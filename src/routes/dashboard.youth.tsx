import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "../components/CrudPage";

export const Route = createFileRoute("/dashboard/youth")({ component: () => (
  <CrudPage<any> config={{
    storeKey: "youth",
    title: "SK Youth Registry",
    subtitle: "Manage youth profiles, attendance, and participation.",
    emptyTitle: "No youth registered",
    fields: [
      { name: "fullName", label: "Full Name", required: true },
      { name: "birthdate", label: "Birthdate", type: "date" },
      { name: "school", label: "School" },
      { name: "contact", label: "Contact" },
      { name: "program", label: "Program / Committee" },
      { name: "attendance", label: "Attendance Count", type: "number" },
    ],
    columns: [
      { key: "fullName", label: "Name" }, { key: "school", label: "School" },
      { key: "program", label: "Program" }, { key: "attendance", label: "Attendance" },
    ],
    searchKeys: ["fullName","school","program"],
    permissions: {
      create: "youthManage",
      edit: "youthManage",
      delete: "youthManage",
    },
  }} />
)});
