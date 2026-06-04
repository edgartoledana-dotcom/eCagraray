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
  storeKey: "youth",
  title: "SK Youth Registry",
  subtitle: "Manage youth profiles, attendance, and participation.",
  emptyTitle: "No youth registered",
  fields: [{
    name: "fullName",
    label: "Full Name",
    required: true
  }, {
    name: "birthdate",
    label: "Birthdate",
    type: "date"
  }, {
    name: "school",
    label: "School"
  }, {
    name: "contact",
    label: "Contact"
  }, {
    name: "program",
    label: "Program / Committee"
  }, {
    name: "attendance",
    label: "Attendance Count",
    type: "number"
  }],
  columns: [{
    key: "fullName",
    label: "Name"
  }, {
    key: "school",
    label: "School"
  }, {
    key: "program",
    label: "Program"
  }, {
    key: "attendance",
    label: "Attendance"
  }],
  searchKeys: ["fullName", "school", "program"],
  permissions: {
    create: "youthManage",
    edit: "youthManage",
    delete: "youthManage"
  }
} });
export {
  SplitComponent as component
};
