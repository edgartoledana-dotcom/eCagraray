import { jsx, jsxs } from "react/jsx-runtime";
import { Inbox } from "lucide-react";
function PageHeader({ title, subtitle, action }) {
  return /* @__PURE__ */ jsxs("div", { className: "mb-6 flex flex-wrap items-end justify-between gap-3", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold md:text-3xl", children: title }),
      subtitle && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: subtitle })
    ] }),
    action
  ] });
}
function Card({ children, className = "" }) {
  return /* @__PURE__ */ jsx("div", { className: `rounded-xl border bg-card p-5 shadow-sm ${className}`, children });
}
function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return /* @__PURE__ */ jsxs("div", { className: "grid place-items-center rounded-xl border border-dashed bg-card/50 p-12 text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "grid h-16 w-16 place-items-center rounded-full bg-muted", children: /* @__PURE__ */ jsx(Icon, { className: "h-8 w-8 text-muted-foreground" }) }),
    /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-semibold", children: title }),
    description && /* @__PURE__ */ jsx("p", { className: "mt-1 max-w-md text-sm text-muted-foreground", children: description }),
    action && /* @__PURE__ */ jsx("div", { className: "mt-5", children: action })
  ] });
}
function Badge({ children, tone = "default" }) {
  const map = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    danger: "bg-destructive/15 text-destructive",
    info: "bg-info/15 text-info",
    muted: "bg-muted text-muted-foreground"
  };
  return /* @__PURE__ */ jsx("span", { className: `inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${map[tone]}`, children });
}
function Button({ children, variant = "primary", className = "", ...rest }) {
  const map = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    outline: "border bg-card hover:bg-muted",
    ghost: "hover:bg-muted",
    danger: "bg-destructive text-destructive-foreground hover:opacity-90"
  };
  return /* @__PURE__ */ jsx("button", { ...rest, className: `inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition ${map[variant]} ${className}`, children });
}
function Input({ label, className = "", ...rest }) {
  return /* @__PURE__ */ jsxs("label", { className: "block", children: [
    label && /* @__PURE__ */ jsx("span", { className: "mb-1 block text-sm font-medium", children: label }),
    /* @__PURE__ */ jsx("input", { ...rest, className: `w-full rounded-lg border bg-background px-3 py-2 text-sm ${className}` })
  ] });
}
function Textarea({ label, className = "", ...rest }) {
  return /* @__PURE__ */ jsxs("label", { className: "block", children: [
    label && /* @__PURE__ */ jsx("span", { className: "mb-1 block text-sm font-medium", children: label }),
    /* @__PURE__ */ jsx("textarea", { ...rest, className: `w-full rounded-lg border bg-background px-3 py-2 text-sm ${className}` })
  ] });
}
function Select({ label, children, className = "", ...rest }) {
  return /* @__PURE__ */ jsxs("label", { className: "block", children: [
    label && /* @__PURE__ */ jsx("span", { className: "mb-1 block text-sm font-medium", children: label }),
    /* @__PURE__ */ jsx("select", { ...rest, className: `w-full rounded-lg border bg-background px-3 py-2 text-sm ${className}`, children })
  ] });
}
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-black/50 p-4", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { onClick: (e) => e.stopPropagation(), className: "w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: title }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "rounded-md p-1 hover:bg-muted", children: "✕" })
    ] }),
    children
  ] }) });
}
export {
  Button as B,
  Card as C,
  EmptyState as E,
  Input as I,
  Modal as M,
  PageHeader as P,
  Select as S,
  Textarea as T,
  Badge as a
};
