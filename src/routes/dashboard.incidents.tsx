import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useSyncable, uid, canRole } from "../lib/store";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Badge, Select, Textarea, Pagination } from "../components/ui-kit";
import { Shield, Plus, Search, X } from "lucide-react";
import { useAuth } from "../lib/auth";
import { pushNotification } from "../lib/notify";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/incidents")({ component: Page });

const TYPES = ["Theft", "Vandalism", "Noise", "Accident", "Disaster", "Medical", "Other"];
const FLOW = ["Submitted", "Under Review", "Verified", "Resolved"];
const STATUS_TABS = ["All", "Submitted", "Under Review", "Verified", "Resolved"];

interface I { id: string; type: string; description: string; location: string; status: string; reporter: string; createdAt: string; timeline: { at: string; status: string; note?: string }[] }

function Page() {
  const { user } = useAuth();
  const canManage = canRole(user?.role, "incidentsManage");
  const canReport = canRole(user?.role, "incidentsReport");
  const [items, setItems, updateItemsAndSync, refreshFromServer] = useSyncable<I[]>("incidents", [], { refreshInterval: 30000 });
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<I | null>(null);
  const [view, setView] = useState<I | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  useEffect(() => { setPage(1); }, [q, statusFilter]);

  useEffect(() => { refreshFromServer(); }, []);

  const filtered = useMemo(() => {
    let result = items;
    if (statusFilter !== "All") result = result.filter((i) => i.status === statusFilter);
    if (q.trim()) {
      const s = q.toLowerCase();
      result = result.filter((i) => i.type.toLowerCase().includes(s) || i.description.toLowerCase().includes(s) || i.location.toLowerCase().includes(s) || i.reporter.toLowerCase().includes(s));
    }
    return result;
  }, [items, q, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: items.length };
    FLOW.forEach((s) => { counts[s] = items.filter((i) => i.status === s).length; });
    return counts;
  }, [items]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || !draft.type || !draft.description) return toast.error("Fill required fields");
    const p: I = { ...draft, id: uid(), createdAt: new Date().toISOString(), status: "Submitted", reporter: user?.fullName || "Anonymous", timeline: [{ at: new Date().toISOString(), status: "Submitted" }] };
    void updateItemsAndSync([p, ...items]);
    pushNotification({ title: "Incident Reported", message: `${p.type} at ${p.location}`, type: "incident" });
    setOpen(false); toast.success("Incident submitted");
  };

  const advance = (i: I, status: string) => {
    updateItemsAndSync(items.map((x) => x.id === i.id ? { ...x, status, timeline: [...x.timeline, { at: new Date().toISOString(), status }] } : x));
  };

  if (!user || (user.role !== "super_admin" && user.role !== "captain" && user.role !== "disaster" && user.role !== "resident")) {
    return <Card><EmptyState icon={Shield} title="Access Restricted" description="You do not have permission to access Incident Reports." /></Card>;
  }

  return (
    <div>
      <PageHeader title="Incident Reports" subtitle="Track community-submitted incidents through resolution." action={
        canReport ? (
          <Button onClick={() => { setDraft({ id: "", type: "Theft", description: "", location: "", status: "Submitted", reporter: "", createdAt: "", timeline: [] }); setOpen(true); }}>
            <Plus className="h-4 w-4" /> Report Incident
          </Button>
        ) : undefined
      } />

      {/* Status Tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {STATUS_TABS.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border/50 hover:bg-muted"}`}>
            {s} <span className="ml-1 opacity-70">({statusCounts[s] || 0})</span>
          </button>
        ))}
      </div>

      <Card>
        {/* Search */}
        <div className="mb-4 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search incidents..." className="w-full rounded-2xl border border-border/60 bg-background/40 py-2.5 pl-10 pr-9 text-xs font-semibold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" />
          {q && <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Shield} title="No incidents reported" description={q || statusFilter !== "All" ? "No incidents match your filters." : "Submitted incidents will appear here for review."} />
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground tracking-wider"><tr><th className="py-2 font-semibold">Type</th><th className="font-semibold">Description</th><th className="font-semibold">Location</th><th className="font-semibold">Reporter</th><th className="font-semibold">Status</th><th className="font-semibold">Date</th><th /></tr></thead>
                <tbody className="divide-y divide-border/30">
                  {filtered.slice((page - 1) * pageSize, page * pageSize).map((i) => (
                    <tr key={i.id} className="hover:bg-primary/[0.02] transition">
                      <td className="py-3"><Badge>{i.type}</Badge></td>
                      <td className="max-w-[280px] truncate">{i.description}</td>
                      <td>{i.location}</td>
                      <td>{i.reporter}</td>
                      <td><Badge tone={i.status === "Resolved" ? "success" : i.status === "Verified" ? "info" : i.status === "Under Review" ? "warning" : "muted"}>{i.status}</Badge></td>
                      <td className="text-xs text-muted-foreground">{new Date(i.createdAt).toLocaleDateString()}</td>
                      <td className="text-right"><Button variant="outline" onClick={() => setView(i)}>View</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
              {filtered.slice((page - 1) * pageSize, page * pageSize).map((i) => (
                <div key={i.id} className="rounded-2xl border border-border/50 bg-background/30 p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge>{i.type}</Badge>
                      <div className="text-xs text-muted-foreground mt-1.5">{i.location}</div>
                    </div>
                    <Button variant="outline" onClick={() => setView(i)} className="px-3 py-1.5 text-xs rounded-xl">View</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs border-t border-border/20 pt-3">
                    <div className="col-span-2">
                      <div className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Description</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">{i.description || "—"}</div>
                    </div>
                    <div>
                      <div className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Reporter</div>
                      <div className="font-semibold">{i.reporter || "Anonymous"}</div>
                    </div>
                    <div>
                      <div className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Status</div>
                      <Badge tone={i.status === "Resolved" ? "success" : i.status === "Verified" ? "info" : "warning"}>{i.status}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination currentPage={page} totalPages={Math.max(1, Math.ceil(filtered.length / pageSize))} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Report Incident">
        {draft && (
          <form onSubmit={submit} className="space-y-3">
            <Select label="Type *" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</Select>
            <Input label="Location *" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
            <Textarea label="Description *" rows={4} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Submit</Button></div>
          </form>
        )}
      </Modal>

      <Modal open={!!view} onClose={() => setView(null)} title="Incident Timeline">
        {view && (
          <div className="space-y-3">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <div className="font-semibold">{view.type} · {view.location}</div>
              <p className="mt-1 text-muted-foreground">{view.description}</p>
              <div className="mt-1 text-xs text-muted-foreground">Reported by {view.reporter}</div>
            </div>
            <div>
              <div className="mb-2 text-sm font-medium">Timeline</div>
              <ol className="space-y-2 border-l-2 border-primary/20 pl-4">
                {view.timeline.map((t, idx) => (
                  <li key={idx} className="relative">
                    <span className={`absolute -left-[23px] top-1 h-3 w-3 rounded-full ${idx === view.timeline.length - 1 ? "bg-primary" : "bg-primary/40"}`} />
                    <div className="text-sm font-medium">{t.status}</div>
                    <div className="text-xs text-muted-foreground">{new Date(t.at).toLocaleString()}</div>
                    {t.note && <div className="text-xs text-muted-foreground mt-0.5 italic">{t.note}</div>}
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {canManage && FLOW.filter((s) => s !== view.status).map((s) => (
                <Button key={s} variant="outline" onClick={() => { advance(view, s); setView({ ...view, status: s, timeline: [...view.timeline, { at: new Date().toISOString(), status: s }] }); }}>Mark {s}</Button>
              ))}
              {!canManage && <p className="text-xs text-muted-foreground">Status is managed by administrators.</p>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
