import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { c as canRole, u as useStored, a as uid } from "./store-CFBfCpGU.js";
import { P as PageHeader, B as Button, C as Card, E as EmptyState, a as Badge, M as Modal, I as Input, S as Select, T as Textarea } from "./ui-kit-wmGkfm9P.js";
import { Plus, Megaphone, Pin, Archive, Pencil, Trash2 } from "lucide-react";
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
const CATEGORIES = ["General", "Health", "Disaster", "Education", "SK", "Community"];
function Page() {
  const {
    user
  } = useAuth();
  const canManage = canRole(user?.role, "announcements");
  const [items, setItems] = useStored("announcements", []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("All");
  const list = items.filter((i) => filter === "All" || i.category === filter).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt));
  const save = (e) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.title.trim()) return toast.error("Title required");
    const isNew = !editing.id;
    const payload = isNew ? {
      ...editing,
      id: uid(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    } : editing;
    setItems(isNew ? [payload, ...items] : items.map((i) => i.id === payload.id ? payload : i));
    if (isNew) pushNotification({
      title: "New Announcement",
      message: payload.title,
      type: "info"
    });
    setOpen(false);
    toast.success(isNew ? "Posted" : "Updated");
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Announcements", subtitle: "Official barangay notices and updates.", action: canManage ? /* @__PURE__ */ jsxs(Button, { onClick: () => {
      setEditing({
        id: "",
        title: "",
        body: "",
        category: "General",
        pinned: false,
        archived: false,
        createdAt: ""
      });
      setOpen(true);
    }, children: [
      /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
      " New Announcement"
    ] }) : void 0 }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx("div", { className: "mb-4 flex flex-wrap gap-2", children: ["All", ...CATEGORIES].map((c) => /* @__PURE__ */ jsx("button", { onClick: () => setFilter(c), className: `rounded-full border px-3 py-1 text-xs ${filter === c ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`, children: c }, c)) }),
      list.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { icon: Megaphone, title: "No announcements yet", description: "Create your first announcement to broadcast to the community." }) : /* @__PURE__ */ jsx("div", { className: "grid gap-3 md:grid-cols-2", children: list.map((a) => /* @__PURE__ */ jsxs("div", { className: `rounded-xl border p-4 ${a.archived ? "opacity-60" : ""} ${a.pinned ? "border-accent" : ""}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Badge, { tone: "info", children: a.category }),
            a.pinned && /* @__PURE__ */ jsxs(Badge, { tone: "warning", children: [
              /* @__PURE__ */ jsx(Pin, { className: "mr-1 inline h-3 w-3" }),
              " Pinned"
            ] }),
            a.archived && /* @__PURE__ */ jsx(Badge, { tone: "muted", children: "Archived" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: new Date(a.createdAt).toLocaleDateString() })
        ] }),
        /* @__PURE__ */ jsx("h3", { className: "mt-2 font-semibold", children: a.title }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground line-clamp-3", children: a.body }),
        canManage && /* @__PURE__ */ jsxs("div", { className: "mt-3 flex gap-1", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => setItems(items.map((x) => x.id === a.id ? {
            ...x,
            pinned: !x.pinned
          } : x)), className: "rounded p-1.5 hover:bg-muted", children: /* @__PURE__ */ jsx(Pin, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsx("button", { onClick: () => setItems(items.map((x) => x.id === a.id ? {
            ...x,
            archived: !x.archived
          } : x)), className: "rounded p-1.5 hover:bg-muted", children: /* @__PURE__ */ jsx(Archive, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsx("button", { onClick: () => {
            setEditing(a);
            setOpen(true);
          }, className: "rounded p-1.5 hover:bg-muted", children: /* @__PURE__ */ jsx(Pencil, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsx("button", { onClick: () => {
            if (confirm("Delete?")) setItems(items.filter((x) => x.id !== a.id));
          }, className: "rounded p-1.5 text-destructive hover:bg-destructive/10", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
        ] })
      ] }, a.id)) })
    ] }),
    /* @__PURE__ */ jsx(Modal, { open, onClose: () => setOpen(false), title: editing?.id ? "Edit Announcement" : "New Announcement", children: editing && /* @__PURE__ */ jsxs("form", { onSubmit: save, className: "space-y-3", children: [
      /* @__PURE__ */ jsx(Input, { label: "Title *", value: editing.title, onChange: (e) => setEditing({
        ...editing,
        title: e.target.value
      }) }),
      /* @__PURE__ */ jsx(Select, { label: "Category", value: editing.category, onChange: (e) => setEditing({
        ...editing,
        category: e.target.value
      }), children: CATEGORIES.map((c) => /* @__PURE__ */ jsx("option", { children: c }, c)) }),
      /* @__PURE__ */ jsx(Textarea, { label: "Message", rows: 5, value: editing.body, onChange: (e) => setEditing({
        ...editing,
        body: e.target.value
      }) }),
      /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsx("input", { type: "checkbox", checked: editing.pinned, onChange: (e) => setEditing({
          ...editing,
          pinned: e.target.checked
        }) }),
        " Pin to top"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { type: "submit", children: "Save" })
      ] })
    ] }) })
  ] });
}
export {
  Page as component
};
