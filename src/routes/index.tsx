import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Shield, Users, Megaphone, AlertTriangle, FileText, HeartHandshake,
  Sparkles, BarChart3, MapPin, Phone, Mail, Building2, Sun, Moon,
  CloudSun, CheckCircle, ChevronDown, MessageSquare, HelpCircle,
} from "lucide-react";
import { getBarangayInfo, getDashboardStats, submitContactInquiry, getTableData } from "../lib/api/auth.functions";
import { useTheme, useAuth } from "../lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "e-Cagraray — Smart Barangay Hub" },
      { name: "description", content: "Smart Governance, Disaster Preparedness, and Community Services for Barangay Cagraray, Bato, Catanduanes." },
      { property: "og:title", content: "e-Cagraray" },
      { property: "og:description", content: "Barangay Services, Disaster Alerts & Community Hub." },
    ],
  }),
  component: Landing,
});

type Language = "en" | "fil" | "bik";

const DICTIONARY: Record<Language, Record<string, string>> = {
  en: {
    brand: "e-Cagraray",
    brandSub: "Barangay Smart Hub",
    navAbout: "About Us",
    navServices: "Services",
    navCommunity: "Our Community",
    navContact: "Contact Us",
    login: "Login",
    register: "Register",
    heroTitle: "Your Barangay, Online — Request Documents, Get Alerts, Stay Connected.",
    heroSubtitle: "Welcome to the official digital portal of Barangay Cagraray. We make public services, disaster updates, and community programs easily accessible to everyone.",
    accessPortal: "Access Portal",
    exploreServices: "Explore Services",
    howItWorks: "How It Works",
    howItWorksSub: "Three simple steps to access barangay services from your phone or computer.",
    step1Title: "1. Register an Account",
    step1Desc: "Create your profile with your basic details. Once verified by the Barangay Secretary, your account will be activated.",
    step2Title: "2. Request or Stay Informed",
    step2Desc: "Apply for documents like Barangay Clearance, view the local hazard map, or read the latest community announcements.",
    step3Title: "3. Receive and Download",
    step3Desc: "Get real-time status updates. Once approved, download your official documents directly as high-quality PDF files.",
    officialsTitle: "Barangay Council & Officials",
    officialsSub: "Working together for a safer, stronger, and more prosperous Barangay Cagraray.",
    faqTitle: "Frequently Asked Questions",
    faqSub: "Find quick answers to common questions about our digital services.",
    contactTitle: "Contact Us",
    contactSub: "Have questions or need assistance? Get in touch with our Barangay Secretariat.",
    formName: "Full Name",
    formEmail: "Email Address",
    formMessage: "Message",
    formSubmit: "Send Message",
    sending: "Sending message...",
    sentSuccess: "Message sent successfully!",
    announcementsTitle: "Community Bulletin",
    announcementsSub: "Latest updates and announcements from the Barangay Council.",
    registeredResidents: "Registered Residents",
    households: "Barangay Households",
    volunteers: "Ready Volunteers",
    projects: "Community Projects",
    weather: "Weather Bulletin",
    weatherStation: "Cagraray Station",
    weatherStatus: "Fair Weather",
    activeAlertsTitle: "Active Alerts",
    noAlerts: "All clear. No active alerts at this time.",
  },
  fil: {
    brand: "e-Cagraray",
    brandSub: "Barangay Smart Hub",
    navAbout: "Tungkol sa Amin",
    navServices: "Mga Serbisyo",
    navCommunity: "Ating Komunidad",
    navContact: "Makipag-ugnayan",
    login: "Mag-login",
    register: "Magrehistro",
    heroTitle: "Ang Iyong Barangay, Online — Kumuha ng Dokumento, Makatanggap ng Alerto, Manatiling Konektado.",
    heroSubtitle: "Maligayang pagdating sa opisyal na digital portal ng Barangay Cagraray. Pinapadali namin ang pag-access sa mga serbisyong pampubliko, babala sa kalamidad, at mga programa para sa lahat.",
    accessPortal: "Pumasok sa Portal",
    exploreServices: "Tingnan ang Serbisyo",
    howItWorks: "Paano Ito Gamitin",
    howItWorksSub: "Tatlong simpleng hakbang para ma-access ang mga serbisyo ng barangay gamit ang iyong cellphone o kompyuter.",
    step1Title: "1. Gumawa ng Account",
    step1Desc: "Magrehistro gamit ang iyong impormasyon. Pagkatapos suriin ng Barangay Secretary, ma-aactivate na ang iyong account.",
    step2Title: "2. Humiling o Magbasa",
    step2Desc: "Mag-apply para sa Barangay Clearance o Indigency, tingnan ang mapa ng kalamidad, o magbasa ng mga anunsyo.",
    step3Title: "3. Tanggapin at I-download",
    step3Desc: "Makatanggap ng real-time updates. Kapag approved na, i-download ang iyong opisyal na dokumento bilang PDF.",
    officialsTitle: "Mga Opisyal at Konseho ng Barangay",
    officialsSub: "Nagtutulungan para sa mas ligtas, mas matatag, at mas maunlad na Barangay Cagraray.",
    faqTitle: "Mga Karaniwang Tanong",
    faqSub: "Mabilis na sagot sa mga tanong tungkol sa ating digital na serbisyo.",
    contactTitle: "Makipag-ugnayan",
    contactSub: "May mga katanungan o kailangan ng tulong? Sumulat sa ating Barangay Secretariat.",
    formName: "Buong Pangalan",
    formEmail: "Email Address",
    formMessage: "Mensahe",
    formSubmit: "Ipadala ang Mensahe",
    sending: "Ipinapadala ang mensahe...",
    sentSuccess: "Matagumpay na naipadala ang mensahe!",
    announcementsTitle: "Pisara ng mga Anunsyo",
    announcementsSub: "Mga pinakabagong balita at anunsyo mula sa Barangay Council.",
    registeredResidents: "Mga Nakarehistrong Residente",
    households: "Mga Sambahayan ng Barangay",
    volunteers: "Mga Handa na Boluntaryo",
    projects: "Mga Proyekto ng Komunidad",
    weather: "Ulat ng Panahon",
    weatherStation: "Estasyon ng Cagraray",
    weatherStatus: "Maayos ang Panahon",
    activeAlertsTitle: "Mga Aktibong Alerto",
    noAlerts: "Ligtas ang lahat. Walang aktibong alerto sa ngayon.",
  },
  bik: {
    brand: "e-Cagraray",
    brandSub: "Barangay Smart Hub",
    navAbout: "Manungod sa Samo",
    navServices: "Mga Serbisyo",
    navCommunity: "Saindong Komunidad",
    navContact: "Makipag-olay",
    login: "Mag-login",
    register: "Magrehistro",
    heroTitle: "An Saindong Barangay, Online — Magkua nin Dokumento, Maka-ako nin Alerto, Magdanay na Konektado.",
    heroSubtitle: "Marhay na pag-abot sa opisyal na digital portal kan Barangay Cagraray. Pigpapadali niamo an pag-access sa mga serbisyo publiko, mga paisi sa kalamidad, asin mga programa sa komunidad para sa gabos.",
    accessPortal: "Maglaog sa Portal",
    exploreServices: "Hilingon an Serbisyo",
    howItWorks: "Paano Ini Gamiton",
    howItWorksSub: "Tolong simpleng lakdang para ma-access an mga serbisyo kan barangay gamit an saindong cellphone o kompyuter.",
    step1Title: "1. Maggibo nin Account",
    step1Desc: "Magrehistro gamit an saindong impormasyon. Pagkatapos ma-verify kan Barangay Secretary, gigibuhon nang aktibo an saindong account.",
    step2Title: "2. Mag-request o Magbasa",
    step2Desc: "Mag-request nin Barangay Clearance o Indigency, hilingon an mapa nin kalamidad, o magbasa nin mga anunsyo.",
    step3Title: "3. Akoon asin I-download",
    step3Desc: "Maka-ako nin real-time updates. Pag aprobado na, i-download an saindong opisyal na dokumento bilang PDF.",
    officialsTitle: "Mga Opisyal kan Barangay asin Konseho",
    officialsSub: "Nagtatarabangan para sa mas ligtas, mas makusog, asin mas mauswag na Barangay Cagraray.",
    faqTitle: "Mga Parating Hapot",
    faqSub: "Hanapin an mga simbag sa mga parating hapot manungod sa samong digital na serbisyo.",
    contactTitle: "Makipag-olay sa Samo",
    contactSub: "May mga hapot o nangangaipo nin tabang? Mag-olay sa samong Barangay Secretariat.",
    formName: "Buong Pangaran",
    formEmail: "Email Address",
    formMessage: "Mensahe",
    formSubmit: "Ipadala an Mensahe",
    sending: "Pigpapadala an mensahe...",
    sentSuccess: "Matagumpay na naipadala an mensahe!",
    announcementsTitle: "Papan kalsada kan mga Paisi",
    announcementsSub: "Mga pinakabagong bareta asin paisi hali sa Barangay Council.",
    registeredResidents: "Mga Rehistradong Residente",
    households: "Mga Harong sa Barangay",
    volunteers: "Mga Handa na Boluntaryo",
    projects: "Mga Proyekto kan Komunidad",
    weather: "Ulat kan Panahon",
    weatherStation: "Estasyon kan Cagraray",
    weatherStatus: "Marhay an Panahon",
    activeAlertsTitle: "Mga Aktibong Alerto",
    noAlerts: "Ligtas an gabos. Mayong aktibong alerto sa ngunyan.",
  },
};

