import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard, Users, Home as HomeIcon, Megaphone, AlertTriangle, FileText,
  Shield, MessageSquare, HeartHandshake, Sparkles, Calendar, Building, Siren,
  ListChecks, Bell, BarChart3, Settings as SettingsIcon, UserCog, LogOut, Menu,
  Moon, Sun, Search, ChevronLeft, ChevronRight, MessageCircleQuestion, X,
  Activity, ChevronDown, ChevronUp, ShieldCheck,
} from "lucide-react";
import { useAuth, useTheme } from "../lib/auth";
import { ROLE_LABELS, type Role, useStored, getItem } from "../lib/store";
import type { Notification } from "../lib/notify";
import { useRealtimeBadges } from "../lib/use-realtime-badges";
import AdminCopilot from "../components/AdminCopilot";
import BiometricsGate from "../components/BiometricsGate";
import { useBiometrics } from "../lib/biometrics";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

type Item = { to: string; label: string; shortLabel?: string; icon: any; roles: Role[]; countKey?: string; countFilter?: (items: any[]) => number; mobile?: boolean; group?: string };

const NAV: Item[] = [
  // MAIN
  { to: "/dashboard", label: "Overview", shortLabel: "Home", icon: LayoutDashboard, roles: ["super_admin","captain","secretary","sk_officer","disaster","resident"], mobile: true, group: "main" },

  // OPERATIONS & SAFETY
  { to: "/dashboard/alerts", label: "Disaster Alerts", shortLabel: "Alerts", icon: AlertTriangle, roles: ["super_admin","captain","disaster","resident"], countKey: "alerts", countFilter: (items) => items.filter((i: any) => i.status === "active").length, mobile: true, group: "operations" },
  { to: "/dashboard/incidents", label: "Incidents", shortLabel: "Incidents", icon: Shield, roles: ["super_admin","captain","disaster","resident"], countKey: "incidents", countFilter: (items) => items.filter((i: any) => i.status !== "Resolved" && i.status !== "Closed").length, mobile: true, group: "operations" },
  { to: "/dashboard/emergency", label: "Emergency", shortLabel: "Emergency", icon: Siren, roles: ["super_admin","disaster","resident","captain"], countKey: "emergency", countFilter: (items) => items.filter((i: any) => i.status === "Pending").length, mobile: true, group: "operations" },
  { to: "/dashboard/evacuation", label: "Evacuation", icon: Building, roles: ["super_admin","disaster","captain"], countKey: "evac_centers", countFilter: (items) => items.filter((i: any) => (i.occupants || 0) >= (i.capacity || 1) * 0.9).length, group: "operations" },

  // COMMUNITY ENGAGEMENT
  { to: "/dashboard/announcements", label: "Announcements", shortLabel: "News", icon: Megaphone, roles: ["super_admin","captain","secretary","resident"], mobile: true, group: "community" },
  { to: "/dashboard/events", label: "Events", shortLabel: "Events", icon: Calendar, roles: ["super_admin","sk_officer","captain","resident"], countKey: "events", countFilter: (items) => {
    const now = new Date(); return items.filter((i: any) => { const d = i.date ? new Date(i.date) : null; return d && d >= now; }).length;
  }, mobile: true, group: "community" },
  { to: "/dashboard/surveys", label: "Surveys & Polls", shortLabel: "Surveys", icon: ListChecks, roles: ["super_admin","sk_officer","captain","resident"], countKey: "polls", countFilter: (items) => items.filter((i: any) => i.status === "active" || i.status === "open").length, mobile: true, group: "community" },
  { to: "/dashboard/complaints", label: "Complaints", icon: MessageSquare, roles: ["super_admin","secretary","resident","captain"], countKey: "complaints", countFilter: (items) => items.filter((i: any) => i.status === "Open" || i.status === "Assigned").length, group: "community" },

  // SERVICES & RECORDS
  { to: "/dashboard/documents", label: "Documents", shortLabel: "Docs", icon: FileText, roles: ["super_admin","secretary","resident"], countKey: "documents_req", countFilter: (items) => items.filter((i: any) => i.status === "Pending" || i.status === "Reviewing").length, mobile: true, group: "services" },
  { to: "/dashboard/residents", label: "Residents", icon: Users, roles: ["super_admin","secretary"], countKey: "residents", countFilter: (items) => items.filter((i: any) => {
    const created = i.createdAt ? new Date(i.createdAt) : null;
    return created && (Date.now() - created.getTime()) < 7 * 24 * 60 * 60 * 1000;
  }).length, group: "services" },
  { to: "/dashboard/households", label: "Households", icon: HomeIcon, roles: ["super_admin","secretary"], group: "services" },
  { to: "/dashboard/officials", label: "Barangay Officials", shortLabel: "Officials", icon: Users, roles: ["super_admin","captain","secretary","sk_officer","disaster","resident"], mobile: true, group: "services" },
  { to: "/dashboard/volunteers", label: "Volunteers", icon: HeartHandshake, roles: ["super_admin","sk_officer","disaster"], countKey: "volunteers", countFilter: (items) => items.filter((i: any) => i.status === "Available").length, group: "services" },
  { to: "/dashboard/youth", label: "Youth (SK)", icon: Sparkles, roles: ["super_admin","sk_officer"], countKey: "youth", countFilter: (items) => items.filter((i: any) => i.attendance === 0 || !i.program).length, group: "services" },

  // ADMINISTRATION
  { to: "/dashboard/admin", label: "Admin Center", shortLabel: "Admin", icon: Shield, roles: ["super_admin"], group: "admin" },
  { to: "/dashboard/reports", label: "Reports", icon: BarChart3, roles: ["super_admin","captain"], group: "admin" },
  { to: "/dashboard/analytics", label: "AI Analytics", shortLabel: "Analytics", icon: BarChart3, roles: ["super_admin"], group: "admin" },
  { to: "/dashboard/health", label: "System Health", shortLabel: "Health", icon: Activity, roles: ["super_admin"], group: "admin" },
  { to: "/dashboard/acl", label: "Access Control", shortLabel: "ACL", icon: ShieldCheck, roles: ["super_admin"], group: "admin" },
  { to: "/dashboard/users", label: "User Management", shortLabel: "Users", icon: UserCog, roles: ["super_admin"], countKey: "users", countFilter: (items) => items.filter((i: any) => i.approved === false || i.approved === 0).length, mobile: true, group: "admin" },
  { to: "/dashboard/notifications", label: "Notifications", shortLabel: "Notifs", icon: Bell, roles: ["super_admin","captain","secretary","sk_officer","disaster","resident"], countKey: "notifications", countFilter: (items) => items.filter((n: any) => !n.read).length, mobile: true, group: "admin" },
  { to: "/dashboard/contact-messages", label: "Messages", shortLabel: "Messages", icon: MessageCircleQuestion, roles: ["super_admin","secretary"], countKey: "inquiries", countFilter: (items) => items.filter((i: any) => i.status === "new" || i.status === "in_review").length, mobile: true, group: "admin" },
  { to: "/dashboard/settings", label: "Settings", icon: SettingsIcon, roles: ["super_admin","captain","secretary","sk_officer","disaster","resident"], mobile: true, group: "admin" },
];

