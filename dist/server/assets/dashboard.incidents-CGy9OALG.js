import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { c as canRole, u as useStored, a as uid } from "./store-CFBfCpGU.js";
import { P as PageHeader, B as Button, C as Card, E as EmptyState, a as Badge, M as Modal, S as Select, I as Input, T as Textarea } from "./ui-kit-wmGkfm9P.js";
import { Plus, Shield } from "lucide-react";
import { u as useAuth } from "./router-DhGZC5pb.js";
import { p as pushNotification } from "./notify-BNw7Zvdy.js";
import { toast } from "sonner";
import "@tanstack/react-query";
import "@tanstack/react-router";
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
const TYPES = ["Theft", "Vandalism", "Noise", "Accident", "Disaster", "Medical", "Other"];
const FLOW = ["Submitted", "Under Review", "Verified", "Resolved"];
function Page() {
  const {
    user
  } = useAuth();
  canRole(user?.role, "incidentsManage");
  const [items, setItems] = useStored("incidents", []);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [view, setView] = useState(null);
  const submit = (e) => {
    e.preventDefault();
    if (!draft || !draft.type || !draft.description) return toast.error("Fill required fields");
    const p = {
      ...draft,
      id: uid(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "Submitted",
      reporter: user?.fullName || "Anonymous",
      timeline: [{
        at: (/* @__PURE__ */ new Date()).toISOString(),
        status: "Submitted"
      }]
    };
    setItems([p, ...items]);
    pushNotification({
      title: "Incident Reported",
      message: `${p.type} at ${p.location}`,
      type: "incident"
    });
    setOpen(false);
    toast.success("Incident submitted");
  };
  const advance = (i, status) => {
    setItems(items.map((x) => x.id === i.id ? {
      ...x,
      status,
      timeline: [...x.timeline, {
        at: (/* @__PURE__ */ new Date()).toISOString(),
        status
      }]
    } : x));
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Incident Reports", subtitle: "Track community-submitted incidents through resolution.", action: /* @__PURE__ */ jsxs(Button, { onClick: () => {
      setDraft({
        id: "",
        type: "Theft",
        description: "",
        location: "",
        status: "Submitted",
        reporter: "",
        createdAt: "",
        timeline: []
      });
      setOpen(true);
    }, children: [
      /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
      " Report Incident"
    ] }) }),
    /* @__PURE__ */ jsx(Card, { children: items.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { icon: Shield, title: "No incidents reported", description: "Submitted incidents will appear here for review." }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "border-b text-left text-xs uppercase text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "py-2", children: "Type" }),
        /* @__PURE__ */ jsx("th", { children: "Description" }),
        /* @__PURE__ */ jsx("th", { children: "Location" }),
        /* @__PURE__ */ jsx("th", { children: "Reporter" }),
        /* @__PURE__ */ jsx("th", { children: "Status" }),
        /* @__PURE__ */ jsx("th", { children: "Date" }),
        /* @__PURE__ */ jsx("th", {})
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: items.map((i) => /* @__PURE__ */ jsxs("tr", { className: "border-b last:border-0", children: [
        /* @__PURE__ */ jsx("td", { className: "py-3", children: /* @__PURE__ */ jsx(Badge, { children: i.type }) }),
        /* @__PURE__ */ jsx("td", { className: "max-w-[280px] truncate", children: i.description }),
        /* @__PURE__ */ jsx("td", { children: i.location }),
        /* @__PURE__ */ jsx("td", { children: i.reporter }),
        /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(Badge, { tone: i.status === "Resolved" ? "success" : i.status === "Verified" ? "info" : "warning", children: i.status }) }),
        /* @__PURE__ */ jsx("td", { className: "text-xs text-muted-foreground", children: new Date(i.createdAt).toLocaleDateString() }),
        /* @__PURE__ */ jsx("td", { className: "text-right", children: /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setView(i), children: "View" }) })
      ] }, i.id)) })
    ] }) }) }),
    /* @__PURE__ */ jsx(Modal, { open, onClose: () => setOpen(false), title: "Report Incident", children: draft && /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
      /* @__PURE__ */ jsx(Select, { label: "Type *", value: draft.type, onChange: (e) => setDraft({
        ...draft,
        type: e.target.value
      }), children: TYPES.map((t) => /* @__PURE__ */ jsx("option", { children: t }, t)) }),
      /* @__PURE__ */ jsx(Input, { label: "Location *", value: draft.location, onChange: (e) => setDraft({
        ...draft,
        location: e.target.value
      }) }),
      /* @__PURE__ */ jsx(Textarea, { label: "Description *", rows: 4, value: draft.description, onChange: (e) => setDraft({
        ...draft,
        description: e.target.value
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { type: "submit", children: "Submit" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Modal, { open: !!view, onClose: () => setView(null), title: "Incident Timeline", children: view && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-muted/50 p-3 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "font-semibold", children: [
          view.type,
          " · ",
          view.location
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: view.description }),
        /* @__PURE__ */ jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
          "Reported by ",
          view.reporter
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "mb-2 text-sm font-medium", children: "Timeline" }),
        /* @__PURE__ */ jsx("ol", { className: "space-y-2 border-l pl-4", children: view.timeline.map((t, idx) => /* @__PURE__ */ jsxs("li", { className: "relative", children: [
          /* @__PURE__ */ jsx("span", { className: "absolute -left-[22px] top-1 h-3 w-3 rounded-full bg-primary" }),
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: t.status }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: new Date(t.at).toLocaleString() })
        ] }, idx)) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 pt-2", children: FLOW.filter((s) => s !== view.status).map((s) => /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => {
        advance(view, s);
        setView({
          ...view,
          status: s,
          timeline: [...view.timeline, {
            at: (/* @__PURE__ */ new Date()).toISOString(),
            status: s
          }]
        });
      }, children: [
        "Mark ",
        s
      ] }, s)) })
    ] }) })
  ] });
}
export {
  Page as component
};
