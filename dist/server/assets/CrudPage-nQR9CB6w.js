import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { Plus, Search, Inbox, Pencil, Trash2 } from "lucide-react";
import { P as PageHeader, B as Button, C as Card, E as EmptyState, M as Modal, I as Input } from "./ui-kit-wmGkfm9P.js";
import { u as useStored, h as hasPermission, a as uid } from "./store-CFBfCpGU.js";
import { u as useAuth } from "./router-DhGZC5pb.js";
import { toast } from "sonner";
function CrudPage({ config }) {
  const { user } = useAuth();
  const [rows, setRows] = useStored(config.storeKey, []);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.toLowerCase();
    return rows.filter((r) => config.searchKeys.some((k) => String(r[k] || "").toLowerCase().includes(s)));
  }, [rows, q, config.searchKeys]);
  const canCreate = !config.permissions?.create || user && hasPermission(user.role, config.permissions.create);
  const canEdit = !config.permissions?.edit || user && hasPermission(user.role, config.permissions.edit);
  const canDelete = !config.permissions?.delete || user && hasPermission(user.role, config.permissions.delete);
  const openNew = () => {
    if (!canCreate) return;
    setEditing({ id: "" });
    setOpen(true);
  };
  const openEdit = (r) => {
    if (!canEdit) return;
    setEditing({ ...r });
    setOpen(true);
  };
  const remove = (r) => {
    if (!canDelete) return;
    if (!confirm("Delete this record?")) return;
    setRows(rows.filter((x) => x.id !== r.id));
    toast.success("Deleted");
  };
  const save = (e) => {
    e.preventDefault();
    if (!editing) return;
    const missing = config.fields.find((f) => f.required && !String(editing[f.name] || "").trim());
    if (missing) return toast.error(`${missing.label} is required`);
    const isNew = !editing.id;
    let payload = { ...editing };
    if (isNew) {
      payload.id = uid();
      payload.createdAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    if (config.beforeSave) payload = config.beforeSave(payload, isNew);
    setRows(isNew ? [payload, ...rows] : rows.map((r) => r.id === payload.id ? payload : r));
    setOpen(false);
    setEditing(null);
    toast.success(isNew ? "Created" : "Updated");
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(
      PageHeader,
      {
        title: config.title,
        subtitle: config.subtitle,
        action: canCreate ? /* @__PURE__ */ jsxs(Button, { onClick: openNew, children: [
          /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
          " Add New"
        ] }) : void 0
      }
    ),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4 flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-w-[200px]", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
          /* @__PURE__ */ jsx("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search…", className: "w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
          filtered.length,
          " of ",
          rows.length
        ] })
      ] }),
      filtered.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { icon: Inbox, title: config.emptyTitle || "No records yet", description: config.emptyDescription || "Start by adding the first one.", action: canCreate ? /* @__PURE__ */ jsxs(Button, { onClick: openNew, children: [
        /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
        " Add New"
      ] }) : void 0 }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "border-b text-left text-xs uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
          config.columns.map((c) => /* @__PURE__ */ jsx("th", { className: "py-2 pr-3 font-medium", children: c.label }, String(c.key))),
          /* @__PURE__ */ jsx("th", {})
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: filtered.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-b last:border-0 hover:bg-muted/40", children: [
          config.columns.map((c) => /* @__PURE__ */ jsx("td", { className: "py-3 pr-3", children: c.render ? c.render(r) : String(r[c.key] ?? "—") }, String(c.key))),
          /* @__PURE__ */ jsxs("td", { className: "py-3 text-right", children: [
            canEdit && /* @__PURE__ */ jsx("button", { onClick: () => openEdit(r), className: "mr-1 rounded p-1.5 hover:bg-muted", children: /* @__PURE__ */ jsx(Pencil, { className: "h-4 w-4" }) }),
            canDelete && /* @__PURE__ */ jsx("button", { onClick: () => remove(r), className: "rounded p-1.5 text-destructive hover:bg-destructive/10", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
          ] })
        ] }, r.id)) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(Modal, { open, onClose: () => setOpen(false), title: editing?.id ? `Edit ${config.title}` : `New ${config.title}`, children: /* @__PURE__ */ jsxs("form", { onSubmit: save, className: "space-y-3", children: [
      config.fields.map((f) => {
        const val = editing?.[f.name] ?? "";
        const set = (v) => setEditing({ ...editing, [f.name]: v });
        if (f.type === "textarea")
          return /* @__PURE__ */ jsxs("label", { className: "block", children: [
            /* @__PURE__ */ jsxs("span", { className: "mb-1 block text-sm font-medium", children: [
              f.label,
              f.required && " *"
            ] }),
            /* @__PURE__ */ jsx("textarea", { value: val, onChange: (e) => set(e.target.value), rows: 3, className: "w-full rounded-lg border bg-background px-3 py-2 text-sm" })
          ] }, f.name);
        if (f.type === "select")
          return /* @__PURE__ */ jsxs("label", { className: "block", children: [
            /* @__PURE__ */ jsxs("span", { className: "mb-1 block text-sm font-medium", children: [
              f.label,
              f.required && " *"
            ] }),
            /* @__PURE__ */ jsxs("select", { value: val, onChange: (e) => set(e.target.value), className: "w-full rounded-lg border bg-background px-3 py-2 text-sm", children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "Select…" }),
              f.options.map((o) => /* @__PURE__ */ jsx("option", { children: o }, o))
            ] })
          ] }, f.name);
        return /* @__PURE__ */ jsx(Input, { label: `${f.label}${f.required ? " *" : ""}`, type: f.type || "text", value: val, onChange: (e) => set(e.target.value) }, f.name);
      }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { type: "submit", children: "Save" })
      ] })
    ] }) })
  ] });
}
export {
  CrudPage as C
};
