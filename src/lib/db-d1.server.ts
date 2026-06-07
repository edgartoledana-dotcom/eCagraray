// D1 Database operations — uses the new relational schema.
// This file is kept for backward compatibility; most operations now
// go through db.server.ts which handles both D1 and local SQLite transparently.

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(): Promise<T | null>;
  all<T = any>(): Promise<{ results: T[]; success: boolean }>;
  run(): Promise<{ meta: { changes: number; lastInsertRowid: number | bigint }; success: boolean }>;
  raw?(): Promise<any[]>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec?(query: string): Promise<void>;
}

export async function getD1(): Promise<D1Database | null> {
  try {
    const specifier = "cloudflare:workers";
    const { env } = await import(/* @vite-ignore */ specifier);
    return (env as { DB?: D1Database }).DB ?? null;
  } catch {
    return null;
  }
}

// D1AuditEntry type
export interface D1AuditEntry {
  id: string;
  actor: string;
  actor_id: string;
  action: string;
  target: string;
  details: string;
  ip: string;
  user_agent: string;
  severity: "info" | "warning" | "critical";
  timestamp: string;
  previous_hash?: string;
  current_hash?: string;
}

export async function readAuditLogD1(limit = 200, severity?: string): Promise<D1AuditEntry[]> {
  const db = await getD1();
  if (!db) return [];
  let sql = "SELECT * FROM audit_log";
  const params: any[] = [];
  if (severity && severity !== "all") {
    sql += " WHERE severity = ?";
    params.push(severity);
  }
  sql += " ORDER BY created_at DESC LIMIT ?";
  params.push(limit);
  const result = await db.prepare(sql).bind(...params).all<any>();
  return result.results || [];
}

export async function writeAuditLogD1(entry: D1AuditEntry): Promise<void> {
  const db = await getD1();
  if (!db) return;
  await db
    .prepare(
      `INSERT INTO audit_log (id, actor, actor_id, action, target, details, ip, user_agent, severity, created_at, previous_hash, current_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      entry.id, entry.actor, entry.actor_id, entry.action,
      entry.target, entry.details, entry.ip, entry.user_agent,
      entry.severity, entry.timestamp || new Date().toISOString(),
      entry.previous_hash || "", entry.current_hash || "",
    )
    .run();
}

export async function clearAuditLogD1(): Promise<void> {
  const db = await getD1();
  if (!db) return;
  await db.prepare("DELETE FROM audit_log").run();
}
