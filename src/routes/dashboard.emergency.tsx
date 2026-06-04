import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "../components/CrudPage";

export const Route = createFileRoute("/dashboard/emergency")({ component: () => (
  <CrudPage<any> config={{
    storeKey: "emergency",
    title: "Emergency Assistance",
    subtitle: "Track rescue, medical, and relief requests by priority.",
    emptyTitle: "No assistance requests",
    fields: [
      { name: "type", label: "Type", type: "select", options: ["Rescue","Medical","Relief"], required: true },
      { name: "priority", label: "Priority", type: "select", options: ["Low","Medium","High","Emergency"], required: true },
      { name: "requester", label: "Requester", required: true },
      { name: "location", label: "Location", required: true },
      { name: "contact", label: "Contact" },
      { name: "description", label: "Details", type: "textarea" },
      { name: "status", label: "Status", type: "select", options: ["Pending","Dispatched","En Route","Completed"] },
    ],
    columns: [
      { key: "type", label: "Type" }, { key: "priority", label: "Priority" },
      { key: "requester", label: "Requester" }, { key: "location", label: "Location" },
      { key: "status", label: "Status" },
    ],
    searchKeys: ["requester","location","type"],
    permissions: {
      create: "emergencyManage",
      edit: "emergencyManage",
      delete: "emergencyManage",
    },
  }} />
)});
