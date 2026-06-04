import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate, useRouterState, Link, Outlet } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { LayoutDashboard, Users, Home, Megaphone, AlertTriangle, Shield, MessageSquare, FileText, HeartHandshake, Sparkles, Calendar, Building, Siren, ListChecks, Bell, BarChart3, UserCog, Settings, LogOut, Menu, ChevronRight, ChevronLeft, Search, Sun, Moon } from "lucide-react";
import { u as useAuth, a as useTheme } from "./router-DhGZC5pb.js";
import { u as useStored, R as ROLE_LABELS } from "./store-CFBfCpGU.js";
import "@tanstack/react-query";
import "sonner";
import "./server-D33WmEg_.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "zod";
const NAV = [{
  to: "/dashboard",
  label: "Overview",
  icon: LayoutDashboard,
  roles: ["super_admin", "captain", "secretary", "sk_officer", "disaster", "resident"]
}, {
  to: "/dashboard/residents",
  label: "Residents",
  icon: Users,
  roles: ["super_admin", "secretary"]
}, {
  to: "/dashboard/households",
  label: "Households",
  icon: Home,
  roles: ["super_admin", "secretary"]
}, {
  to: "/dashboard/announcements",
  label: "Announcements",
  icon: Megaphone,
  roles: ["super_admin", "captain", "secretary", "resident"]
}, {
  to: "/dashboard/alerts",
  label: "Disaster Alerts",
  icon: AlertTriangle,
  roles: ["super_admin", "captain", "disaster", "resident"]
}, {
  to: "/dashboard/incidents",
  label: "Incidents",
  icon: Shield,
  roles: ["super_admin", "captain", "disaster", "resident"]
}, {
  to: "/dashboard/complaints",
  label: "Complaints",
  icon: MessageSquare,
  roles: ["super_admin", "secretary", "resident", "captain"]
}, {
  to: "/dashboard/documents",
  label: "Documents",
  icon: FileText,
  roles: ["super_admin", "secretary", "resident"]
}, {
  to: "/dashboard/volunteers",
  label: "Volunteers",
  icon: HeartHandshake,
  roles: ["super_admin", "sk_officer", "disaster"]
}, {
  to: "/dashboard/youth",
  label: "Youth (SK)",
  icon: Sparkles,
  roles: ["super_admin", "sk_officer"]
}, {
  to: "/dashboard/events",
  label: "Events",
  icon: Calendar,
  roles: ["super_admin", "sk_officer", "captain", "resident"]
}, {
  to: "/dashboard/evacuation",
  label: "Evacuation",
  icon: Building,
  roles: ["super_admin", "disaster", "captain"]
}, {
  to: "/dashboard/emergency",
  label: "Emergency",
  icon: Siren,
  roles: ["super_admin", "disaster", "resident", "captain"]
}, {
  to: "/dashboard/surveys",
  label: "Surveys & Polls",
  icon: ListChecks,
  roles: ["super_admin", "sk_officer", "captain", "resident"]
}, {
  to: "/dashboard/notifications",
  label: "Notifications",
  icon: Bell,
  roles: ["super_admin", "captain", "secretary", "sk_officer", "disaster", "resident"]
}, {
  to: "/dashboard/reports",
  label: "Reports",
  icon: BarChart3,
  roles: ["super_admin", "captain"]
}, {
  to: "/dashboard/users",
  label: "User Management",
  icon: UserCog,
  roles: ["super_admin"]
}, {
  to: "/dashboard/settings",
  label: "Settings",
  icon: Settings,
  roles: ["super_admin", "captain", "secretary", "sk_officer", "disaster", "resident"]
}];
function DashboardLayout() {
  const {
    user,
    logout
  } = useAuth();
  const nav = useNavigate();
  const {
    theme,
    toggle
  } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [date, setDate] = useState("");
  const pathname = useRouterState({
    select: (s) => s.location.pathname
  });
  const [notifications] = useStored("notifications", []);
  const unread = notifications.filter((n) => !n.read).length;
  useEffect(() => {
    if (!user) nav({
      to: "/login"
    });
  }, [user, nav]);
  useEffect(() => {
    const d = /* @__PURE__ */ new Date();
    setDate(d.toLocaleDateString("en-PH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    }));
  }, []);
  if (!user) return null;
  const items = NAV.filter((i) => i.roles.includes(user.role));
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen bg-muted/30", children: [
    /* @__PURE__ */ jsxs("aside", { className: `${collapsed ? "w-20" : "w-64"} ${mobileOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar/95 text-sidebar-foreground shadow-2xl shadow-slate-950/10 transition-all duration-300 md:translate-x-0 md:sticky md:top-0 md:h-screen`, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex h-16 items-center gap-2 border-b border-sidebar-border px-4", children: [
        /* @__PURE__ */ jsx("div", { className: "grid h-11 w-11 shrink-0 place-items-center rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-primary/20", children: /* @__PURE__ */ jsx(Shield, { className: "h-5 w-5" }) }),
        !collapsed && /* @__PURE__ */ jsxs("div", { className: "overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-bold", children: "e-Cagraray" }),
          /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wider opacity-70", children: "Barangay System" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("nav", { className: "flex-1 space-y-0.5 overflow-y-auto px-2 py-3", children: items.map((i) => {
        const active = pathname === i.to || i.to !== "/dashboard" && pathname.startsWith(i.to);
        return /* @__PURE__ */ jsxs(Link, { to: i.to, onClick: () => setMobileOpen(false), className: `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50"}`, children: [
          /* @__PURE__ */ jsx(i.icon, { className: "h-4 w-4 shrink-0" }),
          !collapsed && /* @__PURE__ */ jsx("span", { className: "truncate", children: i.label })
        ] }, i.to);
      }) }),
      /* @__PURE__ */ jsx("div", { className: "border-t border-sidebar-border p-3", children: /* @__PURE__ */ jsxs("button", { onClick: () => {
        logout();
        nav({
          to: "/"
        });
      }, className: "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent/50", children: [
        /* @__PURE__ */ jsx(LogOut, { className: "h-4 w-4" }),
        !collapsed && /* @__PURE__ */ jsx("span", { children: "Sign out" })
      ] }) })
    ] }),
    mobileOpen && /* @__PURE__ */ jsx("div", { onClick: () => setMobileOpen(false), className: "fixed inset-0 z-30 bg-black/50 md:hidden" }),
    /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 flex-1 flex-col", children: [
      /* @__PURE__ */ jsxs("header", { className: "sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-border/70 bg-background/95 px-4 backdrop-blur-xl md:px-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => setMobileOpen(true), className: "rounded-full p-2 transition hover:bg-muted md:hidden", children: /* @__PURE__ */ jsx(Menu, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsx("button", { onClick: () => setCollapsed(!collapsed), className: "hidden rounded-full p-2 transition hover:bg-muted md:inline-flex", children: collapsed ? /* @__PURE__ */ jsx(ChevronRight, { className: "h-5 w-5" }) : /* @__PURE__ */ jsx(ChevronLeft, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsx("div", { className: "hidden md:block text-sm text-muted-foreground", children: date })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "hidden flex-1 max-w-md md:block", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
          /* @__PURE__ */ jsx("input", { placeholder: "Search…", className: "w-full rounded-full border border-border bg-background/90 py-2.5 pl-11 pr-4 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/10" })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("button", { onClick: toggle, className: "rounded-full p-2 transition hover:bg-muted", "aria-label": "Toggle theme", children: theme === "dark" ? /* @__PURE__ */ jsx(Sun, { className: "h-5 w-5" }) : /* @__PURE__ */ jsx(Moon, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsxs(Link, { to: "/dashboard/notifications", className: "relative rounded-full p-2 transition hover:bg-muted", children: [
            /* @__PURE__ */ jsx(Bell, { className: "h-5 w-5" }),
            unread > 0 && /* @__PURE__ */ jsx("span", { className: "absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground", children: unread })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "ml-2 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5", children: [
            /* @__PURE__ */ jsx("div", { className: "grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground", children: user.fullName.split(" ").map((s) => s[0]).slice(0, 2).join("") }),
            /* @__PURE__ */ jsxs("div", { className: "hidden text-xs leading-tight sm:block", children: [
              /* @__PURE__ */ jsx("div", { className: "font-semibold", children: user.fullName }),
              /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: ROLE_LABELS[user.role] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("main", { className: "flex-1 p-4 md:p-6", children: /* @__PURE__ */ jsx("div", { className: "min-h-full rounded-[2rem] border border-border bg-card/90 p-4 shadow-sm shadow-slate-900/5 glass-panel md:p-6", children: /* @__PURE__ */ jsx(Outlet, {}) }) })
    ] })
  ] });
}
export {
  DashboardLayout as component
};
