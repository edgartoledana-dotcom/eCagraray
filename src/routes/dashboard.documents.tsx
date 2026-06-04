import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStored, uid, getItem, canRole } from "../lib/store";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Badge, Select, Textarea } from "../components/ui-kit";
import { FileText, Plus, Printer } from "lucide-react";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/documents")({ component: Page });

const SERVICES = ["Barangay Clearance","Residency Certificate","Indigency Certificate"];
const FLOW = ["Pending","Reviewing","Approved","Rejected","Released"];

interface R { id: string; service: string; requester: string; purpose: string; status: string; createdAt: string }

function Page() {
  const { user } = useAuth();
  const canManage = canRole(user?.role, "documentsReview");
  const [items, setItems] = useStored<R[]>("documents_req", []);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<R | null>(null);
  const [print, setPrint] = useState<R | null>(null);
  const info = getItem<any>("barangay", {});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || !draft.service || !draft.purpose) return toast.error("Required");
    const p: R = { ...draft, id: uid(), createdAt: new Date().toISOString(), status: "Pending", requester: user?.fullName || "Resident" };
    setItems([p, ...items]); setOpen(false); toast.success("Request submitted");
  };

  return (
    <div>
      <PageHeader title="Document Requests" subtitle="Issue official barangay documents online." action={
        <Button onClick={() => { setDraft({ id:"", service:"Barangay Clearance", requester:"", purpose:"", status:"Pending", createdAt:"" }); setOpen(true); }}>
          <Plus className="h-4 w-4" /> New Request
        </Button>
      } />
      <Card>
        {items.length === 0 ? (
          <EmptyState icon={FileText} title="No document requests yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">Service</th><th>Requester</th><th>Purpose</th><th>Status</th><th>Date</th><th /></tr></thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{r.service}</td>
                    <td>{r.requester}</td>
                    <td className="max-w-[240px] truncate">{r.purpose}</td>
                    <td>
                      {canManage ? (
                      <Select value={r.status} onChange={(e) => setItems(items.map((x) => x.id === r.id ? { ...x, status: e.target.value } : x))}>
                        {FLOW.map((s) => <option key={s}>{s}</option>)}
                      </Select>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium">{r.status}</span>
                    )}
                    </td>
                    <td className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="text-right"><Button variant="outline" onClick={() => setPrint(r)} disabled={r.status !== "Released" && r.status !== "Approved"}><Printer className="h-4 w-4" /> Print</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Request Document">
        {draft && (
          <form onSubmit={submit} className="space-y-3">
            <Select label="Service *" value={draft.service} onChange={(e) => setDraft({ ...draft, service: e.target.value })}>{SERVICES.map((s) => <option key={s}>{s}</option>)}</Select>
            <Textarea label="Purpose *" rows={3} value={draft.purpose} onChange={(e) => setDraft({ ...draft, purpose: e.target.value })} />
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Submit</Button></div>
          </form>
        )}
      </Modal>

      {print && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/60 p-4 no-print" onClick={() => setPrint(null)}>
          <div onClick={(e) => e.stopPropagation()} className="mx-auto max-w-2xl bg-white text-black">
            <div className="no-print flex justify-end gap-2 p-4">
              <Button variant="outline" onClick={() => setPrint(null)}>Close</Button>
              <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
            </div>
            <div className="p-12">
              <div className="text-center">
                <div className="text-xs uppercase tracking-widest">Republic of the Philippines</div>
                <div className="text-sm">Province of {info.province} · Municipality of {info.municipality}</div>
                <div className="mt-1 text-xl font-bold">{info.name}</div>
                <hr className="my-4 border-black" />
                <div className="text-2xl font-bold uppercase tracking-wide">{print.service}</div>
              </div>
              <p className="mt-10 leading-7">
                TO WHOM IT MAY CONCERN:<br /><br />
                This is to certify that <b className="underline">{print.requester}</b> is a known resident of {info.name}, {info.municipality}, {info.province}.
                <br /><br />
                This certification is issued upon the request of the above-named person for the purpose of: <b>{print.purpose}</b>.
                <br /><br />
                Issued this {new Date().toLocaleDateString("en-PH", { day: "numeric", month: "long", year: "numeric" })} at {info.name}.
              </p>
              <div className="mt-20 text-right">
                <div className="inline-block w-64 border-t border-black pt-1 text-center">
                  <div className="font-bold">{info.captain || "Punong Barangay"}</div>
                  <div className="text-xs">Punong Barangay</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
