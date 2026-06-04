import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Shield, Users, AlertTriangle, Megaphone, FileText, Sparkles, HeartHandshake, BarChart3, Building2, MapPin, Phone, Mail } from "lucide-react";
import { g as getDashboardStats, b as getBarangayInfo } from "./router-DhGZC5pb.js";
import "@tanstack/react-query";
import "sonner";
import "./store-CFBfCpGU.js";
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
  value,
  label
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border bg-card/70 backdrop-blur p-6 text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "text-4xl font-bold text-primary", children: value }),
    /* @__PURE__ */ jsx("div", { className: "mt-1 text-sm text-muted-foreground", children: label })
  ] });
}
function Landing() {
  const [stats, setStats] = useState({
    residents: 0,
    households: 0,
    volunteers: 0,
    events: 0
  });
  const [info, setInfo] = useState(null);
  useEffect(() => {
    void getDashboardStats().then((stats2) => {
      if (stats2) setStats(stats2);
    });
    void getBarangayInfo().then((info2) => {
      setInfo(info2);
    });
  }, []);
  const features = [{
    icon: Users,
    t: "Resident Profiling",
    d: "Complete digital records with search, filter, and household linking."
  }, {
    icon: AlertTriangle,
    t: "Disaster Alerts",
    d: "Push real-time alerts for typhoons, floods, fires, and emergencies."
  }, {
    icon: Megaphone,
    t: "Announcements",
    d: "Publish official notices to the community by category."
  }, {
    icon: FileText,
    t: "Online Requests",
    d: "Clearances, residency, and indigency certificates online."
  }, {
    icon: Sparkles,
    t: "Youth Engagement",
    d: "SK programs, events, and participation tracking."
  }, {
    icon: HeartHandshake,
    t: "Volunteer Coordination",
    d: "Skill registry and deployment for disaster response."
  }, {
    icon: Shield,
    t: "Incident Reporting",
    d: "Resident-submitted incidents with workflow tracking."
  }, {
    icon: BarChart3,
    t: "Analytics Dashboard",
    d: "Live charts of population, incidents, and events."
  }];
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background text-foreground", children: [
    /* @__PURE__ */ jsx("header", { className: "sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "grid h-11 w-11 place-items-center rounded-3xl gov-gradient text-white shadow-lg shadow-primary/20", children: /* @__PURE__ */ jsx(Shield, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-base font-semibold tracking-wide", children: "e-Cagraray" }),
          /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-[0.35em] text-muted-foreground", children: "Smart Barangay System" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("nav", { className: "hidden items-center gap-8 text-sm font-medium md:flex", children: [
        /* @__PURE__ */ jsx("a", { href: "#about", className: "transition hover:text-primary", children: "About" }),
        /* @__PURE__ */ jsx("a", { href: "#features", className: "transition hover:text-primary", children: "Features" }),
        /* @__PURE__ */ jsx("a", { href: "#stats", className: "transition hover:text-primary", children: "Statistics" }),
        /* @__PURE__ */ jsx("a", { href: "#contact", className: "transition hover:text-primary", children: "Contact" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(Link, { to: "/login", className: "rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary", children: "Login" }),
        /* @__PURE__ */ jsx(Link, { to: "/register", className: "rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-95", children: "Register" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden bg-background/80 py-20", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 hero-glow opacity-80" }),
      /* @__PURE__ */ jsx("div", { className: "relative mx-auto max-w-7xl px-4 md:px-6", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-12 lg:grid-cols-[1.1fr_0.9fr]", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-4 py-2 text-xs font-semibold text-muted-foreground shadow-sm shadow-slate-900/5 glass-panel", children: [
            /* @__PURE__ */ jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-success animate-pulse" }),
            "Republic of the Philippines · Local Government Unit"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsx("h1", { className: "text-5xl font-extrabold leading-tight tracking-tight text-slate-950 md:text-6xl", children: "Barangay management with clarity, speed, and community focus." }),
            /* @__PURE__ */ jsx("p", { className: "max-w-2xl text-lg leading-8 text-muted-foreground", children: "e-Cagraray modernizes operations from resident profiling to disaster alerts, giving officials and citizens a polished digital command center." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-4", children: [
            /* @__PURE__ */ jsx(Link, { to: "/login", className: "inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-95", children: "Access Dashboard" }),
            /* @__PURE__ */ jsx("a", { href: "#features", className: "inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary", children: "Explore Features" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-2 xl:max-w-xl", children: /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-border bg-card p-6 shadow-sm shadow-slate-900/5 glass-panel", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-[0.24em] text-muted-foreground", children: "What’s new" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-3 space-y-2 text-sm text-slate-950", children: [
              /* @__PURE__ */ jsx("p", { children: "Responsive dashboard for all barangay roles." }),
              /* @__PURE__ */ jsx("p", { children: "Improved access to announcements, alerts, and requests." })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-[2rem] border border-border bg-card p-6 shadow-2xl shadow-primary/10 glass-panel", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 border-b border-border/70 pb-4 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsx("span", { children: "Barangay Operations Console" }),
            /* @__PURE__ */ jsx("span", { className: "rounded-full bg-success/10 px-3 py-1 text-success", children: "Live" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-6 grid gap-4 sm:grid-cols-2", children: [{
            l: "Active Alerts",
            v: 0,
            c: "bg-destructive/10 text-destructive"
          }, {
            l: "Pending Requests",
            v: 0,
            c: "bg-info/10 text-info"
          }, {
            l: "Events This Week",
            v: 0,
            c: "bg-accent/20 text-accent-foreground"
          }, {
            l: "Volunteers Online",
            v: 0,
            c: "bg-success/10 text-success"
          }].map((s) => /* @__PURE__ */ jsxs("div", { className: `rounded-3xl p-5 ${s.c}`, children: [
            /* @__PURE__ */ jsx("div", { className: "text-3xl font-semibold", children: s.v }),
            /* @__PURE__ */ jsx("div", { className: "mt-2 text-sm font-medium", children: s.l })
          ] }, s.l)) }),
          /* @__PURE__ */ jsx("div", { className: "mt-6 grid gap-3", children: ["Disaster Operations Center", "Document Releasing", "Community Updates"].map((x) => /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-slate-700 shadow-sm shadow-slate-900/5", children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: x }),
            /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: "Real-time readiness" })
          ] }, x)) })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("section", { id: "about", className: "border-y border-border/70 bg-muted/30 py-24", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 md:px-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl text-center", children: [
        /* @__PURE__ */ jsx("h2", { className: "section-title text-3xl font-bold md:text-4xl", children: "A modern operating system for the barangay" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-base leading-8 text-muted-foreground", children: "Unifying records, disaster response, and citizen participation in one place with a polished, role-aware interface." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-12 grid gap-6 md:grid-cols-4", children: [{
        t: "Resident Management",
        d: "Centralized digital records."
      }, {
        t: "Disaster Preparedness",
        d: "Alerts and rescue coordination."
      }, {
        t: "Community Participation",
        d: "Polls, events, and volunteerism."
      }, {
        t: "SK Engagement",
        d: "Programs for the youth sector."
      }].map((x) => /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-border bg-card p-6 shadow-sm shadow-slate-900/5 glass-panel", children: [
        /* @__PURE__ */ jsx("div", { className: "text-lg font-semibold text-slate-950", children: x.t }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: x.d })
      ] }, x.t)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { id: "features", className: "py-24", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 md:px-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl text-center", children: [
        /* @__PURE__ */ jsx("h2", { className: "section-title text-3xl font-bold md:text-4xl", children: "Everything your barangay needs" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-base leading-8 text-muted-foreground", children: "Designed for officials, responders, and residents alike with clear action and simplified workflows." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4", children: features.map((f) => /* @__PURE__ */ jsxs("div", { className: "group rounded-[1.75rem] border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 glass-panel", children: [
        /* @__PURE__ */ jsx("div", { className: "grid h-12 w-12 place-items-center rounded-3xl gov-gradient text-white shadow-lg shadow-primary/10", children: /* @__PURE__ */ jsx(f.icon, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsx("div", { className: "mt-5 text-lg font-semibold text-slate-950", children: f.t }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: f.d })
      ] }, f.t)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { id: "stats", className: "border-y bg-muted/30 py-16", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 md:grid-cols-4", children: [
      /* @__PURE__ */ jsx(Stat, { value: stats.residents, label: "Registered Residents" }),
      /* @__PURE__ */ jsx(Stat, { value: stats.households, label: "Households" }),
      /* @__PURE__ */ jsx(Stat, { value: stats.volunteers, label: "Volunteers" }),
      /* @__PURE__ */ jsx(Stat, { value: stats.events, label: "Community Events" })
    ] }) }),
    /* @__PURE__ */ jsx("section", { id: "contact", className: "py-24", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto grid max-w-7xl gap-10 px-4 md:grid-cols-2 md:px-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsx("div", { className: "section-title text-3xl font-bold md:text-4xl", children: "Contact the Barangay" }),
        /* @__PURE__ */ jsx("p", { className: "text-base leading-8 text-muted-foreground", children: "Information can be updated from the admin settings panel or shared directly with residents through announcements." }),
        /* @__PURE__ */ jsxs("ul", { className: "space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm shadow-slate-900/5 glass-panel", children: [
          /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsx(Building2, { className: "mt-0.5 h-5 w-5 text-primary" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "font-semibold", children: info?.name }),
              /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
                info?.municipality,
                ", ",
                info?.province
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "mt-0.5 h-5 w-5 text-primary" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: info?.address })
          ] }),
          /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsx(Phone, { className: "mt-0.5 h-5 w-5 text-primary" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: info?.contact })
          ] }),
          /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsx(Mail, { className: "mt-0.5 h-5 w-5 text-primary" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: info?.email })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-[2rem] border border-border bg-card p-8 shadow-2xl shadow-primary/10 glass-panel", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xl font-semibold", children: "Send a quick message" }),
        /* @__PURE__ */ jsxs("form", { className: "mt-6 space-y-4", onSubmit: (e) => {
          e.preventDefault();
          alert("Thanks! Message recorded locally.");
        }, children: [
          /* @__PURE__ */ jsx("input", { className: "w-full rounded-3xl border border-border bg-background/80 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20", placeholder: "Your name", required: true }),
          /* @__PURE__ */ jsx("input", { className: "w-full rounded-3xl border border-border bg-background/80 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20", placeholder: "Email", type: "email", required: true }),
          /* @__PURE__ */ jsx("textarea", { className: "w-full rounded-3xl border border-border bg-background/80 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20", placeholder: "Message", rows: 5, required: true }),
          /* @__PURE__ */ jsx("button", { className: "inline-flex w-full items-center justify-center rounded-3xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95", children: "Send Message" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("footer", { className: "border-t bg-muted/40", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Shield, { className: "h-4 w-4" }),
        " © ",
        (/* @__PURE__ */ new Date()).getFullYear(),
        " e-Cagraray · All rights reserved"
      ] }),
      /* @__PURE__ */ jsxs("nav", { className: "flex flex-wrap gap-4 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsx("a", { href: "#", className: "hover:text-primary", children: "Home" }),
        /* @__PURE__ */ jsx("a", { href: "#about", className: "hover:text-primary", children: "About" }),
        /* @__PURE__ */ jsx("a", { href: "#features", className: "hover:text-primary", children: "Features" }),
        /* @__PURE__ */ jsx("a", { href: "#contact", className: "hover:text-primary", children: "Contact" }),
        /* @__PURE__ */ jsx(Link, { to: "/login", className: "hover:text-primary", children: "Login" }),
        /* @__PURE__ */ jsx(Link, { to: "/register", className: "hover:text-primary", children: "Register" })
      ] })
    ] }) })
  ] });
}
export {
  Landing as component
};
