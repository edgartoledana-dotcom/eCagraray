import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { c as canRole, u as useStored, a as uid } from "./store-CFBfCpGU.js";
import { P as PageHeader, B as Button, C as Card, E as EmptyState, M as Modal, I as Input } from "./ui-kit-wmGkfm9P.js";
import { Plus, ListChecks, Trash2 } from "lucide-react";
import { u as useAuth } from "./router-DhGZC5pb.js";
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
function Page() {
  const {
    user
  } = useAuth();
  const canManage = canRole(user?.role, "surveysManage");
  const [polls, setPolls] = useStored("polls", []);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState(["", ""]);
  const create = (e) => {
    e.preventDefault();
    const cleaned = opts.map((o) => o.trim()).filter(Boolean);
    if (!q.trim() || cleaned.length < 2) return toast.error("Question and 2+ options required");
    const p = {
      id: uid(),
      question: q,
      options: cleaned,
      votes: Object.fromEntries(cleaned.map((o) => [o, 0])),
      voters: [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    setPolls([p, ...polls]);
    setOpen(false);
    setQ("");
    setOpts(["", ""]);
    toast.success("Poll created");
  };
  const vote = (p, opt) => {
    if (!user) return;
    if (p.voters.includes(user.id)) return toast.error("You already voted");
    const next = {
      ...p,
      votes: {
        ...p.votes,
        [opt]: (p.votes[opt] || 0) + 1
      },
      voters: [...p.voters, user.id]
    };
    setPolls(polls.map((x) => x.id === p.id ? next : x));
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Surveys & Polls", subtitle: "Engage the community with quick polls.", action: canManage ? /* @__PURE__ */ jsxs(Button, { onClick: () => setOpen(true), children: [
      /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
      " Create Poll"
    ] }) : void 0 }),
    polls.length === 0 ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(EmptyState, { icon: ListChecks, title: "No polls yet" }) }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-2", children: polls.map((p) => {
      const total = Object.values(p.votes).reduce((a, b) => a + b, 0);
      const voted = user && p.voters.includes(user.id);
      return /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ jsx("div", { className: "font-semibold", children: p.question }),
          canManage && /* @__PURE__ */ jsx("button", { onClick: () => {
            if (confirm("Delete?")) setPolls(polls.filter((x) => x.id !== p.id));
          }, className: "text-destructive", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-3 space-y-2", children: p.options.map((o) => {
          const pct = total ? Math.round((p.votes[o] || 0) / total * 100) : 0;
          return /* @__PURE__ */ jsxs("button", { disabled: !!voted, onClick: () => vote(p, o), className: "block w-full text-left", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
              /* @__PURE__ */ jsx("span", { children: o }),
              /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                p.votes[o] || 0,
                " · ",
                pct,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-1 h-2 overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-primary", style: {
              width: `${pct}%`
            } }) })
          ] }, o);
        }) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 text-xs text-muted-foreground", children: [
          total,
          " vote",
          total !== 1 ? "s" : "",
          voted ? " · you voted" : ""
        ] })
      ] }, p.id);
    }) }),
    /* @__PURE__ */ jsx(Modal, { open, onClose: () => setOpen(false), title: "Create Poll", children: /* @__PURE__ */ jsxs("form", { onSubmit: create, className: "space-y-3", children: [
      /* @__PURE__ */ jsx(Input, { label: "Question *", value: q, onChange: (e) => setQ(e.target.value) }),
      opts.map((o, i) => /* @__PURE__ */ jsx(Input, { label: `Option ${i + 1}`, value: o, onChange: (e) => {
        const c = [...opts];
        c[i] = e.target.value;
        setOpts(c);
      } }, i)),
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: () => setOpts([...opts, ""]), children: "+ Add option" }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { type: "submit", children: "Create" })
      ] })
    ] }) })
  ] });
}
export {
  Page as component
};
