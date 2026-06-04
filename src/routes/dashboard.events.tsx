import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "../components/CrudPage";

export const Route = createFileRoute("/dashboard/events")({ component: () => (
  <CrudPage<any> config={{
    storeKey: "events",
    title: "Community Events",
    subtitle: "Plan and track community events and attendance.",
    emptyTitle: "No events scheduled",
    fields: [
      { name: "title", label: "Title", required: true },
      { name: "date", label: "Date", type: "date" },
      { name: "location", label: "Location" },
      { name: "organizer", label: "Organizer" },
      { name: "description", label: "Description", type: "textarea" },
    ],
    columns: [
      { key: "title", label: "Event" }, { key: "date", label: "Date" },
      { key: "location", label: "Location" }, { key: "organizer", label: "Organizer" },
    ],
    searchKeys: ["title","location","organizer"],
    permissions: {
      create: "eventsManage",
      edit: "eventsManage",
      delete: "eventsManage",
    },
  }} />
)});
