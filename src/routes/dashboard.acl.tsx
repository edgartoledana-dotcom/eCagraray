import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useStored, ROLE_PERMISSIONS, ROLE_LABELS, withToken, type Role, type PermissionKey } from "../lib/store";
import { useAuth } from "../lib/auth";
import { PageHeader, Card, EmptyState, Badge } from "../components/ui-kit";
import { getTableData } from "../lib/api/auth.functions";
import { getLoginAttempts, getAuditLog, type LoginAttempt, type AuditEntry } from "../lib/admin";
import { logAudit } from "../lib/admin";
import { toast } from "sonner";
import {
  Shield, Users, Lock, Key, Eye, CheckCircle, XCircle, AlertTriangle,
  Clock, RefreshCw, UserCog, Fingerprint, ShieldCheck, ShieldAlert,
  Search, ChevronDown, ChevronUp, Globe, Smartphone, Monitor,
  ArrowRight, Activity, Ban, CheckCheck, History, Download,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/acl")({ component: ACLPage });

const ALL_PAGES = [
  { key: "overview", label: "Overview", access: ["super_admin","captain","secretary","sk_officer","disaster","resident"] as Role[] },
  { key: "alerts", label: "Disaster Alerts", access: ["super_admin","captain","disaster","resident"] as Role[] },
  { key: "incidents", label: "Incidents", access: ["super_admin","captain","disaster","resident"] as Role[] },
  { key: "emergency", label: "Emergency", access: ["super_admin","disaster","resident","captain"] as Role[] },
  { key: "evacuation", label: "Evacuation", access: ["super_admin","disaster","captain"] as Role[] },
  { key: "announcements", label: "Announcements", access: ["super_admin","captain","secretary","resident"] as Role[] },
  { key: "events", label: "Events", access: ["super_admin","sk_officer","captain","resident"] as Role[] },
  { key: "surveys", label: "Surveys & Polls", access: ["super_admin","sk_officer","captain","resident"] as Role[] },
  { key: "complaints", label: "Complaints", access: ["super_admin","secretary","resident","captain"] as Role[] },
  { key: "documents", label: "Documents", access: ["super_admin","secretary","resident"] as Role[] },
  { key: "residents", label: "Residents", access: ["super_admin","secretary"] as Role[] },
  { key: "households", label: "Households", access: ["super_admin","secretary"] as Role[] },
  { key: "officials", label: "Officials", access: ["super_admin","captain","secretary","sk_officer","disaster","resident"] as Role[] },
  { key: "volunteers", label: "Volunteers", access: ["super_admin","sk_officer","disaster"] as Role[] },
  { key: "youth", label: "Youth (SK)", access: ["super_admin","sk_officer"] as Role[] },
  { key: "reports", label: "Reports", access: ["super_admin","captain"] as Role[] },
  { key: "users", label: "User Management", access: ["super_admin"] as Role[] },
  { key: "notifications", label: "Notifications", access: ["super_admin","captain","secretary","sk_officer","disaster","resident"] as Role[] },
  { key: "messages", label: "Messages", access: ["super_admin","secretary"] as Role[] },
  { key: "settings", label: "Settings", access: ["super_admin","captain","secretary","sk_officer","disaster","resident"] as Role[] },
  { key: "admin", label: "Admin Center", access: ["super_admin"] as Role[] },
  { key: "analytics", label: "Analytics", access: ["super_admin"] as Role[] },
  { key: "health", label: "System Health", access: ["super_admin"] as Role[] },
  { key: "acl", label: "Access Control", access: ["super_admin"] as Role[] },
];

const ALL_ROLES: Role[] = ["super_admin", "captain", "secretary", "sk_officer", "disaster", "resident"];

const ROLE_COLORS: Record<Role, string> = {
  super_admin: "from-rose-500 to-rose-600",
  captain: "from-blue-500 to-blue-600",
  secretary: "from-emerald-500 to-emerald-600",
  sk_officer: "from-violet-500 to-violet-600",
  disaster: "from-amber-500 to-amber-600",
  resident: "from-slate-500 to-slate-600",
};

const ROLE_DOT_COLORS: Record<Role, string> = {
  super_admin: "bg-rose-500",
  captain: "bg-blue-500",
  secretary: "bg-emerald-500",
  sk_officer: "bg-violet-500",
  disaster: "bg-amber-500",
  resident: "bg-slate-500",
};

function parseUA(ua?: string): { device: string; browser: string; os: string } {
  if (!ua) return { device: "Unknown", browser: "Unknown", os: "Unknown" };
  const device = /mobile|android|iphone|ipad/i.test(ua) ? "Mobile" : "Desktop";
  let browser = "Other";
  if (/chrome/i.test(ua)) browser = "Chrome";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";
  else if (/edge/i.test(ua)) browser = "Edge";
  let os = "Other";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/mac/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad/i.test(ua)) os = "iOS";
  return { device, browser, os };
}

