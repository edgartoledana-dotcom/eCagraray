import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Search, Sparkles, X, FileText, Users, Megaphone, AlertTriangle, Phone, MapPin, Mail,
  Calendar, ArrowRight, Brain, Loader2, Building2, Shield, ChevronRight, History,
  TrendingUp, Clock, Hash, Filter, Mic, ArrowUp, ArrowDown,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAnimatedMount } from "./ui-kit";

type Language = "en" | "fil" | "bik";

interface SearchableItem {
  id: string;
  type: "service" | "official" | "announcement" | "alert" | "faq" | "page" | "action";
  title: string;
  description: string;
  category: string;
  href?: string;
  icon: any;
  keywords: string[];
  tags?: string[];
  createdAt?: string;
  relevance: number;
  matchedField?: string;
  matchedTerm?: string;
}

interface AISearchProps {
  lang: Language;
  officials?: any[];
  announcements?: any[];
  alerts?: any[];
  events?: any[];
  onOpenChat?: () => void;
}

const t = (lang: Language, en: string, fil: string, bik: string) =>
  lang === "en" ? en : lang === "fil" ? fil : bik;

// ─── Trilingual synonym expansion ──────────────────────────────────────
// Boosts recall: "id" → "identification", "brgy" → "barangay", etc.
const SYNONYMS: Record<string, string[]> = {
  id: ["identification", "card", "id"],
  brgy: ["barangay"],
  bgry: ["barangay"],
  cert: ["certificate", "certification"],
  docs: ["document", "documents", "dokumento"],
  doc: ["document", "dokumento"],
  buss: ["business", "negosyo"],
  permit: ["clearance", "license", "permit"],
  clearance: ["permit", "certificate"],
  typhoon: ["bagyo", "storm", "signal"],
  bagyo: ["typhoon", "storm"],
  flood: ["baha", "flooding"],
  baha: ["flood", "flooding"],
  captain: ["kapitan", "leader", "head", "punong"],
  kapitan: ["captain", "punong", "leader"],
  kagawad: ["councilor", "council", "official"],
  secretary: ["secretary", "kalihim"],
  treasurer: ["treasurer", "ingkilo"],
  contact: ["phone", "email", "tawag", "numero"],
  help: ["tulong", "support", "assistance"],
  register: ["signup", "sign up", "mag-register"],
  login: ["log-in", "log in", "signin", "mag-login"],
  password: ["pass", "key", "credentials"],
  weather: ["panahon", "forecast", "ulan"],
  emergency: ["emerhensya", "alert", "disaster"],
  evacuation: ["evac", "shelter", "kanlungan", "ligtas"],
  resident: ["residents", "tao", "taong-bayan", "mamamayan"],
  event: ["events", "gathering", "program", "activity"],
  volunteer: ["volunteers", "boluntaryo"],
  announcement: ["news", "update", "notice", "balita"],
  alert: ["alerts", "warning", "advisory"],
  youth: ["sk", "kabataan", "young"],
  sk: ["sangguniang", "youth", "kabataan"],
  purok: ["zone", "sitio", "area"],
  household: ["households", "sambahayan", "family"],
  complaint: ["complaints", "reklamo", "report"],
  document: ["documents", "dokumento", "papers"],
};

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "in", "on", "at", "to", "for", "of", "with", "by", "from", "as",
  "i", "you", "he", "she", "we", "they", "it",
  "what", "how", "when", "where", "who", "why", "which",
  "do", "does", "did", "can", "could", "would", "should",
  "and", "or", "but", "so",
  "ang", "ng", "sa", "na", "mo", "ko", "siya", "ito", "iyan",
  "mga", "may", "mayroon", "wala", "hindi", "oo",
  "para", "kung", "paano", "ano", "saan", "kailan", "sino", "bakit",
  "daw", "dili", "an", "sarong", "ka", "ki", "kun", "pa",
]);

// ─── Smart matching ───────────────────────────────────────────────────
function expandSynonyms(token: string): string[] {
  const lower = token.toLowerCase();
  const out = new Set([lower]);
  for (const [k, v] of Object.entries(SYNONYMS)) {
    if (k === lower || v.includes(lower)) {
      out.add(k);
      v.forEach((s) => out.add(s));
    }
  }
  return Array.from(out);
}

// Levenshtein distance for typo tolerance
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m: number[][] = [];
  for (let i = 0; i <= b.length; i++) m[i] = [i];
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
        ? m[i - 1][j - 1]
        : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
    }
  }
  return m[b.length][a.length];
}

