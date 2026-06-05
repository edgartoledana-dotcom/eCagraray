import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "../components/CrudPage";
import { useAuth } from "../lib/auth";
import { Card, EmptyState } from "../components/ui-kit";

export const Route = createFileRoute("/dashboard/residents")({ component: Page });

function Page() {
  const { user } = useAuth();
  const getAge = (birthdate: string) => {
    if (!birthdate) return 0;
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (!user || (user.role !== "super_admin" && user.role !== "secretary")) {
    return (
      <Card>
        <EmptyState title="Access Restricted" description="Only System Administrator and Barangay Secretary accounts possess Residents Database clearance." />
      </Card>
    );
  }

  return (
    <CrudPage<any> config={{
      storeKey: "residents",
      title: "Residents",
      subtitle: "Manage resident records and profiles.",
      emptyTitle: "No residents yet",
      emptyDescription: "Add the first resident record or import an Excel/CSV file to get started.",
      fields: [
        { name: "fullName", label: "Full Name", required: true },
        { name: "birthdate", label: "Birthdate", type: "date" },
        { name: "gender", label: "Gender", type: "select", options: ["Male","Female","Other"] },
        { name: "civilStatus", label: "Civil Status", type: "select", options: ["Single","Married","Widowed","Separated"] },
        { name: "contact", label: "Contact Number" },
        { name: "address", label: "Address" },
        { name: "household", label: "Household ID" },
        { name: "occupation", label: "Occupation", type: "select", options: ["Farmer", "Fisherfolk", "Student", "Other"] },
        { name: "isPwd", label: "PWD Status", type: "select", options: ["No", "Yes"] },
      ],
      columns: [
        { key: "fullName", label: "Name" },
        { key: "gender", label: "Gender" },
        { key: "birthdate", label: "Birthdate" },
        { key: "occupation", label: "Occupation" },
        { key: "isPwd", label: "PWD" },
        {
          key: "senior",
          label: "Senior Citizen",
          render: (row) => (getAge(row.birthdate) >= 60 ? "Yes" : "No"),
        },
      ],
      searchKeys: ["fullName","contact","address","occupation"],
      permissions: {
        create: "residentsManage",
        edit: "residentsManage",
        delete: "residentsManage",
      },
    }} />
  );
}
