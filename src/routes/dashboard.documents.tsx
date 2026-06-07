import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useSyncable, uid, getItem, canRole, withToken } from "../lib/store";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Badge, Select, Textarea, Pagination, exportToCSV } from "../components/ui-kit";
import { FileText, Plus, Printer, Archive, Trash2, Download, Search } from "lucide-react";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { getTableData } from "../lib/api/auth.functions";
import { DeleteModal } from "../components/delete-modal";
import { pushNotification } from "../lib/notify";

export const Route = createFileRoute("/dashboard/documents")({ component: Page });

const SERVICES = ["Barangay Clearance","Residency Certificate","Indigency Certificate","Business Permit"];
const FLOW = ["Pending","Reviewing","Approved","Rejected","Released"];

interface R { id: string; service: string; requester: string; purpose: string; status: string; createdAt: string; archived?: boolean; }

const DEFAULT_OFFICIALS = [
  { id: "1", name: "Joseph D. Torrepalma", role: "Punong Barangay (Barangay Captain)", committee: "Overall Community Head" },
  { id: "2", name: "Renante T. Tenerife", role: "Barangay Kagawad (Councilor)", committee: "Committee on Finance, Budget and Appropriation" },
  { id: "3", name: "Marilyn C. Toledana", role: "Barangay Kagawad (Councilor)", committee: "Committee on Education and VAWC" },
  { id: "4", name: "Nick Cyril G. Solo", role: "Barangay Kagawad (Councilor)", committee: "Committee on Infrastructure and Public Works" },
  { id: "5", name: "Rafael T. Tatel", role: "Barangay Kagawad (Councilor)", committee: "Committee on Peace and Order" },
  { id: "6", name: "Melchor C. Bernal", role: "Barangay Kagawad (Councilor)", committee: "Committee on Disaster Risk Reduction and Management" },
  { id: "7", name: "Regie Boy S. Torrepalma", role: "Barangay Kagawad (Councilor)", committee: "Committee on Agriculture and Livelihood" },
  { id: "8", name: "Rosemarie T. Torrepalma", role: "Barangay Kagawad (Councilor)", committee: "Committee on Health and Sanitation" },
  { id: "9", name: "Jean D. Templonuevo", role: "Barangay Kagawad (Councilor)", committee: "Committee on Youth and Sports Development" },
  { id: "10", name: "Racquel V. Tatel", role: "Barangay Treasurer", committee: "Financial Records & Logistics" },
  { id: "11", name: "Angelene T. Tazarra", role: "Barangay Secretary", committee: "Administration & Records Management" },
];

