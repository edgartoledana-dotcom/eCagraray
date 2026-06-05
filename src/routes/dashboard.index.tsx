import { createFileRoute, Link } from "@tanstack/react-router";
import { useStored, ROLE_LABELS } from "../lib/store";
import { Card } from "../components/ui-kit";
import { Users, Home, AlertTriangle, FileText, HeartHandshake, Calendar, Bell, Activity, ArrowUpRight, Sprout, Anchor, GraduationCap, Accessibility, Heart } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { useAuth } from "../lib/auth";
import { useEffect, useState, useMemo } from "react";
import { getUsers, getTableData } from "../lib/api/auth.functions";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

function Stat({ icon: Icon, label, value, tone, index }: any) {
  // Determine left border highlight tone
  let highlight = "border-l-4 border-l-primary";
  if (tone.includes("text-info")) highlight = "border-l-4 border-l-info";
  if (tone.includes("text-destructive")) highlight = "border-l-4 border-l-destructive";
  if (tone.includes("text-warning")) highlight = "border-l-4 border-l-warning";
  if (tone.includes("text-accent")) highlight = "border-l-4 border-l-accent";
  if (tone.includes("text-success")) highlight = "border-l-4 border-l-success";

  return (
    <div className={`rounded-2xl border border-border/50 bg-card/45 p-4 sm:p-5 dark:bg-slate-900/30 animate-slide-in ${highlight} shadow-sm`} style={{ animationDelay: `${index * 60}ms` }}>
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0">
          <div className="text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider text-muted-foreground leading-tight">{label}</div>
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white mt-0.5">{value}</div>
        </div>
        <div className={`grid h-9 w-9 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-2xl ${tone} border shadow-md ml-1`}>
          <Icon className="h-4.5 w-4.5 sm:h-5.5 sm:w-5.5" />
        </div>
      </div>
    </div>
  );
}

