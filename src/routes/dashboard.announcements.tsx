import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { uid, canRole, useSyncable } from "../lib/store";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Badge, Select, Textarea } from "../components/ui-kit";
import { Megaphone, Pin, Archive, Plus, Pencil, Trash2, Search, X, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../lib/auth";
import { pushNotification } from "../lib/notify";
import { toast } from "sonner";
import { DeleteModal } from "../components/delete-modal";

export const Route = createFileRoute("/dashboard/announcements")({ component: Page });

const CATEGORIES = ["General", "Health", "Disaster", "Education", "SK", "Community"];

interface A { id: string; title: string; body: string; category: string; pinned: boolean; archived: boolean; createdAt: string; status?: string; submittedBy?: string }

function Page() {
  const { user } = useAuth();
  const canManage = canRole(user?.role, "announcements");
  const [items, setItems, updateItemsAndSync, refreshFromServer] = useSyncable<A[]>("announcements", [], { refreshInterval: 30000 });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<A | null>(null);
  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<A | null>(null);

  useEffect(() => { refreshFromServer(); }, []);

  const list = items
    .filter((i) => {
      if (canManage) return true;
      return i.status === "Published" || i.status === undefined;
    })
    .filter((i) => (filter === "All" || i.category === filter))
    .filter((i) => !q.trim() || i.title.toLowerCase().includes(q.toLowerCase()) || i.body.toLowerCase().includes(q.toLowerCase()))
    .slice()
    .sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || b.createdAt.localeCompare(a.createdAt));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.title.trim()) return toast.error("Title required");
    const isNew = !editing.id;
    const payload = isNew
      ? { ...editing, id: uid(), createdAt: new Date().toISOString(), status: "Published", submittedBy: user?.fullName || "" }
      : editing;
    const nextItems = isNew ? [payload, ...items] : items.map((i) => i.id === payload.id ? payload : i);
    void updateItemsAndSync(nextItems);
    if (isNew) pushNotification({ title: "New Announcement", message: payload.title, type: "info" });
    setOpen(false); toast.success(isNew ? "Posted" : "Updated");
  };

  const remove = () => {
    if (!deleteTarget) return;
    void updateItemsAndSync(items.filter((x) => x.id !== deleteTarget.id));
    setDeleteTarget(null); toast.success("Deleted");
  };

  if (!user || (user.role !== "super_admin" && user.role !== "captain" && user.role !== "secretary" && user.role !== "resident")) {
    return <Card><EmptyState icon={Megaphone} title="Access Restricted" description="You do not have permission to access Announcements." /></Card>;
  }

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
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search announcements..." className="w-full rounded-2xl border border-border/60 bg-background/40 py-2.5 pl-10 pr-9 text-xs font-semibold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" />
            {q && <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["All", ...CATEGORIES].map((c) => (
              <button key={c} onClick={() => setFilter(c)} className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${filter === c ? "bg-primary text-primary-foreground border-primary" : "border-border/50 hover:bg-muted"}`}>{c}</button>
            ))}
          </div>
        </div>
        {list.length === 0 ? (
          <EmptyState icon={Megaphone} title="No announcements yet" description="Create your first announcement to broadcast to the community." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {list.map((a) => {
              const isExpanded = expanded[a.id];
              const hasLongBody = a.body.length > 150;
              return (
                <div key={a.id} className={`rounded-xl border p-4 transition ${a.archived ? "opacity-50" : ""} ${a.pinned ? "border-accent ring-1 ring-accent/20" : "border-border/40"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone="info">{a.category}</Badge>
                      {a.pinned && <Badge tone="warning"><Pin className="mr-1 inline h-3 w-3" /> Pinned</Badge>}
                      {a.archived && <Badge tone="muted">Archived</Badge>}
                      {a.status === "Pending Approval" && <Badge tone="warning">Pending Approval</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">{new Date(a.createdAt).toLocaleDateString()}</div>
                  </div>
                  <h3 className="mt-2 font-semibold">{a.title}</h3>
                  <p className={`mt-1 text-sm text-muted-foreground ${!isExpanded && hasLongBody ? "line-clamp-3" : "whitespace-pre-wrap"}`}>{a.body}</p>
                  {hasLongBody && (
                    <button onClick={() => setExpanded({ ...expanded, [a.id]: !isExpanded })} className="mt-1 flex items-center gap-0.5 text-[10px] font-bold text-primary hover:underline">
                      {isExpanded ? <><ChevronUp className="h-3 w-3" /> Show less</> : <><ChevronDown className="h-3 w-3" /> Read more</>}
                    </button>
                  )}
                  {canManage && (
                    <div className="mt-3 flex gap-1">
                      <button onClick={() => { updateItemsAndSync(items.map((x) => x.id === a.id ? { ...x, pinned: !x.pinned } : x)); toast.success(a.pinned ? "Unpinned" : "Pinned"); }} className={`rounded p-1.5 transition ${a.pinned ? "text-accent bg-accent/10" : "hover:bg-muted"}`} title={a.pinned ? "Unpin" : "Pin"}><Pin className="h-4 w-4" /></button>
                      <button onClick={() => { updateItemsAndSync(items.map((x) => x.id === a.id ? { ...x, archived: !x.archived } : x)); toast.success(a.archived ? "Unarchived" : "Archived"); }} className={`rounded p-1.5 transition ${a.archived ? "text-warning bg-warning/10" : "hover:bg-muted"}`} title={a.archived ? "Unarchive" : "Archive"}><Archive className="h-4 w-4" /></button>
                      <button onClick={() => { setEditing(a); setOpen(true); }} className="rounded p-1.5 hover:bg-muted" title="Edit"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteTarget(a)} className="rounded p-1.5 text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  )}
                </div>
              );
            })}
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

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={remove} itemName={deleteTarget?.title} message="Delete this announcement?" />
    </div>
  );
}
