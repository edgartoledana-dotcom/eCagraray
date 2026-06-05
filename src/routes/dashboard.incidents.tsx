import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStored, uid, canRole } from "../lib/store";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Badge, Select, Textarea } from "../components/ui-kit";
import { Shield, Plus } from "lucide-react";
import { useAuth } from "../lib/auth";
import { pushNotification } from "../lib/notify";
import { toast } from "sonner";
import { getTableData, saveTableData } from "../lib/api/auth.functions";

export const Route = createFileRoute("/dashboard/incidents")({ component: Page });

const TYPES = ["Theft","Vandalism","Noise","Accident","Disaster","Medical","Other"];
const FLOW = ["Submitted","Under Review","Verified","Resolved"];

interface I { id: string; type: string; description: string; location: string; status: string; reporter: string; createdAt: string; timeline: { at: string; status: string; note?: string }[] }

function Page() {
  const { user } = useAuth();
  const canManage = canRole(user?.role, "incidentsManage");
  const [items, setItems] = useStored<I[]>("incidents", []);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<I | null>(null);
  const [view, setView] = useState<I | null>(null);

  useEffect(() => {
    getTableData({ data: { table: "incidents" } })
      .then((serverData) => {
        if (serverData && Array.isArray(serverData)) {
          setItems(serverData as I[]);
        }
      })
      .catch((err) => console.warn("Could not sync load incidents:", err));
  }, []);

  const updateItemsAndSync = async (nextItems: I[]) => {
    setItems(nextItems);
    try {
      await saveTableData({ data: { table: "incidents", data: nextItems } });
    } catch (err) {
      console.error("Could not sync incidents on server:", err);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || !draft.type || !draft.description) return toast.error("Fill required fields");
    const p: I = { ...draft, id: uid(), createdAt: new Date().toISOString(), status: "Submitted", reporter: user?.fullName || "Anonymous", timeline: [{ at: new Date().toISOString(), status: "Submitted" }] };
    const nextItems = [p, ...items];
    void updateItemsAndSync(nextItems);
    pushNotification({ title: "Incident Reported", message: `${p.type} at ${p.location}`, type: "incident" });
    setOpen(false); toast.success("Incident submitted");
  };

  const advance = (i: I, status: string) => {
    updateItemsAndSync(items.map((x) => x.id === i.id ? { ...x, status, timeline: [...x.timeline, { at: new Date().toISOString(), status }] } : x));
  };

  return (
    <div>
      <PageHeader title="Incident Reports" subtitle="Track community-submitted incidents through resolution." action={
        <Button onClick={() => { setDraft({ id:"", type:"Theft", description:"", location:"", status:"Submitted", reporter:"", createdAt:"", timeline:[] }); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Report Incident
        </Button>
      } />
      <Card>
        {items.length === 0 ? (
          <EmptyState icon={Shield} title="No incidents reported" description="Submitted incidents will appear here for review." />
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">Type</th><th>Description</th><th>Location</th><th>Reporter</th><th>Status</th><th>Date</th><th /></tr></thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id} className="border-b last:border-0">
                      <td className="py-3"><Badge>{i.type}</Badge></td>
                      <td className="max-w-[280px] truncate">{i.description}</td>
                      <td>{i.location}</td>
                      <td>{i.reporter}</td>
                      <td><Badge tone={i.status === "Resolved" ? "success" : i.status === "Verified" ? "info" : "warning"}>{i.status}</Badge></td>
                      <td className="text-xs text-muted-foreground">{new Date(i.createdAt).toLocaleDateString()}</td>
                      <td className="text-right"><Button variant="outline" onClick={() => setView(i)}>View</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
              {items.map((i) => (
                <div key={i.id} className="rounded-2xl border border-border/50 bg-background/30 p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-extrabold text-sm text-foreground"><Badge>{i.type}</Badge></div>
                      <div className="text-xs text-muted-foreground mt-1.5">{i.location}</div>
                    </div>
                    <div>
                      <Button variant="outline" onClick={() => setView(i)} className="px-3 py-1.5 text-xs rounded-xl">View</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs border-t border-border/20 pt-3">
                    <div className="col-span-2">
                      <div className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Description</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">{i.description || "—"}</div>
                    </div>
                    <div>
                      <div className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Reporter</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{i.reporter || "Anonymous"}</div>
                    </div>
                    <div>
                      <div className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Incident Status</div>
                      <div className="mt-0.5">
                        <Badge tone={i.status === "Resolved" ? "success" : i.status === "Verified" ? "info" : "warning"}>{i.status}</Badge>
                      </div>
                    </div>
                    <div className="col-span-2 border-t border-border/10 pt-2">
                      <div className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Reported Date</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{new Date(i.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              <ol className="space-y-2 border-l pl-4">
                {view.timeline.map((t, idx) => (
                  <li key={idx} className="relative">
                    <span className="absolute -left-[22px] top-1 h-3 w-3 rounded-full bg-primary" />
                    <div className="text-sm font-medium">{t.status}</div>
                    <div className="text-xs text-muted-foreground">{new Date(t.at).toLocaleString()}</div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {FLOW.filter((s) => s !== view.status).map((s) => (
                <Button key={s} variant="outline" onClick={() => { advance(view, s); setView({ ...view, status: s, timeline: [...view.timeline, { at: new Date().toISOString(), status: s }] }); }}>Mark {s}</Button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
