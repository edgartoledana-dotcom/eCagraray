import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStored, uid, getItem, canRole } from "../lib/store";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Badge, Select, Textarea } from "../components/ui-kit";
import { FileText, Plus, Printer } from "lucide-react";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { getTableData, saveTableData } from "../lib/api/auth.functions";

export const Route = createFileRoute("/dashboard/documents")({ component: Page });

const SERVICES = ["Barangay Clearance","Residency Certificate","Indigency Certificate","Business Permit"];
const FLOW = ["Pending","Reviewing","Approved","Rejected","Released"];

interface R { id: string; service: string; requester: string; purpose: string; status: string; createdAt: string }

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
  const [items, setItems] = useStored<R[]>("documents_req", []);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<R | null>(null);
  const [print, setPrint] = useState<R | null>(null);
  const [officials, setOfficials] = useState<any[]>(DEFAULT_OFFICIALS);
  const info = getItem<any>("barangay", {});

  useEffect(() => {
    getTableData({ data: { table: "documents_req" } })
      .then((serverData) => {
        if (serverData && Array.isArray(serverData)) {
          setItems(serverData as R[]);
        }
      })
      .catch((err) => console.warn("Could not sync load documents_req:", err));

    getTableData({ data: { table: "officials" } })
      .then((serverData) => {
        if (serverData && Array.isArray(serverData) && serverData.length > 0) {
          setOfficials(serverData);
        }
      })
      .catch((err) => console.warn("Could not sync load officials:", err));
  }, []);

  const updateItemsAndSync = async (nextItems: R[]) => {
    setItems(nextItems);
    try {
      await saveTableData({ data: { table: "documents_req", data: nextItems } });
    } catch (err) {
      console.error("Could not sync documents_req on server:", err);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || !draft.service || !draft.purpose) return toast.error("Required");
    const p: R = { ...draft, id: uid(), createdAt: new Date().toISOString(), status: "Pending", requester: user?.fullName || "Resident" };
    const nextItems = [p, ...items];
    void updateItemsAndSync(nextItems);
    setOpen(false); toast.success("Request submitted");
  };

  const captain = officials.find(o => o.role.toLowerCase().includes("captain") || o.role.toLowerCase().includes("punong barangay")) || DEFAULT_OFFICIALS[0];
  const councilors = officials.filter(o => !o.role.toLowerCase().includes("captain") && !o.role.toLowerCase().includes("punong barangay") && !o.role.toLowerCase().includes("treasurer") && !o.role.toLowerCase().includes("secretary"));
  const treasurer = officials.find(o => o.role.toLowerCase().includes("treasurer")) || DEFAULT_OFFICIALS[9];
  const secretary = officials.find(o => o.role.toLowerCase().includes("secretary")) || DEFAULT_OFFICIALS[10];

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
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
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
                          <Select value={r.status} onChange={(e) => updateItemsAndSync(items.map((x) => x.id === r.id ? { ...x, status: e.target.value } : x))}>
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

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
              {items.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border/50 bg-background/30 p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-extrabold text-sm text-foreground">{r.service}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Requested by {r.requester}</div>
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        onClick={() => setPrint(r)}
                        disabled={r.status !== "Released" && r.status !== "Approved"}
                        className="px-3 py-1.5 text-xs rounded-xl"
                      >
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
                      <div className="font-semibold text-slate-800 dark:text-slate-250">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Approval Status</div>
                      <div className="mt-0.5">
                        {canManage ? (
                          <Select
                            value={r.status}
                            onChange={(e) => updateItemsAndSync(items.map((x) => x.id === r.id ? { ...x, status: e.target.value } : x))}
                            className="px-2 py-1 text-xs rounded-xl h-7.5"
                          >
                            {FLOW.map((s) => <option key={s}>{s}</option>)}
                          </Select>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-border/50">
                            {r.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
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

      {print && (() => {
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
        const orNo = "9320" + Math.floor(1000 + Math.random() * 9000);

        return (
          <div className="fixed inset-0 z-50 overflow-auto bg-black/60 p-4 no-print" onClick={() => setPrint(null)}>
            <div onClick={(e) => e.stopPropagation()} className="mx-auto max-w-4xl bg-white text-black shadow-2xl rounded-xl">
              <div className="no-print flex justify-end gap-2 p-4 border-b border-gray-100">
                <Button variant="outline" onClick={() => setPrint(null)}>Close</Button>
                <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> Print Document</Button>
              </div>
              <div className="p-8 font-serif text-[12px] leading-relaxed text-black bg-white select-text">
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
                <div className="grid grid-cols-10 gap-4 mt-4 items-stretch">
                  {/* Left Column - Barangay Council (3 / 10 width) */}
                  <div className="col-span-3 border border-black p-3 text-center space-y-3 text-[8px] leading-tight">
                    <div className="font-extrabold uppercase text-[8.5px] tracking-tight text-gray-900 border-b border-black/30 pb-1.5 mb-2">
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
                  <div className="col-span-7 border border-black p-5 flex flex-col justify-between text-[11px] leading-relaxed">
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
