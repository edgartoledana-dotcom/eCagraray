import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useSyncable, uid, hasPermission } from "../lib/store";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Badge, Pagination } from "../components/ui-kit";
import { Plus, Pencil, Trash2, Search, X, Users, HeartHandshake, Truck, Stethoscope, Radio, Wrench, ArrowRight, Clock } from "lucide-react";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { DeleteModal } from "../components/delete-modal";

export const Route = createFileRoute("/dashboard/volunteers")({ component: Page });

const TEAMS = ["Rescue", "Medical", "Logistics", "Communications", "General"];
const STATUSES = ["Available", "Deployed", "Inactive"];

interface V { id: string; createdAt?: string; fullName: string; contact: string; skills: string; team: string; status: string; deployment: string }

const teamIcon: Record<string, typeof HeartHandshake> = { Rescue: Truck, Medical: Stethoscope, Logistics: Wrench, Communications: Radio, General: HeartHandshake };
const statusTone: Record<string, "success" | "warning" | "muted"> = { Available: "success", Deployed: "warning", Inactive: "muted" };

function Page() {
  const { user } = useAuth();
  const canManage = user && hasPermission(user.role, "volunteersManage");
  const [items, setItems, updateItemsAndSync, refreshFromServer] = useSyncable<V[]>("volunteers", [], { refreshInterval: 30000 });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<V | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<V | null>(null);
  const [q, setQ] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  useEffect(() => { setPage(1); }, [q, filterTeam]);

  useEffect(() => { refreshFromServer(); }, []);

  const stats = useMemo(() => {
    const byTeam: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const v of items) {
      byTeam[v.team] = (byTeam[v.team] || 0) + 1;
      byStatus[v.status] = (byStatus[v.status] || 0) + 1;
    }
    return { byTeam, byStatus, count: items.length, deployable: items.filter((v) => v.status === "Available").length };
  }, [items]);

  const filtered = useMemo(() => {
    let result = items;
    if (q.trim()) {
      const s = q.toLowerCase();
      result = result.filter((r) => [r.fullName, r.skills, r.team, r.deployment].some((v) => v?.toLowerCase().includes(s)));
    }
    if (filterTeam) result = result.filter((r) => r.team === filterTeam);
    return result;
  }, [items, q, filterTeam]);

  if (!user || (user.role !== "super_admin" && user.role !== "sk_officer" && user.role !== "disaster")) {
    return <Card><EmptyState title="Access Restricted" description="Only System Administrator, Disaster Response, and SK Officer accounts possess Volunteers clearance." /></Card>;
  }

  const setStatus = (v: V, status: string) => {
    if (!canManage) return;
    void updateItemsAndSync(items.map((x) => x.id === v.id ? { ...x, status } : x));
    toast.success(`${v.fullName} marked as ${status}`);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.fullName) return toast.error("Name required");
    const isNew = !editing.id;
    const p = isNew ? { ...editing, id: uid(), createdAt: new Date().toISOString(), status: "Available" } : editing;
    const next = isNew ? [p, ...items] : items.map((x) => x.id === p.id ? p : x);
    void updateItemsAndSync(next);
    setOpen(false); toast.success(isNew ? "Volunteer added" : "Updated");
  };

  const remove = () => {
    if (!deleteTarget) return;
    void updateItemsAndSync(items.filter((x) => x.id !== deleteTarget.id));
    setDeleteTarget(null); toast.success("Deleted");
  };

  return (
    <div>
      <PageHeader title="Volunteers" subtitle="Volunteer registry, skills database, and deployment tracking." action={
        canManage ? <Button onClick={() => { setEditing({ id: "", fullName: "", contact: "", skills: "", team: "General", status: "Available", deployment: "" }); setOpen(true); }}><Plus className="h-4 w-4" /> Add Volunteer</Button> : undefined
      } />

      <div className="grid gap-2 sm:gap-3 mb-4 sm:mb-6 grid-cols-2 sm:grid-cols-4">
        {TEAMS.map((t) => {
          const Icon = teamIcon[t] || HeartHandshake;
          return (
            <div key={t} className="rounded-xl border border-border/40 bg-card/60 p-3 sm:p-4">
              <div className="flex items-center gap-1.5 mb-1"><Icon className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t}</span></div>
              <div className="text-xl sm:text-2xl font-black">{stats.byTeam[t] || 0}</div>
            </div>
          );
        })}
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search volunteers..." className="w-full rounded-2xl border border-border/60 bg-background/40 py-2.5 pl-10 pr-9 text-xs font-semibold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 min-h-[44px]" />
          {q && <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {TEAMS.map((t) => (
            <button key={t} onClick={() => setFilterTeam(filterTeam === t ? "" : t)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition min-h-[40px] lg:min-h-[36px] ${filterTeam === t ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground hover:border-primary/40"}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> {stats.byStatus["Available"] || 0} Available</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> {stats.byStatus["Deployed"] || 0} Deployed</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground/40" /> {stats.byStatus["Inactive"] || 0} Inactive</span>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={Users} title="No volunteers" description={q || filterTeam ? "No volunteers match your filters." : "No volunteers registered yet."} /></Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.slice((page - 1) * pageSize, page * pageSize).map((v) => {
            const Icon = teamIcon[v.team] || HeartHandshake;
            return (
              <Card key={v.id} className={`${v.status === "Deployed" ? "ring-1 ring-warning/20" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{v.fullName}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5"><Icon className="h-3 w-3" /> {v.team}</div>
                  </div>
                  <Badge tone={statusTone[v.status] || "muted"} className="text-[9px] shrink-0">{v.status}</Badge>
                </div>
                {v.skills && <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1"><Wrench className="h-3 w-3" /> {v.skills}</div>}
                {v.deployment && <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" /> {v.deployment}</div>}
                {v.contact && <div className="text-[10px] text-muted-foreground mt-0.5">{v.contact}</div>}
                {canManage && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {v.status === "Available" && <Button variant="outline" onClick={() => setStatus(v, "Deployed")} className="text-[9px] py-1 px-2 min-h-[40px] lg:min-h-[28px]"><ArrowRight className="h-3 w-3" /> Deploy</Button>}
                    {v.status === "Deployed" && <Button variant="outline" onClick={() => setStatus(v, "Available")} className="text-[9px] py-1 px-2 min-h-[40px] lg:min-h-[28px]">Reactivate</Button>}
                    {v.status !== "Inactive" && <Button variant="ghost" onClick={() => setStatus(v, "Inactive")} className="text-[9px] py-1 px-2 min-h-[40px] lg:min-h-[28px]">Deactivate</Button>}
                    <button onClick={() => { setEditing(v); setOpen(true); }} className="rounded p-1.5 hover:bg-muted transition min-h-[40px] min-w-[40px] lg:min-h-[32px] lg:min-w-[32px] flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteTarget(v)} className="rounded p-1.5 text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition min-h-[40px] min-w-[40px] lg:min-h-[32px] lg:min-w-[32px] flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <Pagination currentPage={page} totalPages={Math.max(1, Math.ceil(filtered.length / pageSize))} onPageChange={setPage} />

      <Modal open={open} onClose={() => setOpen(false)} title={editing?.id ? "Update Volunteer" : "Add Volunteer"}>
        {editing && (
          <form onSubmit={save} className="space-y-3">
            <Input label="Full Name *" value={editing.fullName} onChange={(e) => setEditing({ ...editing, fullName: e.target.value })} />
            <Input label="Contact" value={editing.contact} onChange={(e) => setEditing({ ...editing, contact: e.target.value })} />
            <Input label="Skills (comma-separated)" value={editing.skills} onChange={(e) => setEditing({ ...editing, skills: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team</span>
                <select value={editing.team} onChange={(e) => setEditing({ ...editing, team: e.target.value })} className="w-full rounded-2xl border border-border/60 bg-background/50 px-4.5 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10">{TEAMS.map((o) => <option key={o}>{o}</option>)}</select>
              </label>
              {editing.id && (
                <label className="block space-y-1.5">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
                  <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="w-full rounded-2xl border border-border/60 bg-background/50 px-4.5 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10">{STATUSES.map((o) => <option key={o}>{o}</option>)}</select>
                </label>
              )}
            </div>
            <Input label="Current Deployment" value={editing.deployment} onChange={(e) => setEditing({ ...editing, deployment: e.target.value })} />
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Save</Button></div>
          </form>
        )}
      </Modal>

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={remove} itemName={deleteTarget?.fullName} message="Delete this volunteer's record permanently?" />
    </div>
  );
}
