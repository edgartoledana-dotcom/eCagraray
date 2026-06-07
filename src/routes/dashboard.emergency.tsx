import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useSyncable, uid, hasPermission, canRole } from "../lib/store";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Badge, Select, Textarea } from "../components/ui-kit";
import { Plus, Pencil, Trash2, Search, X, Siren, Truck, HeartPulse, Package, MapPin, Phone, ArrowRight, Timer } from "lucide-react";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { DeleteModal } from "../components/delete-modal";
import { pushNotification } from "../lib/notify";

export const Route = createFileRoute("/dashboard/emergency")({ component: Page });

const TYPES = ["Rescue", "Medical", "Relief"];
const PRIORITIES = ["Low", "Medium", "High", "Emergency"];
const STATUSES = ["Pending", "Dispatched", "En Route", "Completed"];

interface E { id: string; createdAt?: string; type: string; priority: string; requester: string; location: string; contact: string; description: string; status: string }

const priorityTone: Record<string, "danger" | "warning" | "info" | "success"> = { Emergency: "danger", High: "warning", Medium: "info", Low: "success" };
const statusTone: Record<string, "warning" | "info" | "danger" | "success"> = { Pending: "warning", Dispatched: "info", "En Route": "danger", Completed: "success" };

function Page() {
  const { user } = useAuth();
  const canManage = user && hasPermission(user.role, "emergencyManage");
  const canRescue = canRole(user?.role, "emergencyRequest");
  const isResident = user?.role === "resident";
  const [items, setItems, updateItemsAndSync, refreshFromServer] = useSyncable<E[]>("emergency", [], { refreshInterval: 30000 });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<E | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<E | null>(null);
  const [q, setQ] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  useEffect(() => { refreshFromServer(); }, []);

  const stats = useMemo(() => {
    const byPriority: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const p of PRIORITIES) byPriority[p] = items.filter((i) => i.priority === p).length;
    for (const s of STATUSES) byStatus[s] = items.filter((i) => i.status === s).length;
    return { byPriority, byStatus, total: items.length, pending: items.filter((i) => i.status === "Pending").length };
  }, [items]);

  const filtered = useMemo(() => {
    let result = items;
    if (q.trim()) {
      const s = q.toLowerCase();
      result = result.filter((r) => [r.requester, r.location, r.type, r.contact].some((v) => v?.toLowerCase().includes(s)));
    }
    if (filterPriority) result = result.filter((r) => r.priority === filterPriority);
    return result;
  }, [items, q, filterPriority]);

  if (!user) {
    return <Card><EmptyState title="Access Restricted" description="Please log in to access the Emergency Assistance module." /></Card>;
  }

  const advanceStatus = (e: E) => {
    const idx = STATUSES.indexOf(e.status);
    if (idx < 0 || idx >= STATUSES.length - 1 || !canManage) return;
    const next = STATUSES[idx + 1];
    void updateItemsAndSync(items.map((x) => x.id === e.id ? { ...x, status: next } : x));
    toast.success(`Status updated to ${next}`);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.requester || !editing.location) return toast.error("Requester and location required");
    const isNew = !editing.id;
    const p = isNew ? { ...editing, id: uid(), createdAt: new Date().toISOString(), status: "Pending" } : editing;
    const next = isNew ? [p, ...items] : items.map((x) => x.id === p.id ? p : x);
    void updateItemsAndSync(next);
    if (isNew) {
      pushNotification({ title: `Emergency ${p.type} Request`, message: `${p.requester} — ${p.location}`, type: "alert" });
    }
    setOpen(false); toast.success(isNew ? "Request filed" : "Updated");
  };

  const remove = () => {
    if (!deleteTarget) return;
    void updateItemsAndSync(items.filter((x) => x.id !== deleteTarget.id));
    setDeleteTarget(null); toast.success("Deleted");
  };

  return (
    <div>
      <PageHeader title="Emergency Assistance" subtitle="Track rescue, medical, and relief assistance requests by priority." action={
        canRescue ? <Button onClick={() => { setEditing({ id: "", type: "Rescue", priority: "Medium", requester: user?.fullName || "", location: "", contact: "", description: "", status: "Pending" }); setOpen(true); }}><Plus className="h-4 w-4" /> {isResident ? "Request Assistance" : "New Request"}</Button> : undefined
      } />

      <div className="grid gap-2 sm:gap-3 mb-4 sm:mb-6 grid-cols-2 sm:grid-cols-4">
        {PRIORITIES.map((p) => (
          <div key={p} className={`rounded-xl border border-border/40 bg-card/60 p-3 sm:p-4 ${p === "Emergency" && stats.byPriority[p] > 0 ? "ring-2 ring-destructive/20" : ""}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`h-2 w-2 rounded-full ${p === "Emergency" ? "bg-destructive" : p === "High" ? "bg-warning" : p === "Medium" ? "bg-info" : "bg-success"}`} />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{p}</span>
            </div>
            <div className={`text-xl sm:text-2xl font-black ${p === "Emergency" && stats.byPriority[p] > 0 ? "text-destructive" : ""}`}>{stats.byPriority[p]}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search requests..." className="w-full rounded-2xl border border-border/60 bg-background/40 py-2.5 pl-10 pr-9 text-xs font-semibold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 min-h-[44px]" />
          {q && <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {PRIORITIES.map((p) => (
            <button key={p} onClick={() => setFilterPriority(filterPriority === p ? "" : p)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition min-h-[36px] ${filterPriority === p ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground hover:border-primary/40"}`}>{p}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={Siren} title="No requests" description={q || filterPriority ? "No requests match your filters." : "No emergency assistance requests yet."} /></Card>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {filtered.map((e) => (
            <Card key={e.id} className={`${e.priority === "Emergency" && e.status !== "Completed" ? "ring-2 ring-destructive/20" : ""}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{e.requester}</span>
                    <Badge tone={priorityTone[e.priority] || "info"} className="text-[9px]">{e.priority}</Badge>
                    <Badge tone={statusTone[e.status] || "warning"} className="text-[9px]">{e.status}</Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[10px] sm:text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">{e.type === "Medical" ? <HeartPulse className="h-3 w-3" /> : e.type === "Rescue" ? <Truck className="h-3 w-3" /> : <Package className="h-3 w-3" />} {e.type}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</span>
                    {e.contact && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {e.contact}</span>}
                  </div>
                  {e.description && <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{e.description}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                  {canManage && e.status !== "Completed" && (
                    <Button variant="outline" onClick={() => advanceStatus(e)} className="text-[10px] py-1.5 px-2 min-h-[32px]">
                      <ArrowRight className="h-3 w-3" /> {STATUSES[STATUSES.indexOf(e.status) + 1]}
                    </Button>
                  )}
                  {canManage && <button onClick={() => { setEditing(e); setOpen(true); }} className="rounded-full p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition min-h-[36px] min-w-[36px] flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button>}
                  {canManage && <button onClick={() => setDeleteTarget(e)} className="rounded-full p-2 text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition min-h-[36px] min-w-[36px] flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing?.id ? "Update Request" : isResident ? "Request Assistance" : "New Assistance Request"}>
        {editing && (
          <form onSubmit={save} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Select label="Type *" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                {TYPES.map((o) => <option key={o}>{o}</option>)}
              </Select>
              <Select label="Priority *" value={editing.priority} onChange={(e) => setEditing({ ...editing, priority: e.target.value })}>
                {PRIORITIES.map((o) => <option key={o}>{o}</option>)}
              </Select>
            </div>
            <Input label="Requester Name *" value={editing.requester} onChange={(e) => setEditing({ ...editing, requester: e.target.value })} />
            <Input label="Location / Address *" value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} />
            <Input label="Contact Number" value={editing.contact} onChange={(e) => setEditing({ ...editing, contact: e.target.value })} />
            <Textarea label="Details / Notes" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} />
            {editing.id && canManage && (
              <Select label="Status" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>{STATUSES.map((o) => <option key={o}>{o}</option>)}</Select>
            )}
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Save</Button></div>
          </form>
        )}
      </Modal>

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={remove} itemName={deleteTarget?.requester} message="Delete this emergency request permanently?" />
    </div>
  );
}
