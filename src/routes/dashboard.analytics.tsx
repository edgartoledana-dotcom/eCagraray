import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStored, withToken } from "../lib/store";
import { useAuth } from "../lib/auth";
import { PageHeader, Card, EmptyState } from "../components/ui-kit";
import { getTableData } from "../lib/api/auth.functions";
import {
  BarChart3, Users, AlertTriangle, FileText, Calendar, TrendingUp,
  TrendingDown, Activity, Heart, Shield, Megaphone, Home,
  ChevronRight, RefreshCw, Zap, Target, Brain, PieChart, MessageSquare,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/analytics")({ component: AnalyticsPage });

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <span>{display.toLocaleString()}{suffix}</span>;
}

function BarChart({ data, maxVal }: { data: { label: string; value: number; color?: string }[]; maxVal?: number }) {
  const max = maxVal || Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 sm:gap-2 h-40 sm:h-48">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
          <span className="text-[10px] sm:text-xs font-bold text-muted-foreground tabular-nums">{d.value}</span>
          <div className="w-full relative rounded-t-lg overflow-hidden" style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 4 : 0 }}>
            <div
              className="absolute inset-0 rounded-t-lg transition-all duration-700 ease-out"
              style={{
                background: d.color || "linear-gradient(to top, hsl(var(--primary)), hsl(var(--primary) / 0.6))",
                animationDelay: `${i * 80}ms`,
              }}
            />
          </div>
          <span className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments, size = 120 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let accumulated = 0;
  const gradientParts: string[] = [];
  for (const seg of segments) {
    const start = (accumulated / total) * 360;
    const end = ((accumulated + seg.value) / total) * 360;
    gradientParts.push(`${seg.color} ${start}deg ${end}deg`);
    accumulated += seg.value;
  }
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div
        className="rounded-full"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${gradientParts.join(", ")})`,
        }}
      />
      <div className="absolute rounded-full bg-background flex items-center justify-center" style={{ width: size * 0.55, height: size * 0.55 }}>
        <span className="text-sm sm:text-base font-extrabold text-foreground">{total}</span>
      </div>
    </div>
  );
}

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return <span className="text-xs font-bold text-muted-foreground">New</span>;
  const pct = Math.round(((current - previous) / previous) * 100);
  const up = pct > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] sm:text-xs font-bold ${up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(pct)}%
    </span>
  );
}

function HeatGrid({ data, labels }: { data: number[][]; labels: { rows: string[]; cols: string[] } }) {
  const max = Math.max(...data.flat(), 1);
  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `auto repeat(${labels.cols.length}, 1fr)` }}>
        <div />
        {labels.cols.map((c, ci) => (
          <div key={ci} className="text-[8px] sm:text-[9px] font-bold text-muted-foreground text-center px-0.5 truncate">{c}</div>
        ))}
        {labels.rows.map((r, ri) => (
          <>
            <div key={`r-${ri}`} className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground pr-1.5 flex items-center">{r}</div>
            {data[ri]?.map((val, ci) => {
              const intensity = val / max;
              return (
                <div
                  key={`${ri}-${ci}`}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded-sm transition-all hover:scale-125 hover:z-10 relative cursor-default group"
                  style={{
                    background: `hsl(var(--primary))`,
                    opacity: Math.max(intensity * 0.9, 0.1),
                  }}
                  title={`${r} × ${labels.cols[ci]}: ${val}`}
                >
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-[8px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">{val}</span>
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}

function SparkLine({ values, color = "hsl(var(--primary))" }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const h = 32;
  const w = 80;
  const points = values.map((v, i) => `${(i / (values.length - 1 || 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AnalyticsPage() {
  const { user } = useAuth();
  const [residents, setResidents] = useStored<any[]>("residents", []);
  const [households] = useStored<any[]>("households", []);
  const [incidents, setIncidents] = useStored<any[]>("incidents", []);
  const [alerts, setAlerts] = useStored<any[]>("alerts", []);
  const [events, setEvents] = useStored<any[]>("events", []);
  const [announcements, setAnnouncements] = useStored<any[]>("announcements", []);
  const [documents, setDocuments] = useStored<any[]>("documents_req", []);
  const [complaints, setComplaints] = useStored<any[]>("complaints", []);
  const [volunteers] = useStored<any[]>("volunteers", []);
  const [officials] = useStored<any[]>("officials", []);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const sync = async (key: string, setter: (v: any[]) => void) => {
      try {
        const d = await getTableData({ data: withToken({ table: key }) });
        if (d && Array.isArray(d)) setter(d);
      } catch {}
    };
    sync("residents", setResidents);
    sync("incidents", setIncidents);
    sync("alerts", setAlerts);
    sync("events", setEvents);
    sync("announcements", setAnnouncements);
    sync("documents_req", setDocuments);
    sync("complaints", setComplaints);
  }, []);

  if (!user || user.role !== "super_admin") {
    return <Card><EmptyState title="Access Restricted" description="Only System Administrators can access analytics." /></Card>;
  }

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const getMonth = (d: string) => { try { const x = new Date(d); return { m: x.getMonth(), y: x.getFullYear() }; } catch { return null; } };

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(thisYear, thisMonth - 5 + i, 1);
    return { m: d.getMonth(), y: d.getFullYear(), label: monthNames[d.getMonth()] };
  });

  const incidentsByMonth = last6.map(({ m, y, label }) => ({
    label,
    value: incidents.filter((i: any) => { const d = getMonth(i.createdAt || i.date); return d && d.m === m && d.y === y; }).length,
    color: "linear-gradient(to top, #ef4444, #f87171)",
  }));

  const residentsByMonth = last6.map(({ m, y, label }) => ({
    label,
    value: residents.filter((r: any) => { const d = getMonth(r.createdAt || r.registeredAt); return d && d.m === m && d.y === y; }).length,
    color: "linear-gradient(to top, #3b82f6, #60a5fa)",
  }));

  const docsByMonth = last6.map(({ m, y, label }) => ({
    label,
    value: documents.filter((d: any) => { const dt = getMonth(d.createdAt); return dt && dt.m === m && dt.y === y; }).length,
    color: "linear-gradient(to top, #10b981, #34d399)",
  }));

  const complaintsByMonth = last6.map(({ m, y, label }) => ({
    label,
    value: complaints.filter((c: any) => { const d = getMonth(c.createdAt); return d && d.m === m && d.y === y; }).length,
    color: "linear-gradient(to top, #f59e0b, #fbbf24)",
  }));

  // Demographics
  const ageGroups = ["0-17", "18-25", "26-35", "36-45", "46-55", "56-65", "66+"];
  const ageBuckets = ageGroups.map((label) => {
    const [min, max] = label === "66+" ? [66, 200] : label.split("-").map(Number);
    return {
      label,
      value: residents.filter((r: any) => {
        if (!r.birthdate) return false;
        const age = Math.floor((Date.now() - new Date(r.birthdate).getTime()) / 31557600000);
        return age >= min && age <= max;
      }).length,
    };
  });

  const genderSplit = [
    { label: "Male", value: residents.filter((r: any) => r.gender === "Male" || r.gender === "male").length, color: "#3b82f6" },
    { label: "Female", value: residents.filter((r: any) => r.gender === "Female" || r.gender === "female").length, color: "#ec4899" },
    { label: "Other", value: residents.filter((r: any) => r.gender && r.gender !== "Male" && r.gender !== "male" && r.gender !== "Female" && r.gender !== "female").length, color: "#8b5cf6" },
  ];

  // Incident status
  const incidentStatuses = ["Open", "In Progress", "Under Investigation", "Resolved", "Closed"];
  const incidentStatusData = incidentStatuses.map((s) => ({
    label: s,
    value: incidents.filter((i: any) => i.status === s).length,
    color: s === "Open" ? "#ef4444" : s === "In Progress" ? "#f59e0b" : s === "Resolved" ? "#10b981" : s === "Closed" ? "#6b7280" : "#8b5cf6",
  }));

  // Document status
  const docStatuses = ["Pending", "Reviewing", "Approved", "Released", "Rejected"];
  const docStatusData = docStatuses.map((s) => ({
    label: s,
    value: documents.filter((d: any) => d.status === s).length,
    color: s === "Pending" ? "#f59e0b" : s === "Reviewing" ? "#3b82f6" : s === "Approved" ? "#10b981" : s === "Released" ? "#8b5cf6" : "#ef4444",
  }));

  // Purok distribution
  const puroks = [...new Set(residents.map((r: any) => r.purok).filter(Boolean))].sort();
  const purokData = puroks.map((p) => ({
    label: String(p),
    value: residents.filter((r: any) => r.purok === p).length,
    color: "linear-gradient(to top, #6366f1, #818cf8)",
  }));

  // Heatmap: Incidents by day-of-week × month
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const heatMonthLabels = last6.map((l) => l.label);
  const heatData = dayLabels.map((_, di) =>
    last6.map(({ m, y }) =>
      incidents.filter((i: any) => {
        const d = getMonth(i.createdAt || i.date);
        if (!d || d.m !== m || d.y !== y) return false;
        const date = new Date(i.createdAt || i.date);
        return (date.getDay() + 6) % 7 === di;
      }).length
    )
  );

  // Engagement score
  const totalActivities = incidents.length + complaints.length + documents.length + events.length + announcements.length;
  const engagementScore = Math.min(100, Math.round((totalActivities / Math.max(residents.length * 0.3, 1)) * 100));

  // Monthly growth
  const thisMonthResidents = residents.filter((r: any) => { const d = getMonth(r.createdAt || r.registeredAt); return d && d.m === thisMonth && d.y === thisYear; }).length;
  const lastMonthResidents = residents.filter((r: any) => { const d = getMonth(r.createdAt || r.registeredAt); return d && d.m === lastMonth && d.y === lastMonthYear; }).length;
  const thisMonthIncidents = incidents.filter((i: any) => { const d = getMonth(i.createdAt || i.date); return d && d.m === thisMonth && d.y === thisYear; }).length;
  const lastMonthIncidents = incidents.filter((i: any) => { const d = getMonth(i.createdAt || i.date); return d && d.m === lastMonth && d.y === lastMonthYear; }).length;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "demographics", label: "Demographics" },
    { key: "incidents", label: "Incidents" },
    { key: "services", label: "Services" },
    { key: "engagement", label: "Engagement" },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="AI Analytics Dashboard"
        subtitle="Deep insights and trend analysis for Barangay Cagraray."
      />

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === t.key
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: "Total Residents", value: residents.length, icon: Users, color: "from-blue-500 to-blue-600", change: `${thisMonthResidents - lastMonthResidents >= 0 ? "+" : ""}${thisMonthResidents - lastMonthResidents}` },
              { label: "Active Incidents", value: incidents.filter((i: any) => i.status !== "Resolved" && i.status !== "Closed").length, icon: Shield, color: "from-rose-500 to-rose-600", change: `${thisMonthIncidents - lastMonthIncidents >= 0 ? "+" : ""}${thisMonthIncidents - lastMonthIncidents}` },
              { label: "Documents", value: documents.length, icon: FileText, color: "from-emerald-500 to-emerald-600", change: `${documents.filter((d: any) => d.status === "Pending").length} pending` },
              { label: "Engagement", value: engagementScore, icon: Heart, color: "from-purple-500 to-purple-600", suffix: "%" },
            ].map((card) => (
              <Card key={card.label} className="p-4 sm:p-5 relative overflow-hidden group">
                <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                      <card.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <TrendIndicator current={card.value} previous={100} />
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-foreground">
                    <AnimatedCounter value={card.value} suffix={card.suffix} />
                  </div>
                  <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground mt-0.5 uppercase tracking-wider">{card.label}</div>
                </div>
              </Card>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
            <Card className="p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold">Resident Registrations (6mo)</h3>
              </div>
              <BarChart data={residentsByMonth} />
            </Card>
            <Card className="p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <h3 className="text-sm font-bold">Incidents (6mo)</h3>
              </div>
              <BarChart data={incidentsByMonth} />
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
            <Card className="p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold">Gender Distribution</h3>
              </div>
              <div className="flex items-center gap-6">
                <DonutChart segments={genderSplit.filter((g) => g.value > 0)} size={100} />
                <div className="space-y-2">
                  {genderSplit.map((g) => (
                    <div key={g.label} className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: g.color }} />
                      <span className="text-xs font-semibold text-muted-foreground">{g.label}</span>
                      <span className="text-xs font-bold text-foreground ml-auto">{g.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
            <Card className="p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-4 w-4 text-purple-500" />
                <h3 className="text-sm font-bold">AI Insights</h3>
              </div>
              <div className="space-y-3">
                {[
                  { text: `Resident growth is ${thisMonthResidents >= lastMonthResidents ? "trending up" : "declining"} this month.`, icon: thisMonthResidents >= lastMonthResidents ? TrendingUp : TrendingDown, color: thisMonthResidents >= lastMonthResidents ? "text-emerald-500" : "text-rose-500" },
                  { text: `${incidents.filter((i: any) => i.status === "Open" || i.status === "In Progress").length} incidents require immediate attention.`, icon: AlertTriangle, color: "text-amber-500" },
                  { text: `Document processing: ${documents.filter((d: any) => d.status === "Pending").length} pending, ${documents.filter((d: any) => d.status === "Reviewing").length} under review.`, icon: FileText, color: "text-blue-500" },
                ].map((insight, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/30">
                    <insight.icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${insight.color}`} />
                    <span className="text-xs text-muted-foreground leading-relaxed">{insight.text}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-4 w-4 text-emerald-500" />
                <h3 className="text-sm font-bold">Quick Stats</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Households", value: households.length, icon: Home, spark: [3, 5, 4, 6, 7, households.length] },
                  { label: "Volunteers", value: volunteers.length, icon: Heart, spark: [1, 2, 3, 2, 4, volunteers.length] },
                  { label: "Officials", value: officials.length, icon: Users, spark: [5, 5, 6, 6, 6, officials.length] },
                  { label: "Active Alerts", value: alerts.filter((a: any) => a.status === "active").length, icon: AlertTriangle, spark: [1, 3, 2, 4, 1, alerts.filter((a: any) => a.status === "active").length] },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                      <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                      <div className="text-sm font-extrabold text-foreground">{stat.value}</div>
                    </div>
                    <div className="w-16 shrink-0">
                      <SparkLine values={stat.spark} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {activeTab === "demographics" && (
        <>
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
            <Card className="p-4 sm:p-5">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Age Distribution
              </h3>
              <BarChart data={ageBuckets} />
            </Card>
            <Card className="p-4 sm:p-5">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <PieChart className="h-4 w-4 text-pink-500" />
                Gender Breakdown
              </h3>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <DonutChart segments={genderSplit.filter((g) => g.value > 0)} size={140} />
                <div className="space-y-3 flex-1 w-full">
                  {genderSplit.map((g) => {
                    const pct = residents.length > 0 ? Math.round((g.value / residents.length) * 100) : 0;
                    return (
                      <div key={g.label}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ background: g.color }} />
                            <span className="text-xs font-semibold">{g.label}</span>
                          </div>
                          <span className="text-xs font-bold">{g.value} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: g.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
          {puroks.length > 0 && (
            <Card className="p-4 sm:p-5">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <Home className="h-4 w-4 text-indigo-500" />
                Purok / Zone Distribution
              </h3>
              <BarChart data={purokData} />
            </Card>
          )}
          <Card className="p-4 sm:p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Age Group Details
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              {ageBuckets.map((ag) => {
                const pct = residents.length > 0 ? Math.round((ag.value / residents.length) * 100) : 0;
                return (
                  <div key={ag.label} className="text-center p-3 rounded-xl bg-muted/30">
                    <div className="text-lg sm:text-xl font-extrabold text-foreground">{ag.value}</div>
                    <div className="text-[10px] font-bold text-muted-foreground mt-0.5">{ag.label}</div>
                    <div className="text-[9px] font-semibold text-primary mt-0.5">{pct}%</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {activeTab === "incidents" && (
        <>
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
            <Card className="p-4 sm:p-5">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-rose-500" />
                Incidents by Month
              </h3>
              <BarChart data={incidentsByMonth} />
            </Card>
            <Card className="p-4 sm:p-5">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Incident Status
              </h3>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <DonutChart segments={incidentStatusData.filter((s) => s.value > 0)} size={120} />
                <div className="space-y-2.5 flex-1 w-full">
                  {incidentStatusData.filter((s) => s.value > 0).map((s) => (
                    <div key={s.label} className="flex items-center gap-2.5">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-xs font-semibold text-muted-foreground flex-1">{s.label}</span>
                      <span className="text-xs font-bold text-foreground">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
          <Card className="p-4 sm:p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Incident Heatmap (Day × Month)
            </h3>
            <HeatGrid data={heatData} labels={{ rows: dayLabels, cols: heatMonthLabels }} />
          </Card>
        </>
      )}

      {activeTab === "services" && (
        <>
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
            <Card className="p-4 sm:p-5">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-500" />
                Documents by Month
              </h3>
              <BarChart data={docsByMonth} />
            </Card>
            <Card className="p-4 sm:p-5">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Document Status
              </h3>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <DonutChart segments={docStatusData.filter((s) => s.value > 0)} size={120} />
                <div className="space-y-2.5 flex-1 w-full">
                  {docStatusData.filter((s) => s.value > 0).map((s) => (
                    <div key={s.label} className="flex items-center gap-2.5">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-xs font-semibold text-muted-foreground flex-1">{s.label}</span>
                      <span className="text-xs font-bold text-foreground">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
          <Card className="p-4 sm:p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-500" />
              Complaints by Month
            </h3>
            <BarChart data={complaintsByMonth} />
          </Card>
        </>
      )}

      {activeTab === "engagement" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: "Events", value: events.length, icon: Calendar, color: "from-violet-500 to-violet-600" },
              { label: "Announcements", value: announcements.length, icon: Megaphone, color: "from-blue-500 to-blue-600" },
              { label: "Volunteers", value: volunteers.length, icon: Heart, color: "from-rose-500 to-rose-600" },
              { label: "Active Alerts", value: alerts.filter((a: any) => a.status === "active").length, icon: AlertTriangle, color: "from-amber-500 to-amber-600" },
            ].map((card) => (
              <Card key={card.label} className="p-4 relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5`} />
                <div className="relative">
                  <card.icon className="h-5 w-5 text-muted-foreground mb-2" />
                  <div className="text-xl sm:text-2xl font-extrabold"><AnimatedCounter value={card.value} /></div>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">{card.label}</div>
                </div>
              </Card>
            ))}
          </div>
          <Card className="p-4 sm:p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Monthly Engagement Trend
            </h3>
            <BarChart data={last6.map(({ m, y, label }) => ({
              label,
              value: events.filter((e: any) => { const d = getMonth(e.createdAt || e.date); return d && d.m === m && d.y === y; }).length
                + announcements.filter((a: any) => { const d = getMonth(a.createdAt); return d && d.m === m && d.y === y; }).length
                + incidents.filter((i: any) => { const d = getMonth(i.createdAt || i.date); return d && d.m === m && d.y === y; }).length,
              color: "linear-gradient(to top, #8b5cf6, #a78bfa)",
            }))} />
          </Card>
        </>
      )}
    </div>
  );
}
