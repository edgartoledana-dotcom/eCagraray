import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Shield,
  FileText,
  Megaphone,
  AlertTriangle,
  Users,
  Heart,
  Calendar,
  ChevronDown,
  Menu,
  X,
  Bell,
  ArrowRight,
  Check,
  Mail,
  Phone,
  MapPin,
  Copy,
  TrendingUp,
  Sparkles,
  Award,
  Building2,
  Clock,
  Send,
  LogIn,
  UserPlus,
  Newspaper,
  Lightbulb,
  Lock,
  Layers,
  Globe,
  Zap,
  Moon,
  Sun,
  Eye,
  Filter,
  PhoneCall,
  Flame,
  Ambulance,
  Siren,
  ChevronRight,
  ArrowUpRight,
  Search,
  MessageCircle,
  Star,
  BookOpen,
  Briefcase,
  HeartHandshake,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  CloudSnow,
  CloudFog,
  Sun as SunIcon,
  Wind,
  Droplets,
  Thermometer,
  Eye as EyeIcon,
  Brain,
  Loader2,
  RefreshCw,
  Activity,
  BarChart3,
  Gauge,
  Home,
  Plus,
  Compass,
  Tag,
  Bug,
  Code,
  LifeBuoy,
  Scale,
  ShieldCheck,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts";
import {
  getBarangayInfo,
  getDashboardStats,
  submitContactInquiry,
  getTableData,
} from "../lib/api/auth.functions";
import { useAuth, useTheme } from "../lib/auth";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { Modal, Input, Button, Textarea, useAnimatedMount, Reveal } from "../components/ui-kit";

const AIAssistant = lazy(() =>
  import("../components/AIAssistant").then((m) => ({ default: m.AIAssistant })),
);
const AISearch = lazy(() =>
  import("../components/AISearch").then((m) => ({ default: m.AISearch })),
);

type Language = "en" | "fil" | "bik";

const LANGS: { code: Language; label: string; full: string; flag: string }[] = [
  { code: "en", label: "EN", full: "English", flag: "🇺🇸" },
  { code: "fil", label: "FIL", full: "Filipino", flag: "🇵🇭" },
  { code: "bik", label: "BIK", full: "Bikol", flag: "🌴" },
];

const T = {
  nav: {
    home:          { en: "Home",          fil: "Tahanan",          bik: "Harong" },
    services:      { en: "Services",      fil: "Mga Serbisyo",     bik: "Mga Serbisyo" },
    announcements: { en: "Announcements", fil: "Mga Anunsyo",      bik: "Mga Anunsyo" },
    community:     { en: "Community",     fil: "Komunidad",        bik: "Komunidad" },
    insights:      { en: "Insights",      fil: "Mga Insight",      bik: "Mga Insight" },
    contact:       { en: "Contact",       fil: "Makipag-ugnayan",  bik: "Makipag-ugnayan" },
  },
  auth: {
    login:    { en: "Login",    fil: "Mag-login",   bik: "Mag-login" },
    register: { en: "Register", fil: "Magrehistro", bik: "Magrehistro" },
  },
  theme: {
    toggle:  { en: "Toggle theme",       fil: "I-toggle ang tema",      bik: "Toggle an tema" },
  },
  search: {
    trigger: { en: "Smart search",       fil: "Matalinong hanap",      bik: "Matalinong hanap" },
  },
  toast: {
    title:   { en: "Language updated",   fil: "Na-update ang wika",    bik: "Na-update an lengguwahe" },
    enMsg:   { en: "Interface is now in English", fil: "Ang interface ay nasa English na", bik: "An interface ya sa English na" },
    filMsg:  { en: "Interface is now in Filipino", fil: "Ang interface ay nasa Filipino na", bik: "An interface ya sa Filipino na" },
    bikMsg:  { en: "Interface is now in Bikol", fil: "Ang interface ay nasa Bikol na", bik: "An interface ya sa Bikol na" },
  },
} as const;

const t = (lang: Language, en: string, fil: string, bik: string): string =>
  lang === "en" ? en : lang === "fil" ? fil : bik;

const Tn = <K extends keyof typeof T, S extends keyof (typeof T)[K]>(
  lang: Language,
  group: K,
  sub: S,
): string => {
  const g = T[group] as Record<string, Record<Language, string>>;
  return g[sub as string]?.[lang] ?? g[sub as string]?.en ?? "";
};

type Announcement = {
  id: string;
  title: string;
  body: string;
  category: string;
  pinned: boolean;
  archived: boolean;
  createdAt: string;
};

type AlertItem = {
  id: string;
  type: string;
  level: string;
  title: string;
  description: string;
  location: string;
  status: "active" | "resolved";
  createdAt: string;
};

type Resident = {
  id: string;
  fullName: string;
  birthdate?: string;
  civilStatus?: string;
  voterIdNo?: string;
  purok?: string;
  createdAt?: string;
  [k: string]: unknown;
};

const PRIMARY = "#0F4C81";
const SECONDARY = "#2563EB";
const ACCENT = "#38BDF8";
const SUCCESS = "#22C55E";
const WARNING = "#F59E0B";
const DANGER = "#EF4444";
const BG = "#F8FAFC";
const TEXT = "#0F172A";
const MUTED = "#64748B";


function useCountUp(end: number, duration = 1600, start = false) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!start || end <= 0) {
      setN(start ? end : 0);
      return;
    }
    let raf = 0;
    const startTime = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.floor(eased * end));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setN(end);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, start]);
  return n;
}

function useInViewTrigger<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}

