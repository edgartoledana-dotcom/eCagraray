import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useSyncable, uid, hasPermission } from "../lib/store";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Badge, Select, Textarea } from "../components/ui-kit";
import { Plus, Pencil, Trash2, Search, X, Calendar, MapPin, Users, Tag, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { DeleteModal } from "../components/delete-modal";

export const Route = createFileRoute("/dashboard/events")({ component: Page });

const CATEGORIES = ["Assembly", "Sports", "Health", "Education", "SK", "Livelihood", "Other"];

interface E { id: string; createdAt?: string; title: string; date: string; location: string; organizer: string; category: string; description: string }

function Page() {
  const { user } = useAuth();
  const canManage = user && hasPermission(user.role, "eventsManage");
  const [items, setItems, updateItemsAndSync, refreshFromServer] = useSyncable<E[]>("events", [], { refreshInterval: 30000 });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<E | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<E | null>(null);
  const [q, setQ] = useState("");
  const [filterCat, setFilterCat] = useState("");

  useEffect(() => { refreshFromServer(); }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = items.filter((e) => e.date && new Date(e.date) >= now).length;
    const past = items.filter((e) => !e.date || new Date(e.date) < now).length;
    const byCat: Record<string, number> = {};
    for (const c of CATEGORIES) byCat[c] = items.filter((e) => e.category === c).length;
    return { upcoming, past, byCat, total: items.length };
  }, [items]);

  const sorted = useMemo(() => {
    let result = items;
    if (q.trim()) {
      const s = q.toLowerCase();
      result = result.filter((r) => [r.title, r.location, r.organizer, r.category].some((v) => v?.toLowerCase().includes(s)));
    }
    if (filterCat) result = result.filter((r) => r.category === filterCat);
    return [...result].sort((a, b) => {
      if (!a.date) return 1; if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [items, q, filterCat]);

  if (!user) {
    return <Card><EmptyState title="Access Restricted" description="Please log in to access Community Events." /></Card>;
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.title) return toast.error("Title required");
    const isNew = !editing.id;
    const p = isNew ? { ...editing, id: uid(), createdAt: new Date().toISOString() } : editing;
    const next = isNew ? [p, ...items] : items.map((x) => x.id === p.id ? p : x);
    void updateItemsAndSync(next);
    setOpen(false); toast.success(isNew ? "Event created" : "Updated");
  };

  const remove = () => {
    if (!deleteTarget) return;
    void updateItemsAndSync(items.filter((x) => x.id !== deleteTarget.id));
    setDeleteTarget(null); toast.success("Deleted");
  };

  const isUpcoming = (d: string) => d && new Date(d) >= new Date();

  return (
    <div>
      <PageHeader title="Community Events" subtitle="Plan and track community events, assemblies, and activities." action={
        canManage ? <Button onClick={() => { setEditing({ id: "", title: "", date: "", location: "", organizer: "", category: "Assembly", description: "" }); setOpen(true); }}><Plus className="h-4 w-4" /> New Event</Button> : undefined
      } />

      <div className="grid gap-2 sm:gap-3 mb-4 sm:mb-6 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-xl border border-border/40 bg-card/60 p-3 sm:p-4">
          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Events</div>
          <div className="text-xl sm:text-2xl font-black">{stats.total}</div>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 sm:p-4">
          <div className="flex items-center gap-1.5 mb-1"><Calendar className="h-3 w-3 text-primary" /><span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-primary">Upcoming</span></div>
          <div className="text-xl sm:text-2xl font-black text-primary">{stats.upcoming}</div>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/60 p-3 sm:p-4">
          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Past</div>
          <div className="text-xl sm:text-2xl font-black">{stats.past}</div>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/60 p-3 sm:p-4">
          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Categories</div>
          <div className="text-sm font-bold mt-1 space-y-0.5">
            {CATEGORIES.filter((c) => stats.byCat[c] > 0).slice(0, 3).map((c) => (
              <div key={c} className="flex justify-between text-[10px]"><span>{c}</span><span>{stats.byCat[c]}</span></div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events..." className="w-full rounded-2xl border border-border/60 bg-background/40 py-2.5 pl-10 pr-9 text-xs font-semibold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 min-h-[44px]" />
          {q && <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setFilterCat(filterCat === c ? "" : c)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition min-h-[36px] ${filterCat === c ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground hover:border-primary/40"}`}>{c}</button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <Card><EmptyState icon={Calendar} title="No events" description={q || filterCat ? "No events match your filters." : "No events have been scheduled yet."} /></Card>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {sorted.map((e) => {
            const upcoming = isUpcoming(e.date);
            return (
              <Card key={e.id} className={`${upcoming ? "ring-1 ring-primary/10" : "opacity-70"}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{e.title}</span>
                      <Badge tone={upcoming ? "info" : "muted"} className="text-[9px]">{upcoming ? "Upcoming" : "Past"}</Badge>
                      <Badge tone="success" className="text-[9px]">{e.category}</Badge>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[10px] sm:text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {e.date ? new Date(e.date).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "TBD"}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location || "—"}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {e.organizer || "—"}</span>
                    </div>
                    {e.description && <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{e.description}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                    {canManage && <button onClick={() => { setEditing(e); setOpen(true); }} className="rounded-full p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition min-h-[40px] min-w-[40px] lg:min-h-[36px] lg:min-w-[36px] flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button>}
                    {canManage && <button onClick={() => setDeleteTarget(e)} className="rounded-full p-2 text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition min-h-[40px] min-w-[40px] lg:min-h-[36px] lg:min-w-[36px] flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing?.id ? "Update Event" : "New Event"}>
        {editing && (
          <form onSubmit={save} className="space-y-3">
            <Input label="Event Title *" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Date" type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
              <Select label="Category" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>{CATEGORIES.map((o) => <option key={o}>{o}</option>)}</Select>
            </div>
            <Input label="Location" value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} />
            <Input label="Organizer" value={editing.organizer} onChange={(e) => setEditing({ ...editing, organizer: e.target.value })} />
            <Textarea label="Description" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} />
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Save</Button></div>
          </form>
        )}
      </Modal>

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={remove} itemName={deleteTarget?.title} message="Delete this event permanently?" />
    </div>
  );
}
