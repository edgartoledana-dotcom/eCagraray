import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "../components/CrudPage";

export const Route = createFileRoute("/dashboard/complaints")({ component: () => (
  <CrudPage<any> config={{
    storeKey: "complaints",
    title: "Complaints",
    subtitle: "Receive, assign, and resolve community complaints.",
    emptyTitle: "No complaints filed",
    fields: [
      { name: "subject", label: "Subject", required: true },
      { name: "complainant", label: "Complainant" },
      { name: "respondent", label: "Respondent" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "assignedTo", label: "Assigned To" },
      { name: "status", label: "Status", type: "select", options: ["Open","Assigned","In Mediation","Resolved","Archived"] },
    ],
    columns: [
      { key: "subject", label: "Subject" },
      { key: "complainant", label: "Complainant" },
      { key: "respondent", label: "Respondent" },
      { key: "assignedTo", label: "Assignee" },
      { key: "status", label: "Status" },
    ],
    searchKeys: ["subject","complainant","respondent"],
    permissions: {
      edit: "complaintsManage",
      delete: "complaintsManage",
    },
  }} />
)});
