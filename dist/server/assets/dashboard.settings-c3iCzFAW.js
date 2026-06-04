import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { c as canRole, R as ROLE_LABELS } from "./store-CFBfCpGU.js";
import { P as PageHeader, C as Card, I as Input, B as Button } from "./ui-kit-wmGkfm9P.js";
import { u as useAuth, a as useTheme, b as getBarangayInfo, h as updateUserProfile, s as saveBarangayInfo } from "./router-DhGZC5pb.js";
import { toast } from "sonner";
import "lucide-react";
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
    user,
    updateUser
  } = useAuth();
  const {
    theme,
    setTheme
  } = useTheme();
  const [info, setInfo] = useState({
    name: "",
    municipality: "",
    province: "",
    address: "",
    contact: "",
    email: "",
    captain: ""
  });
  const [profile, setProfile] = useState(user || {});
  useEffect(() => {
    void getBarangayInfo().then((data) => {
      if (data) setInfo(data);
    });
  }, []);
  useEffect(() => {
    if (user) setProfile(user);
  }, [user?.id]);
  const canSaveInfo = canRole(user?.role, "barangayInfo");
  const saveInfo = async () => {
    if (!canSaveInfo) return toast.error("You are not authorized to update barangay information");
    await saveBarangayInfo({
      data: info
    });
    toast.success("Barangay info saved");
  };
  const saveProfile = async () => {
    if (!user) return;
    const updated = await updateUserProfile({
      data: {
        id: user.id,
        fullName: profile.fullName || user.fullName,
        email: profile.email || user.email,
        contact: profile.contact,
        address: profile.address,
        birthdate: profile.birthdate,
        gender: profile.gender
      }
    });
    if (updated) {
      updateUser(updated);
      setProfile(updated);
      toast.success("Profile updated");
    }
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Settings", subtitle: "Theme, profile, and barangay information." }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Appearance" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Theme persists across sessions." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex gap-2", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => setTheme("light"), className: `flex-1 rounded-lg border p-4 ${theme === "light" ? "border-primary bg-primary/5" : ""}`, children: "☀️ Light" }),
          /* @__PURE__ */ jsx("button", { onClick: () => setTheme("dark"), className: `flex-1 rounded-lg border p-4 ${theme === "dark" ? "border-primary bg-primary/5" : ""}`, children: "🌙 Dark" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Your Profile" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-3", children: [
          /* @__PURE__ */ jsx(Input, { label: "Full Name", value: profile.fullName || "", onChange: (e) => setProfile({
            ...profile,
            fullName: e.target.value
          }) }),
          /* @__PURE__ */ jsx(Input, { label: "Email", value: profile.email || "", onChange: (e) => setProfile({
            ...profile,
            email: e.target.value
          }) }),
          /* @__PURE__ */ jsx(Input, { label: "Contact", value: profile.contact || "", onChange: (e) => setProfile({
            ...profile,
            contact: e.target.value
          }) }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
            "Role: ",
            user ? ROLE_LABELS[user.role] : ""
          ] }),
          /* @__PURE__ */ jsx(Button, { onClick: saveProfile, children: "Save Profile" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "md:col-span-2", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Barangay Information" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Displayed on the landing page and printed documents." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-3 md:grid-cols-2", children: [
          /* @__PURE__ */ jsx(Input, { label: "Barangay Name", value: info.name, onChange: (e) => setInfo({
            ...info,
            name: e.target.value
          }) }),
          /* @__PURE__ */ jsx(Input, { label: "Punong Barangay", value: info.captain, onChange: (e) => setInfo({
            ...info,
            captain: e.target.value
          }) }),
          /* @__PURE__ */ jsx(Input, { label: "Municipality", value: info.municipality, onChange: (e) => setInfo({
            ...info,
            municipality: e.target.value
          }) }),
          /* @__PURE__ */ jsx(Input, { label: "Province", value: info.province, onChange: (e) => setInfo({
            ...info,
            province: e.target.value
          }) }),
          /* @__PURE__ */ jsx(Input, { label: "Address", value: info.address, onChange: (e) => setInfo({
            ...info,
            address: e.target.value
          }) }),
          /* @__PURE__ */ jsx(Input, { label: "Contact", value: info.contact, onChange: (e) => setInfo({
            ...info,
            contact: e.target.value
          }) }),
          /* @__PURE__ */ jsx(Input, { label: "Email", value: info.email, onChange: (e) => setInfo({
            ...info,
            email: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(Button, { onClick: saveInfo, disabled: !canSaveInfo, children: canSaveInfo ? "Save Information" : "Save Information (restricted)" }) })
      ] })
    ] })
  ] });
}
export {
  Page as component
};
