import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useStored, ROLE_LABELS } from "../lib/store";
import { Card, EmptyState } from "../components/ui-kit";
import {
  Users, Home, AlertTriangle, FileText, HeartHandshake, Calendar, Bell,
  Activity, ArrowUpRight, Sprout, Anchor, GraduationCap, Accessibility,
  Heart, Clock, TrendingUp, TrendingDown, Minus, BarChart3, PieChart as PieIcon,
  MapPin, ShieldCheck, ClipboardList, Megaphone, Star, Cloud, CloudRain,
  CloudLightning, Wind, Thermometer, Droplets, RefreshCw, Siren,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area, RadialBarChart, RadialBar,
} from "recharts";
import { useAuth } from "../lib/auth";
import { useEffect, useState, useMemo, useCallback } from "react";
import { getUsers, getTableData } from "../lib/api/auth.functions";
import { withToken, isSessionExpiredError, handleSessionExpired } from "../lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

const COLORS = {
  primary: "oklch(0.55 0.13 255)",
  accent: "oklch(0.78 0.14 80)",
  success: "oklch(0.62 0.15 150)",
  warning: "oklch(0.78 0.15 70)",
  destructive: "oklch(0.58 0.22 27)",
  info: "oklch(0.62 0.13 230)",
  muted: "oklch(0.65 0.02 250)",
};

const CHART_COLORS = [
  "oklch(0.55 0.13 255)",
  "oklch(0.78 0.14 80)",
  "oklch(0.62 0.15 150)",
  "oklch(0.58 0.22 27)",
  "oklch(0.62 0.13 230)",
  "oklch(0.7 0.14 30)",
  "oklch(0.55 0.18 300)",
  "oklch(0.65 0.12 180)",
];

const tooltipStyle = {
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(15,23,42,0.92)",
  color: "white",
  fontSize: "11px",
  fontWeight: 600,
};

function Stat({ icon: Icon, label, value, tone, index, trend }: any) {
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
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-[10px] font-bold ${trend > 0 ? "text-success" : trend < 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {trend > 0 ? <TrendingUp className="h-3 w-3" /> : trend < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              <span>{trend > 0 ? `+${trend}%` : trend < 0 ? `${trend}%` : "No change"}</span>
            </div>
          )}
        </div>
        <div className={`grid h-9 w-9 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-2xl ${tone} border shadow-md ml-1`}>
          <Icon className="h-4.5 w-4.5 sm:h-5.5 sm:w-5.5" />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, className = "", span = "" }: any) {
  return (
    <Card className={`flex flex-col ${className} ${span}`}>
      <div className="mb-4">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</div>
        <div className="text-sm font-extrabold mt-1 text-slate-800 dark:text-slate-200">{subtitle}</div>
      </div>
      {children}
    </Card>
  );
}

function EmptyChart({ message = "No data available yet." }: { message?: string }) {
  return (
    <div className="grid h-64 place-items-center text-xs font-semibold text-muted-foreground bg-muted/15 rounded-2xl border border-dashed border-border/50">
      {message}
    </div>
  );
}

