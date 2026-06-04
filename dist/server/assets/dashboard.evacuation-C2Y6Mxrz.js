import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { u as useStored, a as uid } from "./store-CFBfCpGU.js";
import { P as PageHeader, B as Button, C as Card, E as EmptyState, a as Badge, M as Modal, I as Input } from "./ui-kit-wmGkfm9P.js";
import { Plus, Building, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
function Page() {
  const [items, setItems] = useStored("evac_centers", []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const save = (e) => {
    e.preventDefault();
    if (!editing || !editing.name) return toast.error("Name required");
    const isNew = !editing.id;
    const p = isNew ? {
      ...editing,
      id: uid(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    } : editing;
    setItems(isNew ? [p, ...items] : items.map((x) => x.id === p.id ? p : x));
    setOpen(false);
    toast.success("Saved");
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Evacuation Centers", subtitle: "Capacity monitoring and occupancy tracking.", action: /* @__PURE__ */ jsxs(Button, { onClick: () => {
      setEditing({
        id: "",
        name: "",
        location: "",
        capacity: 100,
        occupants: 0,
        manager: "",
        createdAt: ""
      });
      setOpen(true);
    }, children: [
      /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
      " Add Center"
    ] }) }),
    items.length === 0 ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(EmptyState, { icon: Building, title: "No evacuation centers", description: "Add evacuation centers to monitor capacity during emergencies." }) }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: items.map((c) => {
      const pct = Math.min(100, Math.round(c.occupants / Math.max(1, c.capacity) * 100));
      const tone = pct > 90 ? "bg-destructive" : pct > 70 ? "bg-warning" : "bg-success";
      return /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "font-semibold", children: c.name }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: c.location })
          ] }),
          /* @__PURE__ */ jsxs(Badge, { tone: pct > 90 ? "danger" : pct > 70 ? "warning" : "success", children: [
            pct,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs", children: [
            /* @__PURE__ */ jsxs("span", { children: [
              c.occupants,
              " occupants"
            ] }),
            /* @__PURE__ */ jsxs("span", { children: [
              "capacity ",
              c.capacity
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 h-2 overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsx("div", { className: `h-full ${tone}`, style: {
            width: `${pct}%`
          } }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 text-xs text-muted-foreground", children: [
          "Manager: ",
          c.manager || "—"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 flex gap-1", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => {
            setEditing(c);
            setOpen(true);
          }, className: "rounded p-1.5 hover:bg-muted", children: /* @__PURE__ */ jsx(Pencil, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsx("button", { onClick: () => {
            if (confirm("Delete?")) setItems(items.filter((x) => x.id !== c.id));
          }, className: "rounded p-1.5 text-destructive hover:bg-destructive/10", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
        ] })
      ] }, c.id);
    }) }),
    /* @__PURE__ */ jsx(Modal, { open, onClose: () => setOpen(false), title: "Evacuation Center", children: editing && /* @__PURE__ */ jsxs("form", { onSubmit: save, className: "space-y-3", children: [
      /* @__PURE__ */ jsx(Input, { label: "Name *", value: editing.name, onChange: (e) => setEditing({
        ...editing,
        name: e.target.value
      }) }),
      /* @__PURE__ */ jsx(Input, { label: "Location", value: editing.location, onChange: (e) => setEditing({
        ...editing,
        location: e.target.value
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsx(Input, { label: "Capacity", type: "number", value: editing.capacity, onChange: (e) => setEditing({
          ...editing,
          capacity: Number(e.target.value)
        }) }),
        /* @__PURE__ */ jsx(Input, { label: "Current Occupants", type: "number", value: editing.occupants, onChange: (e) => setEditing({
          ...editing,
          occupants: Number(e.target.value)
        }) })
      ] }),
      /* @__PURE__ */ jsx(Input, { label: "Manager", value: editing.manager, onChange: (e) => setEditing({
        ...editing,
        manager: e.target.value
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { type: "submit", children: "Save" })
      ] })
    ] }) })
  ] });
}
export {
  Page as component
};
