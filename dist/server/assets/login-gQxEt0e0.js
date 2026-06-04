import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, ArrowLeft, EyeOff, Eye } from "lucide-react";
import { u as useAuth } from "./router-DhGZC5pb.js";
import { toast } from "sonner";
import "@tanstack/react-query";
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
function Login() {
  const {
    login
  } = useAuth();
  const nav = useNavigate();
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [form, setForm] = useState({
    username: "",
    password: ""
  });
  const [forgot, setForgot] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) return toast.error("All fields are required");
    try {
      const u = await login(form.username, form.password, remember);
      if (!u) return toast.error("Invalid username or password");
      toast.success(`Welcome, ${u.fullName}`);
      nav({
        to: "/dashboard"
      });
    } catch (error) {
      toast.error(error?.message ?? "Login failed. Please try again.");
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.11),_transparent_24%),#f8fbff] text-foreground", children: /* @__PURE__ */ jsxs("div", { className: "grid min-h-screen grid-cols-1 overflow-hidden md:grid-cols-[1.2fr_0.95fr]", children: [
    /* @__PURE__ */ jsxs("div", { className: "relative hidden md:flex items-center bg-white/80 px-12 py-14 text-slate-900", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.1),transparent_24%)]" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-white/60 backdrop-blur-xl" }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex h-full flex-col justify-between gap-12", children: [
        /* @__PURE__ */ jsxs(Link, { to: "/", className: "inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm shadow-slate-900/5 transition hover:bg-white", children: [
          /* @__PURE__ */ jsx(Shield, { className: "h-5 w-5" }),
          " e-Cagraray"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "max-w-xl space-y-6", children: [
          /* @__PURE__ */ jsx("div", { className: "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-600 shadow-sm shadow-slate-900/5", children: "Ready access for barangay roles" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-5xl font-bold leading-tight", children: "A secure gateway for community operations." }),
            /* @__PURE__ */ jsx("p", { className: "mt-5 max-w-2xl text-lg leading-8 text-slate-700", children: "Log in to manage residents, announcements, disasters, and barangay programs from one polished control center." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3 rounded-[2rem] border border-slate-200/70 bg-white/85 p-6 text-sm text-slate-700 shadow-2xl shadow-slate-900/10", children: [
          /* @__PURE__ */ jsx("div", { className: "font-semibold text-slate-900", children: "Role-based access ready" }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-2 text-sm text-slate-600", children: [
            /* @__PURE__ */ jsx("span", { children: "admin / admin123" }),
            /* @__PURE__ */ jsx("span", { children: "captain / captain123" }),
            /* @__PURE__ */ jsx("span", { children: "resident / resident123" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center px-6 py-12 sm:px-10", children: /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-md overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/95 p-8 shadow-[0_30px_80px_-28px_rgba(15,23,42,0.18)]", children: [
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full bg-primary/20 blur-3xl" }),
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute right-6 top-10 h-24 w-24 rounded-full bg-cyan-400/15 blur-3xl" }),
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Back to Home"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 space-y-3", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold tracking-tight", children: "Sign in" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "Use your barangay account to continue." })
      ] }),
      forgot ? /* @__PURE__ */ jsxs("div", { className: "mt-8 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700 shadow-sm shadow-slate-900/5", children: [
        /* @__PURE__ */ jsx("div", { className: "font-semibold text-slate-900", children: "Forgot Password" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-slate-600", children: "Please contact the Barangay Secretary or Super Admin to reset your password." }),
        /* @__PURE__ */ jsx("button", { className: "mt-5 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-95", onClick: () => setForgot(false), children: "Back to login" })
      ] }) : /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "mt-8 space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-slate-700", children: "Username" }),
          /* @__PURE__ */ jsx("input", { value: form.username, onChange: (e) => setForm({
            ...form,
            username: e.target.value
          }), className: "w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10", placeholder: "admin" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-slate-700", children: "Password" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx("input", { value: form.password, onChange: (e) => setForm({
              ...form,
              password: e.target.value
            }), type: show ? "text" : "password", className: "w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10", placeholder: "••••••••" }),
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShow(!show), className: "absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700", children: show ? /* @__PURE__ */ jsx(EyeOff, { className: "h-5 w-5" }) : /* @__PURE__ */ jsx(Eye, { className: "h-5 w-5" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between", children: [
          /* @__PURE__ */ jsxs("label", { className: "inline-flex items-center gap-2 text-slate-600", children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", checked: remember, onChange: (e) => setRemember(e.target.checked), className: "h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20" }),
            " Remember me"
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setForgot(true), className: "text-primary hover:underline", children: "Forgot password?" })
        ] }),
        /* @__PURE__ */ jsx("button", { type: "submit", className: "w-full rounded-3xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95", children: "Login" }),
        /* @__PURE__ */ jsxs("div", { className: "text-center text-sm text-slate-500", children: [
          "Don't have an account? ",
          /* @__PURE__ */ jsx(Link, { to: "/register", className: "text-primary hover:underline", children: "Register" })
        ] })
      ] })
    ] }) })
  ] }) });
}
export {
  Login as component
};
