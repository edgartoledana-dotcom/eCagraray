import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useSyncable, canRole } from "../lib/store";
import { Button, Card, EmptyState, PageHeader, Badge, Pagination } from "../components/ui-kit";
import { Bell, Trash2, Check, Search, X } from "lucide-react";
import type { Notification } from "../lib/notify";
import { useAuth } from "../lib/auth";

export const Route = createFileRoute("/dashboard/notifications")({ component: Page });

function groupByDate(items: Notification[]) {
  const groups: { label: string; items: Notification[] }[] = [];
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.setDate(now.getDate() - 1)).toISOString().slice(0, 10);

  const buckets: Record<string, Notification[]> = {};
  items.forEach((n) => {
    const d = new Date(n.createdAt).toISOString().slice(0, 10);
    if (!buckets[d]) buckets[d] = [];
    buckets[d].push(n);
  });

  const sorted = Object.entries(buckets).sort(([a], [b]) => b.localeCompare(a));
  sorted.forEach(([date, notifs]) => {
    let label = date;
    if (date === today) label = "Today";
    else if (date === yesterday) label = "Yesterday";
    else label = new Date(date + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
    groups.push({ label, items: notifs });
  });
  return groups;
}

function Page() {
  const { user } = useAuth();
  const canManage = canRole(user?.role, "notificationsManage");
  const [items, setItems, updateItemsAndSync, refreshFromServer] = useSyncable<Notification[]>("notifications", [], { refreshInterval: 30000 });
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  useEffect(() => { setPage(1); }, [q, filter]);

  useEffect(() => { refreshFromServer(); }, []);

  const list = useMemo(() => {
    let result = filter === "unread" ? items.filter((i) => !i.read) : items;
    if (q.trim()) {
      const s = q.toLowerCase();
      result = result.filter((n) => n.title.toLowerCase().includes(s) || n.message.toLowerCase().includes(s));
    }
    return result;
  }, [items, filter, q]);

  const pagedList = useMemo(() => list.slice((page - 1) * pageSize, page * pageSize), [list, page]);
  const groups = useMemo(() => groupByDate(pagedList), [pagedList]);
  const unreadCount = items.filter((n) => !n.read).length;

  if (!user) {
    return <Card><EmptyState title="Access Restricted" description="Please log in to access Notifications." /></Card>;
  }

  return (
    <div>
      <PageHeader title="Notifications" subtitle="System-generated alerts and updates." action={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => updateItemsAndSync(items.map((n) => ({ ...n, read: true })))}><Check className="h-4 w-4" /> Mark all read</Button>
          {canManage && (
            <Button variant="outline" onClick={() => updateItemsAndSync([])}><Trash2 className="h-4 w-4" /> Clear</Button>
          )}
        </div>
      } />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {(["all", "unread"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1 text-xs font-semibold transition capitalize ${filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border/50 hover:bg-muted"}`}>
              {f}{f === "unread" && unreadCount > 0 && <span className="ml-1 opacity-70">({unreadCount})</span>}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notifications..." className="w-full rounded-2xl border border-border/60 bg-background/40 py-2 pl-10 pr-9 text-xs font-semibold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" />
          {q && <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
        </div>
      </div>

      <Card>
        {groups.length === 0 ? (
          <EmptyState icon={Bell} title="You're all caught up" description="New notifications will show here." />
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.label}>
                <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{group.label}</div>
                <div className="divide-y">
                  {group.items.map((n) => (
                    <div key={n.id} className={`flex items-start gap-3 py-3 ${!n.read ? "bg-primary/[0.03] -mx-2 px-2 rounded-lg" : "opacity-60"}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge tone={n.type === "alert" ? "danger" : n.type === "incident" ? "warning" : "info"}>{n.type}</Badge>
                          <div className="font-medium text-sm">{n.title}</div>
                          {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5">{n.message}</div>
                        <div className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {!n.read && <button onClick={() => updateItemsAndSync(items.map((x) => x.id === n.id ? { ...x, read: true } : x))} className="rounded p-1.5 hover:bg-muted transition" title="Mark read"><Check className="h-4 w-4" /></button>}
                        {canManage && (
                          <button onClick={() => updateItemsAndSync(items.filter((x) => x.id !== n.id))} className="rounded p-1.5 text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition" title="Delete"><Trash2 className="h-4 w-4" /></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Pagination currentPage={page} totalPages={Math.max(1, Math.ceil(list.length / pageSize))} onPageChange={setPage} />
    </div>
  );
}
