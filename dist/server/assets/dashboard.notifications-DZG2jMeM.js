import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { u as useStored } from "./store-CFBfCpGU.js";
import { P as PageHeader, B as Button, C as Card, E as EmptyState, a as Badge } from "./ui-kit-wmGkfm9P.js";
import { Check, Trash2, Bell } from "lucide-react";
function Page() {
  const [items, setItems] = useStored("notifications", []);
  const [filter, setFilter] = useState("all");
  const list = filter === "unread" ? items.filter((i) => !i.read) : items;
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Notifications", subtitle: "System-generated alerts and updates.", action: /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => setItems(items.map((n) => ({
        ...n,
        read: true
      }))), children: [
        /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }),
        " Mark all read"
      ] }),
      /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => setItems([]), children: [
        /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }),
        " Clear"
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "mb-4 flex gap-2", children: ["all", "unread"].map((f) => /* @__PURE__ */ jsx("button", { onClick: () => setFilter(f), className: `rounded-full border px-3 py-1 text-xs ${filter === f ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`, children: f }, f)) }),
    /* @__PURE__ */ jsx(Card, { children: list.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { icon: Bell, title: "You're all caught up", description: "New notifications will show here." }) : /* @__PURE__ */ jsx("ul", { className: "divide-y", children: list.map((n) => /* @__PURE__ */ jsxs("li", { className: `flex items-start justify-between gap-3 py-3 ${!n.read ? "" : "opacity-60"}`, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Badge, { tone: n.type === "alert" ? "danger" : n.type === "incident" ? "warning" : "info", children: n.type }),
          /* @__PURE__ */ jsx("div", { className: "font-medium", children: n.title })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: n.message }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: new Date(n.createdAt).toLocaleString() })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
        !n.read && /* @__PURE__ */ jsx("button", { onClick: () => setItems(items.map((x) => x.id === n.id ? {
          ...x,
          read: true
        } : x)), className: "rounded p-1.5 hover:bg-muted", children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsx("button", { onClick: () => setItems(items.filter((x) => x.id !== n.id)), className: "rounded p-1.5 text-destructive hover:bg-destructive/10", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
      ] })
    ] }, n.id)) }) })
  ] });
}
export {
  Page as component
};
