import { createFileRoute } from "@tanstack/react-router";
import { useStored } from "../lib/store";
import { Card } from "../components/ui-kit";
import { Users, Home, AlertTriangle, FileText, HeartHandshake, Calendar, Bell, Activity } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { useAuth } from "../lib/auth";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

function Stat({ icon: Icon, label, value, tone }: any) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-1 text-3xl font-bold">{value}</div>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Overview() {
  const { user } = useAuth();
  const [residents] = useStored<any[]>("residents", []);
  const [households] = useStored<any[]>("households", []);
  const [incidents] = useStored<any[]>("incidents", []);
  const [alerts] = useStored<any[]>("alerts", []);
  const [requests] = useStored<any[]>("documents_req", []);
  const [volunteers] = useStored<any[]>("volunteers", []);
  const [events] = useStored<any[]>("events", []);

  // Population chart by gender
  const popData = ["Male", "Female", "Other"].map((g) => ({ name: g, value: residents.filter((r) => r.gender === g).length }));
  const COLORS = ["oklch(0.55 0.13 255)", "oklch(0.7 0.14 30)", "oklch(0.7 0.1 150)"];

  // Incident trend - by month last 6
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { key: d.toISOString().slice(0, 7), label: d.toLocaleString("en-PH", { month: "short" }) };
  });
  const incidentTrend = months.map((m) => ({
    month: m.label,
    incidents: incidents.filter((i) => (i.createdAt || "").startsWith(m.key)).length,
    alerts: alerts.filter((a) => (a.createdAt || "").startsWith(m.key)).length,
  }));
  const eventPart = events.slice(-6).map((e) => ({ name: e.title?.slice(0, 12) || "Event", attendees: (e.attendees || []).length }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Good day, {user?.fullName.split(" ")[0]}.</h1>
        <p className="text-sm text-muted-foreground">Here's what's happening across the barangay.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Residents" value={residents.length} tone="bg-primary/10 text-primary" />
        <Stat icon={Home} label="Households" value={households.length} tone="bg-info/10 text-info" />
        <Stat icon={AlertTriangle} label="Active Alerts" value={alerts.filter((a) => a.status !== "resolved").length} tone="bg-destructive/10 text-destructive" />
        <Stat icon={Activity} label="Open Incidents" value={incidents.filter((i) => i.status !== "Resolved").length} tone="bg-warning/20 text-warning-foreground" />
        <Stat icon={FileText} label="Document Requests" value={requests.length} tone="bg-accent/20 text-accent-foreground" />
        <Stat icon={HeartHandshake} label="Volunteers" value={volunteers.length} tone="bg-success/15 text-success" />
        <Stat icon={Calendar} label="Events" value={events.length} tone="bg-primary/10 text-primary" />
        <Stat icon={Bell} label="Notifications" value={0} tone="bg-muted text-muted-foreground" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-3 font-semibold">Incident & Alert Trend</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={incidentTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} allowDecimals={false} />
                <Tooltip /><Legend />
                <Line type="monotone" dataKey="incidents" stroke="oklch(0.6 0.22 27)" strokeWidth={2} />
                <Line type="monotone" dataKey="alerts" stroke="oklch(0.55 0.13 255)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <div className="mb-3 font-semibold">Population by Gender</div>
          {residents.length === 0 ? (
            <div className="grid h-64 place-items-center text-sm text-muted-foreground">No resident data yet</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={popData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                    {popData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
        <Card className="lg:col-span-3">
          <div className="mb-3 font-semibold">Event Participation</div>
          {eventPart.length === 0 ? (
            <div className="grid h-48 place-items-center text-sm text-muted-foreground">No event data yet</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={eventPart}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} allowDecimals={false} /><Tooltip />
                  <Bar dataKey="attendees" fill="oklch(0.55 0.13 255)" radius={6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
