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
  storeKey: "events",
  title: "Community Events",
  subtitle: "Plan and track community events and attendance.",
  emptyTitle: "No events scheduled",
  fields: [{
    name: "title",
    label: "Title",
    required: true
  }, {
    name: "date",
    label: "Date",
    type: "date"
  }, {
    name: "location",
    label: "Location"
  }, {
    name: "organizer",
    label: "Organizer"
  }, {
    name: "description",
    label: "Description",
    type: "textarea"
  }],
  columns: [{
    key: "title",
    label: "Event"
  }, {
    key: "date",
    label: "Date"
  }, {
    key: "location",
    label: "Location"
  }, {
    key: "organizer",
    label: "Organizer"
  }],
  searchKeys: ["title", "location", "organizer"],
  permissions: {
    create: "eventsManage",
    edit: "eventsManage",
    delete: "eventsManage"
  }
} });
export {
  SplitComponent as component
};