function Overview() {
  const { user } = useAuth();
  const [residents, setResidents] = useStored<any[]>("residents", []);
  const [households, setHouseholds] = useStored<any[]>("households", []);
  const [incidents, setIncidents] = useStored<any[]>("incidents", []);
  const [alerts, setAlerts] = useStored<any[]>("alerts", []);
  const [requests, setRequests] = useStored<any[]>("documents_req", []);
  const [volunteers, setVolunteers] = useStored<any[]>("volunteers", []);
  const [events, setEvents] = useStored<any[]>("events", []);
  const [dbUsers, setDbUsers] = useState<any[]>([]);

  useEffect(() => {
    const syncTable = async (key: string, setter: (val: any[]) => void) => {
      try {
        const data = await getTableData({ data: { table: key } });
        if (data && Array.isArray(data)) setter(data);
      } catch (err) {
        console.warn(`Failed to sync ${key} on dashboard index mount:`, err);
      }
    };

    void syncTable("residents", setResidents);
    void syncTable("households", setHouseholds);
    void syncTable("incidents", setIncidents);
    void syncTable("alerts", setAlerts);
    void syncTable("documents_req", setRequests);
    void syncTable("volunteers", setVolunteers);
    void syncTable("events", setEvents);

    getUsers()
      .then((list) => {
        if (list) setDbUsers(list);
      })
      .catch((err) => console.error("Failed to load users", err));
  }, []);

  const combinedResidents = useMemo(() => {
    const map = new Map<string, any>();
    // First, populate from localStorage residents
    residents.forEach((r) => {
      const key = (r.fullName || "").toLowerCase().trim();
      if (key) map.set(key, r);
    });
    // Next, merge/override from approved registered users
    dbUsers
      .filter((u) => u.role === "resident" && u.approved !== false)
      .forEach((u) => {
        const key = (u.fullName || "").toLowerCase().trim();
        map.set(key, {
          id: u.id,
          fullName: u.fullName,
          birthdate: u.birthdate,
          gender: u.gender,
          contact: u.contact,
          address: u.address,
          occupation: u.occupation,
          isPwd: u.isPwd,
        });
      });
    return Array.from(map.values());
  }, [residents, dbUsers]);

  const getAge = (birthdate: string) => {
    if (!birthdate) return 0;
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const totalFarmers = combinedResidents.filter((r) => (r.occupation || "").toLowerCase() === "farmer").length;
  const totalFisherfolks = combinedResidents.filter((r) => (r.occupation || "").toLowerCase() === "fisherfolk").length;
  const totalStudents = combinedResidents.filter((r) => (r.occupation || "").toLowerCase() === "student").length;
  const totalPwd = combinedResidents.filter((r) => (r.isPwd || "").toLowerCase() === "yes").length;
  const totalSeniors = combinedResidents.filter((r) => r.birthdate && getAge(r.birthdate) >= 60).length;

  // Population chart by gender
  const popData = ["Male", "Female", "Other"].map((g) => ({ name: g, value: combinedResidents.filter((r) => r.gender === g).length }));
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
          { to: "/dashboard/documents", label: "Approve Documents", desc: "Review and sign clearance & indigency requests.", color: "bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/25 hover:border-blue-500/50" },
          { to: "/dashboard/alerts", label: "Issue Disaster Alert", desc: "Send emergency weather warnings to residents.", color: "bg-red-500/5 text-red-600 dark:text-red-400 border-red-500/25 hover:border-red-500/50" },
          { to: "/dashboard/incidents", label: "Review Incidents", desc: "Track road blockage, utilities, or safety reports.", color: "bg-yellow-500/5 text-yellow-600 dark:text-yellow-400 border-yellow-500/25 hover:border-yellow-500/50" },
          { to: "/dashboard/reports", label: "Barangay Reports", desc: "Analyze budget, demographics, and operations.", color: "bg-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-500/25 hover:border-purple-500/50" },
        ];
      case "secretary":
        return [
          { to: "/dashboard/residents", label: "Register Resident", desc: "Add demographic records for new citizens.", color: "bg-green-500/5 text-green-600 dark:text-green-400 border-green-500/25 hover:border-green-500/50" },
          { to: "/dashboard/documents", label: "Process Documents", desc: "Draft clearances, certs, and indigency forms.", color: "bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/25 hover:border-blue-500/50" },
          { to: "/dashboard/announcements", label: "Announce News", desc: "Broadcast assemblies, missions, or notices.", color: "bg-cyan-500/5 text-cyan-600 dark:text-cyan-400 border-cyan-500/25 hover:border-cyan-500/50" },
          { to: "/dashboard/households", label: "Manage Households", desc: "Map and group resident families by zone.", color: "bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 border-indigo-500/25 hover:border-indigo-500/50" },
        ];
      case "sk_officer":
        return [
          { to: "/dashboard/events", label: "Schedule Sportsfest", desc: "Set location, rules, and details for events.", color: "bg-pink-500/5 text-pink-600 dark:text-pink-400 border-pink-500/25 hover:border-pink-500/50" },
          { to: "/dashboard/youth", label: "SK Youth Registry", desc: "Access the complete demographic list of youth.", color: "bg-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-500/25 hover:border-purple-500/50" },
          { to: "/dashboard/volunteers", label: "Coordinate Volunteers", desc: "Recruit and assign young community assistants.", color: "bg-teal-500/5 text-teal-600 dark:text-teal-400 border-teal-500/25 hover:border-teal-500/50" },
          { to: "/dashboard/surveys", label: "Youth Opinion Polls", desc: "Collect data on youth preferences and needs.", color: "bg-orange-500/5 text-orange-600 dark:text-orange-400 border-orange-500/25 hover:border-orange-500/50" },
        ];
      case "disaster":
        return [
          { to: "/dashboard/alerts", label: "Broadcast Disaster Alert", desc: "Post real-time critical weather warnings.", color: "bg-red-500/5 text-red-600 dark:text-red-400 border-red-500/25 hover:border-red-500/50" },
          { to: "/dashboard/evacuation", label: "Evacuation Center Capacity", desc: "Monitor center logistics and occupants count.", color: "bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/25 hover:border-amber-500/50" },
          { to: "/dashboard/volunteers", label: "Deploy First-Aid Teams", desc: "Dispatch response units to active zones.", color: "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 hover:border-emerald-500/50" },
          { to: "/dashboard/emergency", label: "Update Hotlines", desc: "Ensure citizens can reach MDRRMO, Police, and BFP.", color: "bg-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/25 hover:border-rose-500/50" },
        ];
      case "resident":
      default:
        return [
          { to: "/dashboard/documents", label: "Request Certificate", desc: "Submit application for job or travel clearance.", color: "bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/25 hover:border-blue-500/50" },
          { to: "/dashboard/incidents", label: "Report Incident", desc: "Report fallen trees, busted pipes, or utilities.", color: "bg-yellow-500/5 text-yellow-600 dark:text-yellow-400 border-yellow-500/25 hover:border-yellow-500/50" },
          { to: "/dashboard/complaints", label: "File Citizen Complaint", desc: "Submit noise or illegal dumping complaints formally.", color: "bg-orange-500/5 text-orange-600 dark:text-orange-400 border-orange-500/25 hover:border-orange-500/50" },
          { to: "/dashboard/surveys", label: "Participate in Polls", desc: "Give feedback on solid waste management schedule.", color: "bg-green-500/5 text-green-600 dark:text-green-400 border-green-500/25 hover:border-green-500/50" },
        ];
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">Barangay Overview</h1>
          <p className="mt-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Active Session: {user?.fullName || "User"}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-[10px] font-bold text-primary uppercase tracking-widest shadow-inner">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" /> Connected
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Residents" value={combinedResidents.length} tone="bg-primary/5 text-primary border-primary/10" index={0} />
        <Stat icon={Home} label="Households" value={households.length} tone="bg-info/5 text-info border-info/10" index={1} />
        <Stat icon={AlertTriangle} label="Critical Alerts" value={alerts.filter((a) => a.status !== "resolved").length} tone="bg-destructive/5 text-destructive border-destructive/10" index={2} />
        <Stat icon={Activity} label="Active Incidents" value={incidents.filter((i) => i.status !== "Resolved").length} tone="bg-warning/5 text-warning-foreground border-warning/10" index={3} />
        <Stat icon={FileText} label="Document Requests" value={requests.length} tone="bg-accent/10 text-accent border-accent/20" index={4} />
        <Stat icon={HeartHandshake} label="Volunteer Registry" value={volunteers.length} tone="bg-success/5 text-success border-success/10" index={5} />
        <Stat icon={Calendar} label="Active Projects" value={events.length} tone="bg-primary/5 text-primary border-primary/10" index={6} />
        <Stat icon={Bell} label="Notifications" value={0} tone="bg-muted text-muted-foreground border-muted-foreground/10" index={7} />
      </div>

      {/* Community Sectors Breakdown */}
      <Card className="p-4 sm:p-6">
        <div className="mb-4">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Demographic Breakdown</div>
          <div className="text-sm font-extrabold mt-1 text-slate-800 dark:text-slate-200">Registered Sector Totals</div>
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Farmers", value: totalFarmers, icon: Sprout, color: "text-emerald-500 bg-emerald-500/5 border-emerald-500/10 dark:text-emerald-400" },
            { label: "Fisherfolks", value: totalFisherfolks, icon: Anchor, color: "text-cyan-500 bg-cyan-500/5 border-cyan-500/10 dark:text-cyan-400" },
            { label: "Students", value: totalStudents, icon: GraduationCap, color: "text-indigo-500 bg-indigo-500/5 border-indigo-500/10 dark:text-indigo-400" },
            { label: "PWDs", value: totalPwd, icon: Accessibility, color: "text-orange-500 bg-orange-500/5 border-orange-500/10 dark:text-orange-400" },
            { label: "Seniors", value: totalSeniors, icon: Heart, color: "text-rose-500 bg-rose-500/5 border-rose-500/10 dark:text-rose-400" },
          ].map((s, i) => (
            <div key={s.label} className={`flex items-center gap-3 p-3.5 rounded-2xl border ${s.color} animate-slide-in`} style={{ animationDelay: `${i * 60}ms` }}>
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-background/50 border border-current/10 shadow-sm">
                <s.icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-75">{s.label}</div>
                <div className="text-xl font-black mt-0.5">{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recharts Analytics Displays */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <div className="mb-4">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Operational Trend Analytics</div>
            <div className="text-sm font-extrabold mt-1 text-slate-800 dark:text-slate-200">Incident & Critical Alert Frequency</div>
          </div>
          <div className="h-68">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={incidentTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" fontSize={11} stroke="oklch(0.5 0.02 255)" fontStyle="italic" />
                <YAxis fontSize={11} stroke="oklch(0.5 0.02 255)" allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: "16px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(15,23,42,0.85)", color: "white" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
                <Line type="monotone" name="Incidents Submitted" dataKey="incidents" stroke="oklch(0.6 0.22 27)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" name="Disaster Alerts Issued" dataKey="alerts" stroke="oklch(0.55 0.13 255)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="mb-4">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Demographic Distribution</div>
            <div className="text-sm font-extrabold mt-1 text-slate-800 dark:text-slate-200">Registered Gender</div>
          </div>
          {combinedResidents.length === 0 ? (
            <div className="grid h-64 place-items-center text-xs font-semibold text-muted-foreground bg-muted/15 rounded-2xl border border-dashed border-border/50">
              No resident records found.
            </div>
          ) : (
            <div className="h-68">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={popData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={78} paddingAngle={4}>
                    {popData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "16px", border: "none", background: "rgba(15,23,42,0.85)", color: "white" }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-3 flex flex-col justify-between">
          <div className="mb-4">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Event Attendance</div>
            <div className="text-sm font-extrabold mt-1 text-slate-800 dark:text-slate-200">Resident Event Attendance Count</div>
          </div>
          {eventPart.length === 0 ? (
            <div className="grid h-56 place-items-center text-xs font-semibold text-muted-foreground bg-muted/15 rounded-2xl border border-dashed border-border/50">
              No community projects scheduled yet.
            </div>
          ) : (
            <div className="h-68">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventPart}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" fontSize={11} stroke="oklch(0.5 0.02 255)" />
                  <YAxis fontSize={11} stroke="oklch(0.5 0.02 255)" allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: "16px", border: "none", background: "rgba(15,23,42,0.85)", color: "white" }} />
                  <Bar name="Attending Residents" dataKey="attendees" fill="oklch(0.55 0.13 255)" radius={[8, 8, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Role-based panels */}
      <Card className="p-4 sm:p-6 md:p-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border/30 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">Authorized Dispatch Panels</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Quick access shortcuts assigned exclusively to your credentials clearance level.</p>
          </div>
          <Badge label={`${user?.role ? ROLE_LABELS[user.role] : "RESIDENT"} CLEARANCE`} />
        </div>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {getRoleActions().map((act, i) => (
            <Link
              key={act.label}
              to={act.to}
              className={`flex flex-col justify-between p-4 sm:p-5 rounded-2xl border cursor-pointer ${act.color} animate-slide-in`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div>
                <div className="font-extrabold text-sm tracking-tight leading-snug">{act.label}</div>
                <div className="mt-2 text-xs leading-relaxed opacity-80">{act.desc}</div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-1 text-[10px] font-black uppercase tracking-wider">
                Open <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </Card>

    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary shadow-[0_0_8px_rgba(59,130,246,0.1)]">
      {label}
    </span>
  );
}
