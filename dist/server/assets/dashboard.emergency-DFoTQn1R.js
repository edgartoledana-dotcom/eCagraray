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
  storeKey: "emergency",
  title: "Emergency Assistance",
  subtitle: "Track rescue, medical, and relief requests by priority.",
  emptyTitle: "No assistance requests",
  fields: [{
    name: "type",
    label: "Type",
    type: "select",
    options: ["Rescue", "Medical", "Relief"],
    required: true
  }, {
    name: "priority",
    label: "Priority",
    type: "select",
    options: ["Low", "Medium", "High", "Emergency"],
    required: true
  }, {
    name: "requester",
    label: "Requester",
    required: true
  }, {
    name: "location",
    label: "Location",
    required: true
  }, {
    name: "contact",
    label: "Contact"
  }, {
    name: "description",
    label: "Details",
    type: "textarea"
  }, {
    name: "status",
    label: "Status",
    type: "select",
    options: ["Pending", "Dispatched", "En Route", "Completed"]
  }],
  columns: [{
    key: "type",
    label: "Type"
  }, {
    key: "priority",
    label: "Priority"
  }, {
    key: "requester",
    label: "Requester"
  }, {
    key: "location",
    label: "Location"
  }, {
    key: "status",
    label: "Status"
  }],
  searchKeys: ["requester", "location", "type"],
  permissions: {
    create: "emergencyManage",
    edit: "emergencyManage",
    delete: "emergencyManage"
  }
} });
export {
  SplitComponent as component
};
