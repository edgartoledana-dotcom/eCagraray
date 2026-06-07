import { useEffect, useMemo, useState } from "react";
import { Sparkles, TrendingUp, TrendingDown, Activity, Users, Heart, Shield, Zap, Brain, AlertTriangle, Lightbulb, BarChart3, ArrowRight, Target, Calendar, MapPin, FileText, Megaphone, Clock, RefreshCw, CheckCircle2 } from "lucide-react";

type Language = "en" | "fil" | "bik";

interface AIInsightsProps {
  lang: Language;
  stats?: { residents: number; households: number; volunteers: number; events: number };
  announcements?: any[];
  alerts?: any[];
  officials?: any[];
  weather?: { temp: number; condition: string; description: string } | null;
  residents?: any[];
  households?: any[];
  volunteers?: any[];
  events?: any[];
  documents?: any[];
  incidents?: any[];
  evacCenters?: any[];
}

const t = (lang: Language, en: string, fil: string, bik: string) => lang === "en" ? en : lang === "fil" ? fil : bik;

function useCountUp(target: number, duration = 1500, trigger = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    tick();
    return () => setValue(0);
  }, [target, duration, trigger]);
  return value;
}

function useInView(threshold = 0.2) {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return [setRef, inView] as const;
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-20 w-20 sm:h-24 sm:w-24">
        <svg className="h-20 w-20 sm:h-24 sm:w-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/40" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
            style={{ stroke: score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-lg sm:text-xl font-black text-foreground">{score}</span>
        </div>
      </div>
      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1.5 sm:mt-2 text-center leading-tight px-1">{label}</span>
    </div>
  );
}

function Sparkline({ data, color = "primary" }: { data: number[]; color?: string }) {
  if (!data || data.length === 0) {
    return <div className="h-12 w-full grid place-items-center text-[10px] text-muted-foreground">No data</div>;
  }
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * 100;
    const y = 100 - ((v - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");
  const fillPoints = `0,100 ${points} 100,100`;
  const stroke = color === "success" ? "#10b981" : color === "warning" ? "#f59e0b" : color === "danger" ? "#ef4444" : "#3b82f6";
  return (
    <svg className="h-12 w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.4" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#grad-${color})`} />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function MiniBar({ value, max, color = "primary" }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  const bg = color === "success" ? "bg-success" : color === "warning" ? "bg-warning" : color === "danger" ? "bg-rose-500" : "bg-primary";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
        <div className={`${bg} h-full rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold text-foreground w-8 sm:w-10 text-right tabular-nums">{value}</span>
    </div>
  );
}

function InsightCard({ icon: Icon, title, value, trend, trendUp, color = "primary", delay = 0 }: { icon: any; title: string; value: string | number; trend?: string; trendUp?: boolean; color?: string; delay?: number }) {
  const colorClass = color === "success" ? "text-success" : color === "warning" ? "text-warning" : color === "danger" ? "text-rose-500" : "text-primary";
  const bgClass = color === "success" ? "bg-success/10" : color === "warning" ? "bg-warning/10" : color === "danger" ? "bg-rose-500/10" : "bg-primary/10";
  return (
    <div
      className="relative rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-4 sm:p-5 overflow-hidden group hover:border-primary/40 transition-all duration-500"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className={`grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl ${bgClass} ${colorClass}`}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          {trend && (
            <span className={`flex items-center gap-0.5 text-[10px] font-bold ${trendUp ? "text-success" : "text-rose-500"}`}>
              {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend}
            </span>
          )}
        </div>
        <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground mt-1">{title}</div>
      </div>
    </div>
  );
}

function computeAge(birthdate: string): number {
  if (!birthdate) return 0;
  const b = new Date(birthdate);
  if (isNaN(b.getTime())) return 0;
  const ageDifMs = Date.now() - b.getTime();
  return Math.floor(ageDifMs / (365.25 * 24 * 60 * 60 * 1000));
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function AIInsights({
  lang,
  stats,
  announcements = [],
  alerts = [],
  officials = [],
  weather,
  residents = [],
  households = [],
  volunteers = [],
  events = [],
  documents = [],
  incidents = [],
  evacCenters = [],
}: AIInsightsProps) {
  const [ref, inView] = useInView(0.15);
  const [activeTab, setActiveTab] = useState<"overview" | "predictions" | "recommendations">("overview");
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const totalResidents = residents.length > 0 ? residents.length : (stats?.residents || 0);
  const totalHouseholds = households.length > 0 ? households.length : (stats?.households || 0);
  const totalVolunteers = volunteers.length > 0 ? volunteers.length : (stats?.volunteers || 0);
  const totalEvents = events.length > 0 ? events.length : (stats?.events || 0);
  const totalDocuments = documents.length;
  const totalIncidents = incidents.length;
  const totalEvac = evacCenters.length;

  const monthBuckets = useMemo(() => {
    const buckets: Record<string, number> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets[monthKey(d)] = 0;
    }
    residents.forEach((r: any) => {
      if (r.createdAt) {
        const d = new Date(r.createdAt);
        if (!isNaN(d.getTime())) {
          const k = monthKey(d);
          if (k in buckets) buckets[k]++;
        }
      }
    });
    return Object.values(buckets);
  }, [residents]);

  const cumulativeTrend = useMemo(() => {
    const cumulative: number[] = [];
    let running = Math.max(0, totalResidents - monthBuckets.reduce((a, b) => a + b, 0));
    monthBuckets.forEach((count) => {
      running += count;
      cumulative.push(running);
    });
    if (cumulative.every((v) => v === 0)) {
      const target = totalResidents;
      if (target > 0) {
        return Array.from({ length: 12 }, (_, i) => Math.floor((target * (i + 1)) / 12));
      }
    }
    return cumulative.length > 0 ? cumulative : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  }, [monthBuckets, totalResidents]);

  const trendDelta = useMemo(() => {
    if (cumulativeTrend.length < 2) return 0;
    const last = cumulativeTrend[cumulativeTrend.length - 1];
    const prev = cumulativeTrend[cumulativeTrend.length - 2];
    return prev > 0 ? ((last - prev) / prev) * 100 : 0;
  }, [cumulativeTrend]);

  const documentWeeklyTrend = useMemo(() => {
    const buckets = new Array(7).fill(0);
    const now = new Date();
    documents.forEach((d: any) => {
      if (d.createdAt) {
        const date = new Date(d.createdAt);
        if (!isNaN(date.getTime())) {
          const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
          if (daysAgo >= 0 && daysAgo < 7) {
            buckets[6 - daysAgo]++;
          }
        }
      }
    });
    return buckets;
  }, [documents]);

  const alertWeeklyTrend = useMemo(() => {
    const buckets = new Array(7).fill(0);
    const now = new Date();
    alerts.forEach((a: any) => {
      const date = new Date(a.createdAt || a.date || now);
      if (!isNaN(date.getTime())) {
        const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (daysAgo >= 0 && daysAgo < 7) {
          buckets[6 - daysAgo]++;
        }
      }
    });
    return buckets;
  }, [alerts]);

  const announcementWeeklyTrend = useMemo(() => {
    const buckets = new Array(7).fill(0);
    const now = new Date();
    announcements.forEach((a: any) => {
      const date = new Date(a.createdAt || a.date || now);
      if (!isNaN(date.getTime())) {
        const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (daysAgo >= 0 && daysAgo < 7) {
          buckets[6 - daysAgo]++;
        }
      }
    });
    return buckets;
  }, [announcements]);

  const ageDistribution = useMemo(() => {
    const groups = { youth: 0, adult: 0, senior: 0 };
    residents.forEach((r: any) => {
      const age = computeAge(r.birthdate);
      if (age > 0 && age < 18) groups.youth++;
      else if (age >= 18 && age < 60) groups.adult++;
      else if (age >= 60) groups.senior++;
    });
    return groups;
  }, [residents]);

  const genderDistribution = useMemo(() => {
    const male = residents.filter((r: any) => (r.gender || "").toLowerCase() === "male").length;
    const female = residents.filter((r: any) => (r.gender || "").toLowerCase() === "female").length;
    return { male, female, total: male + female };
  }, [residents]);

  const purokDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    residents.forEach((r: any) => {
      const purok = r.purok || "Unspecified";
      counts[purok] = (counts[purok] || 0) + 1;
    });
    const entries = Object.entries(counts)
      .map(([name, count]) => ({ name, residents: count }))
      .sort((a, b) => b.residents - a.residents)
      .slice(0, 6);
    return entries;
  }, [residents]);

  const documentStatus = useMemo(() => {
    const status = { pending: 0, approved: 0, rejected: 0, completed: 0 };
    documents.forEach((d: any) => {
      const s = (d.status || "").toLowerCase();
      if (s === "pending") status.pending++;
      else if (s === "approved") status.approved++;
      else if (s === "rejected") status.rejected++;
      else if (s === "completed" || s === "released") status.completed++;
    });
    return status;
  }, [documents]);

  const incidentByClassification = useMemo(() => {
    const counts: Record<string, number> = {};
    incidents.forEach((i: any) => {
      const cls = i.classification || i.type || "Other";
      counts[cls] = (counts[cls] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [incidents]);

  const communityScore = useMemo(() => {
    let score = 70;
    if (alerts.filter((a: any) => a.status === "active").length === 0) score += 12;
    else if (alerts.filter((a: any) => a.status === "active").length > 3) score -= 15;
    if (totalVolunteers >= 20) score += 8;
    else if (totalVolunteers >= 10) score += 4;
    if (totalEvents >= 10) score += 6;
    else if (totalEvents >= 5) score += 3;
    if (announcements.length > 0) score += 4;
    return Math.max(0, Math.min(100, score));
  }, [alerts, totalVolunteers, totalEvents, announcements]);

  const safetyScore = useMemo(() => {
    const activeAlerts = alerts.filter((a: any) => a.status === "active").length;
    const recentIncidents = incidents.filter((i: any) => {
      if (!i.createdAt) return false;
      const daysAgo = (Date.now() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30;
    }).length;
    let score = 95;
    score -= activeAlerts * 8;
    score -= Math.min(30, recentIncidents * 2);
    if (weather?.condition === "rain") score -= 5;
    return Math.max(0, Math.min(100, score));
  }, [alerts, incidents, weather]);

  const engagementScore = useMemo(() => {
    let score = 60;
    const docApprovalRate = totalDocuments > 0 ? (documentStatus.approved + documentStatus.completed) / totalDocuments : 0;
    if (totalEvents >= 10) score += 12;
    else if (totalEvents >= 5) score += 7;
    if (totalVolunteers >= 30) score += 12;
    else if (totalVolunteers >= 15) score += 6;
    if (announcements.length >= 5) score += 8;
    if (docApprovalRate > 0.7) score += 8;
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [totalEvents, totalVolunteers, announcements, totalDocuments, documentStatus]);

  const volunteersChange = useMemo(() => {
    if (volunteers.length === 0) return 0;
    const now = new Date();
    const thisMonth = volunteers.filter((v: any) => {
      if (!v.createdAt) return false;
      const d = new Date(v.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const lastMonth = volunteers.filter((v: any) => {
      if (!v.createdAt) return false;
      const d = new Date(v.createdAt);
      const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lastM.getMonth() && d.getFullYear() === lastM.getFullYear();
    }).length;
    if (lastMonth === 0) return thisMonth > 0 ? 100 : 0;
    return Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
  }, [volunteers]);

  const eventsChange = useMemo(() => {
    if (events.length === 0) return 0;
    const now = new Date();
    const thisMonth = events.filter((e: any) => {
      const d = new Date(e.createdAt || e.date || 0);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const lastMonth = events.filter((e: any) => {
      const d = new Date(e.createdAt || e.date || 0);
      const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lastM.getMonth() && d.getFullYear() === lastM.getFullYear();
    }).length;
    if (lastMonth === 0) return thisMonth > 0 ? 100 : 0;
    return Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
  }, [events]);

  const documentsChange = useMemo(() => {
    if (documents.length === 0) return 0;
    const now = new Date();
    const thisWeek = documents.filter((d: any) => {
      if (!d.createdAt) return false;
      const daysAgo = (Date.now() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 7;
    }).length;
    const lastWeek = documents.filter((d: any) => {
      if (!d.createdAt) return false;
      const daysAgo = (Date.now() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo > 7 && daysAgo <= 14;
    }).length;
    if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
    return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  }, [documents]);

  const householdsChange = useMemo(() => {
    if (households.length === 0) return 0;
    const now = new Date();
    const thisMonth = households.filter((h: any) => {
      if (!h.createdAt) return false;
      const d = new Date(h.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const lastMonth = households.filter((h: any) => {
      if (!h.createdAt) return false;
      const d = new Date(h.createdAt);
      const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lastM.getMonth() && d.getFullYear() === lastM.getFullYear();
    }).length;
    if (lastMonth === 0) return thisMonth > 0 ? 100 : 0;
    return Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
  }, [households]);

  const recommendations = useMemo(() => {
    const recs: Array<{ icon: any; title: string; description: string; priority: "high" | "medium" | "low" }> = [];
    const activeAlertsList = alerts.filter((a: any) => a.status === "active");

    if (activeAlertsList.length > 0) {
      recs.push({
        icon: AlertTriangle,
        title: t(lang, "Active Alert Response", "Pang-emergency na tugon", "Emergency tugon"),
        description: t(lang,
          `Review and respond to ${activeAlertsList.length} active alert${activeAlertsList.length > 1 ? "s" : ""} to keep residents informed and safe.`,
          `Suriin at tumugon sa ${activeAlertsList.length} na aktibong alerto para mapanatiling ligtas ang mga residente.`,
          `Surion asin tumugon sa ${activeAlertsList.length} na aktibong alerto.`
        ),
        priority: "high",
      });
    }

    if (totalVolunteers < 20) {
      recs.push({
        icon: Users,
        title: t(lang, "Volunteer Recruitment", "Recruitment ng Boluntaryo", "Recruitment nin Boluntaryo"),
        description: t(lang,
          `Only ${totalVolunteers} volunteer${totalVolunteers === 1 ? "" : "s"} registered. Launch a volunteer drive to strengthen community response capacity.`,
          `Tanging ${totalVolunteers} ang boluntaryo. Magsimula ng volunteer drive para palakasin ang kapasidad.`,
          `Tanging ${totalVolunteers} an boluntaryo. Magsimula nin volunteer drive.`
        ),
        priority: "medium",
      });
    }

    if (announcements.length < 3) {
      recs.push({
        icon: Megaphone,
        title: t(lang, "Increase Engagement", "Dagdagan ang Engagement", "Dagdagan an Engagement"),
        description: t(lang,
          `Post more community updates — only ${announcements.length} recent announcement${announcements.length === 1 ? "" : "s"} found.`,
          `Mag-post ng maraming update — tanging ${announcements.length} lang ang na-publish.`,
          `Mag-post nin maraming update — tanging ${announcements.length} lang.`
        ),
        priority: "low",
      });
    }

    if (documentStatus.pending > 5) {
      recs.push({
        icon: FileText,
        title: t(lang, "Pending Documents", "Nakabinbing Dokumento", "Nakabembing na Dokumento"),
        description: t(lang,
          `${documentStatus.pending} document request${documentStatus.pending > 1 ? "s" : ""} awaiting action. Process them promptly to maintain service quality.`,
          `${documentStatus.pending} na dokumento ang naghihintay ng aksyon.`,
          `${documentStatus.pending} na dokumento an naghihintay.`
        ),
        priority: "high",
      });
    }

    if (communityScore < 75) {
      recs.push({
        icon: Heart,
        title: t(lang, "Community Wellness", "Kalusugan ng Komunidad", "Kalusugan kan Komunidad"),
        description: t(lang,
          "Consider hosting wellness programs and health missions to boost the community well-being score.",
          "Mag-host ng wellness programs para mapabuti ang kalusugan ng komunidad.",
          "Mag-host nin wellness programs para mapabuti."
        ),
        priority: "medium",
      });
    }

    if (weather?.condition === "rain") {
      recs.push({
        icon: Shield,
        title: t(lang, "Flood Preparedness", "Paghahanda sa Baha", "Paghahanda sa Baha"),
        description: t(lang,
          `Current rainy conditions (${weather.temp}°C) — ensure drainage systems are clear and supplies are stocked.`,
          `Kasalukuyang ulan (${weather.temp}°C) — tiyaking malinis ang drainage at may sapat na supply.`,
          `Kasalukuyan na ulan (${weather.temp}°C) — tiyaking malinig an drainage.`
        ),
        priority: "high",
      });
    }

    if (totalIncidents > 0 && incidentByClassification.length > 0) {
      const top = incidentByClassification[0];
      recs.push({
        icon: Activity,
        title: t(lang, "Incident Pattern", "Pattern ng Insidente", "Pattern kan Insidente"),
        description: t(lang,
          `${top.value} ${top.name} incident${top.value > 1 ? "s" : ""} reported. Review safety protocols for this category.`,
          `${top.value} na ${top.name} ang nai-report. Suriin ang safety protocols.`,
          `${top.value} na ${top.name} an nai-report. Surion an protocols.`
        ),
        priority: "medium",
      });
    }

    if (recs.length === 0) {
      recs.push({
        icon: CheckCircle2,
        title: t(lang, "All Systems Healthy", "Maayos ang Lahat", "Maayos an Gabos"),
        description: t(lang,
          "Community metrics look strong. Continue current programs and monitor for changes.",
          "Maayos ang lahat ng sistema. Patuloy sa current programs.",
          "Maayos an gabos. Magpadayon sa mga programa."
        ),
        priority: "low",
      });
    }

    return recs.slice(0, 5);
  }, [alerts, totalVolunteers, announcements, documentStatus, communityScore, weather, totalIncidents, incidentByClassification, lang]);

  const predictions = useMemo(() => {
    const nextMonthEstimate = cumulativeTrend.length > 0
      ? cumulativeTrend[cumulativeTrend.length - 1] + Math.max(1, monthBuckets[monthBuckets.length - 1] || 0)
      : Math.floor(totalResidents * 1.012);

    const growth = Math.max(0, nextMonthEstimate - totalResidents);
    const docTotal = documentWeeklyTrend.reduce((a, b) => a + b, 0);
    const lastWeekDocs = Math.max(1, docTotal);

    return [
      {
        icon: TrendingUp,
        title: t(lang, "Population Growth", "Paglago ng Populasyon", "Pagdakula nin Populasyon"),
        value: `+${growth}`,
        description: t(lang,
          `Based on ${monthBuckets[monthBuckets.length - 1] || 0} new resident${(monthBuckets[monthBuckets.length - 1] || 0) === 1 ? "" : "s"} added this month.`,
          `Batay sa ${monthBuckets[monthBuckets.length - 1] || 0} na bagong residente ngayong buwan.`,
          `Batay sa ${monthBuckets[monthBuckets.length - 1] || 0} na bagong residente.`
        ),
        confidence: Math.min(95, 60 + Math.min(35, residents.length / 5)),
      },
      {
        icon: Activity,
        title: t(lang, "Service Demand", "Demand sa Serbisyo", "Demand sa Serbisyo"),
        value: t(lang, documentsChange > 10 ? "Rising" : documentsChange < -10 ? "Dropping" : "Stable",
                  documentsChange > 10 ? "Tumataas" : documentsChange < -10 ? "Bumababa" : "Stable",
                  documentsChange > 10 ? "Tatahaw" : documentsChange < -10 ? "Bababa" : "Stable"),
        description: t(lang,
          `${docTotal} document request${docTotal === 1 ? "" : "s"} this week. ${documentsChange > 0 ? `+${documentsChange}%` : documentsChange < 0 ? `${documentsChange}%` : "No change"} vs last week.`,
          `${docTotal} na dokumento ngayong linggo. ${documentsChange > 0 ? `+${documentsChange}%` : documentsChange < 0 ? `${documentsChange}%` : "Walang pagbabago"}.`,
          `${docTotal} na dokumento ngayong linggo. ${documentsChange > 0 ? `+${documentsChange}%` : documentsChange < 0 ? `${documentsChange}%` : "Mayong pagbabago"}.`
        ),
        confidence: Math.min(95, 50 + Math.min(40, totalDocuments)),
      },
      {
        icon: Shield,
        title: t(lang, "Disaster Risk", "Risk sa Kalamidad", "Risk sa Kalamidad"),
        value: t(lang,
          weather?.condition === "rain" ? "Elevated" : alerts.filter((a: any) => a.status === "active").length > 2 ? "Moderate" : "Low",
          weather?.condition === "rain" ? "Mataas" : alerts.filter((a: any) => a.status === "active").length > 2 ? "Katamtaman" : "Mababa",
          weather?.condition === "rain" ? "Mataas" : alerts.filter((a: any) => a.status === "active").length > 2 ? "Medyo" : "Mababa"
        ),
        description: t(lang,
          weather?.condition === "rain"
            ? `Heavy rains detected (${weather.temp}°C) — recommend activating emergency protocols.`
            : alerts.filter((a: any) => a.status === "active").length > 2
              ? `${alerts.filter((a: any) => a.status === "active").length} active alerts require monitoring.`
              : "Clear weather pattern, low risk of weather-related incidents.",
          weather?.condition === "rain"
            ? `Malakas na ulan (${weather.temp}°C) — i-activate ang emergency protocols.`
            : alerts.filter((a: any) => a.status === "active").length > 2
              ? `${alerts.filter((a: any) => a.status === "active").length} na aktibong alerto.`
              : "Magandang panahon, mababang risk.",
          weather?.condition === "rain"
            ? `Malakas na ulan (${weather.temp}°C).`
            : alerts.filter((a: any) => a.status === "active").length > 2
              ? `${alerts.filter((a: any) => a.status === "active").length} na alerto.`
              : "Magayong panahon."
        ),
        confidence: 80,
      },
    ];
  }, [cumulativeTrend, monthBuckets, totalResidents, residents, documentWeeklyTrend, documentsChange, totalDocuments, weather, alerts, lang]);

  const forecastSummary = useMemo(() => {
    const activeAlertCount = alerts.filter((a: any) => a.status === "active").length;
    const pendingDocs = documentStatus.pending;
    const growth = trendDelta;
    const newThisMonth = monthBuckets[monthBuckets.length - 1] || 0;

    if (lang === "en") {
      const parts: string[] = [];
      if (newThisMonth > 0) {
        parts.push(`${newThisMonth} new resident${newThisMonth === 1 ? " was" : "s were"} registered this month, with population ${growth > 0 ? "growing" : "stable"} at ${Math.abs(growth).toFixed(1)}% month-over-month.`);
      } else {
        parts.push(`Population stands at ${totalResidents} with no new registrations this month.`);
      }
      if (activeAlertCount > 0) {
        parts.push(`${activeAlertCount} active alert${activeAlertCount === 1 ? "" : "s"} require${activeAlertCount === 1 ? "s" : ""} attention.`);
      } else {
        parts.push("No active alerts at this time — community safety is strong.");
      }
      if (pendingDocs > 0) {
        parts.push(`${pendingDocs} document request${pendingDocs === 1 ? "" : "s"} ${pendingDocs === 1 ? "is" : "are"} pending review.`);
      }
      if (weather?.condition === "rain") {
        parts.push(`Weather alert: rainy conditions (${weather.temp}°C) detected — flood preparedness is advised.`);
      }
      parts.push(`Overall community health score: ${communityScore}/100.`);
      return parts.join(" ");
    } else if (lang === "fil") {
      const parts: string[] = [];
      if (newThisMonth > 0) {
        parts.push(`${newThisMonth} na bagong residente ngayong buwan, may paglago na ${Math.abs(growth).toFixed(1)}%.`);
      } else {
        parts.push(`Ang populasyon ay ${totalResidents}, walang bagong rehistro ngayong buwan.`);
      }
      if (activeAlertCount > 0) {
        parts.push(`${activeAlertCount} na aktibong alerto ang nangangailangan ng atensyon.`);
      } else {
        parts.push("Walang aktibong alerto — malakas ang kaligtasan ng komunidad.");
      }
      if (pendingDocs > 0) {
        parts.push(`${pendingDocs} na dokumento ang nakabinbin.`);
      }
      if (weather?.condition === "rain") {
        parts.push(`Ulan ngayon (${weather.temp}°C) — maghanda para sa baha.`);
      }
      parts.push(`Overall na kalusugan ng komunidad: ${communityScore}/100.`);
      return parts.join(" ");
    } else {
      const parts: string[] = [];
      if (newThisMonth > 0) {
        parts.push(`${newThisMonth} na bagong residente ngayong bulan, may pagdakula na ${Math.abs(growth).toFixed(1)}%.`);
      } else {
        parts.push(`An populasyon ${totalResidents}, mayong bagong rehistro ngayong bulan.`);
      }
      if (activeAlertCount > 0) {
        parts.push(`${activeAlertCount} na aktibong alerto an nangangaipo nin atensyon.`);
      } else {
        parts.push("Mayong aktibong alerto — malakas an kaligtasan.");
      }
      if (pendingDocs > 0) {
        parts.push(`${pendingDocs} na dokumento an nakabembing.`);
      }
      if (weather?.condition === "rain") {
        parts.push(`Ulan ngayon (${weather.temp}°C) — magprepara para sa baha.`);
      }
      parts.push(`Kabusogan kan komunidad: ${communityScore}/100.`);
      return parts.join(" ");
    }
  }, [alerts, documentStatus, trendDelta, monthBuckets, totalResidents, weather, communityScore, lang]);

  const animatedResidents = useCountUp(totalResidents, 1500, inView);
  const animatedHouseholds = useCountUp(totalHouseholds, 1500, inView);
  const animatedVolunteers = useCountUp(totalVolunteers, 1500, inView);
  const animatedEvents = useCountUp(totalEvents, 1500, inView);

  const maxPurokRes = Math.max(...purokDistribution.map((p) => p.residents), 1);
  const lastSyncStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  const isEmpty = residents.length === 0 && households.length === 0 && volunteers.length === 0 && events.length === 0 && documents.length === 0 && incidents.length === 0;

  return (
    <section ref={ref} className="py-16 sm:py-24 transition-colors">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="text-center space-y-4 mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
            <Brain className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
              {t(lang, "AI-Powered Analytics", "AI-Powered Analytics", "AI-Powered Analytics")}
            </span>
            <Sparkles className="h-3 w-3 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight text-foreground font-display">
            {t(lang, "Intelligent Community Insights", "Matalinong mga Insight", "Matalinong mga Insight")}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            {t(lang, "Real-time AI analysis of community data, trends, and recommendations powered by smart algorithms.", "Real-time na pagsusuri ng data ng komunidad at mga mungkahi.", "Real-time na pagsusuri kan data asin mga mungkahi.")}
          </p>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground bg-muted/40 rounded-full px-3 py-1">
            <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: "8s" }} />
            {t(lang, `Last updated ${lastSyncStr}`, `Huling update ${lastSyncStr}`, `Huling update ${lastSyncStr}`)}
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            {t(lang, "Live", "Live", "Live")}
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <div className="inline-flex gap-1 bg-muted/40 p-1 rounded-xl border border-border/40 overflow-x-auto max-w-full">
            {[
              { id: "overview", label: t(lang, "Overview", "Buod", "Buod"), icon: BarChart3 },
              { id: "predictions", label: t(lang, "AI Predictions", "Mga Hula", "Mga Hula"), icon: Brain },
              { id: "recommendations", label: t(lang, "Recommendations", "Mga Mungkahi", "Mga Mungkahi"), icon: Lightbulb },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-lg transition-all duration-300 min-h-[40px] sm:min-h-[44px] shrink-0 ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isEmpty && (
          <div className="rounded-2xl border border-warning/30 bg-warning/5 backdrop-blur-md p-4 sm:p-5 mb-6 flex items-start gap-3">
            <Clock className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-muted-foreground">
              <strong className="text-foreground">{t(lang, "Awaiting real-time data…", "Naghihintay ng data…", "Naghihintay nin data…")}</strong>{" "}
              {t(lang,
                "Database is loading. Insights will update automatically once records sync (every 30 seconds).",
                "Naglo-load ang database. Mag-aauto-update ang mga insight tuwing 30 segundo.",
                "Naglo-load an database. Mag-aauto-update an mga insight kada 30 segundo."
              )}
            </div>
          </div>
        )}

        {activeTab === "overview" && (
          <div className="space-y-6 animate-ai-fade-in">
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
              <InsightCard icon={Users} title={t(lang, "Residents", "Residente", "Residente")} value={animatedResidents} trend={trendDelta !== 0 ? `${trendDelta > 0 ? "+" : ""}${trendDelta.toFixed(1)}%` : undefined} trendUp={trendDelta >= 0} color="primary" delay={0} />
              <InsightCard icon={Heart} title={t(lang, "Households", "Household", "Household")} value={animatedHouseholds} trend={householdsChange !== 0 ? `${householdsChange > 0 ? "+" : ""}${householdsChange}%` : undefined} trendUp={householdsChange >= 0} color="success" delay={100} />
              <InsightCard icon={Zap} title={t(lang, "Volunteers", "Boluntaryo", "Boluntaryo")} value={animatedVolunteers} trend={volunteersChange !== 0 ? `${volunteersChange > 0 ? "+" : ""}${volunteersChange}%` : undefined} trendUp={volunteersChange >= 0} color="warning" delay={200} />
              <InsightCard icon={Calendar} title={t(lang, "Events", "Event", "Event")} value={animatedEvents} trend={eventsChange !== 0 ? `${eventsChange > 0 ? "+" : ""}${eventsChange}%` : undefined} trendUp={eventsChange >= 0} color="primary" delay={300} />
            </div>

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-2xl sm:rounded-3xl border border-border/40 bg-card/60 backdrop-blur-md p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-5 flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight">{t(lang, "Population Trend", "Trend ng Populasyon", "Trend kan Populasyon")}</h3>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">{t(lang, "Last 12 months (cumulative)", "Nakaraang 12 buwan", "Nakaraang 12 buwan")}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-success">
                    <TrendingUp className="h-3 w-3" />
                    {trendDelta > 0 ? `+${trendDelta.toFixed(1)}%` : trendDelta < 0 ? `${trendDelta.toFixed(1)}%` : "0%"}
                  </div>
                </div>
                <div className="h-20 sm:h-24 mb-3">
                  <Sparkline data={cumulativeTrend} color="primary" />
                </div>
                <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-muted-foreground font-medium">
                  <span>Jan</span>
                  <span>Mar</span>
                  <span>May</span>
                  <span>Jul</span>
                  <span>Sep</span>
                  <span>Nov</span>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-border/20">
                  <div>
                    <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t(lang, "Peak", "Pinakamataas", "Pinakamataas")}</div>
                    <div className="text-base sm:text-lg font-black text-foreground tabular-nums">{Math.max(...cumulativeTrend, 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t(lang, "Total", "Kabuuan", "Kabuuan")}</div>
                    <div className="text-base sm:text-lg font-black text-foreground tabular-nums">{totalResidents.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t(lang, "Growth", "Paglago", "Pagdakula")}</div>
                    <div className="text-base sm:text-lg font-black text-success tabular-nums">
                      {trendDelta > 0 ? `+${trendDelta.toFixed(1)}%` : "—"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="rounded-2xl sm:rounded-3xl border border-border/40 bg-card/60 backdrop-blur-md p-4 sm:p-5">
                  <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight mb-3 sm:mb-4 flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    {t(lang, "Health Scores", "Mga Score", "Mga Score")}
                  </h3>
                  <div className="grid grid-cols-3 gap-1 sm:gap-2">
                    <ScoreRing score={communityScore} label={t(lang, "Community", "Komunidad", "Komunidad")} />
                    <ScoreRing score={safetyScore} label={t(lang, "Safety", "Kaligtasan", "Kaligtasan")} />
                    <ScoreRing score={engagementScore} label={t(lang, "Engagement", "Engagement", "Engagement")} />
                  </div>
                </div>

                <div className="rounded-2xl sm:rounded-3xl border border-border/40 bg-card/60 backdrop-blur-md p-4 sm:p-5">
                  <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    {t(lang, "Activity This Week", "Aktibidad", "Aktibidad")}
                  </h3>
                  <div className="space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] mb-1">
                        <span className="font-semibold text-muted-foreground">{t(lang, "Documents", "Dokumento", "Dokumento")}</span>
                        <span className="font-bold text-foreground tabular-nums">{documentWeeklyTrend.reduce((a, b) => a + b, 0)}</span>
                      </div>
                      <MiniBar value={documentWeeklyTrend.reduce((a, b) => a + b, 0)} max={Math.max(...documentWeeklyTrend, 1) * 7 || 30} color="primary" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] mb-1">
                        <span className="font-semibold text-muted-foreground">{t(lang, "Alerts", "Alerto", "Alerto")}</span>
                        <span className="font-bold text-foreground tabular-nums">{alertWeeklyTrend.reduce((a, b) => a + b, 0)}</span>
                      </div>
                      <MiniBar value={alertWeeklyTrend.reduce((a, b) => a + b, 0)} max={Math.max(5, ...alertWeeklyTrend)} color="warning" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] mb-1">
                        <span className="font-semibold text-muted-foreground">{t(lang, "Announcements", "Anunsiyo", "Anunsiyo")}</span>
                        <span className="font-bold text-foreground tabular-nums">{announcementWeeklyTrend.reduce((a, b) => a + b, 0)}</span>
                      </div>
                      <MiniBar value={announcementWeeklyTrend.reduce((a, b) => a + b, 0)} max={Math.max(5, ...announcementWeeklyTrend)} color="success" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl sm:rounded-3xl border border-border/40 bg-card/60 backdrop-blur-md p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {t(lang, "Population by Purok", "Populasyon kada Purok", "Populasyon kada Purok")}
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-bold text-success uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  {t(lang, "Live", "Live", "Live")}
                </span>
              </div>
              {purokDistribution.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-6">
                  {t(lang, "No purok data available yet.", "Walang purok data.", "Mayong purok data.")}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {purokDistribution.map((p, i) => {
                    const colorOptions = ["primary", "success", "warning", "primary", "success", "warning"];
                    return (
                      <div key={p.name} className="flex items-center gap-3">
                        <span className="text-[10px] sm:text-[11px] font-bold text-foreground w-16 sm:w-20 truncate">{p.name}</span>
                        <div className="flex-1">
                          <MiniBar value={p.residents} max={maxPurokRes} color={colorOptions[i % colorOptions.length] as any} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "predictions" && (
          <div className="space-y-4 sm:space-y-6 animate-ai-fade-in">
            <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
              {predictions.map((pred, i) => (
                <div
                  key={i}
                  className="rounded-2xl sm:rounded-3xl border border-border/40 bg-card/60 backdrop-blur-md p-5 sm:p-6 relative overflow-hidden group"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                        <pred.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="flex items-center gap-1 text-[9px] font-bold text-primary">
                        <Sparkles className="h-2.5 w-2.5" />
                        AI
                      </div>
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{pred.title}</div>
                    <div className="text-xl sm:text-2xl font-black text-foreground mb-2">{pred.value}</div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">{pred.description}</p>
                    <div className="mt-3 sm:mt-4 pt-3 border-t border-border/20 flex items-center justify-between">
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t(lang, "Confidence", "Katiyakan", "Katiyakan")}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-16 sm:w-20 bg-muted/50 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pred.confidence}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-foreground tabular-nums">{Math.round(pred.confidence)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl sm:rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/5 via-card/60 to-card/60 backdrop-blur-md p-5 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-2xl bg-primary/15 text-primary shrink-0">
                  <Brain className="h-5 w-5 sm:h-6 sm:w-6 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-foreground mb-1 sm:mb-2 flex items-center gap-2 flex-wrap">
                    {t(lang, "AI Forecast Summary", "AI Buod ng Hula", "AI Buod")}
                    <span className="text-[9px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {t(lang, "Live", "Live", "Live")}
                    </span>
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{forecastSummary}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "recommendations" && (
          <div className="space-y-3 sm:space-y-4 animate-ai-fade-in">
            {recommendations.map((rec, i) => {
              const priorityColor = rec.priority === "high" ? "danger" : rec.priority === "medium" ? "warning" : "primary";
              const priorityBg = rec.priority === "high" ? "bg-rose-500/10 border-rose-500/30" : rec.priority === "medium" ? "bg-warning/10 border-warning/30" : "bg-primary/10 border-primary/30";
              const iconColor = rec.priority === "high" ? "text-rose-500" : rec.priority === "medium" ? "text-warning" : "text-primary";
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-4 sm:p-5 hover:border-primary/40 transition-all duration-300 group"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-2xl shrink-0 ${priorityBg} ${iconColor}`}>
                      <rec.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="text-sm sm:text-base font-black text-foreground tracking-tight">{rec.title}</h4>
                        <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${priorityBg} ${iconColor}`}>
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 hidden sm:block" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalDocuments > 0 && (
          <div className="mt-6 grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 text-center">
            {[
              { label: t(lang, "Pending", "Nakabinbin", "Nakabembing"), value: documentStatus.pending, color: "text-warning" },
              { label: t(lang, "Approved", "Aprubado", "Aprubado"), value: documentStatus.approved, color: "text-success" },
              { label: t(lang, "Rejected", "Tinanggihan", "Tinanggihan"), value: documentStatus.rejected, color: "text-rose-500" },
              { label: t(lang, "Released", "Inilabas", "Inilabas"), value: documentStatus.completed, color: "text-primary" },
            ].map((stat, i) => (
              <div key={i} className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-3 sm:p-4">
                <div className={`text-xl sm:text-2xl font-black tabular-nums ${stat.color}`}>{stat.value}</div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
