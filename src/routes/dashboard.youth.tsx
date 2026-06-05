import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "../components/CrudPage";
import { useAuth } from "../lib/auth";
import { Card, EmptyState } from "../components/ui-kit";

export const Route = createFileRoute("/dashboard/youth")({ component: Page });

function Page() {
  const { user } = useAuth();

  if (!user || (user.role !== "super_admin" && user.role !== "sk_officer")) {
    return (
      <Card>
        <EmptyState title="Access Restricted" description="Only System Administrator and SK Officer accounts possess SK Youth Registry clearance." />
      </Card>
    );
  }

  return (
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
  );
}
