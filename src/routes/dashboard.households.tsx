import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useSyncable, uid, canRole } from "../lib/store";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Badge, Pagination } from "../components/ui-kit";
import { Plus, Pencil, Trash2, Search, X, Home, Users, MapPin, Hash, Building2 } from "lucide-react";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { DeleteModal } from "../components/delete-modal";

export const Route = createFileRoute("/dashboard/households")({ component: Page });

interface H { id: string; createdAt?: string; code: string; head: string; address: string; members: number; purok: string }

function Page() {
  const { user } = useAuth();
  const canManage = canRole(user?.role, "householdsManage");
  const [items, setItems, updateItemsAndSync, refreshFromServer] = useSyncable<H[]>("households", [], { refreshInterval: 30000 });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<H | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<H | null>(null);
  const [q, setQ] = useState("");
  const [filterPurok, setFilterPurok] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  useEffect(() => { setPage(1); }, [q, filterPurok]);

  useEffect(() => { refreshFromServer(); }, []);

  const stats = useMemo(() => {
    const totalMembers = items.reduce((s, h) => s + (h.members || 0), 0);
    const byPurok: Record<string, { count: number; members: number }> = {};
    for (const h of items) {
      const p = h.purok || "Unassigned";
      if (!byPurok[p]) byPurok[p] = { count: 0, members: 0 };
      byPurok[p].count++;
      byPurok[p].members += h.members || 0;
    }
    const puroks = Object.entries(byPurok).sort((a, b) => b[1].count - a[1].count);
    return { totalMembers, puroks, count: items.length };
  }, [items]);

  const purokList = useMemo(() => {
    const set = new Set<string>();
    items.forEach((h) => { if (h.purok) set.add(h.purok); });
    return [...set].sort();
  }, [items]);

  const filtered = useMemo(() => {
    let result = items;
    if (q.trim()) {
      const s = q.toLowerCase();
      result = result.filter((r) => [r.code, r.head, r.address, r.purok].some((v) => v?.toLowerCase().includes(s)));
    }
    if (filterPurok) result = result.filter((r) => r.purok === filterPurok);
    return result;
  }, [items, q, filterPurok]);

  if (!user || !canManage) {
    return <Card><EmptyState title="Access Restricted" description="Only System Administrator and Barangay Secretary accounts possess Households Database clearance." /></Card>;
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.code || !editing.head) return toast.error("Household code and head required");
    const isNew = !editing.id;
    const p = isNew ? { ...editing, id: uid(), createdAt: new Date().toISOString() } : editing;
    const next = isNew ? [p, ...items] : items.map((x) => x.id === p.id ? p : x);
    void updateItemsAndSync(next);
    setOpen(false); toast.success(isNew ? "Household created" : "Updated");
  };

  const remove = () => {
    if (!deleteTarget) return;
    void updateItemsAndSync(items.filter((x) => x.id !== deleteTarget.id));
    setDeleteTarget(null); toast.success("Deleted");
  };

  return (
    <div>
      <PageHeader title="Households" subtitle="Group residents into households and track addresses by purok." action={
        canManage ? <Button onClick={() => { setEditing({ id: "", code: "", head: "", address: "", members: 0, purok: "" }); setOpen(true); }}><Plus className="h-4 w-4" /> Add Household</Button> : undefined
      } />

      <div className="grid gap-2 sm:gap-3 mb-4 sm:mb-6 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/40 bg-card/60 p-3 sm:p-4">
          <div className="flex items-center gap-1.5 mb-1"><Home className="h-3.5 w-3.5 text-primary" /><span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Households</span></div>
          <div className="text-xl sm:text-2xl font-black">{stats.count}</div>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/60 p-3 sm:p-4">
          <div className="flex items-center gap-1.5 mb-1"><Users className="h-3.5 w-3.5 text-accent" /><span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Members</span></div>
          <div className="text-xl sm:text-2xl font-black">{stats.totalMembers}</div>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/60 p-3 sm:p-4">
          <div className="flex items-center gap-1.5 mb-1"><MapPin className="h-3.5 w-3.5 text-info" /><span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Puroks</span></div>
          <div className="text-xl sm:text-2xl font-black">{purokList.length}</div>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/60 p-3 sm:p-4">
          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Avg Members/HH</div>
          <div className="text-xl sm:text-2xl font-black">{stats.count > 0 ? (stats.totalMembers / stats.count).toFixed(1) : "0"}</div>
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search households..." className="w-full rounded-2xl border border-border/60 bg-background/40 py-2.5 pl-10 pr-9 text-xs font-semibold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 min-h-[44px]" />
          {q && <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {purokList.slice(0, 8).map((p) => (
            <button key={p} onClick={() => setFilterPurok(filterPurok === p ? "" : p)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition min-h-[36px] ${filterPurok === p ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground hover:border-primary/40"}`}>{p}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={Home} title="No households" description={q || filterPurok ? "No households match your filters." : "No households registered yet."} /></Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.slice((page - 1) * pageSize, page * pageSize).map((h) => (
            <Card key={h.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{h.head}</div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1"><Hash className="h-3 w-3" /> {h.code}</div>
                </div>
                <Badge tone="info" className="text-[9px] shrink-0">{h.members || 0} members</Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                {h.purok && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {h.purok}</span>}
                {h.address && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {h.address}</span>}
              </div>
              {canManage && (
                <div className="mt-3 flex gap-1">
                  <button onClick={() => { setEditing(h); setOpen(true); }} className="rounded p-1.5 hover:bg-muted transition min-h-[36px] min-w-[36px] flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteTarget(h)} className="rounded p-1.5 text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition min-h-[36px] min-w-[36px] flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      {filtered.length > pageSize && <Pagination currentPage={page} totalPages={Math.max(1, Math.ceil(filtered.length / pageSize))} onPageChange={setPage} />}

      <Modal open={open} onClose={() => setOpen(false)} title={editing?.id ? "Update Household" : "New Household"}>
        {editing && (
          <form onSubmit={save} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Household Code *" value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} />
              <Input label="Head of Household *" value={editing.head} onChange={(e) => setEditing({ ...editing, head: e.target.value })} />
            </div>
            <Input label="Address" value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Member Count" type="number" min={0} value={editing.members} onChange={(e) => setEditing({ ...editing, members: Number(e.target.value) })} />
              <Input label="Purok / Sitio" value={editing.purok} onChange={(e) => setEditing({ ...editing, purok: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Save</Button></div>
          </form>
        )}
      </Modal>

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={remove} itemName={deleteTarget?.head} message="Delete this household permanently?" />
    </div>
  );
}