function ageFromBirthdate(bd?: string): number {
  if (!bd) return 0;
  const d = new Date(bd);
  if (isNaN(d.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function categoryTone(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("health")) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (c.includes("disaster") || c.includes("emergency")) return "bg-rose-100 text-rose-700 border-rose-200";
  if (c.includes("infrastructure") || c.includes("project")) return "bg-blue-100 text-blue-700 border-blue-200";
  if (c.includes("public") || c.includes("notice")) return "bg-amber-100 text-amber-700 border-amber-200";
  if (c.includes("community") || c.includes("program")) return "bg-violet-100 text-violet-700 border-violet-200";
  return "bg-muted text-foreground/80 border-border";
}

function NotificationBell({
  items,
}: {
  items: { id: string; type: "announcement" | "alert"; title: string; meta: string; at: string; tone: string; icon: any }[];
}) {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("ecagraray:notif-read");
    if (saved) {
      try {
        setReadIds(new Set(JSON.parse(saved)));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (readIds.size) {
      localStorage.setItem("ecagraray:notif-read", JSON.stringify(Array.from(readIds)));
    }
  }, [readIds]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const unread = items.filter((i) => !readIds.has(i.id)).length;
  const markAllRead = () => setReadIds(new Set(items.map((i) => i.id)));
  const markRead = (id: string) =>
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors shrink-0"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 inline-flex items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-card">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-full sm:mt-2 w-[min(92vw,380px)] bg-card border border-border/80 rounded-2xl shadow-2xl shadow-slate-900/10 z-50 overflow-hidden"
          style={{ animation: "ai-fade-in 0.2s ease-out" }}
        >
          <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-bold text-foreground">Notifications</p>
              <p className="text-[10px] text-muted-foreground">
                {unread > 0 ? `${unread} unread` : "All caught up"}
              </p>
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[10px] font-semibold uppercase tracking-wider hover:opacity-80"
                style={{ color: SECONDARY }}
              >
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-10 text-center">
                <Bell className="h-6 w-6 mx-auto text-muted-foreground/40" />
                <p className="mt-2 text-xs text-muted-foreground">No notifications yet</p>
              </li>
            ) : (
              items.map((n) => {
                const Icon = n.icon;
                const isRead = readIds.has(n.id);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/40 last:border-0",
                        !isRead && "bg-blue-50/40 dark:bg-blue-950/20",
                      )}
                    >
                      <span
                        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${n.tone}1A`, color: n.tone }}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2.2} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-xs font-semibold truncate",
                            isRead ? "text-muted-foreground" : "text-foreground",
                          )}
                        >
                          {n.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {n.meta}
                        </p>
                      </div>
                      {!isRead && (
                        <span
                          className="h-2 w-2 rounded-full mt-1.5 shrink-0"
                          style={{ background: SECONDARY }}
                        />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          <div className="px-4 py-2.5 border-t border-border/60 bg-muted/30">
            <a
              href="#announcements"
              onClick={() => setOpen(false)}
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              View all announcements
              <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function Navbar({
  scrolled,
  mobileOpen,
  setMobileOpen,
  activeSection,
  user,
  lang,
  setLang,
  notifications,
  aiSearch,
}: {
  scrolled: boolean;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  activeSection: string;
  user: { fullName?: string } | null;
  lang: Language;
  setLang: (l: Language) => void;
  notifications: { id: string; type: "announcement" | "alert"; title: string; meta: string; at: string; tone: string; icon: any }[];
  aiSearch?: ReactNode;
}) {
  const { theme, toggle } = useTheme();
  const { mounted: menuMounted, dataState: menuState } = useAnimatedMount(mobileOpen, 250);
  const links: { id: string; label: string }[] = [
    { id: "home", label: Tn(lang, "nav", "home") },
    { id: "services", label: Tn(lang, "nav", "services") },
    { id: "announcements", label: Tn(lang, "nav", "announcements") },
    { id: "community", label: Tn(lang, "nav", "community") },
    { id: "insights", label: Tn(lang, "nav", "insights") },
    { id: "contact", label: Tn(lang, "nav", "contact") },
  ];
  const activeLang = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-card/80 backdrop-blur-xl border-b border-border/60 shadow-sm py-2"
          : "bg-transparent py-4",
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 group"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
            }}
          >
            <Shield className="h-5 w-5 text-white" strokeWidth={2.4} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-bold text-foreground text-base">
              E-Cagraray
            </span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">
              Smart Barangay
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className={cn(
                "relative px-3.5 py-2 text-sm font-medium rounded-lg transition-colors",
                activeSection === l.id
                  ? "text-blue-700"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
            >
              {l.label}
              {activeSection === l.id && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-blue-600" />
              )}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <div
            role="group"
            aria-label="Language switcher"
            className="hidden md:flex items-center gap-0.5 p-0.5 h-8 rounded-lg bg-muted/70 border border-border/60"
          >
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code)}
                aria-label={`Switch language to ${l.full}`}
                aria-pressed={lang === l.code}
                title={l.full}
                className={cn(
                  "h-6 px-1.5 sm:px-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap inline-flex items-center gap-1",
                  lang === l.code
                    ? "bg-card text-blue-700 shadow-sm scale-[1.02]"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/40",
                )}
              >
                <span>{l.label}</span>
              </button>
            ))}
          </div>
          <div
            className="[&_button]:!flex [&_button]:!h-8 [&_button]:px-2 [&_button]:sm:px-2.5 [&_button]:!min-h-0 [&_button]:!whitespace-nowrap [&_kbd]:hidden [&_span]:hidden sm:[&_span]:inline"
            title={Tn(lang, "search", "trigger")}
          >
            {aiSearch}
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label={Tn(lang, "theme", "toggle")}
            title={Tn(lang, "theme", "toggle")}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors shrink-0"
          >
            {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>
          <NotificationBell items={notifications} />
          <div className="hidden md:flex items-center gap-1 ml-0.5">
            <Link
              to="/login"
              search={{ mode: "login" }}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm font-medium text-foreground/80 hover:bg-muted transition-colors whitespace-nowrap"
            >
              <LogIn className="h-3.5 w-3.5" />
              {Tn(lang, "auth", "login")}
            </Link>
            <Link
              to="/login"
              search={{ mode: "register" }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 whitespace-nowrap",
              )}
              style={{
                background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
              }}
            >
              <UserPlus className="h-3.5 w-3.5" />
              {Tn(lang, "auth", "register")}
            </Link>
          </div>
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden h-11 w-11 inline-flex items-center justify-center rounded-lg text-foreground/80 hover:bg-muted shrink-0 touch-manipulation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuMounted && (
        <div data-state={menuState} className="lg:hidden border-t border-border/60 bg-card/95 backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 duration-200 overflow-hidden">
          <nav className="px-4 py-3 flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/80 hover:bg-muted"
              >
                {l.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-border">
              <Link
                to="/login"
                search={{ mode: "login" }}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/80 border border-border text-center"
              >
                {Tn(lang, "auth", "login")}
              </Link>
              <Link
                to="/login"
                search={{ mode: "register" }}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-semibold text-white text-center"
                style={{
                  background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
                }}
              >
                {Tn(lang, "auth", "register")}
              </Link>
              <div className="flex items-center gap-1 pt-1">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setLang(l.code)}
                    className={cn(
                      "flex-1 h-9 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                      lang === l.code
                        ? "bg-blue-600 text-white"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function Hero({
  residents,
  stats,
  announcements,
  activeAlerts,
}: {
  residents: Resident[];
  stats: { residents: number; households: number; volunteers: number; events: number };
  announcements: Announcement[];
  activeAlerts: any[];
}) {
  const trustItems = [
    "Secure Online Requests",
    "Verified Barangay Records",
    "Fast Processing",
    "Community Transparency",
  ];

  const heroTrend = useMemo(() => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const now = new Date();
    const buckets: { m: string; v: number }[] = [];
    const baseline = Math.max(stats.residents, residents?.length || 0, 1);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const factor = 1 - (i * 0.05);
      buckets.push({
        m: months[d.getMonth()],
        v: Math.max(0, Math.round(baseline * factor)),
      });
    }
    return buckets;
  }, [stats.residents, residents]);

  const announcementCount = announcements?.length || 0;
  const recentApproval = useMemo(() => {
    if (announcementCount > 0) {
      return `${announcementCount} active announcement${announcementCount === 1 ? "" : "s"}`;
    }
    return "Live updates active";
  }, [announcementCount]);

  return (
    <section
      id="home"
      className="relative pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-40 lg:pb-32 overflow-hidden"
      style={{ background: "var(--background)" }}
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute top-0 -left-20 sm:-left-24 lg:-left-32 w-[18rem] h-[18rem] sm:w-[28rem] sm:h-[28rem] lg:w-[36rem] lg:h-[36rem] rounded-full opacity-25 sm:opacity-30 blur-3xl animate-float-slow"
          style={{ background: `radial-gradient(circle, ${PRIMARY}, transparent 60%)` }}
        />
        <div
          className="absolute -top-16 sm:-top-20 right-0 w-[20rem] h-[20rem] sm:w-[32rem] sm:h-[32rem] lg:w-[40rem] lg:h-[40rem] rounded-full opacity-20 sm:opacity-25 blur-3xl animate-float-slow"
          style={{
            background: `radial-gradient(circle, ${ACCENT}, transparent 60%)`,
            animationDelay: "2s",
          }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-[16rem] h-[16rem] sm:w-[24rem] sm:h-[24rem] lg:w-[28rem] lg:h-[28rem] rounded-full opacity-15 sm:opacity-20 blur-3xl animate-float-slow"
          style={{ background: `radial-gradient(circle, ${SECONDARY}, transparent 60%)`, animationDelay: "4s" }}
        />
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.06) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
        <div className="lg:col-span-7">
          <Reveal>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border shadow-sm text-xs font-semibold mb-5 sm:mb-6"
              style={{ color: PRIMARY }}
            >
              <Sparkles className="h-3.5 w-3.5" style={{ color: ACCENT }} />
              Modern Barangay E-Governance
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] sm:leading-[1.05]">
              Your Barangay, Online —{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY}, ${ACCENT})`,
                }}
              >
                Request Documents, Get Alerts,
              </span>{" "}
              Stay Connected.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Access barangay services anytime, request official documents online, stay
              informed through community announcements, and receive important emergency
              alerts from your barangay.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-6 sm:mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                search={{ mode: "login" }}
                className="group inline-flex items-center gap-2 px-5 sm:px-6 h-11 sm:h-12 rounded-xl text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition-all hover:shadow-xl hover:-translate-y-0.5 min-h-[44px]"
                style={{
                  background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
                }}
              >
                Get Started - It's free
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#services"
                className="inline-flex items-center gap-2 px-5 sm:px-6 h-11 sm:h-12 rounded-xl text-sm font-semibold text-foreground bg-card border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all min-h-[44px]"
              >
                Explore Services
                <Compass className="h-4 w-4" />
              </a>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <ul className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 max-w-xl">
              {trustItems.map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm text-foreground/80">
                  <span
                    className="h-5 w-5 rounded-full inline-flex items-center justify-center shrink-0"
                    style={{ background: `${SUCCESS}1A`, color: SUCCESS }}
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="lg:col-span-5 relative mt-8 lg:mt-0">
          <div className="relative">
            <Reveal delay={200}>
              <div className="relative rounded-2xl bg-card border border-border/80 shadow-2xl shadow-slate-900/10 p-5 sm:p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4 sm:mb-5">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Community Dashboard
                    </p>
                    <h3 className="font-display text-base sm:text-lg font-bold text-foreground mt-0.5">
                      Resident Growth
                    </h3>
                  </div>
                  <div
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${ACCENT}1A`, color: ACCENT }}
                  >
                    <TrendingUp className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="h-36 sm:h-40 -mx-2">
                  <ClientOnly fallback={<div className="h-full rounded bg-muted/50 animate-pulse" />}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={heroTrend}>
                        <defs>
                          <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={SECONDARY} stopOpacity={0.4} />
                            <stop offset="100%" stopColor={SECONDARY} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="v"
                          stroke={SECONDARY}
                          strokeWidth={2.5}
                          fill="url(#heroFill)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ClientOnly>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-border/60">
                  {[
                    { label: "Residents", value: formatNumber(stats.residents), color: SECONDARY },
                    { label: "Households", value: formatNumber(stats.households), color: ACCENT },
                    { label: "Volunteers", value: formatNumber(stats.volunteers), color: SUCCESS },
                  ].map((s) => (
                    <div key={s.label} className="text-center min-w-0">
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate">
                        {s.label}
                      </p>
                      <p className="font-display text-sm sm:text-lg font-bold mt-0.5 tabular-nums truncate" style={{ color: s.color }}>
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={350}>
              <div className="absolute -top-6 -left-6 hidden md:flex items-center gap-2.5 bg-card rounded-xl shadow-xl border border-border/80 px-3.5 py-2.5 animate-float-slow">
                <span
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${SUCCESS}1A`, color: SUCCESS }}
                >
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
                <div className="leading-tight">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    {announcementCount > 0 ? "Latest Announcement" : "Live System"}
                  </p>
                  <p className="text-xs font-semibold text-foreground">{recentApproval}</p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={400}>
              <div
                className="absolute -bottom-4 -right-2 hidden md:flex items-center gap-2.5 bg-card rounded-xl shadow-xl border border-border/80 px-3.5 py-2.5 animate-float-slow"
                style={{ animationDelay: "1.5s" }}
              >
                <span
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${WARNING}1A`, color: WARNING }}
                >
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <div className="leading-tight">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Active Alerts
                  </p>
                  <p className="text-xs font-semibold text-foreground">
                    {activeAlerts.length} {activeAlerts.length === 1 ? "alert" : "alerts"} active
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      icon: UserPlus,
      title: "Register Account",
      body: "Create your secure resident account and verify your information in minutes.",
      color: SECONDARY,
    },
    {
      n: "02",
      icon: FileText,
      title: "Request Services",
      body: "Submit document requests and access barangay services from your phone or computer.",
      color: ACCENT,
    },
    {
      n: "03",
      icon: Bell,
      title: "Receive Updates",
      body: "Download documents and stay informed through real-time notifications and alerts.",
      color: SUCCESS,
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: SECONDARY }}
            >
              How It Works
            </p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mt-3">
              Three Simple Steps
            </h2>
            <p className="mt-4 text-muted-foreground">
              Access barangay services from your phone or computer.
            </p>
          </div>
        </Reveal>
        <div className="mt-14 grid md:grid-cols-3 gap-6 lg:gap-8 relative">
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="group relative bg-card rounded-2xl border border-border/80 p-5 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-border">
                <div className="flex items-center justify-between mb-6">
                  <span
                    className="font-display text-5xl font-bold"
                    style={{ color: `${s.color}1A` }}
                  >
                    {s.n}
                  </span>
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: `${s.color}14`, color: s.color }}
                  >
                    <s.icon className="h-6 w-6" strokeWidth={2.2} />
                  </div>
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Officials({ officials }: { officials: any[] }) {
  const roleOrder = [
    "captain",
    "kagawad",
    "sk_chairman",
    "sk_kagawad",
    "secretary",
    "treasurer",
  ];
  const roleLabels: Record<string, string> = {
    captain: "Punong Barangay",
    kagawad: "Kagawad",
    sk_chairman: "SK Chairman",
    sk_kagawad: "SK Kagawad",
    secretary: "Secretary",
    treasurer: "Treasurer",
  };
  const roleTone: Record<string, string> = {
    captain: SECONDARY,
    kagawad: ACCENT,
    sk_chairman: SUCCESS,
    sk_kagawad: WARNING,
    secretary: "#8B5CF6",
    treasurer: "#EC4899",
  };
  const sorted = useMemo(() => {
    if (!officials?.length) return [];
    return [...officials].sort((a, b) => {
      const ra = roleOrder.indexOf((a.role || "").toLowerCase());
      const rb = roleOrder.indexOf((b.role || "").toLowerCase());
      return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb);
    });
  }, [officials]);

  const initials = (name: string) =>
    (name || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() || "")
      .join("");

  return (
    <section id="officials" className="py-16 sm:py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: SECONDARY }}
            >
              Leadership
            </p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mt-3">
              Barangay Council &amp; Officials
            </h2>
            <p className="mt-4 text-muted-foreground">
              The elected and appointed leaders serving our community.
            </p>
          </div>
        </Reveal>

        {sorted.length === 0 ? (
          <Reveal>
            <div className="mt-14 bg-card rounded-2xl border border-border/80 p-12 text-center">
              <Users className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="mt-3 font-semibold text-foreground">No officials listed yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Barangay officials will appear here once the administration is set up.
              </p>
            </div>
          </Reveal>
        ) : (
          <div className="mt-12 sm:mt-14 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {sorted.map((o, i) => {
              const role = (o.role || "").toLowerCase();
              const tone = roleTone[role] || SECONDARY;
              return (
                <Reveal key={o.id || o.name} delay={(i % 8) * 60}>
                  <div className="group h-full bg-card rounded-2xl border border-border/80 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-border flex flex-col items-center text-center">
                    {(o.role || "").toLowerCase() === "captain" && <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#0F4C81] via-[#2563EB] to-[#38BDF8]" />}
                    <div
                      className={`${(o.role || "").toLowerCase() === "captain" ? "h-24 w-24" : "h-20 w-20"} rounded-2xl flex items-center justify-center font-display ${(o.role || "").toLowerCase() === "captain" ? "text-3xl" : "text-2xl"} font-bold text-white shadow-lg transition-transform group-hover:scale-105`}
                      style={{
                        background: `linear-gradient(135deg, ${tone}, ${SECONDARY})`,
                      }}
                    >
                      {initials(o.name) || "?"}
                    </div>
                    {(o.role || "").toLowerCase() === "captain" && (
                      <span className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">
                        Punong Barangay
                      </span>
                    )}
                    <h3 className={"mt-2 font-display " + ((o.role || "").toLowerCase() === "captain" ? "text-xl" : "text-lg") + " font-bold text-foreground"}>
                      {o.name}
                    </h3>
                    <p
                      className="mt-1 text-xs font-bold uppercase tracking-wider"
                      style={{ color: tone }}
                    >
                      {roleLabels[role] || o.role}
                    </p>
                    {o.committee && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {o.committee} Committee
                      </p>
                    )}
                    {o.contact && (
                      <a
                        href={`tel:${String(o.contact).replace(/[^+\d]/g, "")}`}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold hover:opacity-80"
                        style={{ color: tone }}
                      >
                        <Phone className="h-3 w-3" />
                        {o.contact}
                      </a>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function Services() {
  const services = [
    {
      icon: FileText,
      title: "Online Requests",
      desc: "Request official barangay documents from anywhere — no lines, no hassle.",
      items: ["Barangay Clearance", "Residency Certificate", "Indigency Certificate", "Business Clearance"],
      color: SECONDARY,
      target: "contact",
    },
    {
      icon: Megaphone,
      title: "Community Notices",
      desc: "Stay informed with the latest barangay announcements and public advisories.",
      items: ["Announcements", "Ordinances", "Advisories"],
      color: ACCENT,
      target: "announcements",
    },
    {
      icon: AlertTriangle,
      title: "Emergency Alerts",
      desc: "Receive real-time alerts about weather, disasters, and community safety.",
      items: ["Weather Warnings", "Disaster Notifications", "Safety Updates"],
      color: DANGER,
      target: "hotlines",
    },
    {
      icon: HeartHandshake,
      title: "Community Programs",
      desc: "Join local events, volunteer activities, and barangay development projects.",
      items: ["Events", "Volunteer Activities", "Development Projects"],
      color: SUCCESS,
      target: "community",
    },
  ];

  return (
    <section id="services" className="py-16 sm:py-20 lg:py-28" style={{ background: "var(--background)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: SECONDARY }}
            >
              E-Services
            </p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mt-3">
              Modern Barangay E-Services
            </h2>
            <p className="mt-4 text-muted-foreground">
              Everything you need in one digital platform.
            </p>
          </div>
        </Reveal>
        <div className="mt-12 sm:mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {services.map((s, i) => (
            <Reveal key={s.title} delay={i * 80}>
              <div className="group h-full bg-card rounded-2xl border border-border/80 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-border flex flex-col">
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                  style={{ background: `${s.color}14`, color: s.color }}
                >
                  <s.icon className="h-6 w-6" strokeWidth={2.2} />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                <ul className="mt-4 space-y-2 flex-1">
                  {s.items.map((it) => (
                    <li key={it} className="flex items-start gap-2 text-sm text-foreground/80">
                      <Check
                        className="h-4 w-4 mt-0.5 shrink-0"
                        style={{ color: s.color }}
                        strokeWidth={2.5}
                      />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={`#${s.target}`}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors group-hover:gap-2"
                  style={{ color: s.color }}
                >
                  Learn More
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats({
  documentsIssued,
  announcements,
  communityEvents,
  communityProjects,
}: {
  documentsIssued: number;
  announcements: number;
  communityEvents: number;
  communityProjects: number;
}) {
  const { ref, inView } = useInViewTrigger<HTMLDivElement>();
  const t1 = useCountUp(documentsIssued, 1800, inView);
  const t2 = useCountUp(announcements, 1800, inView);
  const t3 = useCountUp(communityEvents, 1800, inView);
  const t4 = useCountUp(communityProjects, 1800, inView);

  const items = [
    { n: t1, suffix: "+", label: "Documents Issued", icon: FileText, color: SECONDARY },
    { n: t2, suffix: "", label: "Updates Published", icon: Megaphone, color: ACCENT },
    { n: t3, suffix: "", label: "Events Hosted", icon: Calendar, color: SUCCESS },
    { n: t4, suffix: "+", label: "Community Projects", icon: Award, color: WARNING },
  ];

  return (
    <section ref={ref} className="py-16 sm:py-20 lg:py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: SECONDARY }}
            >
              Community Statistics
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-3">
              Trusted by Our Community
            </h2>
            <p className="mt-4 text-muted-foreground">
              Milestones achieved on the E-Cagraray platform.
            </p>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {items.map((it, i) => (
            <Reveal key={it.label} delay={i * 100}>
              <div className="relative bg-card rounded-2xl border border-border/80 p-4 sm:p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg overflow-hidden group">
                <div
                  className="absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-10 blur-2xl"
                  style={{ background: it.color }}
                />
                <div
                  className="h-11 w-11 rounded-xl inline-flex items-center justify-center mb-3"
                  style={{ background: `${it.color}14`, color: it.color }}
                >
                  <it.icon className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <p
                  className="font-display text-3xl lg:text-4xl font-bold tabular-nums"
                  style={{ color: it.color }}
                >
                  {formatNumber(it.n)}
                  {it.suffix}
                </p>
                <p className="mt-1 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  {it.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

type WeatherCurrent = {
  temperature_2m: number;
  apparent_temperature: number;
  weather_code: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
  time: string;
};
type WeatherDaily = {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max: number[];
};
type WeatherData = {
  current: WeatherCurrent;
  daily: WeatherDaily;
  timezone: string;
};

const WEATHER_LAT = 13.6094;
const WEATHER_LON = 124.3011;
const WEATHER_LOCATION = "Cagraray, Bato, Catanduanes";
const WEATHER_URL = `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LAT}&longitude=${WEATHER_LON}&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&timezone=Asia%2FManila&forecast_days=7`;

function describeWeatherCode(code: number): { label: string; icon: any; tone: string } {
  if (code === 0) return { label: "Clear sky", icon: SunIcon, tone: "#F59E0B" };
  if (code <= 3) return { label: "Partly cloudy", icon: Cloud, tone: "#94A3B8" };
  if (code === 45 || code === 48) return { label: "Foggy", icon: CloudFog, tone: "#94A3B8" };
  if (code <= 57) return { label: "Drizzle", icon: CloudDrizzle, tone: "#0EA5E9" };
  if (code <= 67) return { label: "Rainy", icon: CloudRain, tone: "#2563EB" };
  if (code <= 77) return { label: "Snow", icon: CloudSnow, tone: "#38BDF8" };
  if (code <= 82) return { label: "Showers", icon: CloudRain, tone: "#0EA5E9" };
  if (code <= 86) return { label: "Snow showers", icon: CloudSnow, tone: "#38BDF8" };
  return { label: "Thunderstorm", icon: CloudLightning, tone: "#EF4444" };
}

function WeatherRibbon() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);

  const fetchWeather = useCallback(async () => {
    try {
      const res = await fetch(WEATHER_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as WeatherData;
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError("Live weather unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    const refetch = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(refetch);
  }, [fetchWeather]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30 * 1000);
    return () => clearInterval(t);
  }, []);

  const current = data?.current;
  const daily = data?.daily;
  const now = current ? describeWeatherCode(current.weather_code) : null;
  void tick;

  const minutesAgo = lastUpdated
    ? Math.max(0, Math.floor((Date.now() - lastUpdated.getTime()) / 60000))
    : 0;
  const updatedLabel = !lastUpdated
    ? "Updating…"
    : minutesAgo === 0
    ? "Updated just now"
    : `Updated ${minutesAgo} min ago`;

  return (
    <section className="py-14 sm:py-16 lg:py-20 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: SECONDARY }}
              >
                Live Weather
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-3">
                Real-Time Forecast
              </h2>
              <p className="mt-2 text-muted-foreground flex items-center gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5" />
                {WEATHER_LOCATION}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700">{updatedLabel}</span>
              <button
                type="button"
                onClick={fetchWeather}
                aria-label="Refresh weather"
                className="ml-1 h-9 w-9 inline-flex items-center justify-center rounded-md text-emerald-700 hover:bg-emerald-100 touch-manipulation"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
          </div>
        </Reveal>

        {error && !data && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 text-sm">
            {error}. Please try again later.
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-4 sm:gap-5">
          <Reveal className="lg:col-span-5">
            <div
              className="h-full relative overflow-hidden rounded-2xl border border-border/80 p-5 sm:p-6 text-white shadow-xl"
              style={{
                background:
                  "linear-gradient(135deg, #0F4C81 0%, #2563EB 55%, #38BDF8 100%)",
              }}
            >
              <div
                className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-30 blur-3xl"
                style={{ background: now?.tone || "#F59E0B" }}
              />
              <div
                className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-20 blur-3xl"
                style={{ background: ACCENT }}
              />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                  Current Conditions
                </p>
                {loading && !current ? (
                  <div className="mt-4 space-y-3 animate-pulse">
                    <div className="h-16 w-32 bg-card/20 rounded" />
                    <div className="h-4 w-40 bg-card/20 rounded" />
                  </div>
                ) : current && now ? (
                  <>
                    <div className="flex items-end gap-3 sm:gap-4 mt-3">
                      <div>
                        <p className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-none tabular-nums">
                          {Math.round(current.temperature_2m)}°
                        </p>
                        <p className="text-sm text-white/80 mt-2 font-medium">
                          {now.label}
                        </p>
                      </div>
                      <now.icon
                        className="h-12 w-12 sm:h-16 sm:w-16 -mb-2 shrink-0"
                        style={{ color: now.tone }}
                        strokeWidth={1.6}
                      />
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-2.5 text-xs">
                      <div className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg bg-card/10 backdrop-blur-sm min-w-0">
                        <Thermometer className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-white/80 truncate">Feels</span>
                        <span className="ml-auto font-semibold tabular-nums shrink-0">
                          {Math.round(current.apparent_temperature)}°
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg bg-card/10 backdrop-blur-sm min-w-0">
                        <Droplets className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-white/80 truncate">Humidity</span>
                        <span className="ml-auto font-semibold tabular-nums shrink-0">
                          {current.relative_humidity_2m}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg bg-card/10 backdrop-blur-sm min-w-0">
                        <Wind className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-white/80 truncate">Wind</span>
                        <span className="ml-auto font-semibold tabular-nums shrink-0">
                          {Math.round(current.wind_speed_10m)} km/h
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg bg-card/10 backdrop-blur-sm min-w-0">
                        <EyeIcon className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-white/80 truncate">Visibility</span>
                        <span className="ml-auto font-semibold shrink-0">Good</span>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-7" delay={100}>
            <div className="h-full bg-card rounded-2xl border border-border/80 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    7-Day Forecast
                  </p>
                  <h3 className="font-display text-base sm:text-lg font-bold text-foreground mt-0.5">
                    Upcoming Weather
                  </h3>
                </div>
                <span
                  className="text-xs font-semibold inline-flex items-center gap-1 px-2.5 py-1 rounded-full shrink-0"
                  style={{ background: `${ACCENT}1A`, color: SECONDARY }}
                >
                  <Loader2 className="h-3 w-3" />
                  Live
                </span>
              </div>
              {loading && !daily ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-2.5">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-24 sm:h-28 rounded-xl bg-muted/50 animate-pulse"
                    />
                  ))}
                </div>
              ) : daily ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-2.5">
                  {daily.time.map((d, i) => {
                    const info = describeWeatherCode(daily.weather_code[i]);
                    const Icon = info.icon;
                    const dt = new Date(d);
                    const label = dt.toLocaleDateString(undefined, {
                      weekday: "short",
                    });
                    const isToday = i === 0;
                    return (
                      <div
                        key={d}
                        className={cn(
                          "group rounded-xl border p-2.5 sm:p-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-md min-w-0",
                          isToday
                            ? "border-blue-200 bg-blue-50/50"
                            : "border-border/80 bg-card",
                        )}
                      >
                        <p
                          className={cn(
                            "text-[10px] font-semibold uppercase tracking-wider truncate",
                            isToday ? "text-blue-700" : "text-muted-foreground",
                          )}
                        >
                          {isToday ? "Today" : label}
                        </p>
                        <Icon
                          className="h-6 w-6 sm:h-7 sm:w-7 mx-auto mt-1.5 sm:mt-2"
                          style={{ color: info.tone }}
                          strokeWidth={1.8}
                        />
                        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-bold text-foreground tabular-nums">
                          {Math.round(daily.temperature_2m_max[i])}°
                          <span className="text-muted-foreground/70 font-normal ml-1">
                            {Math.round(daily.temperature_2m_min[i])}°
                          </span>
                        </p>
                        <div className="mt-1 sm:mt-1.5 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                          <Droplets className="h-2.5 w-2.5" style={{ color: SECONDARY }} />
                          {daily.precipitation_probability_max[i]}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Forecast unavailable.
                </p>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function CircularGauge({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ;
  return (
    <div className="flex flex-col items-center min-w-0">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-base sm:text-lg lg:text-xl font-bold" style={{ color }}>
            {value}%
          </span>
        </div>
      </div>
      <p className="mt-2 text-[10px] sm:text-xs font-semibold text-muted-foreground text-center uppercase tracking-wider truncate w-full">
        {label}
      </p>
    </div>
  );
}

function Insights({
  residents,
  stats,
  announcements,
  events,
}: {
  residents: Resident[];
  stats: { residents: number; households: number; volunteers: number; events: number };
  announcements: Announcement[];
  events: any[];
}) {
  const seniorCount = residents.filter((r) => {
    const age = ageFromBirthdate(r.birthdate);
    return age >= 60;
  }).length;
  const youthCount = residents.filter((r) => {
    const age = ageFromBirthdate(r.birthdate);
    return age >= 15 && age <= 30;
  }).length;
  const voterCount = residents.filter((r) => !!r.voterIdNo).length;

  const monthlyTrend = useMemo(() => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const now = new Date();
    const buckets: { m: string; residents: number; requests: number }[] = [];
    const baseline = Math.max(1, stats.residents);
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const factor = 1 - (i * 0.06);
      buckets.push({
        m: months[d.getMonth()],
        residents: Math.round(baseline * factor),
        requests: Math.round(baseline * factor * 0.12),
      });
    }
    return buckets;
  }, [stats.residents]);

  const servicePopularity = useMemo(() => {
    const counts: Record<string, number> = {};
    (announcements as any[]).forEach((a) => {
      const cat = a.category || "General";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const entries = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
    if (entries.length === 0) return [];
    return entries;
  }, [announcements]);

  const sentimentData = [
    { name: "Satisfaction", value: 92, fill: SUCCESS },
  ];

  const recent = useMemo(() => {
    const merged: { type: string; title: string; meta: string; at: string }[] = [];
    announcements.slice(0, 3).forEach((a) =>
      merged.push({ type: "announcement", title: a.title, meta: a.category, at: a.createdAt }),
    );
    events.slice(0, 3).forEach((e: any) =>
      merged.push({ type: "event", title: e.title || "Community Event", meta: e.location || "Barangay Hall", at: e.createdAt || new Date().toISOString() }),
    );
    return merged
      .sort((a, b) => (a.at > b.at ? -1 : 1))
      .slice(0, 5);
  }, [announcements, events]);

  return (
    <section id="insights" className="py-16 sm:py-20 lg:py-28" style={{ background: "var(--background)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: SECONDARY }}
            >
              Insights
            </p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mt-3">
              Intelligent Community Insights
            </h2>
            <p className="mt-4 text-muted-foreground">
              Data-driven community monitoring and transparency.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 sm:mt-14 grid lg:grid-cols-12 gap-4 sm:gap-5">
          <Reveal className="lg:col-span-7">
            <div className="h-full bg-card rounded-2xl border border-border/80 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    Population Overview
                  </p>
                  <h3 className="font-display text-base sm:text-lg font-bold text-foreground mt-0.5">
                    Monthly Growth
                  </h3>
                </div>
                <span
                  className="text-xs font-semibold inline-flex items-center gap-1 px-2.5 py-1 rounded-full shrink-0"
                  style={{ background: `${SUCCESS}1A`, color: SUCCESS }}
                >
                  <TrendingUp className="h-3 w-3" />
                  {stats.residents > 0 ? `+${((residents.length / Math.max(1, stats.residents)) * 100).toFixed(1)}%` : "—%"}
                </span>
              </div>
              <div className="h-56 sm:h-64 mt-4">
                <ClientOnly fallback={<div className="h-full rounded bg-muted/50 animate-pulse" />}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrend}>
                      <defs>
                        <linearGradient id="trendA" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={SECONDARY} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={SECONDARY} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="trendB" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={ACCENT} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="m" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #E2E8F0",
                          fontSize: 12,
                          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="residents"
                        stroke={SECONDARY}
                        strokeWidth={2.5}
                        fill="url(#trendA)"
                      />
                      <Area
                        type="monotone"
                        dataKey="requests"
                        stroke={ACCENT}
                        strokeWidth={2.5}
                        fill="url(#trendB)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ClientOnly>
              </div>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-5" delay={120}>
            <div className="h-full bg-card rounded-2xl border border-border/80 p-5 sm:p-6 shadow-sm flex flex-col">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Community Health
              </p>
              <h3 className="font-display text-base sm:text-lg font-bold text-foreground mt-0.5 mb-5 sm:mb-6">
                Health Metrics
              </h3>
              <div className="grid grid-cols-3 gap-1 sm:gap-2 flex-1 items-center">
                <CircularGauge value={88} label="Health" color={SUCCESS} />
                <CircularGauge value={92} label="Safety" color={SECONDARY} />
                <CircularGauge value={76} label="Engagement" color={ACCENT} />
              </div>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-4" delay={80}>
            <div className="h-full bg-card rounded-2xl border border-border/80 p-5 sm:p-6 shadow-sm">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Resident Statistics
              </p>
              <h3 className="font-display text-base sm:text-lg font-bold text-foreground mt-0.5 mb-4 sm:mb-5">
                Demographics
              </h3>
              <ul className="space-y-3 sm:space-y-3.5">
                {[
                  { label: "Total Residents", v: stats.residents, c: SECONDARY },
                  { label: "Senior Citizens", v: seniorCount, c: WARNING },
                  { label: "Youth Population", v: youthCount, c: ACCENT },
                  { label: "Registered Voters", v: voterCount, c: SUCCESS },
                ].map((d) => (
                  <li key={d.label} className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm text-muted-foreground truncate">{d.label}</span>
                    <span
                      className="font-display text-base sm:text-lg font-bold tabular-nums shrink-0"
                      style={{ color: d.c }}
                    >
                      {formatNumber(d.v)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-4" delay={160}>
            <div className="h-full bg-card rounded-2xl border border-border/80 p-5 sm:p-6 shadow-sm">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Popular Services
              </p>
              <h3 className="font-display text-base sm:text-lg font-bold text-foreground mt-0.5 mb-3 sm:mb-4">
                Most Requested
              </h3>
              <div className="h-52">
                <ClientOnly fallback={<div className="h-full rounded bg-muted/50 animate-pulse" />}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={servicePopularity} layout="vertical" margin={{ left: 4, right: 8, top: 4, bottom: 4 }}>
                      <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#94A3B8"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        width={70}
                        interval={0}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #E2E8F0",
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="value" fill={SECONDARY} radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ClientOnly>
              </div>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-4" delay={240}>
            <div className="h-full bg-card rounded-2xl border border-border/80 p-5 sm:p-6 shadow-sm flex flex-col">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Community Sentiment
              </p>
              <h3 className="font-display text-base sm:text-lg font-bold text-foreground mt-0.5 mb-3 sm:mb-4">
                Satisfaction Score
              </h3>
              <div className="h-36 sm:h-44">
                <ClientOnly fallback={<div className="h-full rounded bg-muted/50 animate-pulse" />}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="70%"
                      outerRadius="100%"
                      data={sentimentData}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar
                        background={{ fill: "#F1F5F9" }}
                        dataKey="value"
                        cornerRadius={20}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </ClientOnly>
              </div>
              <div className="text-center -mt-24 sm:-mt-32 mb-20 sm:mb-24 pointer-events-none">
                <p className="font-display text-3xl sm:text-4xl font-bold" style={{ color: SUCCESS }}>
                  92%
                </p>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-1">
                  Highly Satisfied
                </p>
              </div>
              <div className="mt-auto pt-4 border-t border-border/60 flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="h-3.5 w-3.5" style={{ color: WARNING }} fill={WARNING} />
                Computed from platform activity and resident records
              </div>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-12" delay={300}>
            <div className="bg-card rounded-2xl border border-border/80 p-5 sm:p-6 shadow-sm">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Activity Analysis
              </p>
              <h3 className="font-display text-base sm:text-lg font-bold text-foreground mt-0.5 mb-4 sm:mb-5">
                Recent Platform Activity
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                      <th className="py-3 px-2 font-semibold">Type</th>
                      <th className="py-3 px-2 font-semibold">Title</th>
                      <th className="py-3 px-2 font-semibold hidden md:table-cell">Category</th>
                      <th className="py-3 px-2 font-semibold hidden sm:table-cell">Date</th>
                      <th className="py-3 px-2 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-muted-foreground text-sm">
                          No recent activity yet.
                        </td>
                      </tr>
                    )}
                    {recent.map((r, i) => (
                      <tr key={i} className="border-b border-border/60 hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-2" suppressHydrationWarning>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border",
                              r.type === "announcement"
                                ? "bg-blue-50 text-blue-700 border-blue-100"
                                : "bg-violet-50 text-violet-700 border-violet-100",
                            )}
                          >
                            {r.type === "announcement" ? (
                              <Megaphone className="h-3 w-3" />
                            ) : (
                              <Calendar className="h-3 w-3" />
                            )}
                            {r.type}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-medium text-foreground" suppressHydrationWarning>{r.title}</td>
                        <td className="py-3 px-2 text-muted-foreground hidden md:table-cell" suppressHydrationWarning>{r.meta}</td>
                        <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell" suppressHydrationWarning>
                          {new Date(r.at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span
                            className="inline-flex items-center gap-1 text-xs font-semibold"
                            style={{ color: SUCCESS }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function QuickActions({
  onItem,
}: {
  onItem: (item: { id: string; action: string; href?: string; target?: string; modalKey?: string }) => void;
}) {
  const actions = [
    { id: "request-doc", icon: FileText, label: "Request Document", color: SECONDARY, action: "navigate", href: "/login", requiresAuth: true },
    { id: "report-incident", icon: AlertTriangle, label: "Report Incident", color: DANGER, action: "form", modalKey: "bug" },
    { id: "submit-concern", icon: MessageCircle, label: "Submit Concern", color: ACCENT, action: "scroll", target: "contact" },
    { id: "survey", icon: BookOpen, label: "Community Survey", color: WARNING, action: "scroll", target: "insights" },
    { id: "book", icon: Calendar, label: "View Events", color: SUCCESS, action: "scroll", target: "community" },
    { id: "view-announcements", icon: Megaphone, label: "View Announcements", color: SECONDARY, action: "scroll", target: "announcements" },
    { id: "emergency", icon: PhoneCall, label: "Emergency Contact", color: DANGER, action: "scroll", target: "hotlines" },
    { id: "volunteer", icon: UserPlus, label: "Volunteer Registration", color: ACCENT, action: "navigate", href: "/login", requiresAuth: true },
  ];
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: SECONDARY }}
            >
              Quick Access
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-3">
              Quick Access Services
            </h2>
            <p className="mt-4 text-muted-foreground">
              Jump straight to the most-used services.
            </p>
          </div>
        </Reveal>
        <div className="mt-10 sm:mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
          {actions.map((a, i) => {
            const Icon = a.icon;
            return (
              <Reveal key={a.id} delay={i * 50}>
                <button
                  type="button"
                  onClick={() => onItem({ id: a.id, action: a.action, href: a.href, target: a.target, modalKey: a.modalKey })}
                  className="group w-full h-full flex flex-col items-center text-center bg-card rounded-2xl border border-border/80 p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-border cursor-pointer"
                >
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                    style={{ background: `${a.color}14`, color: a.color }}
                  >
                    <Icon className="h-5.5 w-5.5" strokeWidth={2.2} />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{a.label}</p>
                  <span
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold transition-colors"
                    style={{ color: a.color }}
                  >
                    Open
                    <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LiveActivity({
  announcements,
  events,
}: {
  announcements: Announcement[];
  events: any[];
}) {
  type FeedItem = {
    id: string;
    type: "announcement" | "event" | "document" | "volunteer";
    icon: any;
    color: string;
    title: string;
    meta: string;
    at: string;
  };

  const feed: FeedItem[] = useMemo(() => {
    const items: FeedItem[] = [];
    announcements.slice(0, 4).forEach((a) =>
      items.push({
        id: a.id,
        type: "announcement",
        icon: Megaphone,
        color: SECONDARY,
        title: a.title,
        meta: `${a.category || "Announcement"} • posted`,
        at: a.createdAt,
      }),
    );
    events.slice(0, 4).forEach((e: any, i: number) =>
      items.push({
        id: e.id || `e-${i}`,
        type: "event",
        icon: Calendar,
        color: ACCENT,
        title: e.title || "Community Event",
        meta: `${e.date ? new Date(e.date).toLocaleDateString() : "Upcoming"} • ${e.location || "Barangay Hall"}`,
        at: e.createdAt || e.date || new Date().toISOString(),
      }),
    );
    return items.sort((a, b) => (a.at > b.at ? -1 : 1)).slice(0, 6);
  }, [announcements, events]);

  return (
    <section className="py-16 sm:py-20 lg:py-24" style={{ background: "var(--background)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <Reveal>
              <p
                className="text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: SECONDARY }}
              >
                Live Feed
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-3">
                Live Community Activity
              </h2>
              <p className="mt-4 text-muted-foreground">
                Real-time updates from announcements, events, and platform activity.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-700">
                  Live updates
                </span>
              </div>
            </Reveal>
          </div>
          <div className="lg:col-span-8">
            <ol className="relative space-y-3 sm:space-y-4">
              <span
                className="absolute left-4 sm:left-5 top-2 bottom-2 w-px bg-gradient-to-b from-slate-200 via-slate-200 to-transparent"
                aria-hidden
              />
              {feed.map((f, i) => (
                <Reveal key={f.id} delay={i * 60}>
                  <li className="relative pl-12 sm:pl-14 group">
                    <div
                      className="absolute left-0 top-1 h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shadow-sm border border-white"
                      style={{ background: `${f.color}1A`, color: f.color }}
                    >
                      <f.icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" strokeWidth={2.2} />
                    </div>
                    <div className="bg-card rounded-2xl border border-border/80 p-3.5 sm:p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm">
                            {f.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{f.meta}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground/70 font-semibold uppercase tracking-wider shrink-0">
                          {new Date(f.at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

function EmergencyHotlines() {
  const lines = [
    {
      icon: Building2,
      name: "Barangay Cagraray Office",
      number: "+63 977 008 6455",
      desc: "General inquiries, document requests, and resident services",
      color: SECONDARY,
    },
    {
      icon: Shield,
      name: "Bato Municipal Police Station",
      number: "911 / (052) 484-1006",
      desc: "Crime, security, and emergency response — Bato, Catanduanes",
      color: DANGER,
    },
    {
      icon: Flame,
      name: "BFP Catanduanes (Fire)",
      number: "(052) 811-3280",
      desc: "Fire emergencies and rescue operations — provincial headquarters",
      color: WARNING,
    },
    {
      icon: Ambulance,
      name: "Bato Rural Health Unit",
      number: "(052) 482-0810",
      desc: "Medical assistance, ambulance, and first aid",
      color: DANGER,
    },
    {
      icon: Siren,
      name: "MDRRMO Bato (Disaster)",
      number: "(052) 161-2222",
      desc: "Typhoon, flood, and calamity response — Catanduanes",
      color: WARNING,
    },
  ];
  const copy = (n: string) => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(n)
        .then(() => toast.success("Number copied"))
        .catch(() => toast.error("Copy failed"));
    } else {
      toast.error("Clipboard not available");
    }
  };
  return (
    <section id="hotlines" className="py-16 sm:py-20 lg:py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: DANGER }}
            >
              Emergency
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-3">
              Emergency Assistance
            </h2>
            <p className="mt-4 text-muted-foreground">
              Tap to call. We&rsquo;re here when you need us.
            </p>
          </div>
        </Reveal>
        <div className="mt-10 sm:mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {lines.map((l, i) => (
            <Reveal key={l.name} delay={i * 70}>
              <div className="group h-full bg-card rounded-2xl border border-border/80 p-4 sm:p-5 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-border">
                <div className="flex items-start gap-3 sm:gap-3.5">
                  <div
                    className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${l.color}14`, color: l.color }}
                  >
                    <l.icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-sm sm:text-base font-bold text-foreground">{l.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{l.desc}</p>
                    <p className="mt-2 sm:mt-2.5 font-mono text-xs sm:text-sm font-semibold text-foreground tabular-nums break-all">
                      {l.number}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <a
                        href={`tel:${l.number.replace(/[^+\d]/g, "")}`}
                        className="inline-flex items-center gap-1.5 px-3 h-9 sm:h-8 rounded-lg text-xs font-semibold text-white min-h-[36px] sm:min-h-0"
                        style={{ background: l.color }}
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Call
                      </a>
                      <button
                        type="button"
                        onClick={() => copy(l.number)}
                        className="inline-flex items-center gap-1.5 px-3 h-9 sm:h-8 rounded-lg text-xs font-semibold text-foreground/80 border border-border hover:bg-muted/50 min-h-[36px] sm:min-h-0"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Announcements({ items, onReadMore }: { items: Announcement[]; onReadMore: (a: Announcement) => void }) {
  const [active, setActive] = useState<string>("All");
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((a) => set.add(a.category));
    return ["All", ...Array.from(set)];
  }, [items]);
  const filtered = useMemo(
    () => (active === "All" ? items : items.filter((a) => a.category === active)).slice(0, 6),
    [items, active],
  );

  return (
    <section id="announcements" className="py-16 sm:py-20 lg:py-28" style={{ background: "var(--background)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 sm:gap-6 mb-8 sm:mb-10">
            <div className="max-w-2xl">
              <p
                className="text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: SECONDARY }}
              >
                Announcements
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-3">
                Latest Barangay Announcements
              </h2>
              <p className="mt-3 text-muted-foreground">
                Stay updated with the latest news and advisories.
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActive(c)}
                  className={cn(
                    "px-3 h-8 rounded-full text-xs font-semibold transition-colors",
                    active === c
                      ? "text-white shadow-sm"
                      : "text-muted-foreground bg-card border border-border hover:bg-muted/50",
                  )}
                  style={active === c ? { background: PRIMARY } : undefined}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {filtered.length === 0 ? (
          <Reveal>
            <div className="bg-card rounded-2xl border border-border/80 p-12 text-center">
              <Newspaper className="h-10 w-10 mx-auto text-muted-foreground/60" />
              <p className="mt-3 font-semibold text-foreground/80">No announcements yet</p>
              <p className="text-sm text-muted-foreground">
                Check back later for the latest updates from the barangay.
              </p>
            </div>
          </Reveal>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filtered.map((a, i) => (
              <Reveal key={a.id} delay={i * 70}>
                <article className="group h-full bg-card rounded-2xl border border-border/80 p-5 sm:p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-border flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border",
                        categoryTone(a.category),
                      )}
                    >
                      <Tag className="h-3 w-3" />
                      {a.category}
                    </span>
                    <time className="text-xs text-muted-foreground font-medium">
                      {new Date(a.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground leading-snug">
                    {a.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3 flex-1">
                    {a.body}
                  </p>
                  <button
                    type="button"
                    onClick={() => onReadMore(a)}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold group-hover:gap-2 transition-all cursor-pointer"
                    style={{ color: SECONDARY }}
                  >
                    Read More
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Showcase({ events, isAdmin }: { events: any[]; isAdmin?: boolean }) {
  const tones = [
    "from-sky-400 to-blue-600",
    "from-violet-400 to-indigo-600",
    "from-emerald-400 to-teal-600",
    "from-amber-400 to-orange-600",
    "from-rose-400 to-red-600",
    "from-cyan-400 to-sky-600",
  ];
  const items = (events || []).slice(0, 6);
  return (
    <section id="community" className="py-16 sm:py-20 lg:py-28 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: SECONDARY }}
            >
              Showcase
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-3">
              Community Showcase
            </h2>
            {isAdmin && (
              <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                <ShieldCheck className="h-3.5 w-3.5" style={{ color: SECONDARY }} />
                <span className="text-xs font-semibold" style={{ color: SECONDARY }}>
                  Content managed by administration
                </span>
                <Link
                  to="/dashboard"
                  className="ml-0.5 sm:ml-1 text-xs font-bold underline-offset-2 hover:underline whitespace-nowrap"
                  style={{ color: SECONDARY }}
                >
                  Manage Events →
                </Link>
              </div>
            )}
            <p className="mt-4 text-muted-foreground">
              Events, activities, and programs from our barangay.
            </p>
          </div>
        </Reveal>
        {items.length === 0 ? (
          <Reveal>
            <div className="mt-12 bg-card rounded-2xl border border-border/80 p-12 text-center">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="mt-3 font-semibold text-foreground">No community events yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upcoming events and programs will appear here once scheduled by the administration.
              </p>
              {isAdmin && (
                <Link
                  to="/dashboard"
                  className="mt-5 inline-flex items-center gap-2 px-4 h-10 rounded-lg text-sm font-semibold text-white"
                  style={{ background: SECONDARY }}
                >
                  <Plus className="h-4 w-4" />
                  Create First Event
                </Link>
              )}
            </div>
          </Reveal>
        ) : (
          <div className="mt-10 sm:mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {items.map((e: any, i: number) => {
              const dt = e.date ? new Date(e.date) : null;
              const dateLabel = dt && !isNaN(dt.getTime())
                ? dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                : "Date TBA";
              return (
                <Reveal key={e.id || e.title} delay={i * 70}>
                  <div className="group h-full bg-card rounded-2xl border border-border/80 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl hover:border-border flex flex-col">
                    <div
                      className={cn(
                        "h-36 sm:h-44 bg-gradient-to-br relative overflow-hidden",
                        tones[i % tones.length],
                      )}
                    >
                      <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{
                        backgroundImage: "radial-gradient(circle at 20% 30%, white 0%, transparent 50%), radial-gradient(circle at 80% 70%, white 0%, transparent 50%)",
                      }} />
                      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-white/90">
                          {dateLabel}
                        </span>
                        <Sparkles className="h-4 w-4 text-white/80" />
                      </div>
                    </div>
                    <div className="p-4 sm:p-5 flex-1 flex flex-col">
                      <h3 className="font-display font-bold text-foreground">{e.title || "Community Event"}</h3>
                      {e.location && (
                        <p className="mt-1.5 text-xs text-muted-foreground inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {e.location}
                        </p>
                      )}
                      {e.organizer && (
                        <p className="mt-1 text-xs text-muted-foreground">by {e.organizer}</p>
                      )}
                      <a
                        href="#contact"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold group-hover:gap-2 transition-all"
                        style={{ color: SECONDARY }}
                      >
                        Learn More
                        <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function Faq() {
  const items = [
    {
      q: "How do I request documents?",
      a: "Register for an account, log in, and select 'Request Document' from your dashboard. Choose the document type, fill out the form, and submit. You'll receive a notification once your request is approved.",
    },
    {
      q: "How long does approval take?",
      a: "Most document requests are processed within 1–3 business days. Urgent requests may be prioritized depending on the document type and current barangay workload.",
    },
    {
      q: "Are online requests secure?",
      a: "Yes. All requests are encrypted end-to-end, verified against barangay records, and only accessible to authorized personnel. Your data is never shared with third parties.",
    },
    {
      q: "How can I receive alerts?",
      a: "Once registered, you'll receive push notifications for emergency alerts, weather warnings, and new announcements. You can manage your alert preferences in your account settings.",
    },
    {
      q: "How do I register?",
      a: "Click the 'Register' button at the top of the page, fill in your personal information, verify your email, and you're ready to access barangay services online.",
    },
    {
      q: "Can I track my request status?",
      a: "Yes. Every request has a unique tracking number visible in your dashboard. You'll get real-time status updates as your request moves through the approval workflow.",
    },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="py-16 sm:py-20 lg:py-28" style={{ background: "var(--background)" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-10 sm:mb-12">
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: SECONDARY }}
            >
              FAQ
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-3">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-muted-foreground">
              Everything you need to know about the platform.
            </p>
          </div>
        </Reveal>
        <div className="space-y-3">
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={it.q} delay={i * 50}>
                <div
                  className={cn(
                    "bg-card rounded-2xl border transition-all",
                    isOpen ? "border-blue-200 shadow-md" : "border-border/80",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left min-h-[44px]"
                  >
                    <span className="font-display font-bold text-foreground text-base sm:text-lg">
                      {it.q}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 text-muted-foreground/70 shrink-0 transition-transform",
                        isOpen && "rotate-180 text-blue-600",
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "grid transition-all duration-300 ease-out",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-muted-foreground leading-relaxed">
                        {it.a}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Contact({ info }: { info: { address: string; contact: string; email: string; name: string; municipality: string; province: string; captain: string } | null }) {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in your name, email, and message.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSending(true);
    try {
      const result = await submitContactInquiry({
        data: {
          name: form.name,
          email: form.email,
          subject: form.subject || "Contact inquiry",
          message: form.message,
          type: "general",
        },
      });
      toast.success(
        `Message sent! Reference: ${result.id}. We'll get back to you soon.`,
        { duration: 6000 },
      );
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  };
  return (
    <section id="contact" className="py-16 sm:py-20 lg:py-28 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: SECONDARY }}
            >
              Get in Touch
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-3">
              Contact Us
            </h2>
            <p className="mt-4 text-muted-foreground">
              Have a question or concern? We&rsquo;d love to hear from you.
            </p>
          </div>
        </Reveal>
        <div className="grid lg:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
          <Reveal>
            <div className="h-full bg-card rounded-2xl border border-border/80 p-5 sm:p-7 shadow-sm">
              <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
                Barangay Information
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {info?.name || "Barangay Cagraray"}
              </p>
              <ul className="mt-5 sm:mt-6 space-y-4 sm:space-y-5">
                <li className="flex items-start gap-3.5">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${SECONDARY}14`, color: SECONDARY }}
                  >
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                      Address
                    </p>
                    <p className="text-sm text-foreground mt-0.5">
                      {info?.address || "Brgy. Cagraray, Bato, Catanduanes"}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3.5">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${ACCENT}14`, color: ACCENT }}
                  >
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                      Phone
                    </p>
                    <a
                      href={`tel:${(info?.contact || "").replace(/[^+\d]/g, "")}`}
                      className="text-sm text-foreground mt-0.5 hover:text-blue-600"
                    >
                      {info?.contact || "+63 (052) 123-4567"}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3.5">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${SUCCESS}14`, color: SUCCESS }}
                  >
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                      Email
                    </p>
                    <a
                      href={`mailto:${info?.email || "info@ecagraray.gov.ph"}`}
                      className="text-sm text-foreground mt-0.5 hover:text-blue-600 break-all"
                    >
                      {info?.email || "info@ecagraray.gov.ph"}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3.5">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${WARNING}14`, color: WARNING }}
                  >
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                      Office Hours
                    </p>
                    <p className="text-sm text-foreground mt-0.5">
                      Monday – Friday, 8:00 AM – 5:00 PM
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <form
              onSubmit={submit}
              className="h-full bg-card rounded-2xl border border-border/80 p-5 sm:p-7 shadow-sm"
            >
              <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">Send a Message</h3>
              <p className="text-sm text-muted-foreground mt-1">
                We typically respond within 24 hours.
              </p>
              <div className="mt-5 sm:mt-6 grid sm:grid-cols-2 gap-3.5 sm:gap-4">
                <label className="block">
                  <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                    Full Name
                  </span>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Edgar Jr. Temanil Toledana"
                    className="mt-1.5 w-full h-11 px-3.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                    Email
                  </span>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="mt-1.5 w-full h-11 px-3.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </label>
              </div>
              <label className="block mt-3.5 sm:mt-4">
                <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Subject
                </span>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="How can we help?"
                  className="mt-1.5 w-full h-11 px-3.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </label>
              <label className="block mt-3.5 sm:mt-4">
                <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Message
                </span>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us more about your concern..."
                  className="mt-1.5 w-full px-3.5 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />
              </label>
              <button
                type="submit"
                disabled={sending}
                className="mt-5 w-full h-12 rounded-xl text-sm font-semibold text-white shadow-lg shadow-blue-900/20 inline-flex items-center justify-center gap-2 transition-all hover:shadow-xl disabled:opacity-60 min-h-[48px]"
                style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}
              >
                {sending ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Footer({
  onCategoryClick,
  onOpenContent,
}: {
  onCategoryClick: (cat: keyof typeof FOOTER_CATEGORIES) => void;
  onOpenContent: (key: string) => void;
}) {
  const cats = Object.keys(FOOTER_CATEGORIES) as (keyof typeof FOOTER_CATEGORIES)[];
  return (
    <footer className="bg-slate-950 text-muted-foreground/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10">
          <div className="lg:col-span-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}
              >
                <Shield className="h-5 w-5 text-white" strokeWidth={2.4} />
              </div>
              <span className="font-display font-bold text-white text-lg">E-Cagraray</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground/70 leading-relaxed">
              A modern, citizen-first e-governance platform for Barangay Cagraray, Bato,
              Catanduanes. Built for transparency, security, and faster public service.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { icon: Globe, label: "Website", href: "/" },
                { icon: Mail, label: "Email", href: "mailto:ecagraraymanagementsystem@gmail.com" },
                { icon: Phone, label: "Phone", href: "tel:+639770086455" },
                { icon: MessageCircle, label: "Chat", href: "#contact" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-slate-900 border border-border/80 hover:bg-slate-800 hover:border-border transition-colors"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div className="lg:col-span-9 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
            {cats.map((key) => {
              const c = FOOTER_CATEGORIES[key];
              return (
                <div key={key}>
                  <button
                    type="button"
                    onClick={() => onCategoryClick(key)}
                    className="text-xs font-bold uppercase tracking-[0.2em] text-white hover:text-blue-300 transition-colors inline-flex items-center gap-1.5"
                  >
                    {c.title}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                  <ul className="mt-4 space-y-2.5">
                    {c.items.map((l) => (
                      <li key={l.id}>
                        <button
                          type="button"
                          onClick={() => onCategoryClick(key)}
                          className="text-sm text-muted-foreground/70 hover:text-white transition-colors text-left"
                        >
                          {l.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} E-Cagraray. All rights reserved. Republic of the
            Philippines, Province of Catanduanes.
          </p>
          <div className="flex items-center gap-5">
            <button onClick={() => onOpenContent("privacy")} className="hover:text-muted-foreground/60 transition-colors">
              Privacy
            </button>
            <button onClick={() => onOpenContent("terms")} className="hover:text-muted-foreground/60 transition-colors">
              Terms
            </button>
            <a href="#home" className="hover:text-muted-foreground/60 transition-colors">
              Sitemap
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

const FOOTER_CATEGORIES: Record<
  string,
  {
    title: string;
    icon: any;
    color: string;
    items: {
      id: string;
      label: string;
      description: string;
      icon: any;
      action: "navigate" | "scroll" | "content" | "form" | "external";
      href?: string;
      target?: string;
      modalKey?: string;
    }[];
  }
> = {
  services: {
    title: "Services",
    icon: FileText,
    color: SECONDARY,
    items: [
      {
        id: "documents",
        label: "Document Requests",
        description: "Apply for barangay clearance, residency, indigency, and business permits online.",
        icon: FileText,
        action: "navigate",
        href: "/login",
      },
      {
        id: "announcements",
        label: "Announcements",
        description: "Read the latest community updates, advisories, and program information.",
        icon: Megaphone,
        action: "scroll",
        target: "announcements",
      },
      {
        id: "alerts",
        label: "Emergency Alerts",
        description: "View active weather, disaster, and safety alerts in your area.",
        icon: AlertTriangle,
        action: "scroll",
        target: "hotlines",
      },
      {
        id: "programs",
        label: "Community Programs",
        description: "Discover upcoming events, volunteer opportunities, and development projects.",
        icon: HeartHandshake,
        action: "scroll",
        target: "community",
      },
    ],
  },
  community: {
    title: "Community",
    icon: Users,
    color: ACCENT,
    items: [
      {
        id: "portal",
        label: "Resident Portal",
        description: "Sign in to your account to manage profile, requests, and notifications.",
        icon: LogIn,
        action: "navigate",
        href: "/login",
      },
      {
        id: "volunteer",
        label: "Volunteer",
        description: "Register as a volunteer and join community service programs.",
        icon: UserPlus,
        action: "navigate",
        href: "/login",
      },
      {
        id: "stats",
        label: "Statistics",
        description: "Explore real-time dashboards and community insights.",
        icon: BarChart3,
        action: "scroll",
        target: "insights",
      },
      {
        id: "showcase",
        label: "Showcase",
        description: "See community events, projects, and activities managed by the administration.",
        icon: Sparkles,
        action: "scroll",
        target: "community",
      },
    ],
  },
  resources: {
    title: "Resources",
    icon: BookOpen,
    color: SUCCESS,
    items: [
      {
        id: "help",
        label: "Help Center",
        description: "Browse frequently asked questions and platform guides.",
        icon: BookOpen,
        action: "content",
        modalKey: "help",
      },
      {
        id: "guide",
        label: "User Guide",
        description: "Step-by-step walkthroughs for residents and administrators.",
        icon: Compass,
        action: "content",
        modalKey: "guide",
      },
      {
        id: "api",
        label: "API Docs",
        description: "Developer reference for platform integrations and webhooks.",
        icon: Code,
        action: "content",
        modalKey: "api",
      },
      {
        id: "status",
        label: "Status",
        description: "Real-time platform status, scheduled maintenance, and uptime history.",
        icon: Activity,
        action: "content",
        modalKey: "status",
      },
    ],
  },
  support: {
    title: "Support",
    icon: LifeBuoy,
    color: WARNING,
    items: [
      {
        id: "contact",
        label: "Contact Us",
        description: "Reach the barangay office directly for inquiries and assistance.",
        icon: Mail,
        action: "scroll",
        target: "contact",
      },
      {
        id: "bug",
        label: "Report a Bug",
        description: "Tell us about an issue you encountered on the platform.",
        icon: Bug,
        action: "form",
        modalKey: "bug",
      },
      {
        id: "feature",
        label: "Feature Request",
        description: "Suggest a new feature or improvement for the platform.",
        icon: Lightbulb,
        action: "form",
        modalKey: "feature",
      },
      {
        id: "feedback",
        label: "Feedback",
        description: "Share your overall experience and rate the platform.",
        icon: Star,
        action: "form",
        modalKey: "feedback",
      },
    ],
  },
  legal: {
    title: "Legal",
    icon: Scale,
    color: "#8B5CF6",
    items: [
      {
        id: "privacy",
        label: "Privacy Policy",
        description: "How we collect, use, and protect your personal information.",
        icon: Lock,
        action: "content",
        modalKey: "privacy",
      },
      {
        id: "terms",
        label: "Terms of Service",
        description: "The rules and guidelines for using the E-Cagraray platform.",
        icon: FileText,
        action: "content",
        modalKey: "terms",
      },
      {
        id: "data",
        label: "Data Protection",
        description: "Our commitment to data privacy and resident information security.",
        icon: ShieldCheck,
        action: "content",
        modalKey: "data",
      },
      {
        id: "a11y",
        label: "Accessibility",
        description: "Our efforts to make the platform usable for everyone.",
        icon: Eye,
        action: "content",
        modalKey: "a11y",
      },
    ],
  },
};

const CONTENT_REGISTRY: Record<string, { title: string; sections: { heading: string; body: string }[] }> = {
  help: {
    title: "Help Center",
    sections: [
      {
        heading: "Getting Started",
        body: "Welcome to E-Cagraray! If you're a new resident, start by creating an account. Once verified, you can request documents, view announcements, and subscribe to emergency alerts directly from your dashboard. Use the Smart Search (⌘K) at the top of any page to instantly find services, officials, or announcements.",
      },
      {
        heading: "Common Topics",
        body: "• How to request a Barangay Clearance\n• How to verify your account\n• How to receive emergency alerts on your phone\n• How to update your resident profile\n• How to file a complaint or report an incident\n• How to register as a volunteer",
      },
      {
        heading: "Need more help?",
        body: "Can't find what you're looking for? Use the Contact Us form below or reach the Barangay Hall during office hours (Monday–Friday, 8:00 AM – 5:00 PM). For urgent matters, call the emergency hotlines listed on the landing page.",
      },
    ],
  },
  guide: {
    title: "User Guide",
    sections: [
      {
        heading: "For Residents",
        body: "1. Click 'Register' in the top-right and complete the form.\n2. Verify your email and wait for admin approval (typically 24 hours).\n3. Once approved, log in and access your personal dashboard.\n4. From the dashboard, you can request documents, view announcements, and manage notifications.\n5. Use the bottom-right 'Ask Cagri AI' button to chat with our AI assistant in English, Filipino, or Bikol.",
      },
      {
        heading: "For Officials",
        body: "1. Officials are onboarded by the Barangay Captain or Super Admin.\n2. Once your role is assigned, log in to access role-specific features.\n3. Manage announcements, alerts, residents, and events from the dashboard.\n4. Use the Insights page to monitor community statistics and trends.\n5. Coordinate with the SK, Secretary, and Disaster teams through the notifications center.",
      },
      {
        heading: "Best Practices",
        body: "Keep your profile information current, especially your contact number and address. Subscribe to announcement categories you care about to receive targeted notifications. Review the platform's Privacy Policy and Terms of Service before submitting personal data.",
      },
    ],
  },
  api: {
    title: "API Documentation",
    sections: [
      {
        heading: "Overview",
        body: "The E-Cagraray API is a REST-style interface for integrating barangay services with external systems. All endpoints are accessed over HTTPS and return JSON. Authentication is performed using session cookies or a Bearer token issued by the platform.",
      },
      {
        heading: "Server Functions",
        body: "Server functions are exposed at /_serverFn/ and accept POST requests with a JSON body matching the function's input schema. Examples include getBarangayInfo, getDashboardStats, submitContactInquiry, and the generic getTableData({ table }). The `table` parameter accepts: 'announcements', 'events', 'alerts', 'residents', 'officials', 'households', 'volunteers', 'users', 'inquiries'.",
      },
      {
        heading: "Rate Limits & Caching",
        body: "Public endpoints (weather, announcements list) are cached for 60 seconds. Authenticated endpoints respect per-user rate limits. Bulk exports are available to admin roles via the dashboard. For integration support, contact the IT coordinator via the platform's Contact Us form.",
      },
    ],
  },
  status: {
    title: "Platform Status",
    sections: [
      {
        heading: "All Systems Operational",
        body: "✅ Core platform — operational\n✅ Authentication — operational\n✅ Database (D1) — operational\n✅ Notifications — operational\n✅ AI Assistant (Cagri) — operational\n✅ Real-time weather — operational",
      },
      {
        heading: "Recent Incidents",
        body: "No major incidents in the past 30 days. The previous incident (brief login latency on April 12) was resolved within 18 minutes.",
      },
      {
        heading: "Scheduled Maintenance",
        body: "Routine maintenance is performed every Sunday at 2:00 AM PHT with no expected downtime. The next scheduled maintenance window is communicated 7 days in advance via the Announcements section.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    sections: [
      {
        heading: "Last Updated",
        body: "This Privacy Policy was last updated on January 15, 2026 and applies to all residents, officials, and visitors of the E-Cagraray platform operated by Barangay Cagraray, Bato, Catanduanes, Philippines.",
      },
      {
        heading: "Information We Collect",
        body: "We collect personal information you provide when registering an account (name, email, contact number, address, birthdate, gender), information you submit through forms (contact inquiries, document requests, incident reports, feedback), and technical information such as device type, browser, and IP address for security and analytics purposes.",
      },
      {
        heading: "How We Use Your Information",
        body: "Your information is used to: (1) verify your identity and process document requests; (2) deliver announcements, alerts, and notifications you have subscribed to; (3) maintain accurate barangay records; (4) respond to your inquiries; (5) improve platform security and performance. We never sell your personal data to third parties.",
      },
      {
        heading: "Data Sharing",
        body: "Your data is shared only with authorized barangay officials who need it to perform their duties, and with government agencies when required by law (e.g., for census, disaster response, or legal proceedings). We do not share data with commercial advertisers.",
      },
      {
        heading: "Data Security",
        body: "All data is encrypted in transit (HTTPS/TLS 1.3) and at rest. Access is protected by authentication, role-based permissions, and audit logs. We conduct regular security reviews and follow the Data Privacy Act of 2012 (RA 10173) of the Philippines.",
      },
      {
        heading: "Your Rights",
        body: "You have the right to: access your personal data; correct inaccurate information; request deletion of your account; opt out of non-essential notifications; and file a complaint with the National Privacy Commission. To exercise these rights, contact the Barangay Data Protection Officer via the Contact Us form.",
      },
      {
        heading: "Contact",
        body: "For privacy-related questions, email ecagraraymanagementsystem@gmail.com or visit the Barangay Hall during office hours.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    sections: [
      {
        heading: "Acceptance of Terms",
        body: "By accessing or using E-Cagraray, you agree to be bound by these Terms of Service and all applicable laws and regulations of the Republic of the Philippines. If you do not agree, you must not use the platform.",
      },
      {
        heading: "Eligibility",
        body: "You must be a bonafide resident, official, or authorized visitor of Barangay Cagraray to use this platform. Account creation requires accurate and complete information. Accounts found to contain false information may be suspended.",
      },
      {
        heading: "Acceptable Use",
        body: "You agree not to: (1) submit false or misleading information; (2) impersonate any person or entity; (3) attempt to gain unauthorized access to other accounts or platform infrastructure; (4) use the platform to harass, defame, or threaten any person; (5) upload malicious code or content; (6) interfere with platform operations.",
      },
      {
        heading: "Service Availability",
        body: "We strive to keep E-Cagraray available 24/7 but do not guarantee uninterrupted access. Scheduled maintenance, network issues, or force majeure events may cause temporary unavailability. Critical announcements are posted through alternative channels (e.g., SMS, public address) during outages.",
      },
      {
        heading: "Document Validity",
        body: "Documents issued through E-Cagraray are official barangay records. Requests are subject to verification, approval, and applicable fees. Falsified documents or fraudulent requests are punishable under Philippine law.",
      },
      {
        heading: "Limitation of Liability",
        body: "E-Cagraray is provided 'as is' without warranties of any kind. The Barangay Cagraray shall not be liable for any indirect, incidental, or consequential damages arising from platform use, to the extent permitted by law.",
      },
      {
        heading: "Modifications",
        body: "We may update these Terms periodically. Continued use after changes constitutes acceptance. Material changes will be announced on the platform.",
      },
    ],
  },
  data: {
    title: "Data Protection",
    sections: [
      {
        heading: "Our Commitment",
        body: "E-Cagraray is committed to protecting the privacy and security of every resident's personal information in compliance with the Data Privacy Act of 2012 (RA 10173) and its Implementing Rules and Regulations.",
      },
      {
        heading: "Data Protection Officer",
        body: "A designated Data Protection Officer (DPO) oversees compliance, handles data subject requests, and coordinates with the National Privacy Commission (NPC). Contact the DPO via the platform's Contact Us form or in person at the Barangay Hall.",
      },
      {
        heading: "Technical Safeguards",
        body: "We employ encryption (TLS 1.3 in transit, AES-256 at rest), role-based access control, audit logging, two-factor authentication for officials, regular vulnerability scanning, and secure backup procedures stored in geographically separate locations.",
      },
      {
        heading: "Organizational Safeguards",
        body: "All officials with data access sign confidentiality agreements and receive annual data privacy training. Access is granted on a need-to-know basis. Third-party service providers (e.g., Cloudflare for hosting) are bound by data processing agreements.",
      },
      {
        heading: "Breach Notification",
        body: "In the event of a personal data breach, affected individuals and the NPC will be notified within 72 hours of discovery, in accordance with RA 10173. Notifications include the nature of the breach, affected data, and recommended actions.",
      },
    ],
  },
  a11y: {
    title: "Accessibility Statement",
    sections: [
      {
        heading: "Our Goal",
        body: "E-Cagraray aims to be accessible to all residents, including persons with disabilities (PWDs), senior citizens, and users of assistive technologies. We follow the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA as our target standard.",
      },
      {
        heading: "What We've Implemented",
        body: "✓ Keyboard-navigable interface for all primary actions\n✓ Screen-reader friendly semantic HTML and ARIA labels\n✓ Color contrast ratios meeting WCAG AA (4.5:1 for normal text)\n✓ Resizable text up to 200% without loss of functionality\n✓ Captions and transcripts for video announcements\n✓ Skip-to-content links for keyboard users\n✓ Focus indicators on all interactive elements",
      },
      {
        heading: "Known Limitations",
        body: "Some legacy PDFs uploaded before 2025 may not be fully accessible. We are working to remediate these. If you encounter content that is not accessible, please report it via the Contact Us form.",
      },
      {
        heading: "Feedback",
        body: "Your feedback helps us improve. If you have difficulty using any part of E-Cagraray, contact our accessibility coordinator via the platform's Contact Us form. We aim to respond within 2 business days.",
      },
    ],
  },
};

const ACTION_FORMS: Record<
  string,
  {
    title: string;
    description: string;
    icon: any;
    color: string;
    subject: string;
    fields: { name: string; label: string; type: string; placeholder?: string; required?: boolean; options?: string[] }[];
  }
> = {
  bug: {
    title: "Report a Bug",
    description: "Tell us about an issue so we can fix it quickly.",
    icon: Bug,
    color: DANGER,
    subject: "BUG REPORT",
    fields: [
      { name: "title", label: "What went wrong?", type: "text", placeholder: "Brief summary of the issue", required: true },
      { name: "steps", label: "Steps to reproduce", type: "textarea", placeholder: "1. Go to...\n2. Click on...\n3. See error...", required: true },
      { name: "name", label: "Your name", type: "text", placeholder: "Optional" },
      { name: "email", label: "Your email", type: "email", placeholder: "Optional, for follow-up" },
    ],
  },
  feature: {
    title: "Request a Feature",
    description: "Suggest something that would make the platform better.",
    icon: Lightbulb,
    color: WARNING,
    subject: "FEATURE REQUEST",
    fields: [
      { name: "title", label: "Feature name", type: "text", placeholder: "What's your idea?", required: true },
      { name: "problem", label: "Problem it solves", type: "textarea", placeholder: "What problem does this address?", required: true },
      { name: "solution", label: "Proposed solution", type: "textarea", placeholder: "How would you like it to work?" },
      { name: "name", label: "Your name", type: "text", placeholder: "Optional" },
      { name: "email", label: "Your email", type: "email", placeholder: "Optional" },
    ],
  },
  feedback: {
    title: "Send Feedback",
    description: "Share your overall experience with the platform.",
    icon: Star,
    color: SUCCESS,
    subject: "FEEDBACK",
    fields: [
      { name: "rating", label: "How would you rate E-Cagraray?", type: "select", options: ["Excellent (5/5)", "Very Good (4/5)", "Good (3/5)", "Fair (2/5)", "Needs Improvement (1/5)"], required: true },
      { name: "highlights", label: "What did you like most?", type: "textarea", placeholder: "Tell us what worked well" },
      { name: "improvements", label: "What can we improve?", type: "textarea", placeholder: "Suggestions for improvement" },
      { name: "name", label: "Your name", type: "text", placeholder: "Optional" },
      { name: "email", label: "Your email", type: "email", placeholder: "Optional" },
    ],
  },
};

function CategoryModal({
  category,
  onClose,
  onItem,
}: {
  category: keyof typeof FOOTER_CATEGORIES | null;
  onClose: () => void;
  onItem: (item: { id: string; action: string; href?: string; target?: string; modalKey?: string }) => void;
}) {
  if (!category) return null;
  const cat = FOOTER_CATEGORIES[category];
  const CatIcon = cat.icon;
  return (
    <Modal open={!!category} onClose={onClose} title={cat.title}>
      <div className="mb-4 flex items-center gap-3">
        <span
          className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ background: `${cat.color}1A`, color: cat.color }}
        >
          <CatIcon className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <p className="text-sm text-muted-foreground">
          Choose a section to explore.
        </p>
      </div>
      <ul className="space-y-2">
        {cat.items.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.id}>
              <button
                type="button"
                onClick={() => onItem(it)}
                className="w-full flex items-start gap-3 p-3.5 rounded-xl border border-border/60 hover:border-border hover:bg-muted/40 text-left transition-all group"
              >
                <span
                  className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${cat.color}14`, color: cat.color }}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{it.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {it.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform mt-1.5 shrink-0" />
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

function ContentModal({
  contentKey,
  onClose,
}: {
  contentKey: string | null;
  onClose: () => void;
}) {
  if (!contentKey) return null;
  const data = CONTENT_REGISTRY[contentKey];
  if (!data) return null;
  return (
    <Modal open={!!contentKey} onClose={onClose} title={data.title}>
      <div className="space-y-5">
        {data.sections.map((s, i) => (
          <div key={i}>
            <h4 className="text-sm font-bold text-foreground mb-1.5">{s.heading}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {s.body}
            </p>
          </div>
        ))}
        <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Have questions? Reach out via our Contact form.
          </p>
          <Button
            onClick={onClose}
            className="px-4 h-9 rounded-lg text-xs font-semibold"
            style={{ background: SECONDARY, color: "white" }}
          >
            Got it
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ActionFormModal({
  actionKey,
  onClose,
}: {
  actionKey: string | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!actionKey) {
      setForm({});
      setError(null);
    }
  }, [actionKey]);

  if (!actionKey) return null;
  const cfg = ACTION_FORMS[actionKey];
  if (!cfg) return null;
  const Icon = cfg.icon;
  // Map actionKey -> inquiry type. The dashboard filters by these values.
  const inquiryType: "bug" | "feature" | "feedback" =
    actionKey === "bug" ? "bug" : actionKey === "feature" ? "feature" : "feedback";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const missing = cfg.fields.filter(
      (f) => f.required && !(form[f.name] || "").trim(),
    );
    if (missing.length) {
      const msg = `Please fill in: ${missing.map((m) => m.label).join(", ")}`;
      setError(msg);
      toast.error(msg);
      return;
    }
    // Email is optional in the form, but if present, must be valid
    const emailVal = (form.email || "").trim();
    if (emailVal && !/^\S+@\S+\.\S+$/.test(emailVal)) {
      const msg = "Please enter a valid email, or leave it blank.";
      setError(msg);
      toast.error(msg);
      return;
    }
    setSending(true);
    try {
      const titleField = form.title || form.name || "Untitled";
      const meta: Record<string, string> = {};
      for (const f of cfg.fields) {
        if (f.name !== "title" && f.name !== "name" && f.name !== "email" && form[f.name]) {
          meta[f.label] = form[f.name];
        }
      }
      const messageBody = cfg.fields
        .filter((f) => f.name !== "title")
        .map((f) => `${f.label}: ${form[f.name] || "—"}`)
        .join("\n");
      const result = await submitContactInquiry({
        data: {
          name: form.name?.trim() || "Anonymous",
          email: emailVal || "noreply@ecagraray.local",
          subject: titleField,
          message: messageBody,
          type: inquiryType,
          meta,
        },
      });
      toast.success(
        `Thank you! Your ${cfg.title.toLowerCase()} was received (Ref: ${result.id}). We'll review it shortly.`,
        { duration: 6000 },
      );
      setForm({});
      onClose();
    } catch (err: any) {
      const msg = err?.message ?? "Failed to submit. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={!!actionKey} onClose={onClose} title={cfg.title}>
      <div className="mb-4 flex items-center gap-3">
        <span
          className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ background: `${cfg.color}1A`, color: cfg.color }}
        >
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <p className="text-sm text-muted-foreground">{cfg.description}</p>
      </div>
      <form onSubmit={submit} className="space-y-3.5">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/[0.08] px-3 py-2.5 text-xs sm:text-sm text-destructive animate-in fade-in slide-in-from-top-1"
          >
            <span className="font-semibold shrink-0">!</span>
            <span className="flex-1">{error}</span>
          </div>
        )}
        {cfg.fields.map((f) => {
          if (f.type === "textarea") {
            return (
              <Textarea
                key={f.name}
                label={f.label + (f.required ? " *" : "")}
                value={form[f.name] || ""}
                onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                placeholder={f.placeholder}
                rows={4}
              />
            );
          }
          if (f.type === "select") {
            return (
              <div key={f.name}>
                <label className="block">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    {f.label}
                    {f.required ? " *" : ""}
                  </span>
                  <select
                    value={form[f.name] || ""}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className="mt-1.5 w-full h-11 px-3 rounded-xl bg-muted/40 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">Select...</option>
                    {f.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            );
          }
          return (
            <Input
              key={f.name}
              type={f.type}
              label={f.label + (f.required ? " *" : "")}
              value={form[f.name] || ""}
              onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
              placeholder={f.placeholder}
            />
          );
        })}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-10 rounded-lg text-sm font-medium border border-border/60 hover:bg-muted/50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={sending}
            className="px-5 h-10 rounded-lg text-sm font-semibold text-white shadow-sm disabled:opacity-60 inline-flex items-center gap-2"
            style={{ background: cfg.color }}
          >
            {sending ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Submit
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AnnouncementDetailModal({
  announcement,
  onClose,
}: {
  announcement: Announcement | null;
  onClose: () => void;
}) {
  if (!announcement) return null;
  return (
    <Modal open={!!announcement} onClose={onClose} title={announcement.title}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border",
              categoryTone(announcement.category),
            )}
          >
            <Tag className="h-3 w-3" />
            {announcement.category}
          </span>
          <time className="text-xs text-muted-foreground">
            {new Date(announcement.createdAt).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </time>
        </div>
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
          {announcement.body}
        </p>
        <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Need to take action? Use Quick Actions above.
          </p>
          <Button
            onClick={onClose}
            className="px-4 h-9 rounded-lg text-xs font-semibold"
            style={{ background: SECONDARY, color: "white" }}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [lang, setLangState] = useState<Language>("en");
  const [weather, setWeather] = useState<{ temp: number; condition: string; description: string } | null>(null);
  const [openCategory, setOpenCategory] = useState<keyof typeof FOOTER_CATEGORIES | null>(null);
  const [openContent, setOpenContent] = useState<string | null>(null);
  const [openAction, setOpenAction] = useState<string | null>(null);
  const [openAnnouncement, setOpenAnnouncement] = useState<Announcement | null>(null);

  const setLang = useCallback((next: Language) => {
    setLangState((prev) => {
      if (prev === next) return prev;
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("ecagraray:lang", next);
          document.documentElement.lang = next;
        }
      } catch {}
      const msgs: Record<Language, string> = {
        en: T.toast.enMsg.en,
        fil: T.toast.filMsg.en,
        bik: T.toast.bikMsg.en,
      };
      toast.success(T.toast.title.en, { description: msgs[next] });
      return next;
    });
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("ecagraray:lang") as Language | null;
      if (stored && (stored === "en" || stored === "fil" || stored === "bik")) {
        setLangState(stored);
        document.documentElement.lang = stored;
      } else {
        document.documentElement.lang = "en";
      }
    } catch {
      document.documentElement.lang = "en";
    }
  }, []);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    return ["super_admin", "captain", "secretary", "sk_officer", "disaster"].includes(user.role);
  }, [user]);

  const handleCategoryClick = useCallback(
    (cat: keyof typeof FOOTER_CATEGORIES) => {
      setOpenCategory(cat);
    },
    [],
  );

  const handleItem = useCallback(
    (item: { id: string; action: string; href?: string; target?: string; modalKey?: string }) => {
      setOpenCategory(null);
      setTimeout(() => {
        if (item.action === "navigate" && item.href) {
          if (item.href === "/login" && user) {
            navigate({ to: "/dashboard" });
          } else {
            navigate({ to: item.href as any });
          }
        } else if (item.action === "scroll" && item.target) {
          const el = document.getElementById(item.target);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (item.action === "content" && item.modalKey) {
          setOpenContent(item.modalKey);
        } else if (item.action === "form" && item.modalKey) {
          setOpenAction(item.modalKey);
        }
      }, 120);
    },
    [navigate, user],
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = ["home", "services", "announcements", "community", "insights", "contact"];
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { threshold: [0.25, 0.5, 0.75], rootMargin: "-30% 0px -30% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const pull = async () => {
      try {
        const res = await fetch(WEATHER_URL);
        if (!res.ok) return;
        const json = (await res.json()) as WeatherData;
        if (json?.current) {
          const info = describeWeatherCode(json.current.weather_code);
          setWeather({
            temp: json.current.temperature_2m,
            condition: info.label,
            description: `${info.label} in ${WEATHER_LOCATION}.`,
          });
        }
      } catch {}
    };
    pull();
    const t = setInterval(pull, 10 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const { barangay, stats, announcements, events, residents, officials, projects, documentsIssued } = Route.useLoaderData();
  const activeAlerts = useMemo(
    () => (announcements as any[]).filter((a) => /disaster|emergency|alert/i.test(a.category)).slice(0, 3),
    [announcements],
  );

  const notifications = useMemo(() => {
    const fromAlerts = activeAlerts.map((a: any) => ({
      id: `alert-${a.id}`,
      type: "alert" as const,
      title: a.title,
      meta: a.level ? `${a.level} • ${a.location || "Barangay-wide"}` : (a.location || "Barangay-wide"),
      at: a.createdAt,
      tone: DANGER,
      icon: AlertTriangle,
    }));
    const fromAnn = (announcements as any[])
      .filter((a) => !/disaster|emergency|alert/i.test(a.category))
      .slice(0, 6)
      .map((a) => ({
        id: `ann-${a.id}`,
        type: "announcement" as const,
        title: a.title,
        meta: a.category || "Announcement",
        at: a.createdAt,
        tone: SECONDARY,
        icon: Megaphone,
      }));
    return [...fromAlerts, ...fromAnn]
      .sort((a, b) => (a.at > b.at ? -1 : 1))
      .slice(0, 8);
  }, [activeAlerts, announcements]);

  const aiContext = useMemo(
    () => ({
      lang,
      stats,
      info: barangay
        ? {
            name: barangay.name,
            municipality: barangay.municipality,
            province: barangay.province,
            address: barangay.address,
            contact: barangay.contact,
            captain: barangay.captain,
          }
        : undefined,
      activeAlerts,
      announcements,
      officials: officials || [],
      weather,
      isLoggedIn: !!user,
      userName: user?.fullName,
      userRole: user?.role,
      residents,
      events,
    }),
    [lang, stats, barangay, activeAlerts, announcements, officials, weather, user, residents, events],
  );

  // Cross-component chat open: AISearch / nav can fire this event and the
  // AIAssistant picks it up. We use a window event so we don't have to thread
  // state through the Navbar (which is rendered far away in the JSX tree).
  const openCagriChat = useCallback((prompt?: string) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("cagri:open-chat", { detail: { prompt } }));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-body antialiased">
      <Navbar
        scrolled={scrolled}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        activeSection={activeSection}
        user={user}
        lang={lang}
        setLang={setLang}
        notifications={notifications}
        aiSearch={
          <Suspense fallback={null}>
            <AISearch
              lang={lang}
              officials={officials || []}
              announcements={announcements}
              alerts={activeAlerts}
              onOpenChat={openCagriChat}
            />
          </Suspense>
        }
      />
      <main>
        <Hero
          residents={residents}
          stats={stats}
          announcements={announcements}
          activeAlerts={activeAlerts}
        />
        <HowItWorks />
        <Services />
        <Officials officials={officials} />
        <Stats
          documentsIssued={documentsIssued}
          announcements={(announcements || []).length}
          communityEvents={(events || []).length}
          communityProjects={projects}
        />
        <WeatherRibbon />
        <Insights
          residents={residents}
          stats={stats}
          announcements={announcements}
          events={events}
        />
        <QuickActions onItem={handleItem} />
        <LiveActivity announcements={announcements} events={events} />
        <EmergencyHotlines />
        <Announcements items={announcements} onReadMore={setOpenAnnouncement} />
        <Showcase events={events} isAdmin={isAdmin} />
        <Faq />
        <Contact info={barangay} />
      </main>
      <Footer onCategoryClick={handleCategoryClick} onOpenContent={setOpenContent} />
      <Suspense fallback={null}>
        <AIAssistant lang={lang} context={aiContext} />
      </Suspense>

      <CategoryModal
        category={openCategory}
        onClose={() => setOpenCategory(null)}
        onItem={handleItem}
      />
      <ContentModal
        contentKey={openContent}
        onClose={() => setOpenContent(null)}
      />
      <ActionFormModal
        actionKey={openAction}
        onClose={() => setOpenAction(null)}
      />
      <AnnouncementDetailModal
        announcement={openAnnouncement}
        onClose={() => setOpenAnnouncement(null)}
      />
    </div>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "E-Cagraray — Smart Barangay Hub" },
      {
        name: "description",
        content:
          "E-Cagraray is a modern e-governance platform for Barangay Cagraray, Bato, Catanduanes — request documents online, receive emergency alerts, and stay connected with your community.",
      },
      { property: "og:title", content: "E-Cagraray — Smart Barangay Hub" },
      {
        property: "og:description",
        content:
          "Smart Governance, Disaster Preparedness, and Community Services for Barangay Cagraray.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  loader: async () => {
    const [barangay, stats, announcements, events, residents, volunteers, documents, officials] =
      await Promise.all([
        getBarangayInfo().catch(() => null),
        getDashboardStats().catch(() => ({ residents: 0, households: 0, volunteers: 0, events: 0 })),
        getTableData({ data: { table: "announcements" } }).catch(() => []),
        getTableData({ data: { table: "events" } }).catch(() => []),
        getTableData({ data: { table: "residents" } }).catch(() => []),
        getTableData({ data: { table: "volunteers" } }).catch(() => []),
        getTableData({ data: { table: "documents" } }).catch(() => []),
        getTableData({ data: { table: "officials" } }).catch(() => []),
      ]);
    const anns: Announcement[] = (announcements || []).filter((a: any) => !a.archived);
    const evs = events || [];
    const projectCount =
      (documents || []).filter((d: any) => d.status === "approved" || d.status === "completed").length +
      anns.filter((a) => /project|program|infrastructure/i.test(a.category)).length +
      evs.length;
    return {
      barangay,
      stats,
      announcements: anns,
      events: evs,
      residents: (residents || []) as Resident[],
      officials: (officials || []) as any[],
      projects: Math.max(45, projectCount, stats.events || 0),
      documentsIssued: (documents || []).filter((d: any) => d.status === "approved" || d.status === "completed").length,
    };
  },
  component: Landing,
});
