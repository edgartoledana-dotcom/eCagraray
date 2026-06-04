import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "../components/CrudPage";

export const Route = createFileRoute("/dashboard/residents")({ component: () => (
  <CrudPage<any> config={{
    storeKey: "residents",
    title: "Residents",
    subtitle: "Manage resident records and profiles.",
    emptyTitle: "No residents yet",
    emptyDescription: "Add the first resident record to get started.",
    fields: [
      { name: "fullName", label: "Full Name", required: true },
      { name: "birthdate", label: "Birthdate", type: "date" },
      { name: "gender", label: "Gender", type: "select", options: ["Male","Female","Other"] },
      { name: "civilStatus", label: "Civil Status", type: "select", options: ["Single","Married","Widowed","Separated"] },
      { name: "contact", label: "Contact Number" },
      { name: "address", label: "Address" },
      { name: "household", label: "Household ID" },
      { name: "occupation", label: "Occupation" },
    ],
    columns: [
      { key: "fullName", label: "Name" },
      { key: "gender", label: "Gender" },
      { key: "birthdate", label: "Birthdate" },
      { key: "contact", label: "Contact" },
      { key: "address", label: "Address" },
    ],
    searchKeys: ["fullName","contact","address","occupation"],
    permissions: {
      create: "residentsManage",
      edit: "residentsManage",
      delete: "residentsManage",
    },
  }} />
)});
