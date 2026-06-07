import { getItem, setItem, uid } from "./store";
import { pushNotification, type Notification } from "./notify";
import { appendAuditEntry } from "./api/chain-audit.functions";

/* ── Audit Log ── */
export interface AuditEntry {
  id: string;
  actor: string;
  actorId: string;
  action: string;
  target: string;
  details: string;
  ip?: string;
  userAgent?: string;
  severity: "info" | "warning" | "critical";
  timestamp: string;
  previousHash?: string;
  currentHash?: string;
}

export function logAudit(entry: Omit<AuditEntry, "id" | "timestamp">) {
  const log = getItem<AuditEntry[]>("audit_log", []);
  const next: AuditEntry = { ...entry, id: uid(), timestamp: new Date().toISOString() };
  setItem("audit_log", [next, ...log].slice(0, 1000));
  appendAuditEntry({ data: { ...next, actorId: next.actorId } }).catch(() => {});
  return next;
}

export async function getAuditLog(limit = 200): Promise<AuditEntry[]> {
  const { readAuditLogD1 } = await import("./db-d1.server");
  try {
    const serverEntries = await readAuditLogD1(limit);
    if (serverEntries && serverEntries.length > 0) {
      return serverEntries.map((e: any) => ({
        id: e.id, actor: e.actor, actorId: e.actor_id,
        action: e.action, target: e.target, details: e.details,
        ip: e.ip, userAgent: e.user_agent,
        severity: e.severity, timestamp: e.timestamp,
        previousHash: e.previous_hash,
        currentHash: e.current_hash,
      }));
    }
  } catch {}
  return getItem<AuditEntry[]>("audit_log", []).slice(0, limit);
}

export async function clearAuditLog() {
  const { clearAuditLogD1 } = await import("./db-d1.server");
  try { await clearAuditLogD1(); } catch {}
  setItem("audit_log", []);
}

/* ── System Configuration ── */
export interface SystemConfig {
  maintenanceMode: boolean;
  allowRegistration: boolean;
  requireApproval: boolean;
  autoAlertEnabled: boolean;
  notificationRetentionDays: number;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  backupFrequency: "manual" | "daily" | "weekly";
  lastBackupAt: string | null;
  featureFlags: Record<string, boolean>;
}

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  maintenanceMode: false,
  allowRegistration: true,
  requireApproval: true,
  autoAlertEnabled: true,
  notificationRetentionDays: 30,
  sessionTimeoutMinutes: 60,
  maxLoginAttempts: 5,
  backupFrequency: "daily",
  lastBackupAt: null,
  featureFlags: {
    aiAssistant: true,
    weatherAlerts: true,
    realtimeNotifications: true,
    advancedAnalytics: true,
  },
};

export function getSystemConfig(): SystemConfig {
  return getItem<SystemConfig>("system_config", DEFAULT_SYSTEM_CONFIG);
}

export function saveSystemConfig(config: SystemConfig) {
  setItem("system_config", config);
}

/* ── Backup Management ── */
export interface BackupRecord {
  id: string;
  label: string;
  createdAt: string;
  size: number;
  tables: string[];
  data: Record<string, any[]>;
}

export function createBackup(label: string): BackupRecord {
  const tables = [
    "residents", "households", "incidents", "alerts", "announcements",
    "documents_req", "volunteers", "events", "complaints", "evac_centers",
    "polls", "officials", "notifications", "system_config",
  ];
  const data: Record<string, any[]> = {};
  for (const table of tables) {
    data[table] = getItem<any[]>(table, []);
  }
  const blob = JSON.stringify(data);
  const record: BackupRecord = {
    id: uid(),
    label,
    createdAt: new Date().toISOString(),
    size: new Blob([blob]).size,
    tables,
    data,
  };
  const backups = getItem<BackupRecord[]>("system_backups", []);
  setItem("system_backups", [record, ...backups].slice(0, 20));
  logAudit({ actor: "System", actorId: "system", action: "backup_created", target: "database", details: `Backup created: ${label} (${(record.size / 1024).toFixed(1)} KB)`, severity: "info" });
  return record;
}

