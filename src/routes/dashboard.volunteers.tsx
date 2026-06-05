import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "../components/CrudPage";
import { useAuth } from "../lib/auth";
import { Card, EmptyState } from "../components/ui-kit";

export const Route = createFileRoute("/dashboard/volunteers")({ component: Page });

function Page() {
  const { user } = useAuth();

  if (!user || (user.role !== "super_admin" && user.role !== "sk_officer" && user.role !== "disaster")) {
    return (
      <Card>
        <EmptyState title="Access Restricted" description="Only System Administrator, Disaster Response, and SK Officer accounts possess Volunteers Database clearance." />
      </Card>
    );
  }

  return (
    <CrudPage<any> config={{
      storeKey: "volunteers",
      title: "Volunteers",
      subtitle: "Volunteer registry, skills database, and deployment tracking.",
      emptyTitle: "No volunteers registered",
      fields: [
        { name: "fullName", label: "Full Name", required: true },
        { name: "contact", label: "Contact" },
        { name: "skills", label: "Skills (comma-separated)" },
        { name: "team", label: "Team", type: "select", options: ["Rescue","Medical","Logistics","Communications","General"] },
        { name: "status", label: "Status", type: "select", options: ["Available","Deployed","Inactive"] },
        { name: "deployment", label: "Current Deployment" },
      ],
      columns: [
        { key: "fullName", label: "Name" }, { key: "team", label: "Team" },
        { key: "skills", label: "Skills" }, { key: "status", label: "Status" },
        { key: "deployment", label: "Deployment" },
      ],
      searchKeys: ["fullName","skills","team"],
      permissions: {
        create: "volunteersManage",
        edit: "volunteersManage",
        delete: "volunteersManage",
      },
    }} />
  );
}
