import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { c as canRole, u as useStored, g as getItem, a as uid } from "./store-CFBfCpGU.js";
import { P as PageHeader, B as Button, C as Card, E as EmptyState, S as Select, M as Modal, T as Textarea } from "./ui-kit-wmGkfm9P.js";
import { Plus, FileText, Printer } from "lucide-react";
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
const SERVICES = ["Barangay Clearance", "Residency Certificate", "Indigency Certificate"];
const FLOW = ["Pending", "Reviewing", "Approved", "Rejected", "Released"];
function Page() {
  const {
    user
  } = useAuth();
  const canManage = canRole(user?.role, "documentsReview");
  const [items, setItems] = useStored("documents_req", []);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [print, setPrint] = useState(null);
  const info = getItem("barangay", {});
  const submit = (e) => {
    e.preventDefault();
    if (!draft || !draft.service || !draft.purpose) return toast.error("Required");
    const p = {
      ...draft,
      id: uid(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "Pending",
      requester: user?.fullName || "Resident"
    };
    setItems([p, ...items]);
    setOpen(false);
    toast.success("Request submitted");
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Document Requests", subtitle: "Issue official barangay documents online.", action: /* @__PURE__ */ jsxs(Button, { onClick: () => {
      setDraft({
        id: "",
        service: "Barangay Clearance",
        requester: "",
        purpose: "",
        status: "Pending",
        createdAt: ""
      });
      setOpen(true);
    }, children: [
      /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
      " New Request"
    ] }) }),
    /* @__PURE__ */ jsx(Card, { children: items.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { icon: FileText, title: "No document requests yet" }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "border-b text-left text-xs uppercase text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "py-2", children: "Service" }),
        /* @__PURE__ */ jsx("th", { children: "Requester" }),
        /* @__PURE__ */ jsx("th", { children: "Purpose" }),
        /* @__PURE__ */ jsx("th", { children: "Status" }),
        /* @__PURE__ */ jsx("th", { children: "Date" }),
        /* @__PURE__ */ jsx("th", {})
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: items.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-b last:border-0", children: [
        /* @__PURE__ */ jsx("td", { className: "py-3 font-medium", children: r.service }),
        /* @__PURE__ */ jsx("td", { children: r.requester }),
        /* @__PURE__ */ jsx("td", { className: "max-w-[240px] truncate", children: r.purpose }),
        /* @__PURE__ */ jsx("td", { children: canManage ? /* @__PURE__ */ jsx(Select, { value: r.status, onChange: (e) => setItems(items.map((x) => x.id === r.id ? {
          ...x,
          status: e.target.value
        } : x)), children: FLOW.map((s) => /* @__PURE__ */ jsx("option", { children: s }, s)) }) : /* @__PURE__ */ jsx("span", { className: "inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium", children: r.status }) }),
        /* @__PURE__ */ jsx("td", { className: "text-xs text-muted-foreground", children: new Date(r.createdAt).toLocaleDateString() }),
        /* @__PURE__ */ jsx("td", { className: "text-right", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => setPrint(r), disabled: r.status !== "Released" && r.status !== "Approved", children: [
          /* @__PURE__ */ jsx(Printer, { className: "h-4 w-4" }),
          " Print"
        ] }) })
      ] }, r.id)) })
    ] }) }) }),
    /* @__PURE__ */ jsx(Modal, { open, onClose: () => setOpen(false), title: "Request Document", children: draft && /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
      /* @__PURE__ */ jsx(Select, { label: "Service *", value: draft.service, onChange: (e) => setDraft({
        ...draft,
        service: e.target.value
      }), children: SERVICES.map((s) => /* @__PURE__ */ jsx("option", { children: s }, s)) }),
      /* @__PURE__ */ jsx(Textarea, { label: "Purpose *", rows: 3, value: draft.purpose, onChange: (e) => setDraft({
        ...draft,
        purpose: e.target.value
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { type: "submit", children: "Submit" })
      ] })
    ] }) }),
    print && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 overflow-auto bg-black/60 p-4 no-print", onClick: () => setPrint(null), children: /* @__PURE__ */ jsxs("div", { onClick: (e) => e.stopPropagation(), className: "mx-auto max-w-2xl bg-white text-black", children: [
      /* @__PURE__ */ jsxs("div", { className: "no-print flex justify-end gap-2 p-4", children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setPrint(null), children: "Close" }),
        /* @__PURE__ */ jsxs(Button, { onClick: () => window.print(), children: [
          /* @__PURE__ */ jsx(Printer, { className: "h-4 w-4" }),
          " Print"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-widest", children: "Republic of the Philippines" }),
          /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
            "Province of ",
            info.province,
            " · Municipality of ",
            info.municipality
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-1 text-xl font-bold", children: info.name }),
          /* @__PURE__ */ jsx("hr", { className: "my-4 border-black" }),
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold uppercase tracking-wide", children: print.service })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "mt-10 leading-7", children: [
          "TO WHOM IT MAY CONCERN:",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("br", {}),
          "This is to certify that ",
          /* @__PURE__ */ jsx("b", { className: "underline", children: print.requester }),
          " is a known resident of ",
          info.name,
          ", ",
          info.municipality,
          ", ",
          info.province,
          ".",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("br", {}),
          "This certification is issued upon the request of the above-named person for the purpose of: ",
          /* @__PURE__ */ jsx("b", { children: print.purpose }),
          ".",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("br", {}),
          "Issued this ",
          (/* @__PURE__ */ new Date()).toLocaleDateString("en-PH", {
            day: "numeric",
            month: "long",
            year: "numeric"
          }),
          " at ",
          info.name,
          "."
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-20 text-right", children: /* @__PURE__ */ jsxs("div", { className: "inline-block w-64 border-t border-black pt-1 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "font-bold", children: info.captain || "Punong Barangay" }),
          /* @__PURE__ */ jsx("div", { className: "text-xs", children: "Punong Barangay" })
        ] }) })
      ] })
    ] }) })
  ] });
}
export {
  Page as component
};
