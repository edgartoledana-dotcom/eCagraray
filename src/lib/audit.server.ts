// =============================================================================
// Audit Log Service — SQL-backed immutable audit trail with chain-of-custody
// hashing for tamper detection. Integrates with the unified db.server SQL
// interface and works in both local SQLite and Cloudflare D1 environments.
// =============================================================================

import { createHash } from "node:crypto";
import { db } from "./db.server";
import { uid } from "./store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuditSeverity = "info" | "warning" | "critical";

export interface AuditEntryInput {
  actor: string;       // User's full name or "System"
  actorId: string;     // User's ID or "system"
  action: string;      // e.g. "login", "user_created", "table_data_written"
  target: string;      // e.g. "users", "sessions", "barangay_info"
  details: string;     // Human-readable description
  ip?: string;
  userAgent?: string;
  severity: AuditSeverity;
}

export interface AuditEntry extends AuditEntryInput {
  id: string;
  previousHash: string;
  currentHash: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Chain-of-custody hashing
// ---------------------------------------------------------------------------

/** Compute the SHA-256 hash of an entry for chain verification. */
function computeHash(entry: AuditEntryInput & { previousHash: string }): string {
  const payload = [
    entry.actor,
    entry.actorId,
    entry.action,
    entry.target,
    entry.details,
    entry.ip ?? "",
    entry.userAgent ?? "",
    entry.severity,
    entry.previousHash || "0",
    new Date().toISOString(),
  ].join("|");
  return createHash("sha256").update(payload).digest("hex");
}

// ---------------------------------------------------------------------------
// Get the hash of the most recent audit entry (for chaining)
// ---------------------------------------------------------------------------

async function getLastHash(): Promise<string> {
  try {
    const last = await db.queryFirst<{ current_hash: string }>(
      "SELECT current_hash FROM audit_log ORDER BY created_at DESC LIMIT 1",
    );
    return last?.current_hash ?? "0";
  } catch {
    return "0";
  }
}

// ---------------------------------------------------------------------------
// Log an audit entry — the primary API
// ---------------------------------------------------------------------------

/**
 * Write an entry to the audit log. Returns the full persisted entry.
 *
 * The audit_log table schema (from migration 0005):
 *   id TEXT PK, actor, actor_id, action, target, details,
 *   ip, user_agent, severity, previous_hash, current_hash, created_at
 *
 * Throws on DB error so callers can decide to catch or propagate.
 */
export async function logAudit(input: AuditEntryInput): Promise<AuditEntry> {
  const previousHash = await getLastHash();
  const id = uid();
  const now = new Date().toISOString();
  const entryWithHash = { ...input, previousHash };
  const currentHash = computeHash(entryWithHash);

  await db.insert("audit_log", {
    id,
    actor: input.actor,
    actor_id: input.actorId,
    action: input.action,
    target: input.target,
    details: input.details,
    ip: input.ip ?? "",
    user_agent: input.userAgent ?? "",
    severity: input.severity,
    previous_hash: previousHash,
    current_hash: currentHash,
    created_at: now,
  });

  return {
    ...input,
    id,
    previousHash,
    currentHash,
    createdAt: now,
  };
}

// ---------------------------------------------------------------------------
// High-level convenience wrappers
// ---------------------------------------------------------------------------

export function logLogin(
  actor: string,
  actorId: string,
  meta?: { ip?: string; userAgent?: string },
) {
  return logAudit({
    actor,
    actorId,
    action: "login",
    target: "sessions",
    details: "User logged in successfully",
    ...meta,
    severity: "info",
  });
}

export function logLoginFailed(
  username: string,
  meta?: { ip?: string; userAgent?: string },
) {
  return logAudit({
    actor: username || "unknown",
    actorId: "unknown",
    action: "login_failed",
    target: "sessions",
    details: `Failed login attempt for user "${username}"`,
    ...meta,
    severity: "warning",
  });
}

export function logLogout(
  actor: string,
  actorId: string,
  meta?: { ip?: string; userAgent?: string },
) {
  return logAudit({
    actor,
    actorId,
    action: "logout",
    target: "sessions",
    details: "User logged out",
    ...meta,
    severity: "info",
  });
}

export function logUserCreated(
  actor: string,
  actorId: string,
  targetUserId: string,
  targetUsername: string,
  meta?: { ip?: string; userAgent?: string },
) {
  return logAudit({
    actor,
    actorId,
    action: "user_created",
    target: `users/${targetUserId}`,
    details: `Created user "${targetUsername}" (${targetUserId})`,
    ...meta,
    severity: "info",
  });
}

export function logUserUpdated(
  actor: string,
  actorId: string,
  targetUserId: string,
  targetUsername: string,
  changes: string,
  meta?: { ip?: string; userAgent?: string },
) {
  return logAudit({
    actor,
    actorId,
    action: "user_updated",
    target: `users/${targetUserId}`,
    details: `Updated user "${targetUsername}": ${changes}`,
    ...meta,
    severity: "info",
  });
}

export function logUserDeleted(
  actor: string,
  actorId: string,
  targetUserId: string,
  targetUsername: string,
  meta?: { ip?: string; userAgent?: string },
) {
  return logAudit({
    actor,
    actorId,
    action: "user_deleted",
    target: `users/${targetUserId}`,
    details: `Deleted user "${targetUsername}"`,
    ...meta,
    severity: "warning",
  });
}

export function logProfileUpdated(
  actor: string,
  actorId: string,
  meta?: { ip?: string; userAgent?: string },
) {
  return logAudit({
    actor,
    actorId,
    action: "profile_updated",
    target: `users/${actorId}`,
    details: "User updated their own profile",
    ...meta,
    severity: "info",
  });
}

export function logBarangayInfoUpdated(
  actor: string,
  actorId: string,
  changes: string,
  meta?: { ip?: string; userAgent?: string },
) {
  return logAudit({
    actor,
    actorId,
    action: "barangay_info_updated",
    target: "barangay_info",
    details: `Barangay info updated: ${changes}`,
    ...meta,
    severity: "info",
  });
}

export function logTableDataRead(
  actor: string,
  actorId: string,
  table: string,
  meta?: { ip?: string; userAgent?: string },
) {
  return logAudit({
    actor,
    actorId,
    action: "table_data_read",
    target: table,
    details: `Read all rows from table "${table}"`,
    ...meta,
    severity: "info",
  });
}

export function logTableDataWritten(
  actor: string,
  actorId: string,
  table: string,
  rowCount: number,
  meta?: { ip?: string; userAgent?: string },
) {
  return logAudit({
    actor,
    actorId,
    action: "table_data_written",
    target: table,
    details: `Wrote ${rowCount} rows to table "${table}"`,
    ...meta,
    severity: "info",
  });
}

export function logPasswordResetRequested(
  email: string,
  meta?: { ip?: string; userAgent?: string },
) {
  return logAudit({
    actor: email,
    actorId: "unknown",
    action: "password_reset_requested",
    target: "password_resets",
    details: `Password reset requested for "${email}"`,
    ...meta,
    severity: "info",
  });
}

export function logPasswordResetCompleted(
  actorId: string,
  meta?: { ip?: string; userAgent?: string },
) {
  return logAudit({
    actor: "System",
    actorId: actorId,
    action: "password_reset_completed",
    target: "password_resets",
    details: "Password reset completed successfully",
    ...meta,
    severity: "info",
  });
}

export function logInquirySubmitted(
  name: string,
  email: string,
  meta?: { ip?: string; userAgent?: string },
) {
  return logAudit({
    actor: name || "Anonymous",
    actorId: "unknown",
    action: "inquiry_submitted",
    target: "inquiries",
    details: `Contact inquiry submitted by ${name} (${email})`,
    ...meta,
    severity: "info",
  });
}

export function logCriticalEvent(
  actor: string,
  actorId: string,
  action: string,
  target: string,
  details: string,
  meta?: { ip?: string; userAgent?: string },
) {
  return logAudit({
    actor,
    actorId,
    action,
    target,
    details,
    ...meta,
    severity: "critical",
  });
}
