import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStored, uid, canRole } from "../lib/store";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Badge, Select, Textarea } from "../components/ui-kit";
import { Megaphone, Pin, Archive, Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "../lib/auth";
import { pushNotification } from "../lib/notify";
import { toast } from "sonner";
import { getTableData, saveTableData } from "../lib/api/auth.functions";

export const Route = createFileRoute("/dashboard/announcements")({ component: Page });

const CATEGORIES = ["General","Health","Disaster","Education","SK","Community"];

interface A { id: string; title: string; body: string; category: string; pinned: boolean; archived: boolean; createdAt: string }

function Page() {
  const { user } = useAuth();
  const canManage = canRole(user?.role, "announcements");
  const [items, setItems] = useStored<A[]>("announcements", []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<A | null>(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    getTableData({ data: { table: "announcements" } })
      .then((serverData) => {
        if (serverData && Array.isArray(serverData)) {
          setItems(serverData as A[]);
        }
      })
      .catch((err) => console.warn("Could not sync load announcements:", err));
  }, []);

  const updateItemsAndSync = async (nextItems: A[]) => {
    setItems(nextItems);
    try {
      await saveTableData({ data: { table: "announcements", data: nextItems } });
    } catch (err) {
      console.error("Could not sync announcements on server:", err);
    }
  };

  const list = items
    .filter((i) => (filter === "All" || i.category === filter))
    .sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || b.createdAt.localeCompare(a.createdAt));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.title.trim()) return toast.error("Title required");
    const isNew = !editing.id;
    const payload = isNew ? { ...editing, id: uid(), createdAt: new Date().toISOString() } : editing;
    const nextItems = isNew ? [payload, ...items] : items.map((i) => i.id === payload.id ? payload : i);
    void updateItemsAndSync(nextItems);
    if (isNew) pushNotification({ title: "New Announcement", message: payload.title, type: "info" });
    setOpen(false); toast.success(isNew ? "Posted" : "Updated");
  };

  return (
    <div>
      <PageHeader title="Announcements" subtitle="Official barangay notices and updates." action={
        canManage ? (
          <Button onClick={() => { setEditing({ id: "", title: "", body: "", category: "General", pinned: false, archived: false, createdAt: "" }); setOpen(true); }}>
            <Plus className="h-4 w-4" /> New Announcement
          </Button>
        ) : undefined
      } />
      <Card>
        <div className="mb-4 flex flex-wrap gap-2">
          {["All", ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setFilter(c)} className={`rounded-full border px-3 py-1 text-xs ${filter === c ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{c}</button>
          ))}
        </div>
        {list.length === 0 ? (
          <EmptyState icon={Megaphone} title="No announcements yet" description="Create your first announcement to broadcast to the community." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {list.map((a) => (
              <div key={a.id} className={`rounded-xl border p-4 ${a.archived ? "opacity-60" : ""} ${a.pinned ? "border-accent" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge tone="info">{a.category}</Badge>
                    {a.pinned && <Badge tone="warning"><Pin className="mr-1 inline h-3 w-3" /> Pinned</Badge>}
                    {a.archived && <Badge tone="muted">Archived</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</div>
                </div>
                <h3 className="mt-2 font-semibold">{a.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{a.body}</p>
                {canManage && (
                  <div className="mt-3 flex gap-1">
                    <button onClick={() => updateItemsAndSync(items.map((x) => x.id === a.id ? { ...x, pinned: !x.pinned } : x))} className="rounded p-1.5 hover:bg-muted"><Pin className="h-4 w-4" /></button>
                    <button onClick={() => updateItemsAndSync(items.map((x) => x.id === a.id ? { ...x, archived: !x.archived } : x))} className="rounded p-1.5 hover:bg-muted"><Archive className="h-4 w-4" /></button>
                    <button onClick={() => { setEditing(a); setOpen(true); }} className="rounded p-1.5 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => { if (confirm("Delete?")) updateItemsAndSync(items.filter((x) => x.id !== a.id)); }} className="rounded p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing?.id ? "Edit Announcement" : "New Announcement"}>
        {editing && (
          <form onSubmit={save} className="space-y-3">
            <Input label="Title *" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <Select label="Category" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Textarea label="Message" rows={5} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.pinned} onChange={(e) => setEditing({ ...editing, pinned: e.target.checked })} /> Pin to top</label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
