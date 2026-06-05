import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "../components/CrudPage";
import { useAuth } from "../lib/auth";
import { Card, EmptyState } from "../components/ui-kit";

export const Route = createFileRoute("/dashboard/complaints")({ component: Page });

function Page() {
  const { user } = useAuth();

  // Residents can file complaints, admins/captain/secretary manage them
  if (!user) {
    return (
      <Card>
        <EmptyState title="Access Restricted" description="Please log in to access the Complaints module." />
      </Card>
    );
  }

  return (
    <CrudPage<any> config={{
      storeKey: "complaints",
      title: "Complaints",
      subtitle: "Receive, assign, and resolve community complaints.",
      emptyTitle: "No complaints filed",
      emptyDescription: "Community members can file complaints which will be assigned for resolution.",
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
  );
}
