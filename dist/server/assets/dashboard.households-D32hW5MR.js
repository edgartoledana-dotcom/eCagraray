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
  storeKey: "households",
  title: "Households",
  subtitle: "Group residents into households and track addresses.",
  emptyTitle: "No households yet",
  fields: [{
    name: "code",
    label: "Household Code",
    required: true
  }, {
    name: "head",
    label: "Head of Household",
    required: true
  }, {
    name: "address",
    label: "Address"
  }, {
    name: "members",
    label: "Member Count",
    type: "number"
  }, {
    name: "purok",
    label: "Purok / Sitio"
  }],
  columns: [{
    key: "code",
    label: "Code"
  }, {
    key: "head",
    label: "Head"
  }, {
    key: "members",
    label: "Members"
  }, {
    key: "address",
    label: "Address"
  }, {
    key: "purok",
    label: "Purok"
  }],
  searchKeys: ["code", "head", "address", "purok"],
  permissions: {
    create: "householdsManage",
    edit: "householdsManage",
    delete: "householdsManage"
  }
} });
export {
  SplitComponent as component
};
