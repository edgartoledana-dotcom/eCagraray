import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, Home as HomeIcon, Megaphone, AlertTriangle, FileText,
  Shield, MessageSquare, HeartHandshake, Sparkles, Calendar, Building, Siren,
  ListChecks, Bell, BarChart3, Settings as SettingsIcon, UserCog, LogOut, Menu,
  Moon, Sun, Search, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useAuth, useTheme } from "../lib/auth";
import { ROLE_LABELS, type Role, useStored } from "../lib/store";
import type { Notification } from "../lib/notify";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

type Item = { to: string; label: string; icon: any; roles: Role[] };

const NAV: Item[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["super_admin","captain","secretary","sk_officer","disaster","resident"] },
  { to: "/dashboard/residents", label: "Residents", icon: Users, roles: ["super_admin","secretary"] },
  { to: "/dashboard/households", label: "Households", icon: HomeIcon, roles: ["super_admin","secretary"] },
  { to: "/dashboard/announcements", label: "Announcements", icon: Megaphone, roles: ["super_admin","captain","secretary","resident"] },
  { to: "/dashboard/alerts", label: "Disaster Alerts", icon: AlertTriangle, roles: ["super_admin","captain","disaster","resident"] },
  { to: "/dashboard/incidents", label: "Incidents", icon: Shield, roles: ["super_admin","captain","disaster","resident"] },
  { to: "/dashboard/complaints", label: "Complaints", icon: MessageSquare, roles: ["super_admin","secretary","resident","captain"] },
  { to: "/dashboard/documents", label: "Documents", icon: FileText, roles: ["super_admin","secretary","resident"] },
  { to: "/dashboard/volunteers", label: "Volunteers", icon: HeartHandshake, roles: ["super_admin","sk_officer","disaster"] },
  { to: "/dashboard/youth", label: "Youth (SK)", icon: Sparkles, roles: ["super_admin","sk_officer"] },
  { to: "/dashboard/events", label: "Events", icon: Calendar, roles: ["super_admin","sk_officer","captain","resident"] },
  { to: "/dashboard/evacuation", label: "Evacuation", icon: Building, roles: ["super_admin","disaster","captain"] },
  { to: "/dashboard/emergency", label: "Emergency", icon: Siren, roles: ["super_admin","disaster","resident","captain"] },
  { to: "/dashboard/surveys", label: "Surveys & Polls", icon: ListChecks, roles: ["super_admin","sk_officer","captain","resident"] },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell, roles: ["super_admin","captain","secretary","sk_officer","disaster","resident"] },
  { to: "/dashboard/reports", label: "Reports", icon: BarChart3, roles: ["super_admin","captain"] },
  { to: "/dashboard/users", label: "User Management", icon: UserCog, roles: ["super_admin"] },
  { to: "/dashboard/settings", label: "Settings", icon: SettingsIcon, roles: ["super_admin","captain","secretary","sk_officer","disaster","resident"] },
];

function DashboardLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [date, setDate] = useState("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [notifications] = useStored<Notification[]>("notifications", []);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user) nav({ to: "/login" });
  }, [user, nav]);

  useEffect(() => {
    const d = new Date();
    setDate(d.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
  }, []);

  if (!user) return null;

  const items = NAV.filter((i) => i.roles.includes(user.role));

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className={`${collapsed ? "w-20" : "w-64"} ${mobileOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar/95 text-sidebar-foreground shadow-2xl shadow-slate-950/10 transition-all duration-300 md:translate-x-0 md:sticky md:top-0 md:h-screen`}>
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Shield className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-sm font-bold">e-Cagraray</div>
              <div className="text-[10px] uppercase tracking-wider opacity-70">Barangay System</div>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {items.map((i) => {
            const active = pathname === i.to || (i.to !== "/dashboard" && pathname.startsWith(i.to));
            return (
              <Link key={i.to} to={i.to} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50"}`}>
                <i.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{i.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <button onClick={() => { logout(); nav({ to: "/" }); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent/50">
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {mobileOpen && <div onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-black/50 md:hidden" />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-border/70 bg-background/95 px-4 backdrop-blur-xl md:px-6">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileOpen(true)} className="rounded-full p-2 transition hover:bg-muted md:hidden"><Menu className="h-5 w-5" /></button>
            <button onClick={() => setCollapsed(!collapsed)} className="hidden rounded-full p-2 transition hover:bg-muted md:inline-flex">
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
            <div className="hidden md:block text-sm text-muted-foreground">{date}</div>
          </div>
          <div className="hidden flex-1 max-w-md md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input placeholder="Search…" className="w-full rounded-full border border-border bg-background/90 py-2.5 pl-11 pr-4 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="rounded-full p-2 transition hover:bg-muted" aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <Link to="/dashboard/notifications" className="relative rounded-full p-2 transition hover:bg-muted">
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{unread}</span>}
            </Link>
            <div className="ml-2 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {user.fullName.split(" ").map((s) => s[0]).slice(0, 2).join("")}
              </div>
              <div className="hidden text-xs leading-tight sm:block">
                <div className="font-semibold">{user.fullName}</div>
                <div className="text-muted-foreground">{ROLE_LABELS[user.role]}</div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <div className="min-h-full rounded-[2rem] border border-border bg-card/90 p-4 shadow-sm shadow-slate-900/5 glass-panel md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
