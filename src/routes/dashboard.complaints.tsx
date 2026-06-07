import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useSyncable, uid, hasPermission, canRole } from "../lib/store";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Badge, Select, Textarea, Pagination, exportToCSV } from "../components/ui-kit";
import { Plus, Pencil, Trash2, Search, X, Scale, MessageSquare, UserCheck, Archive, ChevronRight, ArrowRight, Download } from "lucide-react";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { DeleteModal } from "../components/delete-modal";
import { pushNotification } from "../lib/notify";

export const Route = createFileRoute("/dashboard/complaints")({ component: Page });

const STATUSES = ["Open", "Assigned", "In Mediation", "Resolved", "Archived"] as const;
const STATUS_FLOW: Record<string, string> = { Open: "Assigned", Assigned: "In Mediation", "In Mediation": "Resolved" };

interface C { id: string; createdAt?: string; subject: string; complainant: string; respondent: string; description: string; assignedTo: string; status: string }

const statusTone: Record<string, "warning" | "info" | "danger" | "success" | "muted"> = {
  Open: "warning", Assigned: "info", "In Mediation": "danger", Resolved: "success", Archived: "muted",
};

function Page() {
  const { user } = useAuth();
  const canManage = user && hasPermission(user.role, "complaintsManage");
  const canFile = canRole(user?.role, "complaintsFile");
  const [items, setItems, updateItemsAndSync, refreshFromServer] = useSyncable<C[]>("complaints", [], { refreshInterval: 30000 });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<C | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<C | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => { refreshFromServer(); }, []);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of STATUSES) counts[s] = items.filter((c) => c.status === s).length;
    return { ...counts, total: items.length } as Record<string, number> & { total: number };
  }, [items]);

  const filtered = useMemo(() => {
    let result = items;
    if (q.trim()) {
      const s = q.toLowerCase();
      result = result.filter((r) => [r.subject, r.complainant, r.respondent, r.assignedTo].some((v) => v?.toLowerCase().includes(s)));
    }
    if (statusFilter) result = result.filter((r) => r.status === statusFilter);
    return result;
  }, [items, q, statusFilter]);

  if (!user) {
    return <Card><EmptyState title="Access Restricted" description="Please log in to access the Complaints module." /></Card>;
  }

  const advanceStatus = (c: C) => {
    const next = STATUS_FLOW[c.status];
    if (!next || !canManage) return;
    void updateItemsAndSync(items.map((x) => x.id === c.id ? { ...x, status: next } : x));
    toast.success(`Moved to ${next}`);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.subject) return toast.error("Subject required");
    const isNew = !editing.id;
    const p = isNew ? { ...editing, id: uid(), createdAt: new Date().toISOString(), status: "Open" } : editing;
    const next = isNew ? [p, ...items] : items.map((x) => x.id === p.id ? p : x);
    void updateItemsAndSync(next);
    if (isNew) {
      pushNotification({ title: "New Complaint Filed", message: `${p.subject} — ${p.complainant}`, type: "request" });
    }
    setOpen(false); toast.success(isNew ? "Complaint filed" : "Updated");
  };

  const remove = () => {
    if (!deleteTarget) return;
    void updateItemsAndSync(items.filter((x) => x.id !== deleteTarget.id));
    setDeleteTarget(null); toast.success("Deleted");
  };

  return (
    <div>
      <PageHeader title="Complaints" subtitle="Receive, assign, and resolve community complaints through mediation workflow." action={
        canFile ? <Button onClick={() => { setEditing({ id: "", subject: "", complainant: user?.fullName || "", respondent: "", description: "", assignedTo: "", status: "Open" }); setOpen(true); }}><Plus className="h-4 w-4" /> File Complaint</Button> : undefined
      } />

      <div className="grid gap-2 sm:gap-3 mb-4 sm:mb-6 grid-cols-2 sm:grid-cols-5">
        <button onClick={() => { setStatusFilter(""); setPage(1); }} className={`rounded-xl border border-border/40 bg-card/60 p-3 sm:p-4 text-left transition hover:bg-muted/40 ${!statusFilter ? "ring-2 ring-primary" : stats.total > 0 ? "ring-1 ring-primary/10" : ""}`}>
          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">All</div>
          <div className="text-xl sm:text-2xl font-black">{stats.total}</div>
        </button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => { setStatusFilter(statusFilter === s ? "" : s); setPage(1); }} className={`rounded-xl border border-border/40 bg-card/60 p-3 sm:p-4 text-left transition hover:bg-muted/40 ${statusFilter === s ? "ring-2 ring-primary" : stats[s] > 0 ? "ring-1 ring-primary/10" : ""}`}>
            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{s}</div>
            <div className="text-xl sm:text-2xl font-black">{stats[s]}</div>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search complaints..." className="w-full rounded-2xl border border-border/60 bg-background/40 py-2.5 pl-10 pr-9 text-xs font-semibold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 min-h-[44px]" />
          {q && <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
        </div>
        <Button variant="outline" onClick={() => exportToCSV(filtered, "complaints", { subject: "Subject", complainant: "Complainant", respondent: "Respondent", status: "Status", assignedTo: "Assigned To" })} className="min-h-[44px]">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={Scale} title="No complaints" description={q || statusFilter ? "No complaints match your filters." : "No complaints have been filed yet."} /></Card>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {filtered.slice((page - 1) * pageSize, page * pageSize).map((c) => (
            <Card key={c.id}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{c.subject}</span>
                    <Badge tone={statusTone[c.status] || "muted"} className="text-[9px]">{c.status}</Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[10px] sm:text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {c.complainant || "—"}</span>
                    <span className="flex items-center gap-1"><UserCheck className="h-3 w-3" /> {c.respondent || "—"}</span>
                    {c.assignedTo && <span className="flex items-center gap-1"><ArrowRight className="h-3 w-3" /> {c.assignedTo}</span>}
                  </div>
                  {c.description && <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{c.description}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                  {canManage && STATUS_FLOW[c.status] && (
                    <Button variant="outline" onClick={() => advanceStatus(c)} className="text-[10px] py-1.5 px-2 min-h-[32px]">
                      <ChevronRight className="h-3 w-3" /> {STATUS_FLOW[c.status]}
                    </Button>
                  )}
                  {canManage && <button onClick={() => { setEditing(c); setOpen(true); }} className="rounded-full p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition min-h-[36px] min-w-[36px] flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button>}
                  {canManage && <button onClick={() => setDeleteTarget(c)} className="rounded-full p-2 text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition min-h-[36px] min-w-[36px] flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Pagination currentPage={page} totalPages={Math.max(1, Math.ceil(filtered.length / pageSize))} onPageChange={setPage} />

      <Modal open={open} onClose={() => setOpen(false)} title={editing?.id ? "Update Complaint" : "File a Complaint"}>
        {editing && (
          <form onSubmit={save} className="space-y-3">
            <Input label="Subject *" value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Complainant" value={editing.complainant} onChange={(e) => setEditing({ ...editing, complainant: e.target.value })} readOnly={!canManage && !!editing.complainant} />
              <Input label="Respondent" value={editing.respondent} onChange={(e) => setEditing({ ...editing, respondent: e.target.value })} />
            </div>
            <Textarea label="Description" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} />
            {canManage && (
              <div className="grid grid-cols-2 gap-3">
                <Input label="Assigned To" value={editing.assignedTo} onChange={(e) => setEditing({ ...editing, assignedTo: e.target.value })} />
                {editing.id && (
                  <Select label="Status" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>{STATUSES.map((o) => <option key={o}>{o}</option>)}</Select>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Save</Button></div>
          </form>
        )}
      </Modal>

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={remove} itemName={deleteTarget?.subject} message="Delete this complaint permanently?" />
    </div>
  );
}
