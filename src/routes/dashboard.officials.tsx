import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "../components/CrudPage";
import { useAuth } from "../lib/auth";
import { Card, EmptyState } from "../components/ui-kit";

export const Route = createFileRoute("/dashboard/officials")({ component: Page });

function Page() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Card>
        <EmptyState title="Access Restricted" description="Please sign in to view this page." />
      </Card>
    );
  }

  return (
    <CrudPage<any> config={{
      storeKey: "officials",
      title: "Barangay Council & Officials",
      subtitle: "Manage the official roster of the Barangay Council, Secretaries, and Treasurers.",
      emptyTitle: "No officials registered",
      fields: [
        { name: "name", label: "Full Name", required: true },
        {
          name: "role",
          label: "Role / Position",
          type: "select",
          options: [
            "Punong Barangay (Barangay Captain)",
            "Barangay Kagawad (Councilor)",
            "Barangay Secretary",
            "Barangay Treasurer",
            "SK Chairperson",
            "SK Kagawad",
            "Barangay Tanod",
            "Admin Aide / Staff"
          ],
          required: true
        },
        { name: "committee", label: "Committee / Assignment", required: true },
      ],
      columns: [
        { key: "name", label: "Full Name" },
        { key: "role", label: "Role / Position" },
        { key: "committee", label: "Committee / Assignment" },
      ],
      searchKeys: ["name", "role", "committee"],
      permissions: {
        create: "officialsManage",
        edit: "officialsManage",
        delete: "officialsManage",
      },
    }} />
  );
}
