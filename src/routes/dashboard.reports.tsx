import { createFileRoute } from "@tanstack/react-router";
import { useStored, withToken } from "../lib/store";
import { Button, Card, PageHeader, EmptyState } from "../components/ui-kit";
import { Download, Printer, FileDown, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { getTableData } from "../lib/api/auth.functions";

export const Route = createFileRoute("/dashboard/reports")({ component: Page });

function toCSV(rows: any[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

function downloadCSV(name: string, content: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function Page() {
  const { user } = useAuth();
  
  if (!user || (user.role !== "super_admin" && user.role !== "captain")) {
    return (
      <Card>
        <EmptyState title="Access Restricted" description="Only System Administrator and Barangay Captain accounts can access reports." />
      </Card>
    );
  }

  const [residents, setResidents] = useStored<any[]>("residents", []);
  const [incidents, setIncidents] = useStored<any[]>("incidents", []);
  const [events, setEvents] = useStored<any[]>("events", []);
  const [alerts, setAlerts] = useStored<any[]>("alerts", []);
  
  const [activePrint, setActivePrint] = useState<"residents" | "incidents" | "events" | "alerts" | null>(null);

  useEffect(() => {
    const syncTable = async (key: string, setter: (val: any[]) => void) => {
      try {
        const data = await getTableData({ data: withToken({ table: key }) });
        if (data && Array.isArray(data)) setter(data);
      } catch (err) {
        console.warn(`Failed to sync ${key} for reports:`, err);
      }
    };
    void syncTable("residents", setResidents);
    void syncTable("incidents", setIncidents);
    void syncTable("events", setEvents);
    void syncTable("alerts", setAlerts);
  }, []);

  const getAge = (birthdate: string) => {
    if (!birthdate) return "—";
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handlePrint = (type: "residents" | "incidents" | "events" | "alerts") => {
    setActivePrint(type);
    toast.info("Preparing print spooler...");
    setTimeout(() => {
      window.print();
      setActivePrint(null);
    }, 300);
  };

  const sets = [
    { key: "residents", label: "Demographic Resident Registry", rows: residents },
    { key: "incidents", label: "Community Incident & Security Logs", rows: incidents },
    { key: "events", label: "Barangay Projects & Events Log", rows: events },
    { key: "alerts", label: "Critical Disaster Alert Logs", rows: alerts },
  ];

  return (
    <div className="relative">
      
      {/* On-Screen Dashboard View (Hidden during Print) */}
      <div className={activePrint ? "print:hidden" : "space-y-6 print:hidden"}>
        <PageHeader title="Barangay Reports" subtitle="Export data summaries, print reports, or generate official PDFs." />
        
        <div className="grid gap-6 md:grid-cols-2">
          {sets.map((s) => (
            <Card key={s.key} className="flex flex-col justify-between p-6">
              <div className="flex items-start justify-between border-b border-border/30 pb-4 mb-4">
                <div>
                  <div className="font-extrabold text-slate-800 dark:text-slate-200">{s.label}</div>
                  <div className="text-xs text-muted-foreground mt-1 uppercase font-bold tracking-wider">{s.rows.length} Records</div>
                </div>
                <span className="flex h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button 
                  onClick={() => downloadCSV(`${s.key}-${Date.now()}.csv`, toCSV(s.rows))} 
                  disabled={!s.rows.length}
                  className="flex-1"
                  variant="outline"
                >
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
                <Button 
                  onClick={() => handlePrint(s.key as any)} 
                  disabled={!s.rows.length}
                  className="flex-1"
                >
                  <Printer className="h-4 w-4" /> Save / Print PDF
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Printable Document Overlay (Only visible during Print) */}
      {activePrint && (
        <div className="hidden print:block font-sans text-black bg-white p-8">
          
          {/* LGU Official Header */}
          <div className="text-center mb-8">
            <div className="text-xs uppercase tracking-widest font-semibold text-gray-600">Republic of the Philippines</div>
            <div className="text-sm font-semibold text-gray-800">Province of Catanduanes · Municipality of Bato</div>
            <h1 className="text-2xl font-black mt-1 text-slate-900">Barangay Cagraray</h1>
            <p className="text-[10px] font-mono tracking-widest text-gray-500 mt-1.5 uppercase">Barangay Management System · Official Reports</p>
            <hr className="my-5 border-t-2 border-slate-900 border-double" />
          </div>

          {/* Report Metadata */}
          <div className="flex justify-between items-end border-b border-gray-300 pb-4 mb-6 text-xs text-gray-700">
            <div>
              <div><strong>Document Classification:</strong> Official Report</div>
              <div className="mt-1"><strong>Report Scope:</strong> {activePrint.toUpperCase()} RECORDS</div>
            </div>
            <div className="text-right">
              <div><strong>Compiled On:</strong> {new Date().toLocaleDateString("en-PH", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div className="mt-1"><strong>Status:</strong> Active</div>
            </div>
          </div>

          {/* 1. Residents Print View */}
          {activePrint === "residents" && (
            <div className="space-y-4">
              <h2 className="text-base font-bold uppercase tracking-wider text-gray-900">Demographic Residents Registry Table</h2>
              <table className="w-full text-xs text-left border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th className="p-2 border-r border-gray-300">Resident Name</th>
                    <th className="p-2 border-r border-gray-300">Age</th>
                    <th className="p-2 border-r border-gray-300">Gender</th>
                    <th className="p-2 border-r border-gray-300">Civil Status</th>
                    <th className="p-2 border-r border-gray-300">Contact Number</th>
                    <th className="p-2 border-r border-gray-300">Address</th>
                    <th className="p-2 border-r border-gray-300">Occupation</th>
                    <th className="p-2">PWD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {residents.map((r, i) => (
                    <tr key={r.id || i} className="border-b border-gray-200">
                      <td className="p-2 border-r border-gray-300 font-semibold">{r.fullName}</td>
                      <td className="p-2 border-r border-gray-300">{getAge(r.birthdate)}</td>
                      <td className="p-2 border-r border-gray-300">{r.gender || "—"}</td>
                      <td className="p-2 border-r border-gray-300">{r.civilStatus || "—"}</td>
                      <td className="p-2 border-r border-gray-300">{r.contact || "—"}</td>
                      <td className="p-2 border-r border-gray-300">{r.address || "—"}</td>
                      <td className="p-2 border-r border-gray-300">{r.occupation || "—"}</td>
                      <td className="p-2">{r.isPwd || "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. Incidents Print View */}
          {activePrint === "incidents" && (
            <div className="space-y-4">
              <h2 className="text-base font-bold uppercase tracking-wider text-gray-900">Incident & Community Action logs</h2>
              <table className="w-full text-xs text-left border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th className="p-2 border-r border-gray-300">Incident Type</th>
                    <th className="p-2 border-r border-gray-300">Priority</th>
                    <th className="p-2 border-r border-gray-300">Requester</th>
                    <th className="p-2 border-r border-gray-300">Location</th>
                    <th className="p-2 border-r border-gray-300">Action Status</th>
                    <th className="p-2 border-r border-gray-300">Report Date</th>
                    <th className="p-2">Details Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {incidents.map((inc, i) => (
                    <tr key={inc.id || i} className="border-b border-gray-200">
                      <td className="p-2 border-r border-gray-300 font-semibold">{inc.type}</td>
                      <td className="p-2 border-r border-gray-300">{inc.reporter || "—"}</td>
                      <td className="p-2 border-r border-gray-300">{inc.location || "—"}</td>
                      <td className="p-2 border-r border-gray-300">{inc.status || "—"}</td>
                      <td className="p-2 border-r border-gray-300">{inc.createdAt ? new Date(inc.createdAt).toLocaleDateString() : "—"}</td>
                      <td className="p-2">{inc.description || "No detail log provided"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. Events Print View */}
          {activePrint === "events" && (
            <div className="space-y-4">
              <h2 className="text-base font-bold uppercase tracking-wider text-gray-900">Barangay Projects & Assembly Logs</h2>
              <table className="w-full text-xs text-left border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th className="p-2 border-r border-gray-300">Project/Event Title</th>
                    <th className="p-2 border-r border-gray-300">Assembly Location</th>
                    <th className="p-2 border-r border-gray-300">Schedule Date</th>
                    <th className="p-2 border-r border-gray-300">Sector Focus</th>
                    <th className="p-2">Attendees Registry Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {events.map((e, i) => (
                    <tr key={e.id || i} className="border-b border-gray-200">
                      <td className="p-2 border-r border-gray-300 font-semibold">{e.title}</td>
                      <td className="p-2 border-r border-gray-300">{e.location || "—"}</td>
                      <td className="p-2 border-r border-gray-300">{e.date || "—"}</td>
                      <td className="p-2 border-r border-gray-300">{e.category || "General"}</td>
                      <td className="p-2">{(e.attendees || []).length} Residents Registered</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. Disaster Alerts Print View */}
          {activePrint === "alerts" && (
            <div className="space-y-4">
              <h2 className="text-base font-bold uppercase tracking-wider text-gray-900">Disaster Broadcast Alerts Table</h2>
              <table className="w-full text-xs text-left border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th className="p-2 border-r border-gray-300">Alert Category</th>
                    <th className="p-2 border-r border-gray-300">Alert Severity</th>
                    <th className="p-2 border-r border-gray-300">Title Details</th>
                    <th className="p-2 border-r border-gray-300">Creation Date</th>
                    <th className="p-2">Resolution Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {alerts.map((a, i) => (
                    <tr key={a.id || i} className="border-b border-gray-200">
                      <td className="p-2 border-r border-gray-300 font-semibold">{a.type}</td>
                      <td className="p-2 border-r border-gray-300">{a.level || "—"}</td>
                      <td className="p-2 border-r border-gray-300">{a.title || "—"}</td>
                      <td className="p-2 border-r border-gray-300">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "—"}</td>
                      <td className="p-2">{a.status || "active"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Signatures & Footer stamp */}
          <div className="mt-20 flex justify-between items-start text-xs">
            <div>
              <div className="w-64 border-t border-black pt-1.5 text-center">
                <strong>Certified Report by</strong>
                <div className="text-gray-500 mt-0.5 font-mono">eCagraray System</div>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block w-64 border-t border-black pt-1.5 text-center">
                <strong>Punong Barangay / Secretario</strong>
                <div className="text-gray-500 mt-0.5">Official Signature Authorization</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
