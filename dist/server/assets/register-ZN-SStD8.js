import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shield } from "lucide-react";
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
function Register() {
  const {
    register
  } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({
    fullName: "",
    birthdate: "",
    gender: "Male",
    address: "",
    contact: "",
    email: "",
    username: "",
    password: "",
    confirm: ""
  });
  const strength = (p) => {
    let s2 = 0;
    if (p.length >= 8) s2++;
    if (/[A-Z]/.test(p)) s2++;
    if (/[0-9]/.test(p)) s2++;
    if (/[^A-Za-z0-9]/.test(p)) s2++;
    return s2;
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!f.fullName || !f.email || !f.username || !f.password) return toast.error("Please complete all required fields");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return toast.error("Invalid email address");
    if (f.password.length < 8) return toast.error("Password must be at least 8 characters");
    if (f.password !== f.confirm) return toast.error("Passwords do not match");
    try {
      await register({
        fullName: f.fullName,
        birthdate: f.birthdate,
        gender: f.gender,
        address: f.address,
        contact: f.contact,
        email: f.email,
        username: f.username,
        password: f.password
      });
      toast.success("Account created. You can now log in.");
      nav({
        to: "/login"
      });
    } catch (err) {
      toast.error(err.message);
    }
  };
  const s = strength(f.password);
  const strengthLabel = ["Very weak", "Weak", "Fair", "Good", "Strong"][s];
  const strengthColor = ["bg-destructive", "bg-destructive", "bg-warning", "bg-info", "bg-success"][s];
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background text-foreground", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4 rounded-full border border-border bg-card/80 p-4 shadow-sm shadow-slate-900/5 backdrop-blur glass-panel", children: [
      /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-3 text-sm font-semibold text-slate-950", children: [
        /* @__PURE__ */ jsx("div", { className: "grid h-10 w-10 place-items-center rounded-3xl gov-gradient text-white", children: /* @__PURE__ */ jsx(Shield, { className: "h-5 w-5" }) }),
        "e-Cagraray Registration"
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/login", className: "rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary", children: "Back to Login" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-10 rounded-[2rem] border border-border bg-card p-10 shadow-2xl shadow-primary/10 glass-panel lg:p-12", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Create your account" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-2xl text-sm text-muted-foreground", children: "Residents may register to access services, monitor updates, and receive community announcements." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-full border border-border bg-background/80 px-4 py-2 text-sm text-slate-700", children: [
          "Password strength: ",
          /* @__PURE__ */ jsx("span", { className: "font-semibold", children: strengthLabel })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "mt-8 grid gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsx(Field, { label: "Full Name *", value: f.fullName, onChange: (v) => setF({
          ...f,
          fullName: v
        }), className: "sm:col-span-2" }),
        /* @__PURE__ */ jsx(Field, { label: "Birthdate", type: "date", value: f.birthdate, onChange: (v) => setF({
          ...f,
          birthdate: v
        }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Gender" }),
          /* @__PURE__ */ jsxs("select", { value: f.gender, onChange: (e) => setF({
            ...f,
            gender: e.target.value
          }), className: "mt-1 w-full rounded-3xl border border-border bg-background/80 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10", children: [
            /* @__PURE__ */ jsx("option", { children: "Male" }),
            /* @__PURE__ */ jsx("option", { children: "Female" }),
            /* @__PURE__ */ jsx("option", { children: "Other" })
          ] })
        ] }),
        /* @__PURE__ */ jsx(Field, { label: "Address", value: f.address, onChange: (v) => setF({
          ...f,
          address: v
        }), className: "sm:col-span-2" }),
        /* @__PURE__ */ jsx(Field, { label: "Contact Number", value: f.contact, onChange: (v) => setF({
          ...f,
          contact: v
        }) }),
        /* @__PURE__ */ jsx(Field, { label: "Email *", type: "email", value: f.email, onChange: (v) => setF({
          ...f,
          email: v
        }) }),
        /* @__PURE__ */ jsx(Field, { label: "Username *", value: f.username, onChange: (v) => setF({
          ...f,
          username: v
        }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Field, { label: "Password *", type: "password", value: f.password, onChange: (v) => setF({
            ...f,
            password: v
          }) }),
          f.password && /* @__PURE__ */ jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsx("div", { className: "h-2.5 overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsx("div", { className: `h-full transition-all ${strengthColor}`, style: {
            width: `${s / 4 * 100}%`
          } }) }) })
        ] }),
        /* @__PURE__ */ jsx(Field, { label: "Confirm Password *", type: "password", value: f.confirm, onChange: (v) => setF({
          ...f,
          confirm: v
        }), className: "sm:col-span-2" }),
        /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2 flex flex-col gap-3 pt-2 sm:flex-row sm:justify-between", children: [
          /* @__PURE__ */ jsx("button", { type: "submit", className: "rounded-3xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95", children: "Register" }),
          /* @__PURE__ */ jsx(Link, { to: "/login", className: "inline-flex items-center justify-center rounded-3xl border border-border px-6 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary", children: "Back to Login" })
        ] })
      ] })
    ] })
  ] }) });
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  className = ""
}) {
  return /* @__PURE__ */ jsxs("div", { className, children: [
    /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: label }),
    /* @__PURE__ */ jsx("input", { type, value, onChange: (e) => onChange(e.target.value), className: "mt-1 w-full rounded-lg border bg-background px-3 py-2.5" })
  ] });
}
export {
  Register as component
};
