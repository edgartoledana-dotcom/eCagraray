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
  storeKey: "complaints",
  title: "Complaints",
  subtitle: "Receive, assign, and resolve community complaints.",
  emptyTitle: "No complaints filed",
  fields: [{
    name: "subject",
    label: "Subject",
    required: true
  }, {
    name: "complainant",
    label: "Complainant"
  }, {
    name: "respondent",
    label: "Respondent"
  }, {
    name: "description",
    label: "Description",
    type: "textarea"
  }, {
    name: "assignedTo",
    label: "Assigned To"
  }, {
    name: "status",
    label: "Status",
    type: "select",
    options: ["Open", "Assigned", "In Mediation", "Resolved", "Archived"]
  }],
  columns: [{
    key: "subject",
    label: "Subject"
  }, {
    key: "complainant",
    label: "Complainant"
  }, {
    key: "respondent",
    label: "Respondent"
  }, {
    key: "assignedTo",
    label: "Assignee"
  }, {
    key: "status",
    label: "Status"
  }],
  searchKeys: ["subject", "complainant", "respondent"],
  permissions: {
    edit: "complaintsManage",
    delete: "complaintsManage"
  }
} });
export {
  SplitComponent as component
};
