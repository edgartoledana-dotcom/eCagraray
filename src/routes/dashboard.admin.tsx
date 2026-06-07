import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useStored, uid, canRole } from "../lib/store";
import { Button, Card, Input, Modal, PageHeader, Badge, Select, Textarea } from "../components/ui-kit";
import {
  Shield, Activity, Database, Clock, Users, HardDrive, RefreshCw,
  Server, Lock, Key, Bell, Download, Upload, FileJson, Trash2, Plus,
  Check, X, AlertTriangle, Eye, EyeOff, Radio, Wifi, Cpu, Zap,
  Globe, Search, ChevronDown, ChevronUp, Terminal, Fingerprint,
  BarChart3, Settings as SettingsIcon, Smartphone, Monitor, Copy,
  CheckCheck, History, BookOpen, Zap as ZapIcon, ShieldCheck,
  Megaphone, FileText, MessageSquare,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import ChainVerifier from "../components/ChainVerifier";
import JITEscalation from "../components/JITEscalation";
import { pushNotification } from "../lib/notify";
import {
  logAudit, getAuditLog, clearAuditLog, getSystemConfig, saveSystemConfig,
  getBackups, createBackup, restoreBackup, deleteBackup,
  broadcastNotification, getBroadcastHistory,
  getLoginAttempts, clearLoginAttempts, collectSystemMetrics,
  type AuditEntry, type SystemConfig, type BackupRecord,
  type BroadcastMessage, type SystemMetrics, DEFAULT_SYSTEM_CONFIG,
} from "../lib/admin";

export const Route = createFileRoute("/dashboard/admin")({ component: AdminPage });

function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_SYSTEM_CONFIG);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<any[]>([]);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupLabel, setBackupLabel] = useState("");
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastRoles, setBroadcastRoles] = useState<string[]>(["super_admin"]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);
  const [showAuditFilter, setShowAuditFilter] = useState(false);
  const [auditFilter, setAuditFilter] = useState("");
  const [tick, setTick] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setMetrics(collectSystemMetrics());
    getAuditLog(200).then(setAuditLog).catch(() => {});
    setConfig(getSystemConfig());
    setBackups(getBackups());
    setBroadcasts(getBroadcastHistory());
    setLoginAttempts(getLoginAttempts(50));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const t = setInterval(() => { setTick((p) => p + 1); refresh(); }, 15000);
    return () => clearInterval(t);
  }, [refresh]);

  const handleBackup = () => {
    if (!backupLabel.trim()) return toast.error("Enter a backup label");
    createBackup(backupLabel.trim());
    setBackupLabel("");
    setShowBackupModal(false);
    refresh();
    toast.success("Backup created successfully");
  };

  const handleRestore = (id: string) => {
    if (!confirm("Restore will overwrite all current data. Continue?")) return;
    restoreBackup(id);
    refresh();
    toast.success("Backup restored — page will refresh");
    setTimeout(() => window.location.reload(), 1500);
  };

  const handleBroadcast = () => {
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) return toast.error("Title and message required");
    broadcastNotification(broadcastTitle.trim(), broadcastMsg.trim(), "alert", broadcastRoles, user?.fullName || "Admin");
    setBroadcastTitle("");
    setBroadcastMsg("");
    setShowBroadcastModal(false);
    refresh();
    toast.success("Broadcast sent — all users notified");
  };

  const handleSaveConfig = () => {
    saveSystemConfig(config);
    setShowConfigModal(false);
    logAudit({ actor: user?.fullName || "Admin", actorId: user?.id || "", action: "config_updated", target: "system", details: "System configuration updated", severity: "info" });
    toast.success("System configuration saved");
  };

  const handleExport = (table: string) => {
    const data = (() => {
      try {
        const raw = localStorage.getItem(`ecagraray:${table}`);
        return raw ? JSON.parse(raw) : [];
      } catch { return []; }
    })();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${table}_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    logAudit({ actor: user?.fullName || "Admin", actorId: user?.id || "", action: "data_exported", target: table, details: `Exported ${data.length} records`, severity: "info" });
    toast.success(`${table} exported (${data.length} records)`);
  };

  const handleFullExport = () => {
    const tables = ["residents", "households", "incidents", "alerts", "announcements", "documents_req", "volunteers", "events", "complaints", "evac_centers", "polls", "officials"];
    const data: Record<string, any> = {};
    let total = 0;
    for (const t of tables) {
      try {
        const raw = localStorage.getItem(`ecagraray:${t}`);
        data[t] = raw ? JSON.parse(raw) : [];
        total += data[t].length;
      } catch { data[t] = []; }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ecagraray_full_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    logAudit({ actor: user?.fullName || "Admin", actorId: user?.id || "", action: "full_export", target: "database", details: `Full system export: ${total} records across ${tables.length} tables`, severity: "info" });
    toast.success(`Full export: ${total} records`);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (user?.role !== "super_admin") {
    return (
      <div className="grid place-items-center h-64">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto text-destructive/50 mb-4" />
          <h2 className="text-xl font-bold">Access Restricted</h2>
          <p className="text-sm text-muted-foreground mt-2">Only System Administrators can access the Admin Control Center.</p>
        </div>
      </div>
    );
  }

  const filteredAudit = auditFilter ? auditLog.filter((e) =>
    e.action.toLowerCase().includes(auditFilter.toLowerCase()) ||
    e.actor.toLowerCase().includes(auditFilter.toLowerCase()) ||
    e.target.toLowerCase().includes(auditFilter.toLowerCase())
  ) : auditLog;

  const tabs = [
    { id: "overview", label: "System Health", icon: Activity },
    { id: "audit", label: "Audit Trail", icon: History },
    { id: "security", label: "Security", icon: Lock },
    { id: "backups", label: "Backups", icon: Database },
    { id: "broadcast", label: "Broadcast", icon: Bell },
    { id: "config", label: "Settings", icon: SettingsIcon },
    { id: "data", label: "Data Ops", icon: FileJson },
  ];

  return (
    <div className="space-y-6">
      {/* Futuristic Header */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.1),transparent_50%)] pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/20 border border-primary/30 text-primary shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Admin Control Center</h1>
                <p className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase tracking-widest">System Administration & Analytics Platform</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-success/10 border border-success/20 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-success animate-ping" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-success">Live</span>
            </div>
            <button onClick={refresh} className="rounded-full p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 transition">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Tab Navigation */}
        <div className="mt-6 flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-primary/20 text-primary-foreground border border-primary/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Animated Status Cards */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            {[
              { label: "System Uptime", value: metrics ? `${Math.round(metrics.uptime / 1000)}s` : "—", icon: Clock, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", glow: "shadow-emerald-500/10" },
              { label: "Total Users", value: metrics?.totalUsers ?? "—", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", glow: "shadow-blue-500/10" },
              { label: "Residents", value: metrics?.totalResidents ?? "—", icon: Monitor, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", glow: "shadow-violet-500/10" },
              { label: "Transactions", value: metrics?.totalTransactions ?? "—", icon: Activity, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", glow: "shadow-amber-500/10" },
            ].map((card, i) => (
              <div key={i} className={`relative rounded-2xl border ${card.bg} p-4 sm:p-5 overflow-hidden group ${card.glow}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/[0.02] pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`grid h-8 w-8 place-items-center rounded-lg ${card.bg} ${card.color}`}>
                      <card.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className={`text-2xl sm:text-3xl font-black tracking-tight text-white`}>{valueOr(card.value, "—")}</div>
                  <div className="mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">{card.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* System Resources */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="relative overflow-hidden border-primary/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Storage Analytics</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "LocalStorage Used", used: metrics?.storageUsedKB ?? 0, total: 5120, unit: "KB", color: "bg-primary" },
                    { label: "Audit Log Entries", used: metrics?.totalTransactions ?? 0, total: 1000, unit: "entries", color: "bg-violet-500" },
                    { label: "Backup Storage", used: backups.reduce((s, b) => s + b.size, 0) / 1024, total: 10240, unit: "KB", color: "bg-emerald-500" },
                  ].map((bar, i) => {
                    const pct = Math.min(100, (bar.used / bar.total) * 100);
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-[10px] font-semibold mb-1">
                          <span className="text-muted-foreground">{bar.label}</span>
                          <span>{Math.round(bar.used)} / {bar.total} {bar.unit}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 ${bar.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden border-primary/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quick Actions</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleFullExport} className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/40 p-3 hover:bg-primary/10 hover:border-primary/30 transition text-xs font-semibold text-left">
                    <Download className="h-4 w-4 text-primary" /> Full Export
                  </button>
                  <button onClick={() => { setShowBackupModal(true); }} className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/40 p-3 hover:bg-primary/10 hover:border-primary/30 transition text-xs font-semibold text-left">
                    <Database className="h-4 w-4 text-emerald-400" /> Create Backup
                  </button>
                  <button onClick={() => setShowBroadcastModal(true)} className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/40 p-3 hover:bg-primary/10 hover:border-primary/30 transition text-xs font-semibold text-left">
                    <Bell className="h-4 w-4 text-amber-400" /> Broadcast
                  </button>
                  <button onClick={() => setShowConfigModal(true)} className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/40 p-3 hover:bg-primary/10 hover:border-primary/30 transition text-xs font-semibold text-left">
                    <SettingsIcon className="h-4 w-4 text-violet-400" /> Settings
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Chain Verifier + JIT Escalation Widgets */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ChainVerifier />
            <JITEscalation />
          </div>
        </div>
      )}

      {/* ── AUDIT TAB ── */}
      {activeTab === "audit" && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input value={auditFilter} onChange={(e) => setAuditFilter(e.target.value)} placeholder="Filter audit log..." className="w-full rounded-xl border border-border/60 bg-background/40 py-2 pl-9 pr-3 text-[11px] outline-none focus:border-primary min-h-[38px]" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAuditFilter("")} className="text-[10px]">Clear Filter</Button>
              <Button variant="ghost" onClick={() => { clearAuditLog(); refresh(); toast.success("Audit log cleared"); }} className="text-[10px] text-destructive">Clear All</Button>
            </div>
          </div>
          <div className="rounded-xl border border-border/40 bg-card/40 max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
            {filteredAudit.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground">No audit entries recorded yet</div>
            ) : (
              <table className="w-full text-[10px] sm:text-[11px]">
                <thead className="sticky top-0 bg-card/90 backdrop-blur">
                  <tr className="border-b border-border/30">
                    <th className="text-left px-3 py-2 font-bold uppercase tracking-wider text-muted-foreground">Time</th>
                    <th className="text-left px-3 py-2 font-bold uppercase tracking-wider text-muted-foreground">Actor</th>
                    <th className="text-left px-3 py-2 font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Action</th>
                    <th className="text-left px-3 py-2 font-bold uppercase tracking-wider text-muted-foreground">Target</th>
                    <th className="text-left px-3 py-2 font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Details</th>
                    <th className="text-center px-3 py-2 font-bold uppercase tracking-wider text-muted-foreground">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAudit.map((entry) => (
                    <tr key={entry.id} className="border-b border-border/10 hover:bg-muted/20 transition">
                      <td className="px-3 py-2.5 font-mono text-[9px] text-muted-foreground whitespace-nowrap">{new Date(entry.timestamp).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="px-3 py-2.5 font-semibold">{entry.actor}</td>
                      <td className="px-3 py-2.5 hidden sm:table-cell"><code className="rounded bg-muted/30 px-1.5 py-0.5 text-[9px] font-mono">{entry.action}</code></td>
                      <td className="px-3 py-2.5"><span className="rounded-full bg-primary/5 px-2 py-0.5 text-[9px] font-bold uppercase">{entry.target}</span></td>
                      <td className="px-3 py-2.5 text-muted-foreground hidden md:table-cell max-w-[200px] truncate">{entry.details}</td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge tone={entry.severity === "critical" ? "danger" : entry.severity === "warning" ? "warning" : "info"} className="text-[8px]">{entry.severity}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── SECURITY TAB ── */}
      {activeTab === "security" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider">Login Attempt Monitor</span>
            </div>
            <Button variant="ghost" onClick={() => { clearLoginAttempts(); refresh(); toast.success("Login attempts cleared"); }} className="text-[10px] text-destructive">Clear</Button>
          </div>
          <div className="grid gap-2 sm:gap-3">
            <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-4">
              <div className="rounded-xl border border-border/40 bg-card/40 p-3">
                <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Total Attempts</div>
                <div className="text-lg sm:text-xl font-black mt-1">{loginAttempts.length}</div>
              </div>
              <div className="rounded-xl border border-border/40 bg-card/40 p-3">
                <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Failed</div>
                <div className="text-lg sm:text-xl font-black mt-1 text-destructive">{loginAttempts.filter((a) => !a.success).length}</div>
              </div>
              <div className="rounded-xl border border-border/40 bg-card/40 p-3">
                <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Successful</div>
                <div className="text-lg sm:text-xl font-black mt-1 text-success">{loginAttempts.filter((a) => a.success).length}</div>
              </div>
              <div className="rounded-xl border border-border/40 bg-card/40 p-3">
                <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Unique Users</div>
                <div className="text-lg sm:text-xl font-black mt-1">{new Set(loginAttempts.map((a) => a.username)).size}</div>
              </div>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/40 max-h-48 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
              {loginAttempts.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">No login attempts recorded</div>
              ) : (
                <table className="w-full text-[10px] sm:text-[11px]">
                  <thead className="sticky top-0 bg-card/90 backdrop-blur">
                    <tr className="border-b border-border/30">
                      <th className="text-left px-3 py-2 font-bold uppercase tracking-wider text-muted-foreground">User</th>
                      <th className="text-left px-3 py-2 font-bold uppercase tracking-wider text-muted-foreground">Time</th>
                      <th className="text-left px-3 py-2 font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">IP / Agent</th>
                      <th className="text-center px-3 py-2 font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginAttempts.map((a) => (
                      <tr key={a.id} className="border-b border-border/10 hover:bg-muted/20 transition">
                        <td className="px-3 py-2 font-semibold">{a.username}</td>
                        <td className="px-3 py-2 text-muted-foreground">{new Date(a.timestamp).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                        <td className="px-3 py-2 text-muted-foreground text-[9px] hidden sm:table-cell max-w-[150px] truncate">{a.userAgent || a.ip || "—"}</td>
                        <td className="px-3 py-2 text-center">
                          {a.success
                            ? <span className="inline-flex items-center gap-1 text-success text-[9px] font-bold"><Check className="h-3 w-3" /> Success</span>
                            : <span className="inline-flex items-center gap-1 text-destructive text-[9px] font-bold"><X className="h-3 w-3" /> Failed</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── BACKUPS TAB ── */}
      {activeTab === "backups" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider">Backup Management</span>
            </div>
            <Button onClick={() => setShowBackupModal(true)} className="text-[10px]">
              <Plus className="h-3.5 w-3.5" /> New Backup
            </Button>
          </div>
          {backups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/50 p-8 text-center">
              <Database className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-xs font-semibold text-muted-foreground">No backups created yet</p>
              <p className="text-[10px] text-muted-foreground mt-1">Create your first backup to secure your data.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {backups.map((b) => (
                <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/40 bg-card/40 p-3 sm:p-4 hover:border-primary/20 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                      <Database className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs truncate">{b.label}</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">
                        {new Date(b.createdAt).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        <span className="mx-1">·</span>
                        {(b.size / 1024).toFixed(1)} KB
                        <span className="mx-1">·</span>
                        {b.tables.length} tables
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" onClick={() => handleRestore(b.id)} className="text-[10px] py-1.5 px-2.5"><Upload className="h-3 w-3" /> Restore</Button>
                    <Button variant="ghost" onClick={() => { deleteBackup(b.id); refresh(); toast.success("Backup deleted"); }} className="text-[10px] py-1.5 px-2.5 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BROADCAST TAB ── */}
      {activeTab === "broadcast" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider">Notification Broadcast Center</span>
            </div>
            <Button onClick={() => setShowBroadcastModal(true)} className="text-[10px]">
              <Plus className="h-3.5 w-3.5" /> New Broadcast
            </Button>
          </div>
          {broadcasts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/50 p-8 text-center">
              <Bell className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-xs font-semibold text-muted-foreground">No broadcasts sent yet</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/40 bg-card/40 max-h-64 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
              {broadcasts.map((b) => (
                <div key={b.id} className="flex items-start gap-3 border-b border-border/10 p-3 hover:bg-muted/20 transition">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-400"><Bell className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs">{b.title}</div>
                    <div className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{b.message}</div>
                    <div className="text-[8px] text-muted-foreground mt-0.5">
                      {b.sentBy} · {new Date(b.sentAt).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} · {b.targetRoles.join(", ")}
                    </div>
                  </div>
                  <Badge tone={b.type === "alert" ? "danger" : b.type === "incident" ? "warning" : "info"} className="text-[8px]">{b.type}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CONFIG TAB ── */}
      {activeTab === "config" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider">System Configuration</span>
            </div>
            <Button onClick={() => setShowConfigModal(true)} className="text-[10px]">
              <SettingsIcon className="h-3.5 w-3.5" /> Configure
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Maintenance Mode", value: config.maintenanceMode, color: config.maintenanceMode ? "text-destructive" : "text-success", desc: "Blocks all non-admin access" },
              { label: "Allow Registration", value: config.allowRegistration, color: config.allowRegistration ? "text-success" : "text-destructive", desc: "New users can sign up" },
              { label: "Require Approval", value: config.requireApproval, color: config.requireApproval ? "text-success" : "text-warning", desc: "Admin must approve new users" },
              { label: "Auto Alerts", value: config.autoAlertEnabled, color: config.autoAlertEnabled ? "text-success" : "text-muted-foreground", desc: "Weather-based auto alerts" },
              { label: "Session Timeout", value: `${config.sessionTimeoutMinutes} min`, color: "text-primary", desc: "Auto logout after inactivity" },
              { label: "Max Login Attempts", value: config.maxLoginAttempts.toString(), color: "text-primary", desc: "Before temporary lockout" },
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-border/40 bg-card/40 p-3 sm:p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{item.label}</span>
                  <span className={`text-xs font-black ${item.color}`}>
                    {typeof item.value === "boolean" ? (item.value ? "ON" : "OFF") : item.value}
                  </span>
                </div>
                <p className="text-[9px] text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DATA OPS TAB ── */}
      {activeTab === "data" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <FileJson className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider">Data Export & Import</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <button onClick={() => handleExport("residents")} className="flex flex-col items-start gap-2 rounded-xl border border-border/40 bg-card/40 p-4 hover:border-primary/30 hover:bg-primary/5 transition text-left">
              <Users className="h-5 w-5 text-blue-400" />
              <div><div className="font-semibold text-xs">Residents</div><div className="text-[9px] text-muted-foreground">Export all resident records</div></div>
            </button>
            <button onClick={() => handleExport("incidents")} className="flex flex-col items-start gap-2 rounded-xl border border-border/40 bg-card/40 p-4 hover:border-primary/30 hover:bg-primary/5 transition text-left">
              <Shield className="h-5 w-5 text-amber-400" />
              <div><div className="font-semibold text-xs">Incidents</div><div className="text-[9px] text-muted-foreground">Export all incident reports</div></div>
            </button>
            <button onClick={() => handleExport("alerts")} className="flex flex-col items-start gap-2 rounded-xl border border-border/40 bg-card/40 p-4 hover:border-primary/30 hover:bg-primary/5 transition text-left">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div><div className="font-semibold text-xs">Alerts</div><div className="text-[9px] text-muted-foreground">Export all disaster alerts</div></div>
            </button>
            <button onClick={() => handleExport("announcements")} className="flex flex-col items-start gap-2 rounded-xl border border-border/40 bg-card/40 p-4 hover:border-primary/30 hover:bg-primary/5 transition text-left">
              <Megaphone className="h-5 w-5 text-violet-400" />
              <div><div className="font-semibold text-xs">Announcements</div><div className="text-[9px] text-muted-foreground">Export all announcements</div></div>
            </button>
            <button onClick={() => handleExport("documents_req")} className="flex flex-col items-start gap-2 rounded-xl border border-border/40 bg-card/40 p-4 hover:border-primary/30 hover:bg-primary/5 transition text-left">
              <FileText className="h-5 w-5 text-emerald-400" />
              <div><div className="font-semibold text-xs">Documents</div><div className="text-[9px] text-muted-foreground">Export document requests</div></div>
            </button>
            <button onClick={() => handleExport("complaints")} className="flex flex-col items-start gap-2 rounded-xl border border-border/40 bg-card/40 p-4 hover:border-primary/30 hover:bg-primary/5 transition text-left">
              <MessageSquare className="h-5 w-5 text-rose-400" />
              <div><div className="font-semibold text-xs">Complaints</div><div className="text-[9px] text-muted-foreground">Export all complaints</div></div>
            </button>
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleFullExport} className="text-[11px]">
              <Download className="h-4 w-4" /> Export All Data (Full System)
            </Button>
          </div>
        </div>
      )}

      {/* ── BACKUP MODAL ── */}
      <Modal open={showBackupModal} onClose={() => setShowBackupModal(false)} title="Create System Backup">
        <div className="space-y-4">
          <Input label="Backup Label" value={backupLabel} onChange={(e) => setBackupLabel(e.target.value)} placeholder="e.g., Pre-update snapshot" />
          <div className="text-[10px] text-muted-foreground bg-muted/30 rounded-xl p-3">
            <Database className="h-3.5 w-3.5 inline mr-1" />
            Backup captures all entity tables: residents, households, incidents, alerts, announcements, documents, volunteers, events, complaints, evac centers, polls, officials, notifications, and config.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBackupModal(false)}>Cancel</Button>
            <Button onClick={handleBackup}><Database className="h-4 w-4" /> Create Backup</Button>
          </div>
        </div>
      </Modal>

      {/* ── BROADCAST MODAL ── */}
      <Modal open={showBroadcastModal} onClose={() => setShowBroadcastModal(false)} title="Send Broadcast">
        <div className="space-y-4">
          <Input label="Title" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} placeholder="Emergency broadcast title" />
          <Textarea label="Message" rows={3} value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} placeholder="Message content..." />
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Target Roles</span>
            <div className="flex flex-wrap gap-1.5">
              {["super_admin", "captain", "secretary", "sk_officer", "disaster", "resident"].map((r) => (
                <button
                  key={r}
                  onClick={() => setBroadcastRoles((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r])}
                  className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider border transition ${
                    broadcastRoles.includes(r)
                      ? "bg-primary/20 text-primary-foreground border-primary/30"
                      : "bg-muted/30 text-muted-foreground border-border/40"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBroadcastModal(false)}>Cancel</Button>
            <Button onClick={handleBroadcast}><Bell className="h-4 w-4" /> Send Broadcast</Button>
          </div>
        </div>
      </Modal>

      {/* ── CONFIG MODAL ── */}
      <Modal open={showConfigModal} onClose={() => setShowConfigModal(false)} title="System Configuration">
        <div className="space-y-4">
          <div className="space-y-3">
            {[
              { key: "maintenanceMode", label: "Maintenance Mode", desc: "Blocks all non-admin access" },
              { key: "allowRegistration", label: "Allow Registration", desc: "New users can sign up" },
              { key: "requireApproval", label: "Require Approval", desc: "Admin must approve new users" },
              { key: "autoAlertEnabled", label: "Auto Weather Alerts", desc: "Weather-based auto alert generation" },
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between rounded-xl border border-border/40 p-3 cursor-pointer hover:bg-muted/20 transition">
                <div>
                  <div className="text-xs font-semibold">{item.label}</div>
                  <div className="text-[9px] text-muted-foreground">{item.desc}</div>
                </div>
                <button
                  onClick={() => setConfig((prev) => ({ ...prev, [item.key]: !(prev as any)[item.key] }))}
                  className={`relative h-6 w-11 rounded-full transition-colors ${(config as any)[item.key] ? "bg-primary" : "bg-muted"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${(config as any)[item.key] ? "translate-x-5" : ""}`} />
                </button>
              </label>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <Input label="Session Timeout (min)" type="number" value={config.sessionTimeoutMinutes} onChange={(e) => setConfig((prev) => ({ ...prev, sessionTimeoutMinutes: Number(e.target.value) }))} />
              <Input label="Max Login Attempts" type="number" value={config.maxLoginAttempts} onChange={(e) => setConfig((prev) => ({ ...prev, maxLoginAttempts: Number(e.target.value) }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Backup Frequency" value={config.backupFrequency} onChange={(e) => setConfig((prev) => ({ ...prev, backupFrequency: e.target.value as any }))}>
                <option value="manual">Manual</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </Select>
              <Input label="Notification Retention (days)" type="number" value={config.notificationRetentionDays} onChange={(e) => setConfig((prev) => ({ ...prev, notificationRetentionDays: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConfigModal(false)}>Cancel</Button>
            <Button onClick={handleSaveConfig}><SettingsIcon className="h-4 w-4" /> Save Configuration</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function valueOr(v: any, fallback: string) {
  return v !== null && v !== undefined ? v : fallback;
}

// Need to import these icons at the top
// FileText and Megaphone are already imported
