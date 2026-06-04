import { createFileRoute } from "@tanstack/react-router";
import { useStored } from "../lib/store";
import { Button, Card, PageHeader } from "../components/ui-kit";
import { Download, Printer } from "lucide-react";

export const Route = createFileRoute("/dashboard/reports")({ component: Page });

function toCSV(rows: any[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

function download(name: string, content: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function Page() {
  const [residents] = useStored<any[]>("residents", []);
  const [incidents] = useStored<any[]>("incidents", []);
  const [events] = useStored<any[]>("events", []);
  const [alerts] = useStored<any[]>("alerts", []);

  const sets = [
    { key: "residents", label: "Resident Report", rows: residents },
    { key: "incidents", label: "Incident Report", rows: incidents },
    { key: "events", label: "Event Report", rows: events },
    { key: "alerts", label: "Disaster Report", rows: alerts },
  ];

  return (
    <div>
      <PageHeader title="Reports" subtitle="Generate and export operational reports." action={
        <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print page</Button>
      } />
      <div className="grid gap-4 md:grid-cols-2">
        {sets.map((s) => (
          <Card key={s.key}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{s.label}</div>
                <div className="text-sm text-muted-foreground">{s.rows.length} records</div>
              </div>
              <Button onClick={() => download(`${s.key}-${Date.now()}.csv`, toCSV(s.rows))} disabled={!s.rows.length}>
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
