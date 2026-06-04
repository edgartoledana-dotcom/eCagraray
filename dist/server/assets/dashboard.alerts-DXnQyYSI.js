import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { c as canRole, u as useStored, a as uid } from "./store-CFBfCpGU.js";
import { P as PageHeader, B as Button, C as Card, E as EmptyState, a as Badge, M as Modal, S as Select, I as Input, T as Textarea } from "./ui-kit-wmGkfm9P.js";
import { Plus, AlertTriangle, Trash2 } from "lucide-react";
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
const TYPES = ["Typhoon", "Flood", "Landslide", "Fire", "Earthquake", "Emergency"];
const LEVELS = ["Low", "Moderate", "High", "Critical"];
const levelTone = {
  Low: "info",
  Moderate: "warning",
  High: "danger",
  Critical: "danger"
};
function Page() {
  const {
    user
  } = useAuth();
  const canManage = canRole(user?.role, "alerts");
  const [items, setItems] = useStored("alerts", []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const active = items.filter((a) => a.status === "active");
  const history = items.filter((a) => a.status === "resolved");
  const save = (e) => {
    e.preventDefault();
    if (!editing || !editing.title) return toast.error("Title required");
    const isNew = !editing.id;
    const payload = isNew ? {
      ...editing,
      id: uid(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "active"
    } : editing;
    setItems(isNew ? [payload, ...items] : items.map((i) => i.id === payload.id ? payload : i));
    if (isNew) pushNotification({
      title: `${payload.level} ${payload.type} Alert`,
      message: payload.title,
      type: "alert"
    });
    setOpen(false);
    toast.success("Saved");
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Disaster Alerts", subtitle: "Emergency operations center for active and historical alerts.", action: canManage ? /* @__PURE__ */ jsxs(Button, { onClick: () => {
      setEditing({
        id: "",
        type: "Typhoon",
        level: "Moderate",
        title: "",
        description: "",
        location: "",
        status: "active",
        createdAt: ""
      });
      setOpen(true);
    }, children: [
      /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
      " New Alert"
    ] }) : void 0 }),
    /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-3 mb-6", children: LEVELS.map((l) => /* @__PURE__ */ jsxs("div", { className: "rounded-xl border bg-card p-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: [
        l,
        " active"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-1 text-2xl font-bold", children: active.filter((a) => a.level === l).length })
    ] }, l)).slice(0, 4) }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx("h2", { className: "mb-3 font-semibold", children: "Active Alerts" }),
      active.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { icon: AlertTriangle, title: "No active alerts", description: "All clear. Create an alert if a hazard occurs." }) : /* @__PURE__ */ jsx("div", { className: "grid gap-3 md:grid-cols-2", children: active.map((a) => /* @__PURE__ */ jsxs("div", { className: "rounded-xl border-l-4 border-destructive bg-destructive/5 p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Badge, { tone: "danger", children: a.type }),
            /* @__PURE__ */ jsx(Badge, { tone: levelTone[a.level], children: a.level })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: new Date(a.createdAt).toLocaleString() })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-2 font-semibold", children: a.title }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: a.description }),
        /* @__PURE__ */ jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
          "📍 ",
          a.location
        ] }),
        canManage && /* @__PURE__ */ jsxs("div", { className: "mt-3 flex gap-2", children: [
          /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setItems(items.map((x) => x.id === a.id ? {
            ...x,
            status: "resolved"
          } : x)), children: "Mark Resolved" }),
          /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => {
            if (confirm("Delete?")) setItems(items.filter((x) => x.id !== a.id));
          }, children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
        ] })
      ] }, a.id)) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx("h2", { className: "mb-3 font-semibold", children: "Alert History" }),
      history.length === 0 ? /* @__PURE__ */ jsx("div", { className: "py-6 text-center text-sm text-muted-foreground", children: "No past alerts" }) : /* @__PURE__ */ jsx("ul", { className: "divide-y", children: history.map((a) => /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between py-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "font-medium", children: a.title }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
            a.type,
            " · ",
            a.level,
            " · ",
            new Date(a.createdAt).toLocaleDateString()
          ] })
        ] }),
        /* @__PURE__ */ jsx(Badge, { tone: "success", children: "Resolved" })
      ] }, a.id)) })
    ] }) }),
    /* @__PURE__ */ jsx(Modal, { open, onClose: () => setOpen(false), title: "New Alert", children: editing && /* @__PURE__ */ jsxs("form", { onSubmit: save, className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsx(Select, { label: "Type", value: editing.type, onChange: (e) => setEditing({
          ...editing,
          type: e.target.value
        }), children: TYPES.map((t) => /* @__PURE__ */ jsx("option", { children: t }, t)) }),
        /* @__PURE__ */ jsx(Select, { label: "Level", value: editing.level, onChange: (e) => setEditing({
          ...editing,
          level: e.target.value
        }), children: LEVELS.map((l) => /* @__PURE__ */ jsx("option", { children: l }, l)) })
      ] }),
      /* @__PURE__ */ jsx(Input, { label: "Title", value: editing.title, onChange: (e) => setEditing({
        ...editing,
        title: e.target.value
      }) }),
      /* @__PURE__ */ jsx(Input, { label: "Location", value: editing.location, onChange: (e) => setEditing({
        ...editing,
        location: e.target.value
      }) }),
      /* @__PURE__ */ jsx(Textarea, { label: "Description", rows: 3, value: editing.description, onChange: (e) => setEditing({
        ...editing,
        description: e.target.value
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { type: "submit", children: "Publish" })
      ] })
    ] }) })
  ] });
}
export {
  Page as component
};