const OFFICIALS = [
  { name: "Joseph D. Torrepalma", role: "Punong Barangay (Barangay Captain)", committee: "Overall Community Head" },
  { name: "Aida M. Torrepalma", role: "Barangay Kagawad (Councilor)", committee: "Committee on Finance & Appropriations" },
  { name: "Elmer C. Toledana", role: "Barangay Kagawad (Councilor)", committee: "Committee on Peace & Order" },
  { name: "Edgar T. Balidoy", role: "Barangay Kagawad (Councilor)", committee: "Committee on Agriculture & Fisheries" },
  { name: "Salvacion T. Balidoy", role: "Barangay Kagawad (Councilor)", committee: "Committee on Health & Sanitation" },
  { name: "Allan T. Toledana", role: "Barangay Kagawad (Councilor)", committee: "Committee on Infrastructure & Public Works" },
  { name: "Jeralph T. Balidoy", role: "Barangay Kagawad (Councilor)", committee: "Committee on Environmental Protection" },
  { name: "Joseph T. Balidoy", role: "Barangay Kagawad (Councilor)", committee: "Committee on Human Rights & Justice" },
  { name: "Rona Mae B. Balidoy", role: "SK Chairperson", committee: "Committee on Youth & Sports Development" },
  { name: "Mariam T. Balidoy", role: "Barangay Secretary", committee: "Administration & Records Management" },
  { name: "Marissa B. Balidoy", role: "Barangay Treasurer", committee: "Financial Records & Logistics" },
];

