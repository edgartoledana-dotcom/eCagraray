import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "../components/CrudPage";

export const Route = createFileRoute("/dashboard/households")({ component: () => (
  <CrudPage<any> config={{
    storeKey: "households",
    title: "Households",
    subtitle: "Group residents into households and track addresses.",
    emptyTitle: "No households yet",
    fields: [
      { name: "code", label: "Household Code", required: true },
      { name: "head", label: "Head of Household", required: true },
      { name: "address", label: "Address" },
      { name: "members", label: "Member Count", type: "number" },
      { name: "purok", label: "Purok / Sitio" },
    ],
    columns: [
      { key: "code", label: "Code" },
      { key: "head", label: "Head" },
      { key: "members", label: "Members" },
      { key: "address", label: "Address" },
      { key: "purok", label: "Purok" },
    ],
    searchKeys: ["code","head","address","purok"],
    permissions: {
      create: "householdsManage",
      edit: "householdsManage",
      delete: "householdsManage",
    },
  }} />
)});
