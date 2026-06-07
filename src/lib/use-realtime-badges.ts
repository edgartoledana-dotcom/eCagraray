// =============================================================================
// useRealtimeBadges — WebSocket + polling hybrid badge count hook
//
// Tries to connect to the BadgeHub Durable Object via WebSocket for instant
// badge updates. Falls back to 30-second polling when WebSocket is unavailable
// (e.g., local Node.js dev mode).
//
// The BadgeHub DO sends:
//   { type: "initial", counts } — on connect
//   { type: "badge_update", table?, counts } — on data changes or alarm tick
//
// The hook also keeps 60s polling as a safety net even when WebSocket is active.
// =============================================================================

import { useEffect, useRef, useState, useCallback } from "react";
import { useStored, withToken, type Role } from "./store";
import { getTableData } from "./api/auth.functions";

// ---------------------------------------------------------------------------
// Per-table badge count config
// ---------------------------------------------------------------------------

type TableFilter = (items: any[]) => number;

const TABLE_FILTERS: Record<string, TableFilter> = {
  alerts: (items) => items.filter((i: any) => i.status === "active").length,
  incidents: (items) => items.filter((i: any) => i.status !== "Resolved" && i.status !== "Closed").length,
  emergency: (items) => items.filter((i: any) => i.status === "Pending").length,
  documents_req: (items) => items.filter((i: any) => i.status === "Pending" || i.status === "Reviewing").length,
  complaints: (items) => items.filter((i: any) => i.status === "Open" || i.status === "Assigned").length,
  notifications: (items) => items.filter((i: any) => !i.read).length,
  users: (items) => items.filter((i: any) => i.approved === false || i.approved === 0).length,
  inquiries: (items) => items.filter((i: any) => i.status === "new" || i.status === "in_review").length,
  evac_centers: (items) => items.filter((i: any) => (i.occupants || 0) >= (i.capacity || 1) * 0.9).length,
  volunteers: (items) => items.filter((i: any) => i.status === "Available").length,
  youth: (items) => items.filter((i: any) => i.attendance === 0 || !i.program).length,
  polls: (items) => items.filter((i: any) => i.status === "active" || i.status === "open").length,
  events: (items) => {
    const now = new Date();
    return items.filter((i: any) => {
      const d = i.date ? new Date(i.date) : null;
      return d && d >= now;
    }).length;
  },
  residents: (items) => items.filter((i: any) => {
    const created = i.createdAt ? new Date(i.createdAt) : null;
    return created && (Date.now() - created.getTime()) < 7 * 24 * 60 * 60 * 1000;
  }).length,
};

const POLL_TABLES = [
  "alerts", "incidents", "emergency", "documents_req", "complaints",
  "notifications", "users", "inquiries", "evac_centers", "volunteers",
  "youth", "polls", "events", "residents",
];

// ---------------------------------------------------------------------------
// BadgeCounts type
// ---------------------------------------------------------------------------

export interface BadgeCounts {
  counts: Record<string, number>;
  total: number;
  refresh: () => void;
  markViewed: (table: string) => void;
}

// ---------------------------------------------------------------------------
// WebSocket connection manager (singleton per origin)
// ---------------------------------------------------------------------------

type WsHandler = {
  onInitial: (counts: Record<string, number>) => void;
  onBadgeUpdate: (table?: string, counts?: Record<string, number>) => void;
  onStatusChange: (connected: boolean) => void;
};

let wsInstance: WebSocket | null = null;
let wsHandlerRef: WsHandler | null = null;
let wsReconnectTimer: ReturnType<typeof setTimeout> | null = null;
let wsPingTimer: ReturnType<typeof setInterval> | null = null;

function connectWs(handler: WsHandler) {
  if (wsInstance?.readyState === WebSocket.OPEN) return;

  wsHandlerRef = handler;

  // Determine WebSocket URL
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  const url = `${protocol}//${host}/_badge/ws`;

  try {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      wsInstance = ws;
      handler.onStatusChange(true);

      // Ping every 30s to keep connection alive
      if (wsPingTimer) clearInterval(wsPingTimer);
      wsPingTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 30_000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "initial" && msg.counts) {
          handler.onInitial(msg.counts);
        } else if (msg.type === "badge_update") {
          handler.onBadgeUpdate(msg.table, msg.counts);
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      wsInstance = null;
      handler.onStatusChange(false);
      if (wsPingTimer) {
        clearInterval(wsPingTimer);
        wsPingTimer = null;
      }
      // Reconnect after 5s
      if (wsReconnectTimer) clearTimeout(wsReconnectTimer);
      wsReconnectTimer = setTimeout(() => connectWs(handler), 5_000);
    };

    ws.onerror = () => {
      // onclose will fire after this
      ws.close();
    };
  } catch {
    // WebSocket not available
    handler.onStatusChange(false);
  }
}

function disconnectWs() {
  if (wsReconnectTimer) {
    clearTimeout(wsReconnectTimer);
    wsReconnectTimer = null;
  }
  if (wsPingTimer) {
    clearInterval(wsPingTimer);
    wsPingTimer = null;
  }
  if (wsInstance) {
    wsInstance.onclose = null; // Prevent reconnect
    wsInstance.close();
    wsInstance = null;
  }
  wsHandlerRef = null;
}