export function restoreBackup(id: string): boolean {
  const backups = getItem<BackupRecord[]>("system_backups", []);
  const record = backups.find((b) => b.id === id);
  if (!record) return false;
  for (const [table, rows] of Object.entries(record.data)) {
    setItem(table, rows);
  }
  logAudit({ actor: "System", actorId: "system", action: "backup_restored", target: "database", details: `Data restored from backup: ${record.label}`, severity: "critical" });
  return true;
}

export function deleteBackup(id: string) {
  const backups = getItem<BackupRecord[]>("system_backups", []);
  setItem("system_backups", backups.filter((b) => b.id !== id));
}

export function getBackups(): BackupRecord[] {
  return getItem<BackupRecord[]>("system_backups", []);
}

/* ── Broadcast Center ── */
export interface BroadcastMessage {
  id: string;
  title: string;
  message: string;
  type: Notification["type"];
  targetRoles: string[];
  sentAt: string;
  sentBy: string;
  recipientCount: number;
}

export function broadcastNotification(
  title: string,
  message: string,
  type: Notification["type"],
  targetRoles: string[],
  sentBy: string,
) {
  pushNotification({ title, message, type });
  let recipientCount = 0;
  try {
    const users = getItem<any[]>("users", []);
    if (Array.isArray(users)) {
      recipientCount = users.filter((u) => targetRoles.includes(u.role)).length;
    }
  } catch {}
  const record: BroadcastMessage = {
    id: uid(),
    title,
    message,
    type,
    targetRoles,
    sentAt: new Date().toISOString(),
    sentBy,
    recipientCount,
  };
  const history = getItem<BroadcastMessage[]>("broadcast_history", []);
  setItem("broadcast_history", [record, ...history].slice(0, 50));
  logAudit({ actor: sentBy, actorId: "system", action: "broadcast_sent", target: "notifications", details: `Broadcast: "${title}" to ${targetRoles.join(", ")}`, severity: "info" });
  return record;
}

export function getBroadcastHistory(): BroadcastMessage[] {
  return getItem<BroadcastMessage[]>("broadcast_history", []);
}

/* ── Security / Login Attempts ── */
export interface LoginAttempt {
  id: string;
  username: string;
  ip?: string;
  userAgent?: string;
  success: boolean;
  timestamp: string;
}

export function logLoginAttempt(username: string, success: boolean, ip?: string, ua?: string) {
  const attempts = getItem<LoginAttempt[]>("login_attempts", []);
  const entry: LoginAttempt = { id: uid(), username, ip, userAgent: ua, success, timestamp: new Date().toISOString() };
  setItem("login_attempts", [entry, ...attempts].slice(0, 500));
  return entry;
}

export function getLoginAttempts(limit = 100): LoginAttempt[] {
  return getItem<LoginAttempt[]>("login_attempts", []).slice(0, limit);
}

export function clearLoginAttempts() {
  setItem("login_attempts", []);
}

/* ── System Metrics ── */
export interface SystemMetrics {
  uptime: number;
  totalUsers: number;
  totalResidents: number;
  totalTransactions: number;
  storageUsedKB: number;
  lastChecked: string;
}

export function collectSystemMetrics(): SystemMetrics {
  let storageUsed = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("ecagraray:")) {
      storageUsed += localStorage.getItem(key)?.length || 0;
    }
  }
  return {
    uptime: performance.now(),
    totalUsers: getItem<any[]>("users", []).length,
    totalResidents: getItem<any[]>("residents", []).length,
    totalTransactions: getItem<any[]>("audit_log", []).length,
    storageUsedKB: Math.round(storageUsed / 1024),
    lastChecked: new Date().toISOString(),
  };
}
