import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStored, uid, canRole } from "../lib/store";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Badge, Select, Textarea } from "../components/ui-kit";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../lib/auth";
import { pushNotification } from "../lib/notify";
import { toast } from "sonner";
import { getTableData, saveTableData } from "../lib/api/auth.functions";

export const Route = createFileRoute("/dashboard/alerts")({ component: Page });

const TYPES = ["Typhoon","Flood","Landslide","Fire","Earthquake","Emergency"];
const LEVELS = ["Low","Moderate","High","Critical"];

interface A { id: string; type: string; level: string; title: string; description: string; location: string; status: "active"|"resolved"; createdAt: string }

const levelTone: any = { Low: "info", Moderate: "warning", High: "danger", Critical: "danger" };

function Page() {
  const { user } = useAuth();
  const canManage = canRole(user?.role, "alerts");
  const [items, setItems] = useStored<A[]>("alerts", []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<A | null>(null);
  const active = items.filter((a) => a.status === "active");
  const history = items.filter((a) => a.status === "resolved");

  useEffect(() => {
    getTableData({ data: { table: "alerts" } })
      .then((serverData) => {
        if (serverData && Array.isArray(serverData)) {
          setItems(serverData as A[]);
        }
      })
      .catch((err) => console.warn("Could not sync load alerts:", err));
  }, []);

  const updateItemsAndSync = async (nextItems: A[]) => {
    setItems(nextItems);
    try {
      await saveTableData({ data: { table: "alerts", data: nextItems } });
    } catch (err) {
      console.error("Could not sync alerts on server:", err);
    }
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.title) return toast.error("Title required");
    const isNew = !editing.id;
    const payload = isNew ? { ...editing, id: uid(), createdAt: new Date().toISOString(), status: "active" as const } : editing;
    const nextItems = isNew ? [payload, ...items] : items.map((i) => i.id === payload.id ? payload : i);
    void updateItemsAndSync(nextItems);
    if (isNew) pushNotification({ title: `${payload.level} ${payload.type} Alert`, message: payload.title, type: "alert" });
    setOpen(false); toast.success("Saved");
  };

  return (
    <div>
      <PageHeader title="Disaster Alerts" subtitle="Emergency operations center for active and historical alerts." action={
        canManage ? (
          <Button onClick={() => { setEditing({ id:"", type:"Typhoon", level:"Moderate", title:"", description:"", location:"", status:"active", createdAt:"" }); setOpen(true); }}>
            <Plus className="h-4 w-4" /> New Alert
          </Button>
        ) : undefined
      } />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {LEVELS.map((l) => (
          <div key={l} className="rounded-xl border bg-card p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{l} active</div>
            <div className="mt-1 text-2xl font-bold">{active.filter((a) => a.level === l).length}</div>
          </div>
        )).slice(0, 4)}
      </div>

      <Card>
        <h2 className="mb-3 font-semibold">Active Alerts</h2>
        {active.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="No active alerts" description="All clear. Create an alert if a hazard occurs." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {active.map((a) => (
              <div key={a.id} className="rounded-xl border-l-4 border-destructive bg-destructive/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Badge tone="danger">{a.type}</Badge><Badge tone={levelTone[a.level]}>{a.level}</Badge></div>
                  <div className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</div>
                </div>
                <div className="mt-2 font-semibold">{a.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                <div className="mt-1 text-xs text-muted-foreground">📍 {a.location}</div>
                {canManage && (
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" onClick={() => updateItemsAndSync(items.map((x) => x.id === a.id ? { ...x, status: "resolved" } : x))}>Mark Resolved</Button>
                    <Button variant="ghost" onClick={() => { if (confirm("Delete?")) updateItemsAndSync(items.filter((x) => x.id !== a.id)); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="mt-6">
        <Card>
          <h2 className="mb-3 font-semibold">Alert History</h2>
          {history.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No past alerts</div>
          ) : (
            <ul className="divide-y">
              {history.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium">{a.title}</div>
                    <div className="text-xs text-muted-foreground">{a.type} · {a.level} · {new Date(a.createdAt).toLocaleDateString()}</div>
                  </div>
                  <Badge tone="success">Resolved</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Alert">
        {editing && (
          <form onSubmit={save} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Select label="Type" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</Select>
              <Select label="Level" value={editing.level} onChange={(e) => setEditing({ ...editing, level: e.target.value })}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</Select>
            </div>
            <Input label="Title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <Input label="Location" value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} />
            <Textarea label="Description" rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Publish</Button></div>
          </form>
        )}
      </Modal>
    </div>
  );
}
