import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStored, uid } from "../lib/store";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Badge } from "../components/ui-kit";
import { Building, Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { getTableData, saveTableData } from "../lib/api/auth.functions";

export const Route = createFileRoute("/dashboard/evacuation")({ component: Page });

interface C { id: string; name: string; location: string; capacity: number; occupants: number; manager: string; createdAt: string }

function Page() {
  const { user } = useAuth();
  const [items, setItems] = useStored<C[]>("evac_centers", []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<C | null>(null);

  useEffect(() => {
    getTableData({ data: { table: "evac_centers" } })
      .then((serverData) => {
        if (serverData && Array.isArray(serverData)) {
          setItems(serverData as C[]);
        }
      })
      .catch((err) => console.warn("Could not sync load evac_centers:", err));
  }, []);

  const updateItemsAndSync = async (nextItems: C[]) => {
    setItems(nextItems);
    try {
      await saveTableData({ data: { table: "evac_centers", data: nextItems } });
    } catch (err) {
      console.error("Could not sync evac_centers on server:", err);
    }
  };


  if (!user || (user.role !== "super_admin" && user.role !== "disaster" && user.role !== "captain")) {
    return (
      <Card>
        <EmptyState title="Access Restricted" description="Only System Administrator, Disaster Response, and Barangay Captain accounts possess Evacuation Centers clearance." />
      </Card>
    );
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.name) return toast.error("Name required");
    const isNew = !editing.id;
    const p = isNew ? { ...editing, id: uid(), createdAt: new Date().toISOString() } : editing;
    const nextItems = isNew ? [p, ...items] : items.map((x) => x.id === p.id ? p : x);
    void updateItemsAndSync(nextItems);
    setOpen(false); toast.success("Saved");
  };

  return (
    <div>
      <PageHeader title="Evacuation Centers" subtitle="Capacity monitoring and occupancy tracking." action={
        <Button onClick={() => { setEditing({ id:"", name:"", location:"", capacity:100, occupants:0, manager:"", createdAt:"" }); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Center
        </Button>
      } />
      {items.length === 0 ? (
        <Card><EmptyState icon={Building} title="No evacuation centers" description="Add evacuation centers to monitor capacity during emergencies." /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => {
            const pct = Math.min(100, Math.round((c.occupants / Math.max(1, c.capacity)) * 100));
            const tone = pct > 90 ? "bg-destructive" : pct > 70 ? "bg-warning" : "bg-success";
            return (
              <Card key={c.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.location}</div>
                  </div>
                  <Badge tone={pct > 90 ? "danger" : pct > 70 ? "warning" : "success"}>{pct}%</Badge>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs"><span>{c.occupants} occupants</span><span>capacity {c.capacity}</span></div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">Manager: {c.manager || "—"}</div>
                <div className="mt-3 flex gap-1">
                  <button onClick={() => { setEditing(c); setOpen(true); }} className="rounded p-1.5 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => { if (confirm("Delete?")) updateItemsAndSync(items.filter((x) => x.id !== c.id)); }} className="rounded p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Evacuation Center">
        {editing && (
          <form onSubmit={save} className="space-y-3">
            <Input label="Name *" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Input label="Location" value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Capacity" type="number" value={editing.capacity} onChange={(e) => setEditing({ ...editing, capacity: Number(e.target.value) })} />
              <Input label="Current Occupants" type="number" value={editing.occupants} onChange={(e) => setEditing({ ...editing, occupants: Number(e.target.value) })} />
            </div>
            <Input label="Manager" value={editing.manager} onChange={(e) => setEditing({ ...editing, manager: e.target.value })} />
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Save</Button></div>
          </form>
        )}
      </Modal>
    </div>
  );
}
