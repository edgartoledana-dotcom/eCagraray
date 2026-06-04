import { createFileRoute, Link } from "@tanstack/react-router";
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

  const getRoleActions = () => {
    switch (user?.role) {
      case "super_admin":
      case "captain":
        return [
          { to: "/dashboard/documents", label: "Approve Documents", desc: "Review and sign clearance & indigency requests.", color: "bg-blue-500/10 text-blue-600 border-blue-200/50" },
          { to: "/dashboard/alerts", label: "Issue Disaster Alert", desc: "Send emergency weather warnings to residents.", color: "bg-red-500/10 text-red-600 border-red-200/50" },
          { to: "/dashboard/incidents", label: "Review Incidents", desc: "Track road blockage, utilities, or safety reports.", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200/50" },
          { to: "/dashboard/reports", label: "Barangay Reports", desc: "Analyze budget, demographics, and operations.", color: "bg-purple-500/10 text-purple-600 border-purple-200/50" },
        ];
      case "secretary":
        return [
          { to: "/dashboard/residents", label: "Register Resident", desc: "Add demographic records for new citizens.", color: "bg-green-500/10 text-green-600 border-green-200/50" },
          { to: "/dashboard/documents", label: "Process Documents", desc: "Draft clearances, certs, and indigency forms.", color: "bg-blue-500/10 text-blue-600 border-blue-200/50" },
          { to: "/dashboard/announcements", label: "Announce News", desc: "Broadcast assemblies, missions, or notices.", color: "bg-cyan-500/10 text-cyan-600 border-cyan-200/50" },
          { to: "/dashboard/households", label: "Manage Households", desc: "Map and group resident families by zone.", color: "bg-indigo-500/10 text-indigo-600 border-indigo-200/50" },
        ];
      case "sk_officer":
        return [
          { to: "/dashboard/events", label: "Schedule Sportsfest", desc: "Set location, rules, and details for events.", color: "bg-pink-500/10 text-pink-600 border-pink-200/50" },
          { to: "/dashboard/youth", label: "SK Youth Registry", desc: "Access the complete demographic list of youth.", color: "bg-purple-500/10 text-purple-600 border-purple-200/50" },
          { to: "/dashboard/volunteers", label: "Coordinate Volunteers", desc: "Recruit and assign young community assistants.", color: "bg-teal-500/10 text-teal-600 border-teal-200/50" },
          { to: "/dashboard/surveys", label: "Youth Opinion Polls", desc: "Collect data on youth preferences and needs.", color: "bg-orange-500/10 text-orange-600 border-orange-200/50" },
        ];
      case "disaster":
        return [
          { to: "/dashboard/alerts", label: "Broadcast Disaster Alert", desc: "Post real-time critical weather warnings.", color: "bg-red-500/10 text-red-600 border-red-200/50" },
          { to: "/dashboard/evacuation", label: "Evacuation Center Capacity", desc: "Monitor center logistics and occupants count.", color: "bg-amber-500/10 text-amber-600 border-amber-200/50" },
          { to: "/dashboard/volunteers", label: "Deploy First-Aid Teams", desc: "Dispatch response units to active zones.", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200/50" },
          { to: "/dashboard/emergency", label: "Update Hotlines", desc: "Ensure citizens can reach MDRRMO, Police, and BFP.", color: "bg-rose-500/10 text-rose-600 border-rose-200/50" },
        ];
      case "resident":
      default:
        return [
          { to: "/dashboard/documents", label: "Request Certificate", desc: "Submit application for job or travel clearance.", color: "bg-blue-500/10 text-blue-600 border-blue-200/50" },
          { to: "/dashboard/incidents", label: "Report Incident", desc: "Report fallen trees, busted pipes, or utilities.", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200/50" },
          { to: "/dashboard/complaints", label: "File Citizen Complaint", desc: "Submit noise or illegal dumping complaints formally.", color: "bg-orange-500/10 text-orange-600 border-orange-200/50" },
          { to: "/dashboard/surveys", label: "Participate in Polls", desc: "Give feedback on solid waste management schedule.", color: "bg-green-500/10 text-green-600 border-green-200/50" },
        ];
    }
  };

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

      <Card className="p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Your Role-Based Quick Actions</h2>
        <p className="text-xs text-muted-foreground mb-4">Perform actions and access features authorized for your role.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {getRoleActions().map((act) => (
            <Link key={act.label} to={act.to} className={`flex flex-col justify-between p-5 rounded-2xl border transition duration-200 hover:-translate-y-1 hover:shadow-lg ${act.color}`}>
              <div>
                <div className="font-semibold text-sm leading-snug">{act.label}</div>
                <div className="mt-1.5 text-xs opacity-85 leading-relaxed">{act.desc}</div>
              </div>
              <div className="mt-5 text-xs font-bold uppercase tracking-wider text-right">Open Panel ➔</div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