const GROUP_LABELS: Record<string, string> = {
  main: "Main",
  operations: "Operations & Safety",
  community: "Community Engagement",
  services: "Services & Records",
  admin: "Administration",
};

function renderNavItems(items: Item[], pathname: string, counts: Record<string, () => number>, collapsed: boolean, onItemClick?: () => void) {
  const groups = new Map<string, Item[]>();
  for (const item of items) {
    const g = item.group || "main";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(item);
  }

  const parts: React.JSX.Element[] = [];
  let groupIdx = 0;
  for (const [groupKey, groupItems] of groups) {
    if (!collapsed && groupIdx > 0) {
      parts.push(
        <div key={`divider-${groupKey}`} className="px-3 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-slate-800/60" />
            <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-slate-500/70">{GROUP_LABELS[groupKey] || groupKey}</span>
            <div className="h-px flex-1 bg-slate-800/60" />
          </div>
        </div>
      );
    }
    groupItems.forEach((i) => {
      const active = pathname === i.to || (i.to !== "/dashboard" && pathname.startsWith(i.to));
      const count = i.countKey ? counts[i.countKey]?.() ?? 0 : 0;
      parts.push(
        <Link
          key={i.to}
          to={i.to}
          onClick={onItemClick || undefined}
          className={`group/item flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 min-h-[44px] relative ${
            active
              ? "bg-primary/15 text-white font-extrabold shadow-[inset_0_0_0_1px_rgba(59,130,246,0.15)]"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
          title={collapsed ? i.label : undefined}
        >
          <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-all duration-200 ${
            active
              ? "bg-primary/25 text-primary-foreground shadow-sm"
              : "bg-slate-800/50 text-slate-400 group-hover/item:bg-slate-700/60 group-hover/item:text-slate-200"
          }`}>
            <i.icon className="h-4 w-4" />
          </div>
          {!collapsed && (
            <>
              <span className="truncate flex-1 leading-tight">{i.label}</span>
              {count > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-destructive/90 px-1.5 text-[9px] font-bold text-white shrink-0 shadow-sm">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </>
          )}
          {collapsed && (
            <>
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[7px] font-bold text-white">
                  {count > 9 ? "9+" : count}
                </span>
              )}
              <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-800 text-[10px] text-white font-bold whitespace-nowrap opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all z-50 shadow-xl pointer-events-none before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-slate-800">
                {i.label}
                {count > 0 && <span className="ml-1.5 text-destructive">({count})</span>}
              </div>
            </>
          )}
        </Link>
      );
    });
    groupIdx++;
  }
  return parts;
}