function Page() {
  const { user } = useAuth();
  const canManage = canRole(user?.role, "documentsReview");
  const [items, setItems, updateItemsAndSync, refreshFromServer] = useSyncable<R[]>("documents_req", [], { refreshInterval: 30000 });
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<R | null>(null);
  const [print, setPrint] = useState<R | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<R | null>(null);
  const [viewArchived, setViewArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [officials, setOfficials] = useState<any[]>(DEFAULT_OFFICIALS);
  const info = getItem<any>("barangay", {});
  const [orNumbers, setOrNumbers] = useState<Record<string, string>>({});

  useEffect(() => {
    refreshFromServer();
    getTableData({ data: withToken({ table: "officials" }) })
      .then((serverData) => {
        if (serverData && Array.isArray(serverData) && serverData.length > 0) {
          setOfficials(serverData);
        }
      })
      .catch((err) => console.warn("Could not sync load officials:", err));
  }, []);

  useEffect(() => {
    if (print && !orNumbers[print.id]) {
      setOrNumbers((prev) => ({ ...prev, [print.id]: "9320" + Math.floor(1000 + Math.random() * 9000) }));
    }
  }, [print, orNumbers]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || !draft.service || !draft.purpose) return toast.error("Required");
    const p: R = { ...draft, id: uid(), createdAt: new Date().toISOString(), status: "Pending", requester: user?.fullName || "Resident" };
    const nextItems = [p, ...items];
    void updateItemsAndSync(nextItems);
    pushNotification({ title: "Document Request", message: `${p.service} — ${p.requester}`, type: "request" });
    setOpen(false); toast.success("Request submitted");
  };

  const archiveApproved = () => {
    const next = items.map((r) => {
      if ((r.status === "Approved" || r.status === "Released" || r.status === "Rejected") && !r.archived) {
        return { ...r, archived: true };
      }
      return r;
    });
    const changed = next.filter((r: any) => r.archived).length - items.filter((r: any) => r.archived).length;
    if (changed === 0) return toast.error("No completed requests to archive");
    void updateItemsAndSync(next);
    toast.success(`${changed} request(s) archived`);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const next = items.filter((r) => r.id !== deleteTarget.id);
    void updateItemsAndSync(next);
    setDeleteTarget(null);
    toast.success("Request deleted");
  };

  const filteredItems = useMemo(() => {
    const base = viewArchived ? items.filter((r: any) => r.archived) : items.filter((r: any) => !r.archived);
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter((r: any) =>
      (r.service || "").toLowerCase().includes(q) ||
      (r.requester || "").toLowerCase().includes(q) ||
      (r.purpose || "").toLowerCase().includes(q) ||
      (r.status || "").toLowerCase().includes(q),
    );
  }, [items, viewArchived, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const activeItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  const captain = officials.find(o => o.role.toLowerCase().includes("captain") || o.role.toLowerCase().includes("punong barangay")) || DEFAULT_OFFICIALS[0];
  const councilors = officials.filter(o => !o.role.toLowerCase().includes("captain") && !o.role.toLowerCase().includes("punong barangay") && !o.role.toLowerCase().includes("treasurer") && !o.role.toLowerCase().includes("secretary"));
  const treasurer = officials.find(o => o.role.toLowerCase().includes("treasurer")) || DEFAULT_OFFICIALS[9];
  const secretary = officials.find(o => o.role.toLowerCase().includes("secretary")) || DEFAULT_OFFICIALS[10];

  if (!user || (user.role !== "super_admin" && user.role !== "secretary" && user.role !== "resident")) {
    return <Card><EmptyState icon={FileText} title="Access Restricted" description="You do not have permission to access Documents." /></Card>;
  }

  return (
    <div>
      <PageHeader title="Document Requests" subtitle="Issue official barangay documents online." action={
        <div className="flex flex-wrap gap-2">
          {canManage && (
            <Button variant="outline" onClick={archiveApproved} className="min-h-[44px]">
              <Archive className="h-4 w-4" /> Archive
            </Button>
          )}
          <Button onClick={() => { setDraft({ id:"", service:"Barangay Clearance", requester:"", purpose:"", status:"Pending", createdAt:"" }); setOpen(true); }} className="min-h-[44px]">
            <Plus className="h-4 w-4" /> New Request
          </Button>
        </div>
      } />
      <div className="flex flex-wrap gap-2 mb-3">
        <button onClick={() => { setViewArchived(false); setPage(1); }} className={`px-3 sm:px-4 py-2.5 sm:py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition min-h-[44px] ${!viewArchived ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>Active Requests</button>
        <button onClick={() => { setViewArchived(true); setPage(1); }} className={`px-3 sm:px-4 py-2.5 sm:py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition min-h-[44px] ${viewArchived ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>History ({items.filter((r: any) => r.archived).length})</button>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by service, requester, purpose..."
            className="w-full rounded-xl border border-border/60 bg-background/50 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => exportToCSV(filteredItems, `documents-${viewArchived ? "history" : "active"}`, { service: "Service", requester: "Requester", purpose: "Purpose", status: "Status", createdAt: "Date" })}
          className="min-h-[44px]"
        >
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>
      <Card>
        {activeItems.length === 0 ? (
          <EmptyState icon={FileText} title={viewArchived ? "No archived requests" : "No document requests yet"} />
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">Service</th><th>Requester</th><th>Purpose</th><th>Status</th><th>Date</th><th /></tr></thead>
                <tbody>
                  {activeItems.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{r.service}</td>
                      <td>{r.requester}</td>
                      <td className="max-w-[240px] truncate">{r.purpose}</td>
                      <td>
                        {canManage && !viewArchived ? (
                          <Select value={r.status} onChange={(e) => updateItemsAndSync(items.map((x) => x.id === r.id ? { ...x, status: e.target.value } : x))}>
                            {FLOW.map((s) => <option key={s}>{s}</option>)}
                          </Select>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium">{r.status}</span>
                        )}
                      </td>
                      <td className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="text-right">
                        <div className="inline-flex gap-1">
                          <Button variant="outline" onClick={() => setPrint(r)} disabled={r.status !== "Released" && r.status !== "Approved"}><Printer className="h-4 w-4" /> Print</Button>
                          {viewArchived && canManage && (
                            <button onClick={() => setDeleteTarget(r)} className="rounded-full p-2 text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition" title="Delete">
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
              {activeItems.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border/50 bg-background/30 p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-extrabold text-sm text-foreground">{r.service}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Requested by {r.requester}</div>
                    </div>
                    <div className="flex gap-1.5">
                      {viewArchived && canManage && (
                        <button onClick={() => setDeleteTarget(r)} className="rounded-xl p-2.5 text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition min-h-[44px] min-w-[44px] flex items-center justify-center" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <Button variant="outline" onClick={() => setPrint(r)} disabled={r.status !== "Released" && r.status !== "Approved"} className="px-3 py-2 text-xs rounded-xl min-h-[44px]">
                        <Printer className="h-3.5 w-3.5" /> Print
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs border-t border-border/20 pt-3">
                    <div className="col-span-2">
                      <div className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Purpose</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{r.purpose || "—"}</div>
                    </div>
                    <div>
                      <div className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Request Date</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-250">{new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Approval Status</div>
                      <div className="mt-0.5">
                        {canManage && !viewArchived ? (
                          <Select value={r.status} onChange={(e) => updateItemsAndSync(items.map((x) => x.id === r.id ? { ...x, status: e.target.value } : x))} className="px-2 py-1 text-xs rounded-xl h-7.5">
                            {FLOW.map((s) => <option key={s}>{s}</option>)}
                          </Select>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-border/50">{r.status}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </Card>

      <DeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        itemName={deleteTarget?.service}
        message="Delete this document request permanently?"
      />

      <Modal open={open} onClose={() => setOpen(false)} title="Request Document">
        {draft && (
          <form onSubmit={submit} className="space-y-3">
            <Select label="Service *" value={draft.service} onChange={(e) => setDraft({ ...draft, service: e.target.value })}>{SERVICES.map((s) => <option key={s}>{s}</option>)}</Select>
            <Textarea label="Purpose *" rows={3} value={draft.purpose} onChange={(e) => setDraft({ ...draft, purpose: e.target.value })} />
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Submit</Button></div>
          </form>
        )}
      </Modal>

      {print && (() => {
        if (!orNumbers[print.id]) return null;
        const d = new Date(print.createdAt || Date.now());
        const day = d.getDate();
        const daySuffix = (day: number) => {
          if (day > 3 && day < 21) return 'th';
          switch (day % 10) {
            case 1:  return "st";
            case 2:  return "nd";
            case 3:  return "rd";
            default: return "th";
          }
        };
        const month = d.toLocaleString("en-US", { month: "long" });
        const year = d.getFullYear();
        const dateFormatted = `${month} ${day}, ${year}`;
        const orNo = orNumbers[print.id];

        return (
          <div className="fixed inset-0 z-50 overflow-auto bg-black/60 p-2 sm:p-4 no-print" onClick={() => setPrint(null)}>
            <div onClick={(e) => e.stopPropagation()} className="mx-auto max-w-4xl bg-white text-black shadow-2xl rounded-xl">
              <div className="no-print flex justify-end gap-2 p-3 sm:p-4 border-b border-gray-100">
                <Button variant="outline" onClick={() => setPrint(null)}>Close</Button>
                <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> Print Document</Button>
              </div>
              <div className="p-4 sm:p-8 font-serif text-[10px] sm:text-[12px] leading-relaxed text-black bg-white select-text">
                {/* LGU Official Header */}
                <div className="flex items-center justify-between gap-4 mb-3">
                  {/* Left Seal SVG */}
                  <div className="shrink-0 text-slate-800">
                    <svg className="h-16 w-16" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                      <circle cx="50" cy="50" r="45" strokeWidth="2"/>
                      <circle cx="50" cy="50" r="38" strokeWidth="1" strokeDasharray="2,2"/>
                      <text x="50" y="24" textAnchor="middle" fontSize="6.5" stroke="none" fill="currentColor" fontWeight="bold">BARANGAY CAGRARAY</text>
                      <text x="50" y="82" textAnchor="middle" fontSize="6.5" stroke="none" fill="currentColor" fontWeight="bold">BATO, CATANDUANES</text>
                      <path d="M25,60 C35,50 45,55 55,45 C65,35 75,42 75,55 L75,70 L25,70 Z" fill="currentColor" opacity="0.15" stroke="none"/>
                      <line x1="20" y1="70" x2="80" y2="70" strokeWidth="1.5"/>
                      <line x1="25" y1="73" x2="75" y2="73" strokeWidth="1"/>
                    </svg>
                  </div>

                  <div className="text-center flex-1">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-700">Republic of the Philippines</div>
                    <div className="text-[10px] text-gray-800">Province of Catanduanes · Municipality of Bato</div>
                    <div className="text-sm font-bold uppercase text-gray-900">Barangay Cagraray</div>
                  </div>

                  {/* Right Seal SVG */}
                  <div className="shrink-0 text-slate-800">
                    <svg className="h-16 w-16" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                      <circle cx="50" cy="50" r="45" strokeWidth="2"/>
                      <circle cx="50" cy="50" r="38" strokeWidth="1" strokeDasharray="2,2"/>
                      <text x="50" y="24" textAnchor="middle" fontSize="6" stroke="none" fill="currentColor" fontWeight="bold">MUNICIPALITY OF BATO</text>
                      <text x="50" y="82" textAnchor="middle" fontSize="6" stroke="none" fill="currentColor" fontWeight="bold">OFFICIAL SEAL</text>
                      <rect x="42" y="45" width="16" height="18" strokeWidth="1.5"/>
                      <polygon points="50,33 38,45 62,45" strokeWidth="1.5"/>
                      <circle cx="50" cy="53" r="2" fill="currentColor" stroke="none"/>
                    </svg>
                  </div>
                </div>

                {/* Office Section */}
                <div className="text-center mb-4">
                  <div className="border-t border-black w-full my-1.5" />
                  <h2 className="text-sm font-black tracking-wide uppercase">OFFICE OF THE PUNONG BARANGAY</h2>
                  <div className="border-t-2 border-black border-double w-full my-1.5" />
                </div>

                {/* 2-Column Body Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-10 gap-3 sm:gap-4 mt-4 items-stretch">
                  {/* Left Column - Barangay Council (3 / 10 width) */}
                  <div className="sm:col-span-3 border border-black p-2.5 sm:p-3 text-center space-y-2 sm:space-y-3 text-[7px] sm:text-[8px] leading-tight">
                    <div className="font-extrabold uppercase text-[7.5px] sm:text-[8.5px] tracking-tight text-gray-900 border-b border-black/30 pb-1.5 mb-2">
                      Cagraray<br />Barangay Council
                    </div>

                    <div className="space-y-2 text-left pl-1">
                      {captain && (
                        <div className="text-center pr-1">
                          <div className="font-extrabold text-[9px] uppercase">{captain.name}</div>
                          <div className="text-gray-600 italic">Punong Barangay</div>
                        </div>
                      )}

                      {councilors.map((c) => (
                        <div key={c.id}>
                          <div className="font-bold uppercase">{c.name}</div>
                          <div className="text-[7.5px] text-gray-600 leading-none">{c.committee || c.role}</div>
                        </div>
                      ))}

                      <div className="border-t border-black/20 pt-2 space-y-2">
                        {treasurer && (
                          <div>
                            <div className="font-bold uppercase">{treasurer.name}</div>
                            <div className="text-gray-600 italic text-[7.5px]">Barangay Treasurer</div>
                          </div>
                        )}

                        {secretary && (
                          <div>
                            <div className="font-bold uppercase">{secretary.name}</div>
                            <div className="text-gray-600 italic text-[7.5px]">Barangay Secretary</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Certificate Body (7 / 10 width) */}
                  <div className="sm:col-span-7 border border-black p-3 sm:p-5 flex flex-col justify-between text-[9px] sm:text-[11px] leading-relaxed">
                    <div className="space-y-6">
                      <div className="text-center font-bold text-base uppercase tracking-wider underline mt-2 mb-6">
                        {print.service === "Residency Certificate" ? "CERTIFICATE OF RESIDENCY" : print.service.toUpperCase()}
                      </div>

                      <div className="font-extrabold uppercase tracking-wide border-b border-black/15 pb-1 text-[10px]">
                        TO WHOM IT MAY CONCERN:
                      </div>

                      <div className="space-y-4 text-justify indent-8 text-slate-800">
                        <p>
                          This is to certify that <span className="font-bold uppercase underline text-black">{print.requester}</span>, single/married/widowed, of legal age, is a permanent resident of Barangay Cagraray, Bato, Catanduanes.
                        </p>
                        <p>
                          Further certify that he/she has been residing in this barangay in good standing and is known to be of good moral character.
                        </p>
                        <p>
                          This certification is officially issued by this office upon the request of the above-named person for the purpose of: <span className="font-bold underline text-black">{print.purpose || "whatever legal purposes it may serve"}</span>.
                        </p>
                        <p className="indent-0">
                          Issued upon the request of the interested party this <span className="font-bold text-black">{day}{daySuffix(day)}</span> day of <span className="font-bold text-black">{month}</span>, <span className="font-bold text-black">{year}</span> at Barangay Cagraray, Bato, Catanduanes, Philippines.
                        </p>
                      </div>
                    </div>

                    <div className="mt-12 space-y-8">
                      {/* Approved By Signature Block */}
                      <div className="text-right pr-6">
                        <div className="inline-block text-left text-xs">
                          <div className="text-gray-700 mb-6">Approved by:</div>
                          <div className="relative">
                            {/* Simulated handwritten signature path */}
                            <svg className="absolute -top-7 left-2 h-10 w-24 text-blue-800 opacity-85" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M10,25 Q30,5 50,22 T90,15 M30,12 Q45,28 55,8" />
                            </svg>
                            <div className="font-extrabold uppercase text-[12px]">{captain?.name || info.captain || "JOSEPH D. TORREPALMA"}</div>
                            <div className="text-[10px] text-gray-600">Punong Barangay</div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Metadata Block */}
                      <div className="border-t border-black/20 pt-3 text-[9px] text-gray-700 leading-tight space-y-0.5 text-left">
                        <div>Paid under OR No: <span className="font-bold">{orNo}</span></div>
                        <div>Issued On: <span className="font-bold">{dateFormatted}</span></div>
                        <div>Issued at: <span className="font-bold uppercase">CAGRARAY, BATO, CATANDUANES</span></div>
                        <div className="italic mt-1 text-[8px] text-gray-500">(Note: Not Valid without O.R. No.)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
