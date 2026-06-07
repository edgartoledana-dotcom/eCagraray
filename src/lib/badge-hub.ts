// =============================================================================
// BadgeHub — Durable Object for real-time badge count pushes
//
// Clients connect via WebSocket at /_badge/ws. The DO:
// 1. Accepts WebSocket connections from authenticated dashboard users
// 2. Sends "initial" state with current badge counts on connect
// 3. Receives "refresh" signals from write operations and broadcasts
//    badge count updates to all connected clients
// 4. Has a periodic alarm-based safety-net refresh every 60 seconds
//
// NOTE: This file is designed to run inside a Cloudflare Durable Object.
// The "cloudflare:workers" module is only available in the Workers runtime,
// not in local Node.js tsc. We use @ts-nocheck because this file is compiled
// by wrangler (Cloudflare's build tool) which provides the correct types.
// =============================================================================

// @ts-nocheck
//
// NOTE: No import from "cloudflare:workers" here — that module is only available
// in the Workers runtime and causes Rollup build failures. Instead we manually
// assign ctx/env in the constructor. The Cloudflare Workers runtime does not
// require DO classes to extend DurableObject — it discovers DOs by exported
// class_name in wrangler.toml and matches them by method signatures.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BadgeHubEnv {
  BADGE_HUB: DurableObjectNamespace<BadgeHub>;
  DB: D1Database;
}

interface BadgeCounts {
  alerts: number;
  incidents: number;
  emergency: number;
  documents_req: number;
  complaints: number;
  notifications: number;
  users: number;
  inquiries: number;
  evac_centers: number;
  volunteers: number;
  youth: number;
  polls: number;
  events: number;
  residents: number;
  [key: string]: number;
}

type WsMessage =
  | { type: "ping" }
  | { type: "initial"; counts: BadgeCounts }
  | { type: "badge_update"; table?: string; counts?: BadgeCounts }
  | { type: "refresh" };

// ---------------------------------------------------------------------------
// Table → filter SQL mapping for computing counts directly in D1
// ---------------------------------------------------------------------------

function countFilterForTable(table: string): string {
  switch (table) {
    case "alerts":
      return `WHERE status = 'active'`;
    case "incidents":
      return `WHERE status NOT IN ('Resolved', 'Closed')`;
    case "emergency":
      return `WHERE status = 'Pending'`;
    case "documents_req":
      return `WHERE status IN ('Pending', 'Reviewing')`;
    case "complaints":
      return `WHERE status IN ('Open', 'Assigned')`;
    case "notifications":
      return `WHERE (read IS NULL OR read = 0 OR read = false)`;
    case "users":
      return `WHERE (approved IS NULL OR approved = 0 OR approved = false)`;
    case "inquiries":
      return `WHERE status IN ('new', 'in_review')`;
    case "evac_centers":
      return ""; // Computed in-memory (requires occupants vs capacity)
    case "volunteers":
      return `WHERE status = 'Available'`;
    case "youth":
      return `WHERE attendance = 0 OR program IS NULL`;
    case "polls":
      return `WHERE status IN ('active', 'open')`;
    case "events":
      return ""; // Computed in-memory (requires future-date check)
    case "residents":
      return ""; // Computed in-memory (requires 7-day window)
    default:
      return "";
  }
}

const IN_MEMORY_TABLES = new Set([
  "evac_centers", "events", "residents",
]);

const POLL_TABLES = [
  "alerts", "incidents", "emergency", "documents_req", "complaints",
  "notifications", "users", "inquiries", "evac_centers", "volunteers",
  "youth", "polls", "events", "residents",
];

// ---------------------------------------------------------------------------
// BadgeHub Durable Object
// ---------------------------------------------------------------------------

export class BadgeHub {
  protected ctx: DurableObjectState;
  protected env: BadgeHubEnv;
  private lastCounts: BadgeCounts | null = null;
  private pendingRefresh: Promise<BadgeCounts> | null = null;

  constructor(ctx: DurableObjectState, env: BadgeHubEnv) {
    this.ctx = ctx;
    this.env = env;
  }