interface MatchResult {
  score: number;
  matchedField?: string;
  matchedTerm?: string;
}

function scoreField(query: string, target: string, fieldWeight: number): MatchResult {
  if (!query || !target) return { score: 0 };
  const q = query.toLowerCase().trim();
  const tg = target.toLowerCase();

  // Exact match
  if (tg === q) return { score: 100 * fieldWeight, matchedField: fieldWeight === 1 ? "title" : "desc", matchedTerm: target };
  // Prefix
  if (tg.startsWith(q)) return { score: 88 * fieldWeight, matchedField: "title", matchedTerm: target };
  // Word-boundary prefix
  if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(tg)) {
    return { score: 82 * fieldWeight, matchedField: "title", matchedTerm: target };
  }
  // Contains
  if (tg.includes(q)) return { score: 68 * fieldWeight, matchedField: "title", matchedTerm: target };
  // Word-token overlap
  const qTokens = q.split(/\s+/).filter((w) => w.length > 1 && !STOPWORDS.has(w));
  const tTokens = tg.split(/\s+/).filter((w) => w.length > 1);
  let tokenScore = 0;
  for (const qt of qTokens) {
    for (const tt of tTokens) {
      if (tt === qt) { tokenScore += 35; break; }
      if (tt.startsWith(qt) && qt.length >= 3) { tokenScore += 28; break; }
      // Typo tolerance
      if (qt.length >= 4) {
        const dist = levenshtein(qt, tt);
        if (dist <= 1 && Math.abs(qt.length - tt.length) <= 1) {
          tokenScore += 22; break;
        }
      }
      // Substring
      if (qt.length >= 3 && tt.includes(qt)) { tokenScore += 14; break; }
      // Synonym match
      const syns = expandSynonyms(qt);
      if (syns.some((s) => s === tt || tt.startsWith(s))) { tokenScore += 18; break; }
    }
  }
  if (tokenScore > 0) return { score: Math.min(tokenScore * fieldWeight, 60 * fieldWeight), matchedField: "tokens", matchedTerm: target };
  // Acronym match: "bc" matches "Barangay Clearance"
  if (q.length <= 4 && q.length >= 2) {
    const initials = tTokens.map((w) => w[0] || "").join("");
    if (initials === q) return { score: 50 * fieldWeight, matchedField: "acronym", matchedTerm: target };
  }
  return { score: 0 };
}

function fuzzyMatchMulti(query: string, item: SearchableItem): MatchResult {
  // Try matching against title, description, category, and each keyword
  const candidates: MatchResult[] = [];
  candidates.push(scoreField(query, item.title, 1.0));
  candidates.push(scoreField(query, item.description, 0.5));
  candidates.push(scoreField(query, item.category, 0.3));
  for (const kw of item.keywords) {
    if (kw) candidates.push(scoreField(query, kw, 0.7));
  }
  if (item.tags) {
    for (const tag of item.tags) {
      if (tag) candidates.push(scoreField(query, tag, 0.6));
    }
  }
  // Find best
  let best: MatchResult = { score: 0 };
  for (const c of candidates) {
    if (c.score > best.score) best = c;
  }
  // Type boost
  if (best.score > 0) {
    if (item.type === "service") best.score += 5;
    else if (item.type === "page") best.score += 3;
    else if (item.type === "action") best.score += 2;
    else if (item.type === "alert") best.score += 1; // recency-ish
  }
  return best;
}