const FAQS = [
  {
    q: { en: "How long does it take to request a Barangay Clearance?", fil: "Gaano katagal bago makakuha ng Barangay Clearance?", bik: "Gurano kahaloy bago makua an Barangay Clearance?" },
    a: {
      en: "Once submitted, the Barangay Secretary will review your request. It typically takes 1-2 hours for approval, and you can download the print-ready PDF immediately.",
      fil: "Pagkatapos mai-submit, susuriin ito ng Barangay Secretary. Kadalasang inaabot ito ng 1-2 oras para sa pag-apruba, at maaari mo na itong i-download agad bilang PDF.",
      bik: "Pagkatapos mai-submit, buburitsipon ini kan Barangay Secretary. Kadalasan nagaabot ini nin 1-2 oras para sa pag-apruba, asin pwede mo na ini i-download tulos bilang PDF."
    }
  },
  {
    q: { en: "Is there any fee for requesting certificates online?", fil: "May bayad ba ang pag-request ng sertipiko online?", bik: "May bayad daw an pag-request nin sertipiko online?" },
    a: {
      en: "The online portal is free to use. Standard local fees for document issuance may apply, which can be settled when collecting physical copies or according to Barangay treasury guidelines.",
      fil: "Libreng gamitin ang online portal. Ang mga karaniwang lokal na bayarin para sa pag-isyu ng dokumento ay maaaring bayaran alinsunod sa mga alituntunin ng Barangay Treasurer.",
      bik: "Libreng gamiton an online portal. An mga karaniwang lokal na bayad para sa pag-isyu nin dokumento pwedeng bayaran alinsunod sa mga panundon kan Barangay Treasurer."
    }
  },
  {
    q: { en: "Who can register on this smart portal?", fil: "Sino ang pwedeng magrehistro sa portal na ito?", bik: "Siisay an pwedeng magrehistro sa portal na ini?" },
    a: {
      en: "All active residents, household members, and SK youths of Barangay Cagraray, Bato, Catanduanes are encouraged to register for personalized services and instant notifications.",
      fil: "Lahat ng residente, miyembro ng pamilya, at kabataan (SK) ng Barangay Cagraray, Bato, Catanduanes ay pwedeng magrehistro para sa mga serbisyo at alerto.",
      bik: "Gabos na residente, miyembro kan pamilya, asin kabataan (SK) kan Barangay Cagraray, Bato, Catanduanes pwedeng magrehistro para sa mga serbisyo asin alerto."
    }
  },
  {
    q: { en: "How do disaster alerts work?", fil: "Paano gumagana ang mga alerto sa kalamidad?", bik: "Paano nagtatrabaho an mga paisi sa kalamidad?" },
    a: {
      en: "Barangay emergency officers broadcast weather or evacuation bulletins instantly to the pinned disaster banner and send push notifications to all registered users.",
      fil: "Agad na ipinapaskil ng mga opisyal sa kalamidad ang mga anunsyo tungkol sa bagyo o baha sa nakapaskil na banner at nagpapadala ng notifications sa mga rehistradong user.",
      bik: "Tulos na ipinapaskil kan mga opisyal sa kalamidad an mga ulat manungod sa bagyo o baha sa nakapaskil na banner asin nagpapadala nin notifications sa mga rehistradong user."
    }
  }
];

