import { jsxs, jsx } from "react/jsx-runtime";
import { u as useStored } from "./store-CFBfCpGU.js";
import { C as Card } from "./ui-kit-wmGkfm9P.js";
import { Users, Home, AlertTriangle, Activity, FileText, HeartHandshake, Calendar, Bell } from "lucide-react";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { u as useAuth } from "./router-DhGZC5pb.js";
import "react";
import "@tanstack/react-query";
import "@tanstack/react-router";
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
function Stat({
  icon: Icon,
  label,
  value,
  tone
}) {
  return /* @__PURE__ */ jsx("div", { className: "rounded-xl border bg-card p-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: label }),
      /* @__PURE__ */ jsx("div", { className: "mt-1 text-3xl font-bold", children: value })
    ] }),
    /* @__PURE__ */ jsx("div", { className: `grid h-10 w-10 place-items-center rounded-lg ${tone}`, children: /* @__PURE__ */ jsx(Icon, { className: "h-5 w-5" }) })
  ] }) });
}
function Overview() {
  const {
    user
  } = useAuth();
  const [residents] = useStored("residents", []);
  const [households] = useStored("households", []);
  const [incidents] = useStored("incidents", []);
  const [alerts] = useStored("alerts", []);
  const [requests] = useStored("documents_req", []);
  const [volunteers] = useStored("volunteers", []);
  const [events] = useStored("events", []);
  const popData = ["Male", "Female", "Other"].map((g) => ({
    name: g,
    value: residents.filter((r) => r.gender === g).length
  }));
  const COLORS = ["oklch(0.55 0.13 255)", "oklch(0.7 0.14 30)", "oklch(0.7 0.1 150)"];
  const months = Array.from({
    length: 6
  }, (_, i) => {
    const d = /* @__PURE__ */ new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      key: d.toISOString().slice(0, 7),
      label: d.toLocaleString("en-PH", {
        month: "short"
      })
    };
  });
  const incidentTrend = months.map((m) => ({
    month: m.label,
    incidents: incidents.filter((i) => (i.createdAt || "").startsWith(m.key)).length,
    alerts: alerts.filter((a) => (a.createdAt || "").startsWith(m.key)).length
  }));
  const eventPart = events.slice(-6).map((e) => ({
    name: e.title?.slice(0, 12) || "Event",
    attendees: (e.attendees || []).length
  }));
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold md:text-3xl", children: [
        "Good day, ",
        user?.fullName.split(" ")[0],
        "."
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Here's what's happening across the barangay." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsx(Stat, { icon: Users, label: "Residents", value: residents.length, tone: "bg-primary/10 text-primary" }),
      /* @__PURE__ */ jsx(Stat, { icon: Home, label: "Households", value: households.length, tone: "bg-info/10 text-info" }),
      /* @__PURE__ */ jsx(Stat, { icon: AlertTriangle, label: "Active Alerts", value: alerts.filter((a) => a.status !== "resolved").length, tone: "bg-destructive/10 text-destructive" }),
      /* @__PURE__ */ jsx(Stat, { icon: Activity, label: "Open Incidents", value: incidents.filter((i) => i.status !== "Resolved").length, tone: "bg-warning/20 text-warning-foreground" }),
      /* @__PURE__ */ jsx(Stat, { icon: FileText, label: "Document Requests", value: requests.length, tone: "bg-accent/20 text-accent-foreground" }),
      /* @__PURE__ */ jsx(Stat, { icon: HeartHandshake, label: "Volunteers", value: volunteers.length, tone: "bg-success/15 text-success" }),
      /* @__PURE__ */ jsx(Stat, { icon: Calendar, label: "Events", value: events.length, tone: "bg-primary/10 text-primary" }),
      /* @__PURE__ */ jsx(Stat, { icon: Bell, label: "Notifications", value: 0, tone: "bg-muted text-muted-foreground" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-4 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxs(Card, { className: "lg:col-span-2", children: [
        /* @__PURE__ */ jsx("div", { className: "mb-3 font-semibold", children: "Incident & Alert Trend" }),
        /* @__PURE__ */ jsx("div", { className: "h-64", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data: incidentTrend, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", opacity: 0.3 }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "month", fontSize: 12 }),
          /* @__PURE__ */ jsx(YAxis, { fontSize: 12, allowDecimals: false }),
          /* @__PURE__ */ jsx(Tooltip, {}),
          /* @__PURE__ */ jsx(Legend, {}),
          /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "incidents", stroke: "oklch(0.6 0.22 27)", strokeWidth: 2 }),
          /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "alerts", stroke: "oklch(0.55 0.13 255)", strokeWidth: 2 })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx("div", { className: "mb-3 font-semibold", children: "Population by Gender" }),
        residents.length === 0 ? /* @__PURE__ */ jsx("div", { className: "grid h-64 place-items-center text-sm text-muted-foreground", children: "No resident data yet" }) : /* @__PURE__ */ jsx("div", { className: "h-64", children: /* @__PURE__ */ jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxs(PieChart, { children: [
          /* @__PURE__ */ jsx(Pie, { data: popData, dataKey: "value", nameKey: "name", innerRadius: 50, outerRadius: 80, children: popData.map((_, i) => /* @__PURE__ */ jsx(Cell, { fill: COLORS[i] }, i)) }),
          /* @__PURE__ */ jsx(Tooltip, {}),
          /* @__PURE__ */ jsx(Legend, {})
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "lg:col-span-3", children: [
        /* @__PURE__ */ jsx("div", { className: "mb-3 font-semibold", children: "Event Participation" }),
        eventPart.length === 0 ? /* @__PURE__ */ jsx("div", { className: "grid h-48 place-items-center text-sm text-muted-foreground", children: "No event data yet" }) : /* @__PURE__ */ jsx("div", { className: "h-64", children: /* @__PURE__ */ jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxs(BarChart, { data: eventPart, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", opacity: 0.3 }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "name", fontSize: 12 }),
          /* @__PURE__ */ jsx(YAxis, { fontSize: 12, allowDecimals: false }),
          /* @__PURE__ */ jsx(Tooltip, {}),
          /* @__PURE__ */ jsx(Bar, { dataKey: "attendees", fill: "oklch(0.55 0.13 255)", radius: 6 })
        ] }) }) })
      ] })
    ] })
  ] });
}
export {
  Overview as component
};