function DashboardLayout() {
  const { user, logout, hydrated } = useAuth();
  const nav = useNavigate();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [date, setDate] = useState("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Live badge counts (polled from server every 30s)
  const { counts: rawCounts, markViewed } = useRealtimeBadges(user?.role);
  const unreadNotifs = rawCounts.notifications || 0;

  // Wrap rawCounts into the () => number shape expected by renderNavItems
  const counts: Record<string, () => number> = {};
  for (const key of Object.keys(rawCounts)) {
    counts[key] = () => rawCounts[key as keyof typeof rawCounts] || 0;
  }

  // ── Badge reset on page visit ───────────────────────────────────────────
  // When the user navigates to a page, immediately refresh its badge count
  // so the badge doesn't show stale counts.
  const pathnameToTable: Record<string, string> = {
    "/dashboard": "",
    "/dashboard/alerts": "alerts",
    "/dashboard/incidents": "incidents",
    "/dashboard/emergency": "emergency",
    "/dashboard/documents": "documents_req",
    "/dashboard/complaints": "complaints",
    "/dashboard/notifications": "notifications",
    "/dashboard/users": "users",
    "/dashboard/contact-messages": "inquiries",
    "/dashboard/evacuation": "evac_centers",
    "/dashboard/volunteers": "volunteers",
    "/dashboard/youth": "youth",
    "/dashboard/surveys": "polls",
    "/dashboard/events": "events",
    "/dashboard/residents": "residents",
  };
  useEffect(() => {
    const table = pathnameToTable[pathname];
    if (table) {
      markViewed(table);
    }
  }, [pathname, markViewed]);

  useEffect(() => {
    if (!hydrated) return; // wait for session validation
    if (!user) {
      nav({ to: "/login", search: { mode: "login" } });
    }
  }, [user, hydrated, nav]);

  useEffect(() => {
    const d = new Date();
    setDate(d.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
    const tick = setInterval(() => {
      setDate(new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
    }, 60000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const [biometricsOpen, setBiometricsOpen] = useState(false);
  const onAnomaly = useCallback(() => setBiometricsOpen(true), []);
  const isSuperAdminLayout = user?.role === "super_admin";
  useBiometrics({ onAnomalyDetected: onAnomaly, enabled: !isSuperAdminLayout });

  if (!user) return null;

  const items = NAV.filter((i) => i.roles.includes(user.role));
  const activeItem = items.find((i) => pathname === i.to || (i.to !== "/dashboard" && pathname.startsWith(i.to)));

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20 transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className={`${collapsed ? "w-20" : "w-64"} hidden md:flex flex-col bg-slate-900 text-slate-100 border-r border-slate-800/80 shadow-2xl transition-all duration-300 shrink-0 h-screen overflow-hidden print:hidden`}>
        <div className="flex h-16 items-center gap-3 border-b border-slate-800/80 px-4 bg-slate-950/20 shrink-0">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Shield className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden flex-1">
              <div className="text-sm font-black tracking-tight text-white">e-Cagraray</div>
              <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Brgy. Management System</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-full p-1.5 text-slate-500 hover:text-white hover:bg-slate-800/60 transition shrink-0"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 space-y-0.5" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {items.length > 0 && renderNavItems(items, pathname, counts, collapsed)}
        </nav>
        <div className="border-t border-slate-800/80 p-2 bg-slate-950/25 shrink-0">
          <button
            onClick={() => { logout(); nav({ to: "/" }); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-800/60 transition min-h-[44px] group"
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive/70 group-hover:bg-destructive/20 transition">
              <LogOut className="h-4 w-4" />
            </div>
            {!collapsed && <span className="truncate">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 md:hidden print:hidden ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <div onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <aside className={`absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-slate-900 text-slate-100 shadow-2xl border-r border-slate-800/80 transition-transform duration-300 ease-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col`}>
          <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-4 bg-slate-950/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-black tracking-tight text-white">e-Cagraray</div>
                <div className="text-[8px] font-extrabold uppercase tracking-widest text-slate-400">{ROLE_LABELS[user.role]}</div>
              </div>
            </div>
            <button onClick={() => setMobileOpen(false)} className="rounded-full p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/60 transition min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 space-y-0.5" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {renderNavItems(items, pathname, counts, false, () => setMobileOpen(false))}
          </nav>
          <div className="border-t border-slate-800/80 p-2 bg-slate-950/25 shrink-0">
            <button
              onClick={() => { logout(); nav({ to: "/" }); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-800/60 transition min-h-[44px] group"
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive/70 group-hover:bg-destructive/20 transition">
                <LogOut className="h-4 w-4" />
              </div>
              <span className="truncate">Sign Out</span>
            </button>
          </div>
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col h-screen overflow-hidden print:h-auto print:overflow-visible">
        <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between gap-2 border-b border-border/50 bg-background/95 px-2.5 sm:px-3 md:px-4 shrink-0 print:hidden shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-full p-2.5 transition hover:bg-muted md:hidden touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* Page title breadcrumb for mobile */}
            <div className="md:hidden flex items-center gap-1.5 min-w-0">
              {activeItem && (
                <>
                  <activeItem.icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs font-bold truncate">{activeItem.label}</span>
                </>
              )}
            </div>
            <div className="hidden xl:flex items-center gap-2 rounded-full border border-success/20 bg-success/5 px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Connected
            </div>
            <div className="hidden lg:block text-xs font-semibold text-muted-foreground truncate">{date}</div>
          </div>

          <div className="hidden sm:flex flex-1 max-w-sm lg:max-w-md items-center relative">
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, metaKey: true }))}
              className="w-full rounded-2xl border border-border/60 bg-background/40 py-2 pl-9 pr-3 text-xs outline-none transition hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10 min-h-[40px] flex items-center gap-2 text-muted-foreground"
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <span>Search...</span>
              <kbd className="ml-auto text-[10px] font-bold text-muted-foreground/50 bg-muted/30 px-1.5 py-0.5 rounded border border-border/30">⌘K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1.5">
            <button
              onClick={toggle}
              className="rounded-full p-2 transition hover:bg-muted text-muted-foreground hover:text-foreground touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
            <Link
              to="/dashboard/notifications"
              className="relative rounded-full p-2 transition hover:bg-muted text-muted-foreground hover:text-foreground min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadNotifs > 0 && (
                <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[8px] font-bold text-destructive-foreground">
                  {unreadNotifs > 99 ? "99+" : unreadNotifs}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-1.5 sm:px-2.5 py-1 shadow-sm">
              <div className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-xl bg-primary text-xs font-black text-primary-foreground shadow-md shadow-primary/10">
                {user.fullName.split(" ").map((s) => s[0]).slice(0, 2).join("")}
              </div>
              <div className="hidden text-left text-[11px] leading-tight lg:block">
                <div className="font-extrabold text-slate-800 dark:text-slate-200 max-w-[90px] truncate">{user.fullName.split(" ")[0]}</div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{ROLE_LABELS[user.role]}</div>
              </div>
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto overscroll-contain p-2 sm:p-3 md:p-4 lg:p-6 bg-background/30 print:p-0 print:bg-transparent print:overflow-visible pb-20 md:pb-4">
          <div className="min-h-full rounded-xl sm:rounded-2xl md:rounded-[2rem] border border-border/50 bg-card/60 p-3 sm:p-4 md:p-6 lg:p-8 shadow-xl dark:bg-card/45 print:border-none print:shadow-none print:bg-transparent print:p-0">                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Outlet />
            </div>
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-lg border-t border-border/50 flex items-center justify-around px-1 safe-area-bottom print:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          {items.filter((i) => i.mobile).slice(0, 5).map((i) => {
            const active = pathname === i.to || (i.to !== "/dashboard" && pathname.startsWith(i.to));
            const count = i.countKey ? counts[i.countKey]?.() ?? 0 : 0;
            return (
              <Link
                key={i.to}
                to={i.to}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition min-w-0 flex-1 ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <div className="relative">
                  <i.icon className="h-5 w-5" />
                  {count > 0 && (
                    <span className="absolute -right-1.5 -top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-destructive px-0.5 text-[7px] font-bold text-destructive-foreground">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </div>
                <span className={`text-[8px] font-bold uppercase tracking-wider truncate max-w-full ${active ? "text-primary" : "text-muted-foreground"}`}>{i.shortLabel || i.label}</span>
              </Link>
            );
          })}
          <Link
            to="/dashboard/notifications"
            className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition min-w-0 flex-1 ${pathname === "/dashboard/notifications" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <div className="relative">
              <Bell className="h-5 w-5" />
              {unreadNotifs > 0 && (
                <span className="absolute -right-1.5 -top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-destructive px-0.5 text-[7px] font-bold text-destructive-foreground">
                  {unreadNotifs > 9 ? "9+" : unreadNotifs}
                </span>
              )}
            </div>
            <span className={`text-[8px] font-bold uppercase tracking-wider truncate max-w-full ${pathname === "/dashboard/notifications" ? "text-primary" : "text-muted-foreground"}`}>Alerts</span>
          </Link>
          <Link
            to="/dashboard/settings"
            className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition min-w-0 flex-1 ${pathname === "/dashboard/settings" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <SettingsIcon className="h-5 w-5" />
            <span className={`text-[8px] font-bold uppercase tracking-wider truncate max-w-full ${pathname === "/dashboard/settings" ? "text-primary" : "text-muted-foreground"}`}>Settings</span>
          </Link>
        </nav>
      </div>
      {isSuperAdminLayout && <AdminCopilot />}
      <BiometricsGate open={biometricsOpen} onVerify={() => setBiometricsOpen(false)} onCancel={() => setBiometricsOpen(false)} />
    </div>
  );
}
