import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { R as ROLE_LABELS } from "./store-CFBfCpGU.js";
import { E as EmptyState, P as PageHeader, B as Button, C as Card, a as Badge, M as Modal, I as Input, S as Select } from "./ui-kit-wmGkfm9P.js";
import { Plus, UserCog, Pencil, Trash2 } from "lucide-react";
import { u as useAuth, c as getUsers, d as deleteUser, e as createUser, f as updateUser } from "./router-DhGZC5pb.js";
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
const ROLES = ["super_admin", "captain", "secretary", "sk_officer", "disaster", "resident"];
function Page() {
  const {
    user
  } = useAuth();
  const canManageUsers = user?.role === "super_admin";
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    void loadUsers();
  }, []);
  async function loadUsers() {
    setLoading(true);
    try {
      const list = await getUsers();
      if (list) setUsers(list);
    } catch (error) {
      toast.error(error?.message || "Unable to load users");
    } finally {
      setLoading(false);
    }
  }
  const save = async (e) => {
    e.preventDefault();
    if (!canManageUsers) return toast.error("Only Super Admin can manage users");
    if (!editing || !editing.username || !editing.fullName) return toast.error("Username and full name are required");
    const isNew = !editing.id;
    if (isNew && !editing.password) return toast.error("Password is required for a new account");
    const payload = {
      id: editing.id,
      username: editing.username,
      fullName: editing.fullName,
      email: editing.email,
      role: editing.role,
      contact: editing.contact,
      address: editing.address,
      birthdate: editing.birthdate,
      gender: editing.gender,
      password: editing.password
    };
    try {
      const saved = isNew ? await createUser({
        data: payload
      }) : await updateUser({
        data: payload
      });
      setUsers((prev) => {
        if (isNew) return [...prev, saved];
        return prev.map((u) => u.id === saved.id ? saved : u);
      });
      setOpen(false);
      toast.success("User saved successfully");
    } catch (error) {
      toast.error(error?.message || "Unable to save user");
    }
  };
  const removeUser = async (id) => {
    if (!canManageUsers) return toast.error("Only Super Admin can manage users");
    if (!confirm("Delete user?")) return;
    try {
      await deleteUser({
        data: {
          id
        }
      });
      setUsers((prev) => prev.filter((user2) => user2.id !== id));
      toast.success("User removed");
    } catch (error) {
      toast.error(error?.message || "Unable to remove user");
    }
  };
  return /* @__PURE__ */ jsx("div", { children: !canManageUsers ? /* @__PURE__ */ jsx(EmptyState, { title: "Unauthorized", description: "Only Super Admin can manage user accounts." }) : /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "User Management", subtitle: "Create accounts and assign roles.", action: /* @__PURE__ */ jsxs(Button, { onClick: () => {
      setEditing({
        id: "",
        username: "",
        password: "",
        fullName: "",
        email: "",
        role: "resident",
        createdAt: ""
      });
      setOpen(true);
    }, children: [
      /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
      " New User"
    ] }) }),
    /* @__PURE__ */ jsx(Card, { children: loading ? /* @__PURE__ */ jsx("div", { className: "py-10 text-center text-sm text-muted-foreground", children: "Loading users…" }) : users.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { icon: UserCog, title: "No users yet" }) : /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "border-b text-left text-xs uppercase text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "py-2", children: "Name" }),
        /* @__PURE__ */ jsx("th", { children: "Username" }),
        /* @__PURE__ */ jsx("th", { children: "Email" }),
        /* @__PURE__ */ jsx("th", { children: "Role" }),
        /* @__PURE__ */ jsx("th", {})
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: users.map((u) => /* @__PURE__ */ jsxs("tr", { className: "border-b last:border-0", children: [
        /* @__PURE__ */ jsx("td", { className: "py-3 font-medium", children: u.fullName }),
        /* @__PURE__ */ jsx("td", { children: u.username }),
        /* @__PURE__ */ jsx("td", { children: u.email }),
        /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(Badge, { tone: u.role === "super_admin" ? "danger" : "info", children: ROLE_LABELS[u.role] }) }),
        /* @__PURE__ */ jsxs("td", { className: "text-right", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => {
            setEditing({
              ...u,
              password: ""
            });
            setOpen(true);
          }, className: "rounded p-1.5 hover:bg-muted", children: /* @__PURE__ */ jsx(Pencil, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsx("button", { disabled: u.id === user?.id, onClick: () => removeUser(u.id), className: "rounded p-1.5 text-destructive hover:bg-destructive/10 disabled:opacity-30", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
        ] })
      ] }, u.id)) })
    ] }) }),
    /* @__PURE__ */ jsx(Modal, { open, onClose: () => setOpen(false), title: editing?.id ? "Edit User" : "New User", children: editing && /* @__PURE__ */ jsxs("form", { onSubmit: save, className: "space-y-3", children: [
      /* @__PURE__ */ jsx(Input, { label: "Full Name *", value: editing.fullName || "", onChange: (e) => setEditing({
        ...editing,
        fullName: e.target.value
      }) }),
      /* @__PURE__ */ jsx(Input, { label: "Username *", value: editing.username || "", onChange: (e) => setEditing({
        ...editing,
        username: e.target.value
      }) }),
      /* @__PURE__ */ jsx(Input, { label: "Email", type: "email", value: editing.email || "", onChange: (e) => setEditing({
        ...editing,
        email: e.target.value
      }) }),
      /* @__PURE__ */ jsx(Input, { label: editing.id ? "New Password (leave blank to keep)" : "Password *", type: "password", value: editing.password || "", onChange: (e) => setEditing({
        ...editing,
        password: e.target.value
      }) }),
      /* @__PURE__ */ jsx(Select, { label: "Role", value: editing.role, onChange: (e) => setEditing({
        ...editing,
        role: e.target.value
      }), children: ROLES.map((r) => /* @__PURE__ */ jsx("option", { value: r, children: ROLE_LABELS[r] }, r)) }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { type: "submit", children: "Save" })
      ] })
    ] }) })
  ] }) });
}
export {
  Page as component
};
