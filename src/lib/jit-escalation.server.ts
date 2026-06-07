import { createHash, randomBytes } from "node:crypto";

interface JITEscalation {
  id: string;
  user_id: string;
  user_name: string;
  role: string;
  permissions: string;
  justification: string;
  approved_by: string;
  approved_by_name: string;
  requested_at: string;
  expires_at: string;
  status: "active" | "expired" | "revoked";
}

async function getDB() {
  const { getD1 } = await import("./db-d1.server");
  return getD1();
}

export async function requestEscalation(opts: {
  userId: string;
  userName: string;
  role: string;
  permissions: string[];
  justification: string;
}): Promise<{ id: string }> {
  const db = await getDB();
  if (!db) throw new Error("D1 not available");

  const id = randomUUID();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  await db
    .prepare(
      `INSERT INTO jit_escalations (id, user_id, user_name, role, permissions, justification, requested_at, expires_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    )
    .bind(id, opts.userId, opts.userName, opts.role, JSON.stringify(opts.permissions), opts.justification, now, expiresAt)
    .run();

  return { id };
}

export async function approveEscalation(id: string, approvedBy: string, approvedByName: string): Promise<void> {
  const db = await getDB();
  if (!db) return;

  await db
    .prepare(`UPDATE jit_escalations SET approved_by = ?, approved_by_name = ?, status = 'active' WHERE id = ?`)
    .bind(approvedBy, approvedByName, id)
    .run();
}

export async function revokeEscalation(id: string): Promise<void> {
  const db = await getDB();
  if (!db) return;

  await db
    .prepare(`UPDATE jit_escalations SET status = 'revoked' WHERE id = ?`)
    .bind(id)
    .run();
}

export async function getActiveEscalation(userId: string): Promise<JITEscalation | null> {
  const db = await getDB();
  if (!db) return null;

  const now = new Date().toISOString();

  const row = await db
    .prepare(
      `SELECT * FROM jit_escalations
       WHERE user_id = ? AND status = 'active' AND expires_at > ?
       ORDER BY requested_at DESC LIMIT 1`,
    )
    .bind(userId, now)
    .first();

  if (!row) return null;

  const e = row as any;
  return {
    id: e.id,
    user_id: e.user_id,
    user_name: e.user_name,
    role: e.role,
    permissions: e.permissions,
    justification: e.justification,
    approved_by: e.approved_by || "",
    approved_by_name: e.approved_by_name || "",
    requested_at: e.requested_at,
    expires_at: e.expires_at,
    status: e.status,
  };
}

export async function listEscalations(status?: string): Promise<JITEscalation[]> {
  const db = await getDB();
  if (!db) return [];

  let sql = "SELECT * FROM jit_escalations";
  const params: any[] = [];

  if (status && status !== "all") {
    sql += " WHERE status = ?";
    params.push(status);
  }

  sql += " ORDER BY requested_at DESC LIMIT 50";

  const { results } = await (db as any).prepare(sql).bind(...params).run();
  return (results || []) as JITEscalation[];
}

export async function cleanupExpired(): Promise<number> {
  const db = await getDB();
  if (!db) return 0;

  const now = new Date().toISOString();
  const { results } = await (db as any)
    .prepare(`UPDATE jit_escalations SET status = 'expired' WHERE status = 'active' AND expires_at < ?`)
    .bind(now)
    .run();

  return results?.meta?.changes || 0;
}

function randomUUID(): string {
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