function Stat({ value, label, index }: { value: number; label: string; index: number }) {
  return (
    <div className="rounded-[2rem] border border-border/50 bg-card/40 backdrop-blur-md p-6 text-center hover-card-premium dark:bg-slate-900/30 animate-slide-in shadow-sm" style={{ animationDelay: `${index * 75}ms` }}>
      <div className="text-4xl font-extrabold text-primary">{value}</div>
      <div className="mt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function Landing() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate({ to: "/dashboard" });
    }
  }, [user, navigate]);

  const [lang, setLang] = useState<Language>("en");
  const [stats, setStats] = useState({ residents: 0, households: 0, volunteers: 0, events: 0 });
  const [info, setInfo] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [officials, setOfficials] = useState<any[]>(OFFICIALS);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const [msgName, setMsgName] = useState("");
  const [msgEmail, setMsgEmail] = useState("");
  const [msgDetails, setMsgDetails] = useState("");
  const [sendingInquiry, setSendingInquiry] = useState(false);

  const t = (key: string) => DICTIONARY[lang][key] || key;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgName || !msgEmail || !msgDetails) return;
    
    setSendingInquiry(true);
    const toastId = toast.loading(lang === "en" ? "Sending message..." : "Ipinapadala ang mensahe...");
    
    try {
      await submitContactInquiry({
        name: msgName,
        email: msgEmail,
        message: msgDetails
      });
      
      toast.success(
        lang === "en" 
          ? "Message transmitted! An official copy was logged to our system." 
          : "Naipadala ang mensahe! Naka-log na ito sa aming system.", 
        { id: toastId, duration: 6000 }
      );
      setMsgName("");
      setMsgEmail("");
      setMsgDetails("");
    } catch (error) {
      toast.error("Failed to transmit message. Please try again.", { id: toastId });
    } finally {
      setSendingInquiry(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const storedLang = localStorage.getItem("ecagraray:language") as Language;
    if (storedLang && ["en", "fil", "bik"].includes(storedLang)) {
      setLang(storedLang);
    }

    void getDashboardStats().then((stats) => {
      if (stats) setStats(stats);
    });
    void getBarangayInfo().then((info) => {
      setInfo(info);
    });
    void getTableData({ data: { table: "alerts" } }).then((data) => {
      if (data && Array.isArray(data)) {
        setActiveAlerts(data.filter((a) => a.status === "active"));
      }
    });
    void getTableData({ data: { table: "announcements" } }).then((data) => {
      if (data && Array.isArray(data)) {
        setAnnouncements(data.filter((a) => !a.archived).slice(0, 3));
      }
    });
    void getTableData({ data: { table: "officials" } }).then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        setOfficials(data);
      }
    });
  }, []);

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("ecagraray:language", newLang);
  };

  const features = [
    { icon: FileText, t: { en: "Online requests", fil: "Online requests", bik: "Online requests" }, d: { en: "Barangay Clearance, Certificate of Indigency, and Residency Certificate requests.", fil: "Kahilingan para sa Barangay Clearance, Indigency, at Residency Certificate.", bik: "Kahilingan para sa Barangay Clearance, Indigency, asin Residency Certificate." } },
    { icon: AlertTriangle, t: { en: "Disaster warnings", fil: "Alerto sa kalamidad", bik: "Paisi sa kalamidad" }, d: { en: "Live alert broadcasting (typhoon signals, floods, earthquakes) with hazard overlays.", fil: "Live na ulat ng bagyo, baha, at lindol na may gabay sa mga ligtas na evacuation centers.", bik: "Live na ulat kan bagyo, baha, asin lindol na may giya sa mga ligtas na evacuation centers." } },
    { icon: Megaphone, t: { en: "Official notices", fil: "Mga anunsyo", bik: "Mga paisi" }, d: { en: "Stay updated with priority tags (urgent, info, event) and announcements.", fil: "Manatiling updated sa mga balita at programa ng Barangay Council.", bik: "Magdanay na updated sa mga bareta asin programa kan Barangay Council." } },
    { icon: Users, t: { en: "Our community", fil: "Ating komunidad", bik: "Ating komunidad" }, d: { en: "Digital profiling per household with zone maps and SK event trackers.", fil: "Impormasyon bawat pamilya sa purok at SK youth program events.", bik: "Impormasyon lambang pamilya sa purok asin SK youth program events." } }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 relative overflow-x-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 h-[50rem] w-[50rem] rounded-full bg-primary/5 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[20%] left-[-10%] h-[40rem] w-[40rem] rounded-full bg-accent/5 blur-[100px] pointer-events-none -z-10 animate-pulse-slow" />

      {/* Floating Glassmorphic Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/60 backdrop-blur-xl transition-all duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:py-4 md:px-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="grid h-11 w-11 place-items-center rounded-[1.25rem] bg-primary text-white shadow-xl shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
              <Shield className="h-5.5 w-5.5" />
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-slate-900 dark:text-white group-hover:text-primary transition-colors">{t("brand")}</div>
              <div className="text-[8.5px] font-extrabold uppercase tracking-[0.25em] text-muted-foreground">{t("brandSub")}</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground md:flex">
            <a href="#about" className="transition hover:text-primary hover:translate-y-[-1px]">{t("navAbout")}</a>
            <a href="#features" className="transition hover:text-primary hover:translate-y-[-1px]">{t("navServices")}</a>
            <a href="#officials" className="transition hover:text-primary hover:translate-y-[-1px]">{t("navCommunity")}</a>
            <a href="#contact" className="transition hover:text-primary hover:translate-y-[-1px]">{t("navContact")}</a>
          </nav>
          <div className="flex items-center gap-2">
            {/* Multilingual Toggle */}
            <div className="flex bg-muted/60 p-1 rounded-full border border-border/60 text-[10px] font-bold">
              {(["en", "fil", "bik"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => changeLanguage(l)}
                  className={`px-2.5 py-1 rounded-full transition-all uppercase ${lang === l ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {l}
                </button>
              ))}
            </div>
            {mounted && (
              <button
                onClick={toggle}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all duration-200"
                aria-label="Toggle Theme"
              >
                {theme === "dark" ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5" />}
              </button>
            )}
            <Link to="/login" search={{ mode: "login" }} className="rounded-full border border-border/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition hover:border-primary hover:text-primary hover:bg-primary/5">{t("login")}</Link>
            <Link to="/login" search={{ mode: "register" }} className="rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/15 transition hover:opacity-95 hover:shadow-primary/25 active:scale-[0.98]">{t("register")}</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-16 lg:py-24">
        <div className="absolute inset-0 hero-glow opacity-60 pointer-events-none" />
        
        <div className="relative mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
            
            {/* Left Block */}
            <div className="space-y-8 text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/5 px-4 py-2 text-xs font-bold shadow-sm backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-success uppercase tracking-widest text-[9.5px]">Official Portal Active</span>
              </div>
              <div className="space-y-5">
                <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
                  {t("heroTitle")}
                </h1>
                <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                  {t("heroSubtitle")}
                </p>
              </div>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link to="/login" search={{ mode: "login" }} className="inline-flex items-center gap-2.5 rounded-full bg-primary px-8 py-4 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-xl shadow-primary/20 hover:opacity-95 hover:translate-y-[-1px] transition duration-250 active:scale-[0.98]">
                  {t("accessPortal")}
                </Link>
                <a href="#features" className="inline-flex items-center rounded-full border border-border/80 px-8 py-4 text-xs font-bold uppercase tracking-wider transition hover:border-primary hover:text-primary hover:bg-primary/[0.02] hover:translate-y-[-1px] active:scale-[0.98]">
                  {t("exploreServices")}
                </a>
              </div>
            </div>

            {/* Right Block - Announcements Board */}
            <div className="rounded-[2.5rem] border border-border/50 p-6 shadow-2xl backdrop-blur-lg bg-card/45 dark:bg-slate-900/35 relative">
              <div className="flex items-center justify-between border-b border-border/30 pb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">{t("announcementsTitle")}</span>
                </div>
                <Badge tone="info">Bato, Catanduanes</Badge>
              </div>

              {/* Active alerts inside bulletin board if any exist */}
              {activeAlerts.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-rose-500">{t("activeAlertsTitle")}</div>
                  {activeAlerts.map((a) => (
                    <div key={a.id} className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 flex gap-3 text-xs">
                      <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-extrabold text-slate-900 dark:text-white">{a.title}</div>
                        <div className="text-muted-foreground mt-0.5">{a.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Announcements list */}
              <div className="mt-4 space-y-3">
                {announcements.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground font-semibold">
                    {lang === "en" ? "No announcements posted recently." : "Walang kamakailang anunsyo."}
                  </div>
                ) : (
                  announcements.map((a) => (
                    <div key={a.id} className="rounded-2xl border border-border/30 bg-background/55 p-4 flex gap-3.5 items-start">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Megaphone className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-primary">{a.category}</span>
                          <span className="text-[9px] text-muted-foreground font-semibold">{new Date(a.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-white mt-1 truncate">{a.title}</h4>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{a.body}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* "How It Works" Section */}
      <section id="about" className="border-t border-border/50 bg-muted/20 py-20 transition-colors">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">{t("howItWorks")}</div>
            <h2 className="text-3xl font-black md:text-4xl text-slate-950 dark:text-white">{t("howItWorksSub")}</h2>
          </div>
          
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              { t: t("step1Title"), d: t("step1Desc") },
              { t: t("step2Title"), d: t("step2Desc") },
              { t: t("step3Title"), d: t("step3Desc") },
            ].map((x, idx) => (
              <div key={idx} className="group rounded-[2rem] border border-border/50 p-6 backdrop-blur-md bg-card/40 hover-card-premium dark:bg-slate-900/20 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="text-lg font-black text-slate-900 dark:text-white">{x.t}</div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground font-semibold">{x.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">{t("navServices")}</div>
            <h2 className="text-3xl font-black md:text-4xl text-slate-950 dark:text-white">
              {lang === "en" ? "Modern Barangay E-Services" : "Makabagong Serbisyo ng Barangay"}
            </h2>
          </div>
          
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div key={i} className="group rounded-[2rem] border border-border/50 p-6 bg-card/40 backdrop-blur-md hover-card-premium dark:bg-slate-900/20 animate-slide-in shadow-sm" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary shadow-md">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="mt-5 text-base font-extrabold text-slate-900 dark:text-white">{f.t[lang]}</div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground font-semibold">{f.d[lang]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="border-y border-border/50 bg-muted/20 py-16 transition-colors">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 md:grid-cols-4 md:px-6">
          <Stat value={stats.residents} label={t("registeredResidents")} index={0} />
          <Stat value={stats.households} label={t("households")} index={1} />
          <Stat value={stats.volunteers} label={t("volunteers")} index={2} />
          <Stat value={stats.events} label={t("projects")} index={3} />
        </div>
      </section>

      {/* Barangay Council Page Section */}
      <section id="officials" className="py-20 bg-background transition-colors">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">{t("officialsTitle")}</div>
            <h2 className="text-3xl font-black md:text-4xl text-slate-950 dark:text-white">{t("officialsSub")}</h2>
          </div>
          
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {officials.map((o, i) => (
              <div key={i} className="rounded-2xl border border-border/40 bg-card/20 p-5 backdrop-blur-md hover-card-premium flex flex-col justify-between">
                <div>
                  <div className="text-sm font-extrabold text-slate-950 dark:text-white">{o.name}</div>
                  <div className="text-[10px] font-black uppercase text-primary tracking-wider mt-1">{o.role}</div>
                  <div className="text-xs text-muted-foreground font-semibold mt-3 flex items-start gap-1.5">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{o.committee}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 border-t border-border/50 bg-muted/20 transition-colors">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <div className="text-center space-y-4 mb-10">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">{t("faqTitle")}</div>
            <h2 className="text-3xl font-black text-slate-950 dark:text-white">{t("faqSub")}</h2>
          </div>
          
          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const open = faqOpen === idx;
              return (
                <div key={idx} className="rounded-2xl border border-border/50 bg-card/60 overflow-hidden shadow-sm">
                  <button
                    onClick={() => setFaqOpen(open ? null : idx)}
                    className="w-full text-left py-4 px-6 flex justify-between items-center gap-4 transition hover:bg-muted/40 font-extrabold text-sm"
                  >
                    <span>{faq.q[lang]}</span>
                    <ChevronDown className={`h-4.5 w-4.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                  {open && (
                    <div className="px-6 pb-5 pt-1 text-xs text-muted-foreground font-semibold leading-relaxed border-t border-border/20">
                      {faq.a[lang]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Panel */}
      <section id="contact" className="py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 md:grid-cols-2 md:px-6">
          <div className="space-y-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">{t("contactTitle")}</div>
            <h2 className="text-3xl font-black text-slate-950 dark:text-white">{t("contactSub")}</h2>
            <ul className="space-y-4 rounded-[2rem] border border-border/50 bg-card/40 p-6 shadow-sm backdrop-blur-md dark:bg-slate-900/20">
              <li className="flex items-start gap-4">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary"><Building2 className="h-4.5 w-4.5" /></div>
                <div>
                  <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{info?.name || "Barangay Cagraray"}</div>
                  <div className="text-xs text-muted-foreground font-semibold">{info?.municipality || "Bato"}, {info?.province || "Catanduanes"}</div>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary"><MapPin className="h-4.5 w-4.5" /></div>
                <div>
                  <div className="text-xs text-muted-foreground font-semibold leading-relaxed">{info?.address || "Cagraray, Bato, Catanduanes, Ph"}</div>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary"><Phone className="h-4.5 w-4.5" /></div>
                <div>
                  <div className="text-xs text-muted-foreground font-semibold">{info?.contact || "+63 977 008 6455"}</div>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary"><Mail className="h-4.5 w-4.5" /></div>
                <div>
                  <div className="text-xs text-muted-foreground font-semibold">ecagraraymanagementsystem@gmail.com</div>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="rounded-[2.5rem] border border-border/50 p-8 shadow-2xl backdrop-blur-lg bg-card/40 dark:bg-slate-900/30 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-extrabold flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> {t("contactTitle")}</h3>
              <form className="mt-6 space-y-4.5" onSubmit={handleSendMessage}>
                <input value={msgName} onChange={(e) => setMsgName(e.target.value)} className="w-full rounded-2xl border border-border/50 bg-background/50 px-4 py-3 text-xs outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" placeholder={t("formName")} required />
                <input value={msgEmail} onChange={(e) => setMsgEmail(e.target.value)} className="w-full rounded-2xl border border-border/50 bg-background/50 px-4 py-3 text-xs outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" placeholder={t("formEmail")} type="email" required />
                <textarea value={msgDetails} onChange={(e) => setMsgDetails(e.target.value)} className="w-full rounded-2xl border border-border/50 bg-background/50 px-4 py-3 text-xs outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" placeholder={t("formMessage")} rows={5} required />
                <button disabled={sendingInquiry} className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-95 shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50">
                  {sendingInquiry ? t("sending") : t("formSubmit")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 bg-muted/20 transition-colors">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" /> © {new Date().getFullYear()} e-Cagraray Hub · Bato, Catanduanes
          </div>
          <nav className="flex flex-wrap gap-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <a href="#" className="hover:text-primary">Home</a>
            <a href="#about" className="hover:text-primary">{t("navAbout")}</a>
            <a href="#features" className="hover:text-primary">{t("navServices")}</a>
            <a href="#contact" className="hover:text-primary">{t("navContact")}</a>
            <Link to="/login" search={{ mode: "login" }} className="hover:text-primary">{t("login")}</Link>
            <Link to="/login" search={{ mode: "register" }} className="hover:text-primary">{t("register")}</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Badge({ label, tone = "default", children }: { label?: string; tone?: "default" | "success" | "warning" | "danger" | "info" | "muted"; children?: React.ReactNode }) {
  let toneClass = "bg-primary/10 border-primary/20 text-primary shadow-[0_0_8px_rgba(59,130,246,0.1)]";
  if (tone === "success") toneClass = "bg-success/10 border-success/20 text-success shadow-[0_0_8px_rgba(16,185,129,0.1)]";
  if (tone === "warning") toneClass = "bg-warning/10 border-warning/20 text-warning shadow-[0_0_8px_rgba(245,158,11,0.1)]";
  if (tone === "danger") toneClass = "bg-rose-500/10 border-rose-500/20 text-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.1)]";
  if (tone === "muted") toneClass = "bg-muted border-border text-muted-foreground";

  return (
    <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${toneClass}`}>
      {label || children}
    </span>
  );
}