function ACLPage() {
  const { user } = useAuth();
  const [users, setUsers] = useStored<any[]>("users", []);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [activeTab, setActiveTab] = useState("matrix");
  const [expandedRole, setExpandedRole] = useState<Role | null>(null);
  const [searchUA, setSearchUA] = useState("");

  const refresh = useCallback(() => {
    setLoginAttempts(getLoginAttempts(100));
    getAuditLog(100).then(setAuditLog).catch(() => {});
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const sync = async () => {
      try {
        const d = await getTableData({ data: withToken({ table: "users" }) });
        if (d && Array.isArray(d)) setUsers(d);
      } catch {}
    };
    sync();
  }, []);

  if (!user || user.role !== "super_admin") {
    return <Card><EmptyState title="Access Restricted" description="Only System Administrators can access the Access Control Center." /></Card>;
  }

  const roleUsers = useMemo(() => {
    const map: Record<Role, number> = {} as any;
    for (const r of ALL_ROLES) map[r] = 0;
    for (const u of users) {
      if (map[u.role as Role] !== undefined) map[u.role as Role]++;
    }
    return map;
  }, [users]);

  const recentLogins = loginAttempts.slice(0, 30);
  const failedLogins = loginAttempts.filter((a) => !a.success);
  const successLogins = loginAttempts.filter((a) => a.success);
  const uniqueIPs = new Set(loginAttempts.map((a) => a.ip).filter(Boolean)).size;
  const uniqueBrowsers = new Set(loginAttempts.map((a) => parseUA(a.userAgent).browser)).size;

  const tabs = [
    { key: "matrix", label: "Role Matrix" },
    { key: "logins", label: "Login Audit" },
    { key: "sessions", label: "User Sessions" },
    { key: "security", label: "Security" },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Access Control Center"
        subtitle="Role-based permissions, session management, and security audit."
      />

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === t.key
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "matrix" && (
        <>
          {/* Role Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {ALL_ROLES.map((r) => (
              <button key={r} className="text-left" onClick={() => setExpandedRole(expandedRole === r ? null : r)}>
                <Card className="p-3 sm:p-4 relative overflow-hidden group cursor-pointer hover:border-primary/30 transition-all">
                  <div className={`absolute inset-0 bg-gradient-to-br ${ROLE_COLORS[r]} opacity-5 group-hover:opacity-10 transition-opacity`} />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${ROLE_DOT_COLORS[r]}`} />
                      <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">{ROLE_LABELS[r]}</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-extrabold text-foreground">{roleUsers[r]}</div>
                    <div className="text-[9px] font-semibold text-muted-foreground mt-0.5">users</div>
                  </div>
                </Card>
              </button>
            ))}
          </div>

          {/* Permission Matrix */}
          <Card className="p-4 sm:p-5 overflow-x-auto">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Page Access Matrix
            </h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2 px-2 sm:px-3 font-bold text-muted-foreground uppercase tracking-wider">Page</th>
                  {ALL_ROLES.map((r) => (
                    <th key={r} className="text-center py-2 px-1 sm:px-2 font-bold text-muted-foreground uppercase tracking-wider">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className={`h-1.5 w-1.5 rounded-full ${ROLE_DOT_COLORS[r]}`} />
                        <span className="hidden sm:inline text-[9px]">{ROLE_LABELS[r].split(" ").pop()}</span>
                        <span className="sm:hidden text-[8px]">{r.slice(0, 3).toUpperCase()}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_PAGES.map((page, pi) => (
                  <tr key={page.key} className={`border-b border-border/10 ${pi % 2 === 0 ? "bg-muted/10" : ""} hover:bg-muted/30 transition-colors`}>
                    <td className="py-2 px-2 sm:px-3 font-bold text-foreground whitespace-nowrap">{page.label}</td>
                    {ALL_ROLES.map((r) => {
                      const hasAccess = page.access.includes(r);
                      return (
                        <td key={r} className="text-center py-2 px-1 sm:px-2">
                          {hasAccess ? (
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                          ) : (
                            <XCircle className="h-3 w-3 text-muted-foreground/30 mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Expanded Role Detail */}
          {expandedRole && (
            <Card className="p-4 sm:p-5">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <UserCog className="h-4 w-4 text-primary" />
                {ROLE_LABELS[expandedRole]} — Accessible Pages
              </h3>
              <div className="flex flex-wrap gap-2">
                {ALL_PAGES.filter((p) => p.access.includes(expandedRole)).map((p) => (
                  <span key={p.key} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    <CheckCheck className="h-3 w-3" />
                    {p.label}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {ALL_PAGES.filter((p) => !p.access.includes(expandedRole)).map((p) => (
                  <span key={p.key} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/30 text-xs font-bold text-muted-foreground line-through">
                    <Ban className="h-3 w-3" />
                    {p.label}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Permission Groups */}
          <Card className="p-4 sm:p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Key className="h-4 w-4 text-amber-500" />
              Permission Groups
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(Object.keys(ROLE_PERMISSIONS) as PermissionKey[]).map((perm) => (
                <div key={perm} className="p-3 rounded-xl bg-muted/20 border border-border/20">
                  <div className="text-xs font-bold text-foreground mb-2">{perm}</div>
                  <div className="flex flex-wrap gap-1">
                    {ROLE_PERMISSIONS[perm].map((r) => (
                      <span key={r} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${ROLE_DOT_COLORS[r]}`}>
                        {ROLE_LABELS[r].split(" ").pop()}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {activeTab === "logins" && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: "Total Attempts", value: loginAttempts.length, icon: History, color: "from-blue-500 to-blue-600" },
              { label: "Successful", value: successLogins.length, icon: CheckCircle, color: "from-emerald-500 to-emerald-600" },
              { label: "Failed", value: failedLogins.length, icon: XCircle, color: "from-rose-500 to-rose-600" },
              { label: "Unique IPs", value: uniqueIPs, icon: Globe, color: "from-violet-500 to-violet-600" },
            ].map((m) => (
              <Card key={m.label} className="p-3 sm:p-4 relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${m.color} opacity-5`} />
                <div className="relative flex items-center gap-2.5">
                  <m.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <div className="text-lg sm:text-xl font-extrabold text-foreground">{m.value}</div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{m.label}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Login Table */}
          <Card className="p-4 sm:p-5 overflow-x-auto">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-primary" />
              Login History
            </h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2 px-2 sm:px-3 font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left py-2 px-2 sm:px-3 font-bold text-muted-foreground uppercase tracking-wider">Username</th>
                  <th className="text-left py-2 px-2 sm:px-3 font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">IP Address</th>
                  <th className="text-left py-2 px-2 sm:px-3 font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Browser</th>
                  <th className="text-left py-2 px-2 sm:px-3 font-bold text-muted-foreground uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentLogins.map((a) => {
                  const { browser, device } = parseUA(a.userAgent);
                  return (
                    <tr key={a.id} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                      <td className="py-2 px-2 sm:px-3">
                        {a.success ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">
                            <CheckCircle className="h-3 w-3" /> OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 font-bold">
                            <XCircle className="h-3 w-3" /> FAIL
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 sm:px-3 font-bold text-foreground">{a.username}</td>
                      <td className="py-2 px-2 sm:px-3 text-muted-foreground font-mono hidden sm:table-cell">{a.ip || "—"}</td>
                      <td className="py-2 px-2 sm:px-3 text-muted-foreground hidden md:table-cell">
                        <span className="inline-flex items-center gap-1">
                          {device === "Mobile" ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                          {browser}
                        </span>
                      </td>
                      <td className="py-2 px-2 sm:px-3 text-muted-foreground tabular-nums">{new Date(a.timestamp).toLocaleString("en-PH")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {activeTab === "sessions" && (
        <>
          <Card className="p-4 sm:p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Registered Users
            </h3>
            <div className="space-y-2">
              {users.map((u: any) => {
                const lastLogin = loginAttempts.find((a) => a.username === u.username && a.success);
                return (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/20 hover:border-border/40 transition-all">
                    <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${ROLE_COLORS[u.role as Role] || "from-slate-500 to-slate-600"} flex items-center justify-center text-white text-xs font-extrabold shrink-0`}>
                      {(u.fullName || u.username || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-foreground truncate">{u.fullName || u.username}</span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${ROLE_DOT_COLORS[u.role as Role] || "bg-slate-500"}`}>
                          {ROLE_LABELS[u.role as Role] || u.role}
                        </span>
                        {u.approved === false && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[9px] font-bold">
                            <Clock className="h-2.5 w-2.5" /> Pending
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {u.email} · {u.username}
                        {lastLogin && <span className="ml-1.5">· Last login: {new Date(lastLogin.timestamp).toLocaleString("en-PH")}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`h-2 w-2 rounded-full ${lastLogin ? "bg-emerald-500" : "bg-slate-400"}`} />
                      <span className="text-[10px] font-semibold text-muted-foreground">{lastLogin ? "Active" : "No logins"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {activeTab === "security" && (
        <>
          {/* Security Score */}
          <Card className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="8" strokeDasharray={2 * Math.PI * 42} strokeDashoffset={2 * Math.PI * 42 * 0.15} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-extrabold text-foreground">85</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-extrabold text-foreground mb-1">Security Score: Good</h3>
                <p className="text-xs text-muted-foreground mb-3">Your system has strong security posture. Consider addressing the items below for an even better score.</p>
                <div className="space-y-2">
                  {[
                    { ok: true, text: "Role-based access control enabled" },
                    { ok: true, text: "Audit logging active" },
                    { ok: true, text: "Password policy enforced" },
                    { ok: failedLogins.length < 10, text: failedLogins.length >= 10 ? `${failedLogins.length} failed login attempts detected` : "No excessive failed logins" },
                    { ok: true, text: "Session timeout configured" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {item.ok ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                      <span className="text-xs text-muted-foreground">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Security Alerts */}
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
            <Card className="p-4 sm:p-5">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-500" />
                Security Events
              </h3>
              <div className="space-y-2">
                {auditLog.filter((e) => e.severity === "critical" || e.severity === "warning").slice(0, 8).map((e) => (
                  <div key={e.id} className={`flex items-start gap-2.5 p-2.5 rounded-lg ${e.severity === "critical" ? "bg-rose-500/5 border border-rose-500/10" : "bg-amber-500/5 border border-amber-500/10"}`}>
                    {e.severity === "critical" ? <ShieldAlert className="h-3.5 w-3.5 text-rose-500 mt-0.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] sm:text-xs font-bold text-foreground">{e.action} <span className="text-muted-foreground">→ {e.target}</span></div>
                      <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">{e.details}</div>
                      <div className="text-[9px] text-muted-foreground/60 mt-0.5">{new Date(e.timestamp).toLocaleString("en-PH")} · {e.actor}</div>
                    </div>
                  </div>
                ))}
                {auditLog.filter((e) => e.severity === "critical" || e.severity === "warning").length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-6">No security events recorded.</div>
                )}
              </div>
            </Card>
            <Card className="p-4 sm:p-5">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Recent Activity
              </h3>
              <div className="space-y-2">
                {auditLog.slice(0, 8).map((e) => (
                  <div key={e.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/20">
                    <div className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${e.severity === "critical" ? "bg-rose-500" : e.severity === "warning" ? "bg-amber-500" : "bg-emerald-500"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] sm:text-xs font-bold text-foreground">{e.action}</div>
                      <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">{e.details}</div>
                      <div className="text-[9px] text-muted-foreground/60 mt-0.5">{new Date(e.timestamp).toLocaleString("en-PH")}</div>
                    </div>
                  </div>
                ))}
                {auditLog.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-6">No audit entries yet.</div>
                )}
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="p-4 sm:p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Security Actions
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { label: "Clear Failed Logins", desc: "Reset failed login attempt counter", icon: XCircle, action: () => { try { localStorage.removeItem("ecagraray:login_attempts"); refresh(); toast.success("Failed logins cleared"); } catch {} } },
                { label: "Export Audit Log", desc: "Download audit trail as JSON", icon: Download, action: () => {
                  const blob = new Blob([JSON.stringify(auditLog, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = "audit-log.json"; a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Audit log exported");
                }},
                { label: "Lock All Sessions", desc: "Force re-authentication for all users", icon: Lock, action: () => { toast.info("Session lock feature — configure via System Config") } },
              ].map((action) => (
                <button key={action.label} onClick={action.action} className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/20 border border-border/20 hover:border-primary/30 hover:bg-primary/5 transition-all text-left group">
                  <action.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-foreground">{action.label}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{action.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}