// ---------------------------------------------------------------------------
// useRealtimeBadges hook
// ---------------------------------------------------------------------------

/**
 * Returns live badge counts using WebSocket (instant) with polling fallback.
 *
 * WebSocket provides instant updates from the BadgeHub DO.
 * Polling (every 60s) acts as a safety-net when WebSocket is connected but
 * the DO might have missed an update. When WebSocket is down (Node.js dev),
 * falls back to 30s polling like the original useBadgeCounts.
 */
export function useRealtimeBadges(role: Role | null | undefined): BadgeCounts {
  // Per-table localStorage-backed state (instant on mount)
  const [alertItems] = useStored<any[]>("alerts", []);
  const [incidentItems] = useStored<any[]>("incidents", []);
  const [emergencyItems] = useStored<any[]>("emergency", []);
  const [docItems] = useStored<any[]>("documents_req", []);
  const [complaintItems] = useStored<any[]>("complaints", []);
  const [notifItems] = useStored<any[]>("notifications", []);
  const [userItems] = useStored<any[]>("users", []);
  const [inquiryItems] = useStored<any[]>("inquiries", []);
  const [evacItems] = useStored<any[]>("evac_centers", []);
  const [volunteerItems] = useStored<any[]>("volunteers", []);
  const [youthItems] = useStored<any[]>("youth", []);
  const [pollItems] = useStored<any[]>("polls", []);
  const [eventItems] = useStored<any[]>("events", []);
  const [residentItems] = useStored<any[]>("residents", []);

  // Server-side data (from WebSocket pushes or polling)
  const [serverData, setServerData] = useState<Record<string, any[] | null>>({});
  const [wsConnected, setWsConnected] = useState(false);
  const [liveCounts, setLiveCounts] = useState<Record<string, number> | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  // Use liveCounts from WebSocket if available, otherwise serverData, otherwise localStorage.
  // No useCallback wrapper — called only during render, and all deps change every render anyway.
  const getData = (table: string): any[] | null => {
    if (liveCounts && liveCounts[table] !== undefined) {
      return null;
    }
    const server = serverData[table];
    if (server && Array.isArray(server)) return server;
    const map: Record<string, any[]> = {
      alerts: alertItems, incidents: incidentItems, emergency: emergencyItems,
      documents_req: docItems, complaints: complaintItems, notifications: notifItems,
      users: userItems, inquiries: inquiryItems, evac_centers: evacItems,
      volunteers: volunteerItems, youth: youthItems, polls: pollItems,
      events: eventItems, residents: residentItems,
    };
    return map[table] ?? [];
  };

  // Compute counts: use liveCounts (from DO) if available, else raw data filtering
  const counts: Record<string, number> = {};
  if (liveCounts) {
    Object.assign(counts, liveCounts);
  } else {
    for (const table of POLL_TABLES) {
      const filter = TABLE_FILTERS[table];
      if (filter) {
        const data = getData(table);
        if (data) {
          counts[table] = filter(data);
        }
      }
    }
  }

  const total = Object.values(counts).reduce((s, c) => s + c, 0);

  // ── WebSocket handler callbacks ─────────────────────────────────────────

  const handleInitial = useCallback((initialCounts: Record<string, number>) => {
    if (mountedRef.current) {
      setLiveCounts(initialCounts);
    }
  }, []);

  const handleBadgeUpdate = useCallback(
    (table?: string, updatedCounts?: Record<string, number>) => {
      if (!mountedRef.current) return;
      if (updatedCounts) {
        setLiveCounts(updatedCounts);
      } else if (table && liveCounts) {
        // If only a table name is provided without full counts,
        // we'll rely on the safety-net poll to refresh
      }
    },
    [liveCounts],
  );

  const handleWsStatus = useCallback((connected: boolean) => {
    if (mountedRef.current) {
      setWsConnected(connected);
    }
  }, []);

  // ── Connect WebSocket on mount ──────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;

    connectWs({
      onInitial: handleInitial,
      onBadgeUpdate: handleBadgeUpdate,
      onStatusChange: handleWsStatus,
    });

    return () => {
      mountedRef.current = false;
      disconnectWs();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Safety-net polling ──────────────────────────────────────────────────

  const pollInterval = wsConnected ? 60_000 : 30_000;

  const poll = useCallback(async () => {
    if (!role) return;
    const results: Record<string, any[] | null> = {};
    await Promise.all(
      POLL_TABLES.map(async (table) => {
        try {
          const data = await getTableData({ data: withToken({ table }) });
          if (Array.isArray(data)) {
            results[table] = data;
          }
        } catch {
          // Silently fail
        }
      }),
    );
    if (mountedRef.current) {
      setServerData((prev) => ({ ...prev, ...results }));
    }
  }, [role]);

  useEffect(() => {
    const id = setInterval(poll, pollInterval);
    return () => clearInterval(id);
  }, [poll, pollInterval]);

  // Initial poll on mount
  useEffect(() => {
    poll();
  }, [poll]);

  // ── Public API ──────────────────────────────────────────────────────────

  const refresh = useCallback(() => {
    poll();
  }, [poll]);

  const markViewed = useCallback(
    (_table: string) => {
      poll();
    },
    [poll],
  );

  return { counts, total, refresh, markViewed };
}
