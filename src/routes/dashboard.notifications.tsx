import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStored } from "../lib/store";
import { Button, Card, EmptyState, PageHeader, Badge } from "../components/ui-kit";
import { Bell, Trash2, Check } from "lucide-react";
import type { Notification } from "../lib/notify";

export const Route = createFileRoute("/dashboard/notifications")({ component: Page });

function Page() {
  const [items, setItems] = useStored<Notification[]>("notifications", []);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const list = filter === "unread" ? items.filter((i) => !i.read) : items;

  return (
    <div>
      <PageHeader title="Notifications" subtitle="System-generated alerts and updates." action={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setItems(items.map((n) => ({ ...n, read: true })))}><Check className="h-4 w-4" /> Mark all read</Button>
          <Button variant="outline" onClick={() => setItems([])}><Trash2 className="h-4 w-4" /> Clear</Button>
        </div>
      } />
      <div className="mb-4 flex gap-2">
        {(["all","unread"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1 text-xs ${filter === f ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{f}</button>
        ))}
      </div>
      <Card>
        {list.length === 0 ? (
          <EmptyState icon={Bell} title="You're all caught up" description="New notifications will show here." />
        ) : (
          <ul className="divide-y">
            {list.map((n) => (
              <li key={n.id} className={`flex items-start justify-between gap-3 py-3 ${!n.read ? "" : "opacity-60"}`}>
                <div>
                  <div className="flex items-center gap-2"><Badge tone={n.type === "alert" ? "danger" : n.type === "incident" ? "warning" : "info"}>{n.type}</Badge><div className="font-medium">{n.title}</div></div>
                  <div className="text-sm text-muted-foreground">{n.message}</div>
                  <div className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex gap-1">
                  {!n.read && <button onClick={() => setItems(items.map((x) => x.id === n.id ? { ...x, read: true } : x))} className="rounded p-1.5 hover:bg-muted"><Check className="h-4 w-4" /></button>}
                  <button onClick={() => setItems(items.filter((x) => x.id !== n.id))} className="rounded p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
