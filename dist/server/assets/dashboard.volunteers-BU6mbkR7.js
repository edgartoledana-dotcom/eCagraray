import { jsx } from "react/jsx-runtime";
import { C as CrudPage } from "./CrudPage-nQR9CB6w.js";
import "react";
import "lucide-react";
import "./ui-kit-wmGkfm9P.js";
import "./store-CFBfCpGU.js";
import "./router-DhGZC5pb.js";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "sonner";
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
const SplitComponent = () => /* @__PURE__ */ jsx(CrudPage, { config: {
  storeKey: "volunteers",
  title: "Volunteers",
  subtitle: "Volunteer registry, skills database, and deployment tracking.",
  emptyTitle: "No volunteers registered",
  fields: [{
    name: "fullName",
    label: "Full Name",
    required: true
  }, {
    name: "contact",
    label: "Contact"
  }, {
    name: "skills",
    label: "Skills (comma-separated)"
  }, {
    name: "team",
    label: "Team",
    type: "select",
    options: ["Rescue", "Medical", "Logistics", "Communications", "General"]
  }, {
    name: "status",
    label: "Status",
    type: "select",
    options: ["Available", "Deployed", "Inactive"]
  }, {
    name: "deployment",
    label: "Current Deployment"
  }],
  columns: [{
    key: "fullName",
    label: "Name"
  }, {
    key: "team",
    label: "Team"
  }, {
    key: "skills",
    label: "Skills"
  }, {
    key: "status",
    label: "Status"
  }, {
    key: "deployment",
    label: "Deployment"
  }],
  searchKeys: ["fullName", "skills", "team"],
  permissions: {
    create: "volunteersManage",
    edit: "volunteersManage",
    delete: "volunteersManage"
  }
} });
export {
  SplitComponent as component
};