function Overview() {
  const { user, hydrated } = useAuth();
  const [residents, setResidents] = useStored<any[]>("residents", []);
  const [households, setHouseholds] = useStored<any[]>("households", []);
  const [incidents, setIncidents] = useStored<any[]>("incidents", []);
  const [alerts, setAlerts] = useStored<any[]>("alerts", []);
  const [requests, setRequests] = useStored<any[]>("documents_req", []);
  const [volunteers, setVolunteers] = useStored<any[]>("volunteers", []);
  const [events, setEvents] = useStored<any[]>("events", []);
  const [announcements, setAnnouncements] = useStored<any[]>("announcements", []);
  const [complaints, setComplaints] = useStored<any[]>("complaints", []);
  const [evacCenters, setEvacCenters] = useStored<any[]>("evac_centers", []);
  const [emergency, setEmergency] = useStored<any[]>("emergency", []);
  const [youth, setYouth] = useStored<any[]>("youth", []);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [weather, setWeather] = useState<{ temp: number; feels: number; humidity: number; wind: number; precip: number; label: string; code: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    // Wait for auth hydration before fetching data
    if (!hydrated) return;

    const syncTable = async (key: string, setter: (val: any[]) => void) => {
      try {
        const data = await getTableData({ data: withToken({ table: key }) });
        if (data && Array.isArray(data)) setter(data);
      } catch (err) {
        if (isSessionExpiredError(err)) {
          handleSessionExpired("/login", {
            onBeforeRedirect: () => toast.error("Your session has expired. Please sign in again."),
          });
          return;
        }
        console.warn(`Failed to sync ${key}:`, err);
      }
    };

    setLoading(true);

    if (!user) {
      setLoading(false);
      return;
    }

    getUsers({ data: withToken({}) })
      .then((list) => { if (list) setDbUsers(list); })
      .catch((err) => {
        if (isSessionExpiredError(err)) {
          handleSessionExpired("/login", {
            onBeforeRedirect: () => toast.error("Your session has expired. Please sign in again."),
          });
          return;
        }
        console.warn("Failed to load users", err);
      });

    const allSyncs = [
      syncTable("residents", setResidents),
      syncTable("households", setHouseholds),
      syncTable("incidents", setIncidents),
      syncTable("alerts", setAlerts),
      syncTable("documents_req", setRequests),
      syncTable("volunteers", setVolunteers),
      syncTable("events", setEvents),
      syncTable("announcements", setAnnouncements),
      syncTable("complaints", setComplaints),
      syncTable("evac_centers", setEvacCenters),
      syncTable("emergency", setEmergency),
      syncTable("youth", setYouth),
    ];
    Promise.all(allSyncs).finally(() => setLoading(false));
  }, [hydrated, user]);

  // Weather — separate from auth-dependent data to avoid unnecessary re-runs
  useEffect(() => {
    const fetchWeather = () =>
      fetch("https://api.open-meteo.com/v1/forecast?latitude=13.6094&longitude=124.3111&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,precipitation&timezone=Asia%2FManila")
        .then((r) => r.ok ? r.json() : null)
        .then((json) => {
          if (!json?.current) return;
          const c = json.current;
          const labels: Record<number, string> = { 0: "Clear", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Foggy", 48: "Rime fog", 51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle", 61: "Slight rain", 63: "Mod rain", 65: "Heavy rain", 71: "Slight snow", 80: "Showers", 81: "Mod showers", 82: "Violent showers", 95: "T-storm", 96: "T-storm+hail", 99: "T-storm+hail" };
          setWeather({ temp: c.temperature_2m, feels: c.apparent_temperature, humidity: c.relative_humidity_2m, wind: c.wind_speed_10m, precip: c.precipitation ?? 0, label: labels[c.weather_code] || "Unknown", code: c.weather_code });
          localStorage.setItem("ecagraray:cached_weather", JSON.stringify({ data: json, timestamp: new Date().toISOString() }));
        })
        .catch(() => {});

    // Try cache first
    try {
      const cached = localStorage.getItem("ecagraray:cached_weather");
      if (cached) {
        const parsed = JSON.parse(cached);
        const age = Date.now() - new Date(parsed.timestamp).getTime();
        if (age < 30 * 60 * 1000 && parsed.data?.current) {
          const c = parsed.data.current;
          const labels: Record<number, string> = { 0: "Clear", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Foggy", 48: "Rime fog", 51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle", 61: "Slight rain", 63: "Mod rain", 65: "Heavy rain", 71: "Slight snow", 80: "Showers", 81: "Mod showers", 82: "Violent showers", 95: "T-storm", 96: "T-storm+hail", 99: "T-storm+hail" };
          setWeather({ temp: c.temperature_2m, feels: c.apparent_temperature, humidity: c.relative_humidity_2m, wind: c.wind_speed_10m, precip: c.precipitation ?? 0, label: labels[c.weather_code] || "Unknown", code: c.weather_code });
        }
      }
    } catch {}

    // Fetch fresh and poll every 10 min
    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(weatherInterval);
  }, []);

  useEffect(() => {
    if (!hydrated || !user) return;
    const refreshInterval = setInterval(() => {
      const syncTable = async (key: string, setter: (val: any[]) => void) => {
        try {
          const data = await getTableData({ data: withToken({ table: key }) });
          if (data && Array.isArray(data)) setter(data);
        } catch (err) {
          if (isSessionExpiredError(err)) {
            handleSessionExpired("/login", {
              onBeforeRedirect: () => toast.error("Your session has expired. Please sign in again."),
            });
            return;
          }
        }
      };
      void syncTable("incidents", setIncidents);
      void syncTable("alerts", setAlerts);
      void syncTable("emergency", setEmergency);
      void syncTable("complaints", setComplaints);
      void syncTable("documents_req", setRequests);
      void syncTable("announcements", setAnnouncements);
    }, 30000);
    return () => clearInterval(refreshInterval);
  }, [hydrated, user]);

  const combinedResidents = useMemo(() => {
    const map = new Map<string, any>();
    residents.forEach((r) => {
      const key = (r.fullName || "").toLowerCase().trim();
      if (key) map.set(key, r);
    });
    dbUsers
      .filter((u) => u.role === "resident" && u.approved !== false)
      .forEach((u) => {
        const key = (u.fullName || "").toLowerCase().trim();
        map.set(key, {
          id: u.id, fullName: u.fullName, birthdate: u.birthdate,
          gender: u.gender, contact: u.contact, address: u.address,
          occupation: u.occupation, isPwd: u.isPwd, civilStatus: u.civilStatus,
          purok: u.purok, bloodType: u.bloodType,
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
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  // ── Computed Demographics ──
  const totalFarmers = combinedResidents.filter((r) => (r.occupation || "").toLowerCase() === "farmer").length;
  const totalFisherfolks = combinedResidents.filter((r) => (r.occupation || "").toLowerCase() === "fisherfolk").length;
  const totalStudents = combinedResidents.filter((r) => (r.occupation || "").toLowerCase() === "student").length;
  const totalPwd = combinedResidents.filter((r) => r.isPwd === true || String(r.isPwd || "").toLowerCase() === "yes").length;
  const totalSeniors = combinedResidents.filter((r) => r.birthdate && getAge(r.birthdate) >= 60).length;
  const totalYouth = combinedResidents.filter((r) => r.birthdate && getAge(r.birthdate) >= 15 && getAge(r.birthdate) <= 30).length;

  // ── Chart Data ──
  const popData = ["Male", "Female", "Other"].map((g) => ({ name: g, value: combinedResidents.filter((r) => r.gender === g).length }));
  const PIE_COLORS = ["oklch(0.55 0.13 255)", "oklch(0.7 0.14 30)", "oklch(0.7 0.1 150)"];

  const ageGroups = [
    { name: "0–17", min: 0, max: 17 },
    { name: "18–30", min: 18, max: 30 },
    { name: "31–45", min: 31, max: 45 },
    { name: "46–59", min: 46, max: 59 },
    { name: "60+", min: 60, max: 200 },
  ];
  const ageData = ageGroups.map((g) => ({
    name: g.name,
    count: combinedResidents.filter((r) => r.birthdate && getAge(r.birthdate) >= g.min && getAge(r.birthdate) <= g.max).length,
  }));

  const civilStatusData = ["Single", "Married", "Widowed", "Separated"].map((s) => ({
    name: s, value: combinedResidents.filter((r) => (r.civilStatus || "Single") === s).length,
  })).filter((d) => d.value > 0);

  const purokMap = new Map<string, number>();
  combinedResidents.forEach((r) => {
    const p = r.purok || r.address?.split(",")[0]?.trim() || "Unassigned";
    purokMap.set(p, (purokMap.get(p) || 0) + 1);
  });
  const purokData = Array.from(purokMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const householdSizeData = households.map((h) => {
    const members = Array.isArray(h.members) ? h.members.length : parseInt(h.members, 10) || 1;
    return { name: h.code || h.head?.slice(0, 10) || "HH", size: members };
  }).slice(0, 12);

  const docStatusData = [
    { name: "Pending", value: requests.filter((r) => !r.status || r.status === "pending").length },
    { name: "Approved", value: requests.filter((r) => r.status === "approved").length },
    { name: "Rejected", value: requests.filter((r) => r.status === "rejected").length },
  ].filter((d) => d.value > 0);

  const incidentTypeMap = new Map<string, number>();
  incidents.forEach((i) => {
    const t = i.type || i.category || "Other";
    incidentTypeMap.set(t, (incidentTypeMap.get(t) || 0) + 1);
  });
  const incidentTypeData = Array.from(incidentTypeMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { key: d.toISOString().slice(0, 7), label: d.toLocaleString("en-PH", { month: "short" }) };
  });
  const incidentTrend = months.map((m) => ({
    month: m.label,
    incidents: incidents.filter((i) => (i.createdAt || "").startsWith(m.key)).length,
    alerts: alerts.filter((a) => (a.createdAt || "").startsWith(m.key)).length,
    documents: requests.filter((r) => (r.createdAt || "").startsWith(m.key)).length,
  }));

  const volTeamMap = new Map<string, number>();
  volunteers.forEach((v) => {
    const t = v.team || "Unassigned";
    volTeamMap.set(t, (volTeamMap.get(t) || 0) + 1);
  });
  const volTeamData = Array.from(volTeamMap.entries())
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0);

  const eventPart = events.slice(-6).map((e) => ({
    name: e.title?.slice(0, 14) || "Event",
    attendees: (e.attendees || []).length,
  }));

  // ── Recent Activity Feed ──
  const recentActivity = useMemo(() => {
    const items: { type: string; icon: any; color: string; text: string; time: string }[] = [];

    incidents.slice(-5).forEach((i) => {
      items.push({
        type: "incident", icon: AlertTriangle, color: "text-warning",
        text: `Incident reported: ${i.title || "Untitled"}`,
        time: i.createdAt || "",
      });
    });
    requests.slice(-5).forEach((r) => {
      items.push({
        type: "document", icon: FileText, color: "text-info",
        text: `Document request: ${r.title || r.type || "Certificate"}`,
        time: r.createdAt || "",
      });
    });
    alerts.slice(-5).forEach((a) => {
      items.push({
        type: "alert", icon: ShieldCheck, color: "text-destructive",
        text: `Alert issued: ${a.title || "Emergency"}`,
        time: a.createdAt || "",
      });
    });
    announcements.slice(-3).forEach((a) => {
      items.push({
        type: "announcement", icon: Megaphone, color: "text-primary",
        text: `Announcement: ${a.title || "News"}`,
        time: a.createdAt || "",
      });
    });
    events.slice(-3).forEach((e) => {
      items.push({
        type: "event", icon: Calendar, color: "text-accent",
        text: `Event scheduled: ${e.title || "Community Event"}`,
        time: e.date || "",
      });
    });
    complaints.slice(-3).forEach((c) => {
      items.push({
        type: "complaint", icon: ClipboardList, color: "text-orange-500",
        text: `Complaint filed: ${c.title || c.subject || "Citizen Concern"}`,
        time: c.createdAt || "",
      });
    });
    emergency.slice(-3).forEach((e) => {
      items.push({
        type: "emergency", icon: Siren, color: "text-destructive",
        text: `Emergency ${e.type || "Request"}: ${e.requester || "Anonymous"}`,
        time: e.createdAt || "",
      });
    });

    return items
      .sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime())
      .slice(0, 10);
  }, [incidents, requests, alerts, announcements, events, complaints, emergency]);

  // ── Trend calculations ──
  const prevMonthIncidents = incidents.filter((i) => {
    const d = new Date(i.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() - 1 && d.getFullYear() === now.getFullYear();
  }).length;
  const currMonthIncidents = incidents.filter((i) => {
    const d = new Date(i.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const incidentTrendVal = prevMonthIncidents === 0 ? 0 : Math.round(((currMonthIncidents - prevMonthIncidents) / prevMonthIncidents) * 100);

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
          { to: "/dashboard/emergency", label: "Request Assistance", desc: "File rescue, medical, or relief assistance request.", color: "bg-red-500/5 text-red-600 dark:text-red-400 border-red-500/25 hover:border-red-500/50" },
          { to: "/dashboard/incidents", label: "Report Incident", desc: "Report fallen trees, busted pipes, or utilities.", color: "bg-yellow-500/5 text-yellow-600 dark:text-yellow-400 border-yellow-500/25 hover:border-yellow-500/50" },
          { to: "/dashboard/complaints", label: "File Citizen Complaint", desc: "Submit noise or illegal dumping complaints formally.", color: "bg-orange-500/5 text-orange-600 dark:text-orange-400 border-orange-500/25 hover:border-orange-500/50" },
          { to: "/dashboard/surveys", label: "Participate in Polls", desc: "Give feedback on solid waste management schedule.", color: "bg-green-500/5 text-green-600 dark:text-green-400 border-green-500/25 hover:border-green-500/50" },
        ];
    }
  };

  if (!user) {
    return <Card><EmptyState title="Access Restricted" description="Please log in to access the dashboard." /></Card>;
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-muted/60" />
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-2xl bg-muted/30" />
      </div>
    );
  }

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
        <Stat icon={Activity} label="Active Incidents" value={incidents.filter((i) => i.status !== "Resolved").length} tone="bg-warning/5 text-warning-foreground border-warning/10" index={3} trend={incidentTrendVal} />
        <Stat icon={FileText} label="Document Requests" value={requests.length} tone="bg-accent/10 text-accent border-accent/20" index={4} />
        <Stat icon={HeartHandshake} label="Volunteer Registry" value={volunteers.length} tone="bg-success/5 text-success border-success/10" index={5} />
        <Stat icon={Siren} label="Emergency Requests" value={emergency.filter((e) => e.status !== "Completed").length} tone="bg-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/10" index={6} />
        <Stat icon={Megaphone} label="Announcements" value={announcements.length} tone="bg-muted text-muted-foreground border-muted-foreground/10" index={7} />
      </div>

      {/* Weather & Alerts */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Live Weather */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-1 rounded-2xl border border-border/50 bg-card/45 p-4 sm:p-5 dark:bg-slate-900/30 shadow-sm">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-2">
            <Cloud className="h-3.5 w-3.5 text-primary" /> Live Weather
          </div>
          {weather ? (
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">{weather.temp}°</span>
                <span className="text-xs font-semibold text-muted-foreground">feels {weather.feels}°</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold">{weather.label}</span>
                <span className="text-[9px] text-muted-foreground">• {weather.humidity}% RH</span>
              </div>
              <div className="mt-1.5 flex gap-2 text-[9px] text-muted-foreground">
                <span className="flex items-center gap-0.5"><Wind className="h-3 w-3" />{weather.wind} km/h</span>
                <span className="flex items-center gap-0.5"><Droplets className="h-3 w-3" />{weather.precip} mm</span>
              </div>
              <button onClick={() => nav({ to: "/dashboard/alerts" })} className="mt-2 text-[9px] font-bold text-primary hover:text-primary/80 uppercase tracking-wider transition flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> View Alerts
              </button>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Loading...</div>
          )}
        </div>

        {/* Active Alerts Summary */}
        <Link to="/dashboard/alerts" className="rounded-2xl border border-border/50 bg-card/45 p-4 sm:p-5 dark:bg-slate-900/30 shadow-sm hover:bg-card/60 transition">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-2">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Active Alerts
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">{alerts.filter((a) => a.status !== "resolved").length}</span>
            <span className="text-xs font-semibold text-muted-foreground">unresolved</span>
          </div>
          <div className="mt-1 space-y-0.5">
            {["Critical", "High", "Moderate", "Low"].map((l) => {
              const cnt = alerts.filter((a) => a.level === l && a.status !== "resolved").length;
              if (cnt === 0) return null;
              return <div key={l} className="flex items-center gap-1.5 text-[9px]"><span className={`h-1.5 w-1.5 rounded-full ${l === "Critical" ? "bg-destructive" : l === "High" ? "bg-warning" : l === "Moderate" ? "bg-info" : "bg-muted-foreground/50"}`} /><span className="font-bold">{l}: {cnt}</span></div>;
            })}
            {alerts.filter((a) => a.status !== "resolved").length === 0 && <div className="text-[9px] text-muted-foreground">All clear — no active alerts</div>}
          </div>
        </Link>

        {/* Evacuation Summary */}
        <Link to="/dashboard/evacuation" className="rounded-2xl border border-border/50 bg-card/45 p-4 sm:p-5 dark:bg-slate-900/30 shadow-sm hover:bg-card/60 transition">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-2">
            <Home className="h-3.5 w-3.5 text-accent" /> Evacuation Centers
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">{evacCenters.length}</span>
            <span className="text-xs font-semibold text-muted-foreground">centers</span>
          </div>
          <div className="mt-1 text-[9px] text-muted-foreground">
            {evacCenters.reduce((s, c) => s + (c.occupants || 0), 0)} / {evacCenters.reduce((s, c) => s + (c.capacity || 0), 0)} occupied
            {evacCenters.filter((c) => (c.capacity || 0) > 0 && ((c.occupants || 0) / c.capacity) >= 0.9).length > 0 && (
              <span className="text-destructive font-bold ml-1">• {evacCenters.filter((c) => (c.capacity || 0) > 0 && ((c.occupants || 0) / c.capacity) >= 0.9).length} near capacity</span>
            )}
          </div>
        </Link>

        {/* Announcements Summary */}
        <Link to="/dashboard/announcements" className="rounded-2xl border border-border/50 bg-card/45 p-4 sm:p-5 dark:bg-slate-900/30 shadow-sm hover:bg-card/60 transition">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-2">
            <Megaphone className="h-3.5 w-3.5 text-primary" /> Recent News
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">{announcements.length}</span>
            <span className="text-xs font-semibold text-muted-foreground">announcements</span>
          </div>
          <div className="mt-1 text-[9px] text-muted-foreground line-clamp-1">
            {announcements.filter((a) => a.pinned).length > 0
              ? `${announcements.filter((a) => a.pinned).length} pinned • latest ${new Date([...announcements].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))[0]?.createdAt || "").toLocaleDateString("en-PH", { month: "short", day: "numeric" })}`
              : announcements.length > 0 ? `Latest: ${new Date([...announcements].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))[0]?.createdAt || "").toLocaleDateString("en-PH", { month: "short", day: "numeric" })}` : "No announcements yet"}
          </div>
        </Link>
      </div>

      {/* Community Sectors Breakdown */}
      <Card className="p-4 sm:p-6">
        <div className="mb-4">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Demographic Breakdown</div>
          <div className="text-sm font-extrabold mt-1 text-slate-800 dark:text-slate-200">Registered Sector Totals</div>
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Farmers", value: totalFarmers, icon: Sprout, color: "text-emerald-500 bg-emerald-500/5 border-emerald-500/10 dark:text-emerald-400" },
            { label: "Fisherfolks", value: totalFisherfolks, icon: Anchor, color: "text-cyan-500 bg-cyan-500/5 border-cyan-500/10 dark:text-cyan-400" },
            { label: "Students", value: totalStudents, icon: GraduationCap, color: "text-indigo-500 bg-indigo-500/5 border-indigo-500/10 dark:text-indigo-400" },
            { label: "PWDs", value: totalPwd, icon: Accessibility, color: "text-orange-500 bg-orange-500/5 border-orange-500/10 dark:text-orange-400" },
            { label: "Seniors", value: totalSeniors, icon: Heart, color: "text-rose-500 bg-rose-500/5 border-rose-500/10 dark:text-rose-400" },
            { label: "Youth (15–30)", value: totalYouth, icon: Star, color: "text-purple-500 bg-purple-500/5 border-purple-500/10 dark:text-purple-400" },
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

      {/* Row 1: Incident Trend + Gender Distribution */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Operational Trend Analytics" subtitle="Incident, Alert & Document Frequency" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={incidentTrend}>
                <defs>
                  <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.58 0.22 27)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="oklch(0.58 0.22 27)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.55 0.13 255)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="oklch(0.55 0.13 255)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="docGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.14 80)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="oklch(0.78 0.14 80)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" fontSize={11} stroke="oklch(0.5 0.02 255)" fontStyle="italic" />
                <YAxis fontSize={11} stroke="oklch(0.5 0.02 255)" allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
                <Area type="monotone" name="Incidents" dataKey="incidents" stroke="oklch(0.58 0.22 27)" fill="url(#incGrad)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Area type="monotone" name="Alerts" dataKey="alerts" stroke="oklch(0.55 0.13 255)" fill="url(#alertGrad)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Area type="monotone" name="Doc Requests" dataKey="documents" stroke="oklch(0.78 0.14 80)" fill="url(#docGrad)" strokeWidth={2.5} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Demographic Distribution" subtitle="Registered Gender">
          {combinedResidents.length === 0 ? <EmptyChart message="No resident records found." /> : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={popData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={4}>
                    {popData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ ...tooltipStyle, border: "none" }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Row 2: Age Distribution + Civil Status + Document Status */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Population Pyramid" subtitle="Age Group Distribution">
          {combinedResidents.length === 0 ? <EmptyChart message="No resident data." /> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" fontSize={11} stroke="oklch(0.5 0.02 255)" />
                  <YAxis fontSize={11} stroke="oklch(0.5 0.02 255)" allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar name="Residents" dataKey="count" radius={[8, 8, 0, 0]}>
                    {ageData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Civil Status Overview" subtitle="Marital Status Breakdown">
          {civilStatusData.length === 0 ? <EmptyChart message="No data yet." /> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={civilStatusData} dataKey="value" nameKey="name" outerRadius={85} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {civilStatusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ ...tooltipStyle, border: "none" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Document Processing" subtitle="Request Status Overview">
          {docStatusData.length === 0 ? <EmptyChart message="No document requests yet." /> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={docStatusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={4}>
                    {docStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.name === "Approved" ? COLORS.success : entry.name === "Rejected" ? COLORS.destructive : COLORS.warning} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ ...tooltipStyle, border: "none" }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Row 3: Incident Types + Purok Population + Volunteer Teams */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Incident Classification" subtitle="Types of Reported Incidents">
          {incidentTypeData.length === 0 ? <EmptyChart message="No incidents recorded yet." /> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incidentTypeData} layout="vertical" barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={false} />
                  <XAxis type="number" fontSize={11} stroke="oklch(0.5 0.02 255)" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" fontSize={11} stroke="oklch(0.5 0.02 255)" width={100} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar name="Count" dataKey="value" radius={[0, 8, 8, 0]}>
                    {incidentTypeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Purok / Zone Population" subtitle="Residents per Zone">
          {purokData.length === 0 ? <EmptyChart message="No zone data mapped yet." /> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={purokData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" fontSize={10} stroke="oklch(0.5 0.02 255)" angle={-35} textAnchor="end" height={50} />
                  <YAxis fontSize={11} stroke="oklch(0.5 0.02 255)" allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar name="Residents" dataKey="count" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Volunteer Teams" subtitle="Team Distribution">
          {volTeamData.length === 0 ? <EmptyChart message="No volunteer teams formed yet." /> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={volTeamData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={4}>
                    {volTeamData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ ...tooltipStyle, border: "none" }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Row 4: Household Size + Event Attendance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Household Composition" subtitle="Members per Household">
          {householdSizeData.length === 0 ? <EmptyChart message="No household data registered." /> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={householdSizeData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" fontSize={10} stroke="oklch(0.5 0.02 255)" angle={-35} textAnchor="end" height={50} />
                  <YAxis fontSize={11} stroke="oklch(0.5 0.02 255)" allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar name="Members" dataKey="size" radius={[8, 8, 0, 0]}>
                    {householdSizeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Event Attendance" subtitle="Resident Event Participation Count">
          {eventPart.length === 0 ? <EmptyChart message="No community projects scheduled yet." /> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventPart} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" fontSize={10} stroke="oklch(0.5 0.02 255)" />
                  <YAxis fontSize={11} stroke="oklch(0.5 0.02 255)" allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar name="Attending" dataKey="attendees" fill={COLORS.accent} radius={[8, 8, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Recent Activity Feed */}
      <Card className="p-4 sm:p-6">
        <div className="mb-5 flex items-center justify-between border-b border-border/30 pb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live Feed</div>
            <div className="text-sm font-extrabold mt-1 text-slate-800 dark:text-slate-200">Recent Activity</div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-success uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Live
          </div>
        </div>
        {recentActivity.length === 0 ? (
          <div className="grid h-32 place-items-center text-xs font-semibold text-muted-foreground bg-muted/15 rounded-2xl border border-dashed border-border/50">
            No recent activity recorded.
          </div>
        ) : (
          <div className="space-y-1">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-muted/30 transition-colors animate-slide-in" style={{ animationDelay: `${i * 40}ms` }}>
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-background border border-border/40 ${item.color}`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">{item.text}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">{item.time ? new Date(item.time).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "Recently"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Role-based panels */}
      <Card className="p-4 sm:p-6 md:p-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border/30 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">Authorized Dispatch Panels</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Quick access shortcuts assigned exclusively to your credentials clearance level.</p>
          </div>
          <BadgeLabel label={`${user?.role ? ROLE_LABELS[user.role] : "RESIDENT"} CLEARANCE`} />
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

function BadgeLabel({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary shadow-[0_0_8px_rgba(59,130,246,0.1)]">
      {label}
    </span>
  );
}
