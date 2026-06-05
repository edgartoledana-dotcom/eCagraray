import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "../components/CrudPage";
import { useAuth } from "../lib/auth";
import { Card, EmptyState } from "../components/ui-kit";

export const Route = createFileRoute("/dashboard/emergency")({ component: Page });

function Page() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Card>
        <EmptyState title="Access Restricted" description="Please log in to access the Emergency Assistance module." />
      </Card>
    );
  }

  return (
    <CrudPage<any> config={{
      storeKey: "emergency",
      title: "Emergency Assistance",
      subtitle: "Track rescue, medical, and relief assistance requests by priority.",
      emptyTitle: "No assistance requests",
      emptyDescription: "Emergency requests will appear here. Residents can submit requests for help.",
      fields: [
        { name: "type", label: "Type", type: "select", options: ["Rescue","Medical","Relief"], required: true },
        { name: "priority", label: "Priority", type: "select", options: ["Low","Medium","High","Emergency"], required: true },
        { name: "requester", label: "Requester Name", required: true },
        { name: "location", label: "Location / Address", required: true },
        { name: "contact", label: "Contact Number" },
        { name: "description", label: "Details / Notes", type: "textarea" },
        { name: "status", label: "Response Status", type: "select", options: ["Pending","Dispatched","En Route","Completed"] },
      ],
      columns: [
        { key: "type", label: "Type" },
        { key: "priority", label: "Priority" },
        { key: "requester", label: "Requester" },
        { key: "location", label: "Location" },
        { key: "contact", label: "Contact" },
        { key: "status", label: "Status" },
      ],
      searchKeys: ["requester","location","type"],
      permissions: {
        create: "emergencyManage",
        edit: "emergencyManage",
        delete: "emergencyManage",
      },
    }} />
  );
}
