import { createHash } from "node:crypto";
import { readAuditLogD1, writeAuditLogD1, clearAuditLogD1, type D1AuditEntry } from "./db-d1.server";

export interface AuditedAction {
  actor: string;
  actorId: string;
  action: string;
  target: string;
  details: string;
  ip?: string;
  userAgent?: string;
  severity: "info" | "warning" | "critical";
}

export interface ChainEntry extends D1AuditEntry {
  previous_hash: string;
  current_hash: string;
}

export function computeHash(
  previousHash: string,
  timestamp: string,
  actor: string,
  actorId: string,
  action: string,
  target: string,
  details: string,
  severity: string,
): string {
  const input = `${previousHash}|${timestamp}|${actor}|${actorId}|${action}|${target}|${details}|${severity}`;
  return createHash("sha256").update(input, "utf-8").digest("hex");
}

export async function getLastChainHash(): Promise<string> {
  const db = await import("./db-d1.server");
  const entries = await db.readAuditLogD1(1);
  if (entries.length === 0) return "0000000000000000000000000000000000000000000000000000000000000000";
  const last = entries[0] as any;
  return (last as ChainEntry).current_hash || computeGenesisFallback(last);
}

function computeGenesisFallback(entry: any): string {
  return computeHash(
    "0000000000000000000000000000000000000000000000000000000000000000",
    entry.timestamp || "",
    entry.actor || "",
    entry.actor_id || "",
    entry.action || "",
    entry.target || "",
    entry.details || "",
    entry.severity || "info",
  );
}

export async function appendAuditChain(action: AuditedAction): Promise<ChainEntry> {
  const previousHash = await getLastChainHash();
  const timestamp = new Date().toISOString();
  const currentHash = computeHash(
    previousHash, timestamp,
    action.actor, action.actorId,
    action.action, action.target,
    action.details, action.severity,
  );

  const entry = {
    id: crypto.randomUUID(),
    actor: action.actor,
    actor_id: action.actorId,
    action: action.action,
    target: action.target,
    details: action.details,
    ip: action.ip || "",
    user_agent: action.userAgent || "",
    severity: action.severity,
    timestamp,
    previous_hash: previousHash,
    current_hash: currentHash,
  };

  await writeAuditLogD1(entry as any);
  return entry as any;
}

export interface ChainVerificationResult {
  valid: boolean;
  totalEntries: number;
  verified: number;
  brokenAt?: number;
  firstEntryHash?: string;
  lastEntryHash?: string;
}

export async function verifyChain(limit = 1000): Promise<ChainVerificationResult> {
  const entries = await readAuditLogD1(limit);
  if (entries.length === 0) return { valid: true, totalEntries: 0, verified: 0 };

  const sorted = [...entries].reverse();

  let prevHash = "0000000000000000000000000000000000000000000000000000000000000000";
  for (let i = 0; i < sorted.length; i++) {
    const e = sorted[i] as any;
    const storedHash = e.current_hash || "";
    const expectedHash = computeHash(
      prevHash,
      e.timestamp || "",
      e.actor || "",
      e.actor_id || "",
      e.action || "",
      e.target || "",
      e.details || "",
      e.severity || "info",
    );

    if (storedHash !== expectedHash) {
      return {
        valid: false,
        totalEntries: entries.length,
        verified: i,
        brokenAt: i,
        firstEntryHash: sorted[0]?.current_hash,
        lastEntryHash: sorted[sorted.length - 1]?.current_hash,
      };
    }

    if (e.previous_hash && e.previous_hash !== prevHash) {
      return {
        valid: false,
        totalEntries: entries.length,
        verified: i,
        brokenAt: i,
        firstEntryHash: sorted[0]?.current_hash,
        lastEntryHash: sorted[sorted.length - 1]?.current_hash,
      };
    }

    prevHash = expectedHash;
  }

  return {
    valid: true,
    totalEntries: entries.length,
    verified: entries.length,
    firstEntryHash: sorted[0]?.current_hash,
    lastEntryHash: sorted[sorted.length - 1]?.current_hash,
  };
}

export async function clearAuditChain() {
  await clearAuditLogD1();
}