// "Did you mean" — find the closest single-word match in any title
function suggestDidYouMean(query: string, items: SearchableItem[]): string | null {
  if (!query || query.length < 3) return null;
  const q = query.toLowerCase();
  // First, try simple typo correction on full query vs titles
  let best: { dist: number; title: string } | null = null;
  for (const it of items) {
    const titleWords = it.title.toLowerCase().split(/\s+/);
    for (const w of titleWords) {
      if (w.length < 3) continue;
      if (Math.abs(w.length - q.length) > 3) continue;
      const dist = levenshtein(q, w);
      if (dist <= 2 && (!best || dist < best.dist)) {
        best = { dist, title: it.title };
      }
    }
    // Also try matching first 4-6 chars
    if (q.length >= 4 && !best) {
      for (const w of titleWords) {
        if (w.length < 4) continue;
        const dist = levenshtein(q.substring(0, 4), w.substring(0, 4));
        if (dist <= 1) {
          best = { dist: dist + 1, title: it.title };
          break;
        }
      }
    }
  }
  if (best && best.dist > 0) return best.title;
  return null;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  // Build a regex that matches any word/phrase from the query (case-insensitive)
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
  if (!tokens.length) return text;
  // Also include synonyms for highlighting
  const expanded = new Set<string>(tokens);
  for (const tok of tokens) {
    for (const s of expandSynonyms(tok)) {
      if (s.length >= 3) expanded.add(s);
    }
  }
  const pattern = Array.from(expanded)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const parts = text.split(new RegExp(`(${pattern})`, "gi"));
  return parts.map((part, i) =>
    expanded.has(part.toLowerCase()) ? (
      <mark key={i} className="bg-primary/30 text-primary font-bold rounded px-0.5">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function buildSearchIndex(props: AISearchProps): SearchableItem[] {
  const items: SearchableItem[] = [];
  const now = Date.now();

  items.push(
    {
      id: "service-clearance",
      type: "service",
      title: t(props.lang, "Barangay Clearance", "Barangay Clearance", "Barangay Clearance"),
      description: t(props.lang, "Request official barangay clearance certificate online.", "Mag-request ng opisyal na barangay clearance online.", "Magingge nin opisyal na barangay clearance online."),
      category: "Services",
      href: "/login?mode=login",
      icon: FileText,
      keywords: ["clearance", "certificate", "document", "request", "dokumento", "kumuha", "id", "cert"],
      tags: ["popular", "document"],
      relevance: 0,
    },
    {
      id: "service-residency",
      type: "service",
      title: t(props.lang, "Residency Certificate", "Residency Certificate", "Residency Certificate"),
      description: t(props.lang, "Proof of residency for legal and official purposes.", "Patunay ng paninirahan para sa legal na layunin.", "Patunay nin paninirahan."),
      category: "Services",
      href: "/login?mode=login",
      icon: FileText,
      keywords: ["residency", "residence", "address", "proof", "tirahan", "tinitirahan", "cert"],
      tags: ["document"],
      relevance: 0,
    },
    {
      id: "service-indigency",
      type: "service",
      title: t(props.lang, "Indigency Certificate", "Indigency Certificate", "Indigency Certificate"),
      description: t(props.lang, "Certificate for financial assistance and support programs.", "Sertipiko para sa tulong pinansyal.", "Sertipiko para sa tulong pinansyal."),
      category: "Services",
      href: "/login?mode=login",
      icon: FileText,
      keywords: ["indigency", "indigent", "poor", "assistance", "dukwente", "hirap", "cert"],
      tags: ["document"],
      relevance: 0,
    },
    {
      id: "service-business",
      type: "service",
      title: t(props.lang, "Business Permit", "Business Permit", "Business Permit"),
      description: t(props.lang, "Apply for barangay business permit online.", "Mag-apply ng business permit online.", "Mag-apply nin business permit online."),
      category: "Services",
      href: "/login?mode=login",
      icon: FileText,
      keywords: ["business", "permit", "trading", "negosyo", "tindahan", "buss"],
      tags: ["document"],
      relevance: 0,
    },
    {
      id: "page-alerts",
      type: "page",
      title: t(props.lang, "Disaster Alerts", "Mga Alerto", "Mga Alerto"),
      description: t(props.lang, "Active emergency and disaster alerts in the barangay.", "Aktibong emergency at kalamidad na alerto.", "Aktibong emergency asin kalamidad na alerto."),
      category: "Pages",
      href: "/dashboard/alerts",
      icon: AlertTriangle,
      keywords: ["alert", "emergency", "disaster", "typhoon", "flood", "earthquake", "baha", "bagyo", "lindol"],
      tags: ["safety"],
      relevance: 0,
    },
    {
      id: "page-announcements",
      type: "page",
      title: t(props.lang, "Announcements", "Mga Anunsiyo", "Mga Anunsiyo"),
      description: t(props.lang, "Latest community news and updates.", "Pinakabagong balita at update.", "Pinakabagong bareta asin update."),
      category: "Pages",
      href: "/dashboard/announcements",
      icon: Megaphone,
      keywords: ["announcement", "news", "update", "notice", "balita", "anunsiyo"],
      relevance: 0,
    },
    {
      id: "page-events",
      type: "page",
      title: t(props.lang, "Events & Programs", "Mga Event", "Mga Event"),
      description: t(props.lang, "Community events and programs calendar.", "Calendar ng mga event ng komunidad.", "Calendar nin mga event."),
      category: "Pages",
      href: "/dashboard/events",
      icon: Calendar,
      keywords: ["event", "program", "activity", "meeting", "assembly", "gawain", "pulong"],
      relevance: 0,
    },
    {
      id: "page-officials",
      type: "page",
      title: t(props.lang, "Barangay Officials", "Mga Opisyal", "Mga Opisyal"),
      description: t(props.lang, "Meet your elected barangay officials and leaders.", "Kilala ang inyong mga opisyal.", "Aram an saimong mga opisyal."),
      category: "Pages",
      href: "#officials",
      icon: Users,
      keywords: ["official", "captain", "kagawad", "secretary", "treasurer", "kapitan", "opisyal", "council"],
      tags: ["popular"],
      relevance: 0,
    },
    {
      id: "page-contact",
      type: "page",
      title: t(props.lang, "Contact Information", "Impormasyon", "Impormasyon"),
      description: t(props.lang, "Get in touch with the barangay office.", "Makipag-ugnayan sa barangay.", "Makipag-ugnayan sa barangay."),
      category: "Pages",
      href: "#contact",
      icon: Phone,
      keywords: ["contact", "phone", "email", "address", "reach", "tawag", "numero"],
      relevance: 0,
    },
    {
      id: "page-evacuation",
      type: "page",
      title: t(props.lang, "Evacuation Centers", "Evacuation Center", "Evacuation Center"),
      description: t(props.lang, "Find designated evacuation centers in the barangay.", "Hanapin ang mga evacuation center.", "Hanapin an mga evacuation center."),
      category: "Pages",
      href: "/dashboard/evacuation",
      icon: Shield,
      keywords: ["evacuation", "shelter", "safe", "emergency", "ligtas", "kanlungan", "evac"],
      tags: ["safety"],
      relevance: 0,
    },
    {
      id: "faq-register",
      type: "faq",
      title: t(props.lang, "How do I register an account?", "Paano mag-register?", "Paano mag-register?"),
      description: t(props.lang, "Click Register, fill in your details, and wait for admin approval.", "I-click ang Register at punan ang mga detalye.", "I-click an Register."),
      category: "FAQ",
      href: "/login?mode=register",
      icon: FileText,
      keywords: ["register", "sign up", "account", "create", "mag-register", "signup"],
      relevance: 0,
    },
    {
      id: "faq-forgot-password",
      type: "faq",
      title: t(props.lang, "I forgot my password", "Nakalimutan ko ang password", "Nakalimutan ko an password"),
      description: t(props.lang, "Use the Forgot Password link on the login page to reset.", "Gamitin ang Forgot Password sa login page.", "Gamitin an Forgot Password."),
      category: "FAQ",
      href: "/login",
      icon: FileText,
      keywords: ["password", "forgot", "reset", "login", "nakalimutan", "pass"],
      relevance: 0,
    },
    {
      id: "action-chat",
      type: "action",
      title: t(props.lang, "Chat with Cagri AI", "Makipag-chat kay Cagri AI", "Makipag-chat ki Cagri AI"),
      description: t(props.lang, "Open the AI assistant for instant help.", "Buksan ang AI assistant para sa tulong.", "Bukas an AI assistant."),
      category: "Quick Actions",
      icon: Brain,
      keywords: ["ai", "chat", "assistant", "help", "question", "tulong", "cagri"],
      tags: ["popular"],
      relevance: 0,
    },
  );

  (props.officials || []).forEach((o: any) => {
    items.push({
      id: `official-${o.id || o.name}`,
      type: "official",
      title: o.name,
      description: `${o.role || ""}${o.committee ? ` — ${o.committee}` : ""}`,
      category: "Officials",
      href: "#officials",
      icon: Building2,
      keywords: [o.name, o.role, o.committee, o.position].filter(Boolean).map((s: string) => s.toLowerCase()),
      relevance: 0,
      createdAt: o.createdAt,
    });
  });

  (props.announcements || []).slice(0, 15).forEach((a: any) => {
    items.push({
      id: `announcement-${a.id}`,
      type: "announcement",
      title: a.title || "Announcement",
      description: a.description || a.content || "",
      category: "Announcements",
      href: "/dashboard/announcements",
      icon: Megaphone,
      keywords: [a.title, a.description, a.category].filter(Boolean).map((s: string) => s.toLowerCase()),
      tags: a.category ? [a.category.toLowerCase()] : undefined,
      createdAt: a.createdAt,
    });
  });

  (props.alerts || []).slice(0, 15).forEach((a: any) => {
    items.push({
      id: `alert-${a.id}`,
      type: "alert",
      title: a.title || a.level || "Alert",
      description: a.description || a.message || "",
      category: "Alerts",
      href: "/dashboard/alerts",
      icon: AlertTriangle,
      keywords: [a.title, a.description, a.level].filter(Boolean).map((s: string) => s.toLowerCase()),
      tags: a.level ? [a.level.toLowerCase()] : undefined,
      createdAt: a.createdAt,
    });
  });

  (props.events || []).slice(0, 10).forEach((e: any) => {
    items.push({
      id: `event-${e.id}`,
      type: "announcement", // treat as announcement category
      title: e.title || e.name || "Event",
      description: e.description || "",
      category: "Events",
      href: "/dashboard/events",
      icon: Calendar,
      keywords: [e.title, e.description, e.location].filter(Boolean).map((s: string) => s.toLowerCase()),
      createdAt: e.date || e.createdAt,
    });
  });

  return items;
}

function getAIQueryInterpretation(query: string, lang: Language, resultsCount: number): string {
  const q = query.toLowerCase().trim();
  if (!q) return "";
  const has = (re: RegExp) => re.test(q);

  if (has(/\b(clear|certification|doc|paper)/)) {
    return t(lang, `Showing ${resultsCount} document and certificate services.`, `Ipinapakita ang ${resultsCount} serbisyo para sa dokumento.`, `Ipinapakita an ${resultsCount} serbisyo para sa dokumento.`);
  }
  if (has(/\b(captain|kapitan|head|leader|chief|punong)/)) {
    return t(lang, "Looking for barangay leadership and captain information.", "Naghahanap ng impormasyon tungkol sa kapitan.", "Naghahanap nin impormasyon manongod sa kapitan.");
  }
  if (has(/\b(alert|emergency|disaster|typhoon|flood|baha|bagyo|earthquake|lindol)/)) {
    return t(lang, "Finding emergency, disaster, and weather safety information.", "Naghahanap ng impormasyon tungkol sa emergency.", "Naghahanap nin impormasyon manongod sa emergency.");
  }
  if (has(/\b(event|program|activity|gathering|meeting)/)) {
    return t(lang, "Searching for community events and programs.", "Naghahanap ng mga event at programa.", "Naghahanap nin mga event.");
  }
  if (has(/\b(register|sign up|account|create|new)/)) {
    return t(lang, "Showing account registration help.", "Ipinapakita ang tulong sa pag-register.", "Ipinapakita an tulong sa pag-register.");
  }
  if (has(/\b(contact|phone|email|address|reach|call)/)) {
    return t(lang, "Finding contact information and office details.", "Naghahanap ng impormasyon sa pakikipag-ugnayan.", "Naghahanap nin impormasyon.");
  }
  if (has(/\b(weather|forecast|rain|panahon|ulan|klima)/)) {
    return t(lang, "Showing weather-related results.", "Ipinapakita ang mga resulta tungkol sa panahon.", "Ipinapakita an mga resulta manongod sa panahon.");
  }
  if (has(/\b(official|kagawad|council|secretary|treasurer|sk|chairman)/)) {
    return t(lang, `Listing ${resultsCount} barangay officials and council members.`, `Ipinapakita ang ${resultsCount} opisyal ng barangay.`, `Ipinapakita an ${resultsCount} opisyal.`);
  }
  if (has(/\b(volunteer|volunteers|boluntaryo)/)) {
    return t(lang, "Showing volunteer and SK programs.", "Ipinapakita ang volunteer at SK programs.", "Ipinapakita an volunteer programs.");
  }
  if (has(/\b(youth|sk|kabataan|sangguniang)/)) {
    return t(lang, "Showing youth and SK information.", "Ipinapakita ang impormasyon para sa kabataan.", "Ipinapakita para sa kabataan.");
  }
  if (has(/\b(purok|zone|sitio|address|home)/)) {
    return t(lang, "Showing purok and address information.", "Ipinapakita ang purok at address.", "Ipinapakita an purok asin address.");
  }
  if (has(/\b(complaint|reklamo|report)/)) {
    return t(lang, "Showing complaint and report services.", "Ipinapakita ang complaint at report services.", "Ipinapakita an complaint services.");
  }
  return t(lang, `Smart search found ${resultsCount} matches.`, `Matalinong paghahanap: ${resultsCount} nahanap.`, `Matalinong paghahanap: ${resultsCount} nahanap.`);
}

const HISTORY_KEY = "ecagraray:search-history";
const MAX_HISTORY = 8;

function loadHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: string[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

const TYPE_FILTERS = [
  { key: "all", label: "All" },
  { key: "service", label: "Services" },
  { key: "official", label: "Officials" },
  { key: "announcement", label: "News" },
  { key: "alert", label: "Alerts" },
  { key: "page", label: "Pages" },
  { key: "faq", label: "FAQ" },
  { key: "action", label: "Actions" },
] as const;

export function AISearch({ lang, officials, announcements, alerts, events, onOpenChat }: AISearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<typeof TYPE_FILTERS[number]["key"]>("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const searchIndex = useMemo(
    () => buildSearchIndex({ lang, officials, announcements, alerts, events }),
    [lang, officials, announcements, alerts, events],
  );

  const { mounted, dataState } = useAnimatedMount(open, 200);

  useEffect(() => {
    if (open) {
      setHistory(loadHistory());
      setTypeFilter("all");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  const commitSearch = useCallback(
    (q: string) => {
      if (!q.trim()) return;
      setHistory((h) => {
        const next = [q, ...h.filter((x) => x !== q)].slice(0, MAX_HISTORY);
        saveHistory(next);
        return next;
      });
    },
    [],
  );

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  const results = useMemo(() => {
    if (!query.trim()) return [];
    setSearching(true);
    const startTime = Date.now();

    let scored = searchIndex.map((item) => {
      const m = fuzzyMatchMulti(query, item);
      return { ...item, relevance: m.score, matchedField: m.matchedField, matchedTerm: m.matchedTerm };
    });

    if (typeFilter !== "all") {
      scored = scored.filter((i) => i.type === typeFilter);
    }

    const filtered = scored.filter((item) => item.relevance > 5).sort((a, b) => b.relevance - a.relevance).slice(0, 12);

    const elapsed = Date.now() - startTime;
    if (elapsed < 180) {
      setTimeout(() => setSearching(false), 180 - elapsed);
    } else {
      setSearching(false);
    }
    return filtered;
  }, [query, searchIndex, typeFilter]);

  const didYouMean = useMemo(() => {
    if (results.length > 0) return null;
    if (query.trim().length < 3) return null;
    return suggestDidYouMean(query, searchIndex);
  }, [results, query, searchIndex]);

  const aiInterpretation = useMemo(
    () => (query.trim() ? getAIQueryInterpretation(query, lang, results.length) : ""),
    [query, lang, results.length],
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, typeFilter]);

  useEffect(() => {
    if (results.length === 0) return;
    const el = document.getElementById(`search-result-${selectedIndex}`);
    if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedIndex, results.length]);

  // Global hotkey: Cmd/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "/" && !open && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      // Cycle through type filters
      const idx = TYPE_FILTERS.findIndex((f) => f.key === typeFilter);
      const next = TYPE_FILTERS[(idx + 1) % TYPE_FILTERS.length];
      setTypeFilter(next.key);
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      const item = results[selectedIndex];
      commitSearch(query);
      handleResultClick(item);
    }
  };

  const handleResultClick = (item: SearchableItem) => {
    if (item.type === "action" && item.id === "action-chat") {
      setOpen(false);
      const carriedQuery = query.trim();
      setQuery("");
      // Try the explicit handler first, then the DOM fallback
      if (onOpenChat) {
        onOpenChat(carriedQuery || undefined);
      } else {
        const chatButton = document.querySelector("[aria-label='Open AI Assistant']") as HTMLButtonElement;
        chatButton?.click();
      }
      return;
    }
    if (item.href) {
      commitSearch(query);
      // Hash links should scroll smoothly
      if (item.href.startsWith("#")) {
        setOpen(false);
        setQuery("");
        setTimeout(() => {
          const target = document.querySelector(item.href!);
          if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
        return;
      }
      window.location.href = item.href;
    }
  };

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchableItem[]> = {};
    results.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [results]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const popularSuggestions = useMemo(
    () => [
      t(lang, "How to get a clearance?", "Paano kumuha ng clearance?", "Paano kumuha nin clearance?"),
      t(lang, "Active alerts", "Aktibong alerto", "Aktibong alerto"),
      t(lang, "Who is the captain?", "Sino ang kapitan?", "Sinu an kapitan?"),
      t(lang, "Weather today", "Panahon ngayon", "Panahon ngonyan"),
      t(lang, "Volunteer program", "Programa sa boluntaryo", "Programa sa boluntaryo"),
      t(lang, "Evacuation centers", "Mga evacuation center", "Mga evacuation center"),
    ],
    [lang],
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl border border-border/40 bg-card/40 backdrop-blur-md hover:border-primary/40 hover:bg-card/60 transition-all group min-h-[40px] min-w-[40px] sm:min-w-0"
        aria-label={t(lang, "Open smart search", "Buksan ang matalinong hanap", "Bukas an matalinong hanap")}
        title={t(lang, "Search (⌘K)", "Hanap (⌘K)", "Hanap (⌘K)")}
      >
        <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition" />
        <span className="hidden sm:inline text-[11px] font-semibold text-muted-foreground">
          {t(lang, "Smart search", "Matalinong hanap", "Matalinong hanap")}
        </span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded-md bg-muted/60 text-[9px] font-black text-muted-foreground border border-border/40">
          <span>⌘</span>K
        </kbd>
      </button>

      {mounted && (
        <div
          data-state={dataState}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-start justify-center pt-[4vh] sm:pt-[10vh] px-2 sm:px-3 no-print data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <div
            data-state={dataState}
            className="relative w-full max-w-2xl bg-card/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-border/40 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 ai-search-glow pointer-events-none" />

            {/* Search input */}
            <div className="relative flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-5 py-3.5 sm:py-4 border-b border-border/30">
              <div className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shrink-0">
                <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t(lang, "Ask anything or search…", "Magtanong o maghanap…", "Magtanong o maghanap…")}
                inputMode="search"
                autoComplete="off"
                className="flex-1 min-w-0 bg-transparent text-sm sm:text-base text-foreground outline-none placeholder:text-muted-foreground"
              />
              {searching ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              ) : query ? (
                <button
                  onClick={() => setQuery("")}
                  aria-label={t(lang, "Clear", "Burahin", "Burahon")}
                  className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
              <button
                onClick={close}
                aria-label={t(lang, "Close", "Isara", "Sarhan")}
                className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition sm:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Type filter chips */}
            {query && (
              <div className="flex items-center gap-1.5 overflow-x-auto px-3.5 sm:px-5 py-2.5 border-b border-border/20 bg-muted/20 no-scrollbar">
                <Filter className="h-3 w-3 text-muted-foreground shrink-0" />
                {TYPE_FILTERS.map((f) => {
                  const active = typeFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setTypeFilter(f.key)}
                      className={cn(
                        "shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition min-h-[28px]",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground border border-border/40",
                      )}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* AI interpretation */}
            {aiInterpretation && query && results.length > 0 && (
              <div className="px-3.5 sm:px-5 py-2.5 bg-primary/5 border-b border-border/20 flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-primary shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-semibold text-foreground/80">
                  {aiInterpretation}
                </span>
              </div>
            )}

            {/* Results / empty state / recent / popular */}
            <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain">
              {/* Recent searches (when no query) */}
              {!query && history.length > 0 && (
                <div className="p-3.5 sm:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
                      <History className="h-3 w-3" />
                      {t(lang, "Recent searches", "Mga huling hanap", "Mga huling hanap")}
                    </div>
                    <button
                      onClick={clearHistory}
                      className="text-[10px] font-semibold text-muted-foreground hover:text-destructive transition"
                    >
                      {t(lang, "Clear", "Burahin", "Burahon")}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {history.map((h, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setQuery(h);
                          inputRef.current?.focus();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-card/60 hover:bg-muted/60 hover:border-primary/40 px-3 py-1.5 text-[10.5px] font-semibold text-foreground transition min-h-[36px]"
                      >
                        <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular suggestions (no query) */}
              {!query && (
                <div className="p-3.5 sm:p-5 space-y-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2 px-1 inline-flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3" />
                      {t(lang, "Quick actions", "Mga mabilis na aksyon", "Mga mabilis na aksyon")}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {searchIndex
                        .filter((i) => i.type === "action" || i.tags?.includes("popular"))
                        .slice(0, 4)
                        .map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleResultClick(item)}
                            className="flex items-center gap-2.5 p-3 rounded-xl border border-border/30 hover:border-primary/40 hover:bg-primary/5 transition text-left group min-h-[48px]"
                          >
                            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition shrink-0">
                              <item.icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] sm:text-xs font-bold text-foreground truncate">
                                {item.title}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {item.description}
                              </div>
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition shrink-0" />
                          </button>
                        ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2 px-1 inline-flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3" />
                      {t(lang, "Try asking", "Subukang magtanong", "Subukang magtanong")}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {popularSuggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => setQuery(s)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-card/60 hover:bg-muted/60 hover:border-primary/40 px-3 py-1.5 text-[10.5px] font-semibold text-foreground transition min-h-[36px]"
                        >
                          <Hash className="h-2.5 w-2.5 text-primary" />
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* No results — suggest "Did you mean" */}
              {query && results.length === 0 && !searching && (
                <div className="px-5 sm:px-6 py-10 text-center space-y-3">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted/40 text-muted-foreground mx-auto">
                    <Search className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">
                      {t(lang, "No results for", "Walang nahanap para sa")} "{query}"
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {t(
                        lang,
                        "Try different keywords, or ask Cagri AI for help.",
                        "Subukan ang ibang keyword, o tanungin si Cagri AI.",
                        "Subukan an ibang keyword.",
                      )}
                    </p>
                  </div>
                  {didYouMean && (
                    <button
                      onClick={() => setQuery(didYouMean)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 text-[11px] font-semibold text-primary transition"
                    >
                      <Sparkles className="h-3 w-3" />
                      {t(lang, "Did you mean", "Ibig sabihin mo ba")} "{didYouMean}"?
                    </button>
                  )}
                  {onOpenChat && (
                    <div>
                      <button
                        onClick={() => {
                          setOpen(false);
                          setQuery("");
                          onOpenChat();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition min-h-[36px]"
                      >
                        <Brain className="h-3.5 w-3.5" />
                        {t(lang, "Ask Cagri AI", "Tanungin si Cagri AI", "Tanungin si Cagri AI")}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Results */}
              {query && results.length > 0 && (
                <div className="p-2 sm:p-3 space-y-2.5">
                  {Object.entries(groupedResults).map(([category, items]) => (
                    <div key={category}>
                      <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1 px-2 inline-flex items-center gap-1.5">
                        {category}
                        <span className="rounded-full bg-muted/60 text-muted-foreground px-1.5 text-[9px]">
                          {items.length}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {items.map((item) => {
                          const globalIndex = results.indexOf(item);
                          const isSelected = globalIndex === selectedIndex;
                          return (
                            <button
                              key={item.id}
                              id={`search-result-${globalIndex}`}
                              onClick={() => handleResultClick(item)}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                              className={cn(
                                "w-full flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl text-left transition-all min-h-[52px]",
                                isSelected
                                  ? "bg-primary/10 border border-primary/30"
                                  : "border border-transparent hover:bg-muted/40",
                              )}
                            >
                              <div
                                className={cn(
                                  "grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl shrink-0",
                                  item.type === "alert" && "bg-rose-500/10 text-rose-500",
                                  item.type === "service" && "bg-primary/10 text-primary",
                                  item.type === "official" && "bg-success/10 text-success",
                                  item.type === "announcement" && "bg-warning/10 text-warning",
                                  item.type === "page" && "bg-info/10 text-info",
                                  item.type === "faq" && "bg-violet-500/10 text-violet-500",
                                  item.type === "action" && "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground",
                                )}
                              >
                                <item.icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[12px] sm:text-[13px] font-bold text-foreground line-clamp-1">
                                  {highlightMatch(item.title, query)}
                                </div>
                                <div className="text-[10px] sm:text-[11px] text-muted-foreground line-clamp-1">
                                  {highlightMatch(item.description.substring(0, 100), query)}
                                </div>
                                {item.matchedField === "acronym" && (
                                  <div className="text-[9px] text-primary font-bold uppercase tracking-wider mt-0.5">
                                    {t(lang, "Acronym match", "Acronym match", "Acronym match")}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[9px] font-black text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                                  {Math.round(item.relevance)}%
                                </span>
                                <ChevronRight
                                  className={cn(
                                    "h-3.5 w-3.5",
                                    isSelected ? "text-primary" : "text-muted-foreground",
                                  )}
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with hints */}
            <div className="border-t border-border/30 px-3.5 sm:px-5 py-2.5 bg-card/60 flex items-center justify-between text-[9px] sm:text-[10px] text-muted-foreground gap-2 flex-wrap">
              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/40 font-black inline-flex items-center">
                    <ArrowUp className="h-2 w-2" />
                    <ArrowDown className="h-2 w-2" />
                  </kbd>
                  {t(lang, "navigate", "mag-navigate", "mag-navigate")}
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/40 font-black">↵</kbd>
                  {t(lang, "open", "buksan", "bukas")}
                </span>
                <span className="hidden sm:flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/40 font-black">Tab</kbd>
                  {t(lang, "filter", "i-filter", "i-filter")}
                </span>
                <span className="hidden sm:flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/40 font-black">ESC</kbd>
                  {t(lang, "close", "isara", "sarhan")}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Sparkles className="h-2.5 w-2.5 text-primary" />
                <span className="font-bold text-primary uppercase tracking-wider">
                  {t(lang, "AI-Powered", "AI-Powered", "AI-Powered")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