  // ── WebSocket lifecycle ──────────────────────────────────────────────────

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // HTTP endpoint for write operations to trigger a refresh
    if (url.pathname === "/_badge/notify" && request.method === "POST") {
      const body = (await request.json()) as { table?: string; secret?: string };
      await this.handleNotify(body.table);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      });
    }

    // Health check
    if (url.pathname === "/_badge/health") {
      const count = this.ctx.getWebSockets().length;
      return new Response(JSON.stringify({ ok: true, connections: count }), {
        headers: { "content-type": "application/json" },
      });
    }

    // WebSocket upgrade
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server);

    // Send initial badge counts
    const counts = await this.getBadgeCounts();
    this.lastCounts = counts;
    server.send(JSON.stringify({ type: "initial", counts } satisfies WsMessage));

    // Schedule periodic refresh as a safety net
    await this.ctx.storage.setAlarm(Date.now() + 60_000);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string) {
    try {
      const msg = JSON.parse(message) as WsMessage;
      if (msg.type === "ping") {
        ws.send(JSON.stringify({ type: "pong" }));
      }
    } catch {
      // Ignore malformed messages
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    ws.close(code, reason);
  }

  async webSocketError(ws: WebSocket, error: Error) {
    console.error("[BadgeHub] WebSocket error:", error);
  }

  // ── Alarm-based safety-net refresh ───────────────────────────────────────

  async alarm() {
    // Push badge counts periodically as a safety net
    const counts = await this.getBadgeCounts();
    this.lastCounts = counts;

    const message = JSON.stringify({
      type: "badge_update",
      counts,
    } satisfies WsMessage);

    this.broadcast(message);

    // Reschedule
    await this.ctx.storage.setAlarm(Date.now() + 60_000);
  }

  // ── Notification handler ─────────────────────────────────────────────────

  private async handleNotify(table?: string) {
    if (table) {
      // Refresh just this table
      const single = await this.getCountForTable(table);
      if (this.lastCounts) {
        this.lastCounts[table] = single;
      }
      const message = JSON.stringify({
        type: "badge_update",
        table,
        counts: this.lastCounts ?? (await this.getBadgeCounts()),
      } satisfies WsMessage);
      this.broadcast(message);
    } else {
      // Refresh all tables
      const counts = await this.getBadgeCounts();
      this.lastCounts = counts;
      const message = JSON.stringify({
        type: "badge_update",
        counts,
      } satisfies WsMessage);
      this.broadcast(message);
    }
  }

  // ── D1 badge count computation ──────────────────────────────────────────

  private async getCountForTable(table: string): Promise<number> {
    if (IN_MEMORY_TABLES.has(table)) {
      // For tables that need runtime filtering, grab all rows
      try {
        const result = await this.env.DB.prepare(
          `SELECT * FROM "${table}"`,
        ).all<any>();
        const rows = result.results ?? [];

        switch (table) {
          case "evac_centers":
            return rows.filter(
              (r) => (r.occupants ?? 0) >= (r.capacity ?? 1) * 0.9,
            ).length;
          case "events": {
            const now = new Date();
            return rows.filter((r) => {
              const d = r.date ? new Date(r.date) : null;
              return d && d >= now;
            }).length;
          }
          case "residents": {
            return rows.filter((r) => {
              const created = r.created_at
                ? new Date(r.created_at)
                : r.createdAt
                  ? new Date(r.createdAt)
                  : null;
              return (
                created && Date.now() - created.getTime() < 7 * 24 * 60 * 60 * 1000
              );
            }).length;
          }
          default:
            return rows.length;
        }
      } catch {
        return 0;
      }
    }

    // SQL filter-based count
    try {
      const filter = countFilterForTable(table);
      const result = await this.env.DB.prepare(
        `SELECT COUNT(*) as count FROM "${table}" ${filter}`,
      ).first<{ count: number }>();
      return result?.count ?? 0;
    } catch {
      return 0;
    }
  }

  private async getBadgeCounts(): Promise<BadgeCounts> {
    // Deduplicate concurrent calls
    if (this.pendingRefresh) return this.pendingRefresh;

    this.pendingRefresh = (async () => {
      const results: BadgeCounts = {
        alerts: 0, incidents: 0, emergency: 0, documents_req: 0,
        complaints: 0, notifications: 0, users: 0, inquiries: 0,
        evac_centers: 0, volunteers: 0, youth: 0, polls: 0,
        events: 0, residents: 0,
      };

      await Promise.all(
        POLL_TABLES.map(async (table) => {
          results[table] = await this.getCountForTable(table);
        }),
      );

      return results;
    })();

    const counts = await this.pendingRefresh;
    this.pendingRefresh = null;
    return counts;
  }

  // ── Broadcast helper ────────────────────────────────────────────────────

  private broadcast(message: string) {
    const sockets = this.ctx.getWebSockets();
    if (sockets.length === 0) return;

    const encoded = new TextEncoder().encode(message);
    for (const ws of sockets) {
      try {
        ws.send(encoded);
      } catch {
        // Connection may be dead — will be cleaned up by webSocketClose
      }
    }
  }
}
