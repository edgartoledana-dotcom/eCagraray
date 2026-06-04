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
  storeKey: "residents",
  title: "Residents",
  subtitle: "Manage resident records and profiles.",
  emptyTitle: "No residents yet",
  emptyDescription: "Add the first resident record to get started.",
  fields: [{
    name: "fullName",
    label: "Full Name",
    required: true
  }, {
    name: "birthdate",
    label: "Birthdate",
    type: "date"
  }, {
    name: "gender",
    label: "Gender",
    type: "select",
    options: ["Male", "Female", "Other"]
  }, {
    name: "civilStatus",
    label: "Civil Status",
    type: "select",
    options: ["Single", "Married", "Widowed", "Separated"]
  }, {
    name: "contact",
    label: "Contact Number"
  }, {
    name: "address",
    label: "Address"
  }, {
    name: "household",
    label: "Household ID"
  }, {
    name: "occupation",
    label: "Occupation"
  }],
  columns: [{
    key: "fullName",
    label: "Name"
  }, {
    key: "gender",
    label: "Gender"
  }, {
    key: "birthdate",
    label: "Birthdate"
  }, {
    key: "contact",
    label: "Contact"
  }, {
    key: "address",
    label: "Address"
  }],
  searchKeys: ["fullName", "contact", "address", "occupation"],
  permissions: {
    create: "residentsManage",
    edit: "residentsManage",
    delete: "residentsManage"
  }
} });
export {
  SplitComponent as component
};
