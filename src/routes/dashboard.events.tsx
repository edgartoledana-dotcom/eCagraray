import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "../components/CrudPage";
import { useAuth } from "../lib/auth";
import { Card, EmptyState } from "../components/ui-kit";

export const Route = createFileRoute("/dashboard/events")({ component: Page });

function Page() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Card>
        <EmptyState title="Access Restricted" description="Please log in to access Community Events." />
      </Card>
    );
  }

  return (
    <CrudPage<any> config={{
      storeKey: "events",
      title: "Community Events",
      subtitle: "Plan and track community events, assemblies, and activities.",
      emptyTitle: "No events scheduled",
      emptyDescription: "Create the first community event to get started.",
      fields: [
        { name: "title", label: "Event Title", required: true },
        { name: "date", label: "Date", type: "date" },
        { name: "location", label: "Location" },
        { name: "organizer", label: "Organizer" },
        { name: "category", label: "Category", type: "select", options: ["Assembly","Sports","Health","Education","SK","Livelihood","Other"] },
        { name: "description", label: "Description", type: "textarea" },
      ],
      columns: [
        { key: "title", label: "Event" },
        { key: "date", label: "Date" },
        { key: "location", label: "Location" },
        { key: "organizer", label: "Organizer" },
        { key: "category", label: "Category" },
      ],
      searchKeys: ["title","location","organizer","category"],
      permissions: {
        create: "eventsManage",
        edit: "eventsManage",
        delete: "eventsManage",
      },
    }} />
  );
}
