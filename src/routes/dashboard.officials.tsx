import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useSyncable, uid, hasPermission } from "../lib/store";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Badge, Pagination } from "../components/ui-kit";
import { Plus, Pencil, Trash2, Search, X, Shield, Users, Building2, ScrollText } from "lucide-react";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { DeleteModal } from "../components/delete-modal";

export const Route = createFileRoute("/dashboard/officials")({ component: Page });

const ROLES = [
  "Punong Barangay (Barangay Captain)",
  "Barangay Kagawad (Councilor)",
  "Barangay Secretary",
  "Barangay Treasurer",
  "SK Chairperson",
  "SK Kagawad",
  "Barangay Tanod",
  "Admin Aide / Staff",
];

const ROLE_GROUPS = ["Punong Barangay", "Kagawad", "Secretary/Treasurer", "SK", "Tanod/Staff"];

function getRoleGroup(role: string): string {
  if (role.startsWith("Punong")) return "Punong Barangay";
  if (role.includes("Kagawad")) return "Kagawad";
  if (role === "Barangay Secretary" || role === "Barangay Treasurer") return "Secretary/Treasurer";
  if (role.startsWith("SK")) return "SK";
  return "Tanod/Staff";
}

interface O { id: string; createdAt?: string; name: string; role: string; committee: string }

function Page() {
  const { user } = useAuth();
  const canManage = user && hasPermission(user.role, "officialsManage");
  const [items, setItems, updateItemsAndSync, refreshFromServer] = useSyncable<O[]>("officials", [], { refreshInterval: 30000 });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<O | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<O | null>(null);
  const [q, setQ] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  useEffect(() => { setPage(1); }, [q, filterGroup]);

  useEffect(() => { refreshFromServer(); }, []);

  const stats = useMemo(() => {
    const byGroup: Record<string, number> = {};
    const committees = new Set<string>();
    for (const o of items) {
      const g = getRoleGroup(o.role);
      byGroup[g] = (byGroup[g] || 0) + 1;
      if (o.committee) committees.add(o.committee);
    }
    return { byGroup, committees: [...committees].sort(), count: items.length };
  }, [items]);

  const filtered = useMemo(() => {
    let result = items;
    if (q.trim()) {
      const s = q.toLowerCase();
      result = result.filter((r) => [r.name, r.role, r.committee].some((v) => v?.toLowerCase().includes(s)));
    }
    if (filterGroup) result = result.filter((r) => getRoleGroup(r.role) === filterGroup);
    return result;
  }, [items, q, filterGroup]);

  if (!user) {
    return <Card><EmptyState title="Access Restricted" description="Please sign in to view this page." /></Card>;
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.name || !editing.role) return toast.error("Name and role required");
    const isNew = !editing.id;
    const p = isNew ? { ...editing, id: uid(), createdAt: new Date().toISOString() } : editing;
    const next = isNew ? [p, ...items] : items.map((x) => x.id === p.id ? p : x);
    void updateItemsAndSync(next);
    setOpen(false); toast.success(isNew ? "Official added" : "Updated");
  };

  const remove = () => {
    if (!deleteTarget) return;
    void updateItemsAndSync(items.filter((x) => x.id !== deleteTarget.id));
    setDeleteTarget(null); toast.success("Deleted");
  };

  return (
    <div>
      <PageHeader title="Barangay Council & Officials" subtitle="Manage the official roster of the Barangay Council." action={
        canManage ? <Button onClick={() => { setEditing({ id: "", name: "", role: ROLES[0], committee: "" }); setOpen(true); }}><Plus className="h-4 w-4" /> Add Official</Button> : undefined
      } />

      <div className="grid gap-2 sm:gap-3 mb-4 sm:mb-6 grid-cols-2 sm:grid-cols-5">
        {ROLE_GROUPS.map((g) => (
          <div key={g} className="rounded-xl border border-border/40 bg-card/60 p-3 sm:p-4">
            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{g}</div>
            <div className="text-xl sm:text-2xl font-black">{stats.byGroup[g] || 0}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search officials..." className="w-full rounded-2xl border border-border/60 bg-background/40 py-2.5 pl-10 pr-9 text-xs font-semibold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 min-h-[44px]" />
          {q && <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {ROLE_GROUPS.map((g) => (
            <button key={g} onClick={() => setFilterGroup(filterGroup === g ? "" : g)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition min-h-[36px] ${filterGroup === g ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground hover:border-primary/40"}`}>{g}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={Shield} title="No officials" description={q || filterGroup ? "No officials match your filters." : "No officials registered yet."} /></Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.slice((page - 1) * pageSize, page * pageSize).map((o) => (
            <Card key={o.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-sm">{o.name}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{o.role}</div>
                </div>
                <Badge tone="info" className="text-[9px] shrink-0">{getRoleGroup(o.role)}</Badge>
              </div>
              {o.committee && (
                <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
                  <ScrollText className="h-3 w-3" /> {o.committee}
                </div>
              )}
              {canManage && (
                <div className="mt-3 flex gap-1">
                  <button onClick={() => { setEditing(o); setOpen(true); }} className="rounded p-1.5 hover:bg-muted transition min-h-[36px] min-w-[36px] flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteTarget(o)} className="rounded p-1.5 text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition min-h-[36px] min-w-[36px] flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      <Pagination currentPage={page} totalPages={Math.max(1, Math.ceil(filtered.length / pageSize))} onPageChange={setPage} />

      <Modal open={open} onClose={() => setOpen(false)} title={editing?.id ? "Update Official" : "Add Official"}>
        {editing && (
          <form onSubmit={save} className="space-y-3">
            <Input label="Full Name *" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <label className="block space-y-1.5">
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role / Position *</span>
              <select value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} className="w-full rounded-2xl border border-border/60 bg-background/50 px-4.5 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10">{ROLES.map((o) => <option key={o}>{o}</option>)}</select>
            </label>
            <Input label="Committee / Assignment *" value={editing.committee} onChange={(e) => setEditing({ ...editing, committee: e.target.value })} />
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Save</Button></div>
          </form>
        )}
      </Modal>

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={remove} itemName={deleteTarget?.name} message="Delete this official's record permanently?" />
    </div>
  );
}
