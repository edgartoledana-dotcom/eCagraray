import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Compass,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Fingerprint,
  Globe,
  GraduationCap,
  Heart,
  Home as HomeIcon,
  Info,
  Key,
  Lightbulb,
  Loader2,
  Lock,
  Mail,
  MapPin,
  PartyPopper,
  Phone,
  PhoneCall,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  User,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { useAuth, useTheme } from "../lib/auth";
import {
  requestPasswordReset,
  verifyResetCode,
  completePasswordReset,
} from "../lib/api/auth.functions";
import { SESSION_KEY } from "../lib/store";
import { toast } from "sonner";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: (search.mode as string) || "login",
  }),
  head: () => ({
    meta: [
      { title: "Access · e-Cagraray Smart Portal" },
      {
        name: "description",
        content:
          "Securely sign in or register for the E-Cagraray Smart Barangay portal — request documents, receive alerts, and stay connected.",
      },
    ],
  }),
  component: Login,
});

type Mode = "login" | "register" | "forgot" | "otp" | "reset";
type Lang = "en" | "fil" | "bik";

interface ResetContext {
  email: string;
  maskedEmail: string;
  expiresAt: number;
}

const LANGS: { code: Lang; label: string; full: string }[] = [
  { code: "en", label: "EN", full: "English" },
  { code: "fil", label: "FIL", full: "Filipino" },
  { code: "bik", label: "BIK", full: "Bikol" },
];

const T = {
  brand: {
    en: "e-Cagraray",
    fil: "e-Cagraray",
    bik: "e-Cagraray",
  },
  tagline: {
    en: "Your Digital Barangay Gateway",
    fil: "Ang Iyong Digital na Barangay",
    bik: "An Iyong Digital na Barangay",
  },
  subtitle: {
    en: "Access smart governance services, request official clearances, get emergency disaster alerts, and engage with community projects — all in one secure portal.",
    fil: "Mag-access ng mga serbisyo, humiling ng mga clearance, makatanggap ng emergency alerts, at makilahok sa mga proyekto — lahat sa isang secure na portal.",
    bik: "Mag-access nin mga serbisyo, maghingeret nin mga clearance, makaresibe nin mga emergency alert, asin makilahok sa mga proyekto â€” gabos sa sarong secure na portal.",
  },
} as const;

const t = (lang: Lang, en: string, fil: string, bik?: string) =>
  lang === "en" ? en : lang === "fil" ? fil : (bik ?? fil);

const REG_STEPS = [
  {
    n: 1,
    label: { en: "Account", fil: "Account", bik: "Account" },
    desc: { en: "Set up secure credentials", fil: "Mag-set up ng account", bik: "Mag-set up nin account" },
    icon: Key,
  },
  {
    n: 2,
    label: { en: "Personal", fil: "Personal", bik: "Personal" },
    desc: { en: "Tell us about yourself", fil: "Ikwento mo ang iyong sarili", bik: "Istoryahi mo an saimong sadiri" },
    icon: User,
  },
  {
    n: 3,
    label: { en: "Address", fil: "Address", bik: "Address" },
    desc: { en: "Where do you live?", fil: "Saan ka nakatira?", bik: "Hain ka nakatira?" },
    icon: MapPin,
  },
  {
    n: 4,
    label: { en: "Review", fil: "Review", bik: "Review" },
    desc: { en: "Confirm and submit", fil: "Kumpirmahin at isumite", bik: "Kumpirmahon asin isumite" },
    icon: CheckCircle2,
  },
] as const;

function Login() {
  const { mode } = Route.useSearch();
  const [authMode, setAuthMode] = useState<Mode>(
    mode === "register" ? "register" : "login",
  );
  const [resetContext, setResetContext] = useState<ResetContext>({
    email: "",
    maskedEmail: "",
    expiresAt: 0,
  });
  const navigate = useNavigate();
  const { login, register, user } = useAuth();
  const { theme, toggle } = useTheme();
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem("ecagraray:lang") as Lang | null;
      if (stored === "en" || stored === "fil" || stored === "bik") return stored;
    } catch {}
    return "en";
  });
  useEffect(() => {
    try {
      localStorage.setItem("ecagraray:lang", lang);
      document.documentElement.lang = lang;
    } catch {}
  }, [lang]);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  useEffect(() => {
    // Sync authMode with URL when route search changes (e.g. browser back/forward)
    const urlMode = mode === "register" ? "register" : "login";
    setAuthMode((prev) => (prev === "forgot" || prev === "otp" ? prev : urlMode));
  }, [mode]);

  useEffect(() => {
    // Handle Android back button / browser back button to navigate between auth modes
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && (e.state as any).authMode) {
        setAuthMode((e.state as any).authMode);
        return;
      }
      const params = new URLSearchParams(window.location.search);
      const urlMode = params.get("mode");
      setAuthMode(urlMode === "register" ? "register" : "login");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const switchMode = (m: Mode) => {
    if (m === authMode) return;
    setAuthMode(m);
    if (m === "register" || m === "login") {
      navigate({ to: "/login", search: { mode: m } });
    } else {
      // For forgot/otp/reset, push history entry so the back button returns to the previous mode
      try {
        window.history.pushState({ authMode: m }, "", window.location.pathname + window.location.search);
      } catch {}
    }
  };

  return (
    <div
      id="main-content"
      className="min-h-screen w-full overflow-x-hidden bg-background text-foreground font-body antialiased relative animate-in fade-in slide-in-from-bottom-2 duration-500"
    >
      <AuthBackground />

      <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 group"
          aria-label="Back to homepage"
        >
          <div className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
            <Shield className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={2.4} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display font-bold text-foreground text-sm sm:text-base">
              {T.brand.en}
            </span>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium tracking-wide uppercase">
              Smart Barangay
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div
            role="group"
            aria-label="Language switcher"
            className="hidden sm:flex items-center gap-0.5 p-0.5 h-8 rounded-lg bg-card/60 border border-border/40 backdrop-blur"
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
                  "h-6 px-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                  lang === l.code
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/60",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-card/60 hover:text-foreground transition-colors border border-border/40 bg-card/40 backdrop-blur"
          >
            {theme === "dark" ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
          </button>
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors border border-border/40 bg-card/40 backdrop-blur min-h-[44px] sm:min-h-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Home
          </Link>
        </div>
      </header>

      <main
        className="relative z-10 px-3 sm:px-6 lg:px-8 pb-8 sm:pb-12"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto grid w-full max-w-6xl gap-5 sm:gap-6 lg:gap-8 lg:grid-cols-2 items-stretch">
          <BrandPanel lang={lang} mode={authMode} />
          <AuthPanel
            mode={authMode}
            lang={lang}
            onSwitchMode={switchMode}
            resetContext={resetContext}
            setResetContext={setResetContext}
            onHome={() => {
              try {
                window.history.pushState(null, "", "/login");
              } catch {}
              navigate({ to: "/" });
            }}
            onLogin={async (username, password, remember) => {
              try {
                const u = await login(username, password, remember);
                if (!u) {
                  toast.error("Invalid credentials. Please try again.");
                  return false;
                }
                toast.success(`Welcome back, ${u.fullName.split(" ")[0] || u.fullName}!`);
                navigate({ to: "/dashboard" });
                return true;
              } catch (err: any) {
                toast.error(err?.message ?? "Sign in failed. Please try again.");
                return false;
              }
            }}
            onRegister={async (data) => {
              try {
                await register(data);
                toast.success(
                  "Registration submitted! Your account is pending LGU verification.",
                  { duration: 6000 },
                );
                return true;
              } catch (err: any) {
                toast.error(err?.message ?? "Registration failed.");
                return false;
              }
            }}
          />
        </div>

        <p className="mt-6 sm:mt-8 text-center text-[10px] sm:text-xs text-muted-foreground/70 font-medium tracking-wider">
          © {new Date().getFullYear()} e-Cagraray · Republic of the Philippines ·{" "}
          <span className="hidden sm:inline">Province of Catanduanes · </span>Brgy. Cagraray, Bato
        </p>
      </main>
    </div>
  );
}

function AuthBackground() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />
      <div className="absolute top-[-12%] right-[-10%] h-[40rem] w-[40rem] sm:h-[55rem] sm:w-[55rem] rounded-full bg-primary/10 dark:bg-primary/5 blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-[-15%] left-[-12%] h-[35rem] w-[35rem] sm:h-[45rem] sm:w-[45rem] rounded-full bg-sky-500/10 dark:bg-sky-500/5 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[30rem] w-[30rem] rounded-full bg-cyan-400/5 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.05) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}

function BrandPanel({ lang, mode }: { lang: Lang; mode: Mode }) {
  const features = [
    {
      icon: FileText,
      title: t(lang, "Online Document Requests", "Online na mga Kahilingan", "Online na mga Hingeret"),
      desc: t(
        lang,
        "Request clearances and certificates from anywhere, anytime.",
        "Humiling ng mga clearance at sertipiko kahit saan, kahit kailan.",
        "Maghingeret nin mga clearance asin sertipiko sain, kailanman.",
      ),
      color: "from-sky-500 to-blue-600",
    },
    {
      icon: ShieldAlert,
      title: t(lang, "Real-Time Emergency Alerts", "Mga Real-Time na Alert", "Mga Real-Time na Alert"),
      desc: t(
        lang,
        "Get instant notifications for weather, disaster, and safety updates.",
        "Makatanggap ng instant na notification tungkol sa panahon at kalamidad.",
        "Makaresibe nin instant na notification manongod sa panahon asin kalamidad.",
      ),
      color: "from-rose-500 to-orange-600",
    },
    {
      icon: Users,
      title: t(lang, "Community Engagement", "Pakikilahok sa Komunidad", "Pakikilahok sa Komunidad"),
      desc: t(
        lang,
        "Join programs, volunteer, and connect with your neighbors.",
        "Makilahok sa mga programa, mag-volunteer, at makipag-ugnayan.",
        "Makilahok sa mga programa, mag-volunteer, asin makipag-ugnay.",
      ),
      color: "from-emerald-500 to-teal-600",
    },
    {
      icon: Lock,
      title: t(lang, "Bank-Grade Security", "Seguridad na Antas-Bangko", "Seguridad na Antas-Bangko"),
      desc: t(
        lang,
        "Your data is encrypted end-to-end and never shared with third parties.",
        "Ang iyong data ay naka-encrypt at hindi ibinibigay sa ibang partido.",
        "An saimong data ya naka-encrypt asin dai ibinibigay sa ibang partido.",
      ),
      color: "from-violet-500 to-indigo-600",
    },
  ];

  return (
    <section
      aria-label="Brand introduction"
      className="relative hidden lg:flex flex-col justify-between rounded-3xl border border-border/40 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl shadow-2xl shadow-primary/5 p-8 xl:p-10 overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute top-[-30%] right-[-20%] h-[28rem] w-[28rem] rounded-full bg-primary/15 blur-3xl animate-pulse-slow"
      />
      <div
        aria-hidden
        className="absolute bottom-[-20%] left-[-15%] h-[24rem] w-[24rem] rounded-full bg-sky-500/15 blur-3xl"
      />

      <div className="relative z-10 space-y-7">
        <div className="inline-flex w-fit items-center gap-2.5 rounded-full border border-success/30 bg-success/10 px-4 py-2 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-70" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <span className="text-success text-[10px] font-bold uppercase tracking-[0.25em]">
            {t(lang, "Live · Secured", "Live · Secure", "Live · Secure")}
          </span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl xl:text-5xl font-black leading-[1.1] tracking-tight font-display">
            <span className="block bg-clip-text text-transparent bg-gradient-to-br from-primary via-primary to-sky-600">
              {T.tagline[lang]}
            </span>
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground font-medium max-w-md">
            {T.subtitle[lang]}
          </p>
        </div>

        <ul className="space-y-3.5 max-w-md">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <li
                key={f.title}
                className="group flex items-start gap-3.5 rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm p-3.5 transition-all hover:border-primary/30 hover:bg-card/60"
              >
                <div
                  className={cn(
                    "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br",
                    f.color,
                  )}
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold text-foreground text-sm">
                    {f.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                    {f.desc}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="relative z-10 mt-6 rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm p-4 font-mono text-[10px]">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-foreground font-sans flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-primary" />
            {t(lang, "Gateway Status", "Status ng Gateway", "Status kan Gateway")}
          </span>
          <span className="inline-flex items-center gap-1.5 text-success font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            {t(lang, "Operational", "Gumagana", "Gumagana")}
          </span>
        </div>
        <div className="space-y-1.5 text-muted-foreground">
          <StatusLine ok label="D1 Database: Connected" />
          <StatusLine ok label="SSL Encryption: 256-Bit TLS" />
          <StatusLine ok label="Domain Sync: Active" />
          <div className="flex items-center gap-2">
            <ChevronRight className="h-3 w-3 text-primary" />
            <span>Console: Ready</span>
            <span className="inline-block h-3 w-1 bg-primary rounded-sm animate-pulse ml-0.5" />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusLine({ ok, label }: { ok?: boolean; label: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        ok ? "text-success/80" : "text-muted-foreground",
      )}
    >
      <ChevronRight className="h-3 w-3" />
      <span>{label}</span>
    </div>
  );
}

function AuthPanel({
  mode,
  lang,
  onSwitchMode,
  onLogin,
  onRegister,
  onHome,
  resetContext,
  setResetContext,
}: {
  mode: Mode;
  lang: Lang;
  onSwitchMode: (m: Mode) => void;
  onLogin: (username: string, password: string, remember: boolean) => Promise<boolean>;
  onRegister: (data: any) => Promise<boolean>;
  onHome: () => void;
  resetContext: ResetContext;
  setResetContext: (ctx: ResetContext) => void;
}) {
  return (
    <section
      aria-label="Authentication"
      className="relative rounded-3xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/5 p-5 sm:p-7 lg:p-8 flex flex-col"
    >
      <div className="mb-5 sm:mb-6 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {mode === "register"
              ? t(lang, "Create your account", "Gumawa ng account", "Maggibo nin account")
              : mode === "forgot"
                ? t(lang, "Reset password", "I-reset ang password", "I-reset an password")
                : mode === "otp"
                  ? t(lang, "Verify code", "I-verify ang code", "I-verify an code")
                  : mode === "reset"
                    ? t(lang, "Set new password", "Magtakda ng bagong password", "Magtakda nin bagong password")
                    : t(lang, "Welcome back", "Maligayang pagbabalik", "Maligayang pagbabalik")}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
            {mode === "register"
              ? t(
                  lang,
                  "Join thousands of residents using e-Cagraray.",
                  "Sumali sa libu-libong residente na gumagamit ng e-Cagraray.",
                  "Sumali sa mga ribo-ribong residente na gumagamit nin e-Cagraray.",
                )
              : mode === "forgot"
                ? t(
                    lang,
                    "We'll send a secure code to your email.",
                    "Magpapadala kami ng secure na code sa iyong email.",
                    "Magpapadala kami nin secure na code sa saimong email.",
                  )
                : mode === "otp"
                  ? t(
                      lang,
                      `Enter the 6-digit code we sent to ${resetContext.maskedEmail || "your email"}.`,
                      `Ilagay ang 6-digit na code na ipinadala sa ${resetContext.maskedEmail || "iyong email"}.`,
                      `Ilagay an 6-digit na code na ipinadala sa ${resetContext.maskedEmail || "saimong email"}.`,
                    )
                  : mode === "reset"
                    ? t(
                        lang,
                        "Choose a strong password you don't use anywhere else.",
                        "Pumili ng malakas na password na hindi mo ginagamit sa iba.",
                        "Pumili nin malakas na password na dai mo ginagamit sa iba.",
                      )
                    : t(
                        lang,
                        "Sign in to access your dashboard.",
                        "Mag-sign in para ma-access ang iyong dashboard.",
                        "Mag-sign in tanganing ma-access an saimong dashboard.",
                      )}
          </p>
        </div>
        <FingerprintBadge />
      </div>

      {mode === "register" || mode === "login" ? (
        <ModeSwitcher mode={mode} lang={lang} onSwitch={onSwitchMode} />
      ) : null}

      <div className="flex-1 min-h-0 flex flex-col">
        {mode === "login" && (
          <LoginForm
            lang={lang}
            onLogin={onLogin}
            onForgot={() => onSwitchMode("forgot")}
          />
        )}
        {mode === "register" && (
          <RegisterForm lang={lang} onRegister={onRegister} />
        )}
        {mode === "forgot" && (
          <ForgotForm
            lang={lang}
            onSent={(payload) => {
              setResetContext({
                email: payload.email,
                maskedEmail: payload.maskedEmail,
                expiresAt: Date.now() + (payload.expiresInSeconds ?? 300) * 1000,
              });
              onSwitchMode("otp");
            }}
            onBack={() => onSwitchMode("login")}
          />
        )}
        {mode === "otp" && (
          <OtpForm
            lang={lang}
            email={resetContext.email}
            onVerified={() => onSwitchMode("reset")}
            onBack={() => onSwitchMode("forgot")}
          />
        )}
        {mode === "reset" && (
          <ResetForm
            lang={lang}
            email={resetContext.email}
            onDone={() => {
              setResetContext({ email: "", maskedEmail: "", expiresAt: 0 });
              onSwitchMode("login");
            }}
            onBack={() => onSwitchMode("otp")}
          />
        )}
      </div>

      <div className="sm:hidden mt-4 -mx-1">
        <Link
          to="/"
          onClick={onHome}
          className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground bg-card/40 border border-border/40 transition-colors min-h-[44px]"
        >
          <HomeIcon className="h-3.5 w-3.5" />
          {t(lang, "Back to Home", "Bumalik sa Home", "Bumalik sa Home")}
        </Link>
      </div>

      <FooterLinks lang={lang} />
    </section>
  );
}
function ModeSwitcher({
  mode,
  lang,
  onSwitch,
}: {
  mode: Mode;
  lang: Lang;
  onSwitch: (m: Mode) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Authentication mode"
      className="relative flex p-1 bg-muted/60 rounded-xl border border-border/30 mb-5 sm:mb-6 select-none"
    >
      <div
        className="absolute top-1 bottom-1 rounded-lg bg-primary shadow-md shadow-primary/30 transition-all duration-500 ease-out"
        style={{
          left: mode === "register" ? "50%" : "4px",
          width: "calc(50% - 4px)",
        }}
      />
      <button
        type="button"
        role="tab"
        aria-selected={mode === "login"}
        onClick={() => onSwitch("login")}
        className={cn(
          "relative z-10 w-1/2 text-center py-2.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer min-h-[40px] rounded-lg",
          mode === "login" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {t(lang, "Sign In", "Mag-sign In", "Mag-sign In")}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "register"}
        onClick={() => onSwitch("register")}
        className={cn(
          "relative z-10 w-1/2 text-center py-2.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer min-h-[40px] rounded-lg",
          mode === "register" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {t(lang, "Register", "Mag-register", "Mag-register")}
      </button>
    </div>
  );
}

function FingerprintBadge() {
  return (
    <div
      aria-hidden
      className="hidden sm:grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/10 to-sky-500/10 border border-primary/20 text-primary shrink-0"
    >
      <Fingerprint className="h-5 w-5" strokeWidth={2} />
    </div>
  );
}

function LoginForm({
  lang,
  onLogin,
  onForgot,
}: {
  lang: Lang;
  onLogin: (username: string, password: string, remember: boolean) => Promise<boolean>;
  onForgot: () => void;
}) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem("ecagraray:saved-username");
      return { username: saved || "", password: "" };
    } catch {
      return { username: "", password: "" };
    }
  });
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [lockout, setLockout] = useState<{ count: number; lockedUntil: number; remaining: number }>(
    () => {
      try {
        const raw = localStorage.getItem("ecagraray:login-attempts");
        if (raw) {
          const parsed = JSON.parse(raw);
          const now = Date.now();
          if (parsed?.lockedUntil && parsed.lockedUntil > now) {
            return {
              count: parsed.count ?? 0,
              lockedUntil: parsed.lockedUntil,
              remaining: Math.ceil((parsed.lockedUntil - now) / 1000),
            };
          }
        }
      } catch {}
      return { count: 0, lockedUntil: 0, remaining: 0 };
    },
  );

  useEffect(() => {
    if (lockout.remaining <= 0) return;
    const id = window.setInterval(() => {
      setLockout((prev) => {
        const next = Math.max(0, prev.remaining - 1);
        if (next === 0 && prev.lockedUntil > 0) {
          try {
            localStorage.setItem(
              "ecagraray:login-attempts",
              JSON.stringify({ count: 0, lockedUntil: 0 }),
            );
          } catch {}
          return { count: 0, lockedUntil: 0, remaining: 0 };
        }
        return { ...prev, remaining: next };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [lockout.remaining]);

  const isLocked = lockout.remaining > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    const errs: typeof errors = {};
    if (!form.username.trim()) errs.username = t(lang, "Username is required", "Kinakailangan ang username", "Kinakailangan an username");
    if (!form.password) errs.password = t(lang, "Password is required", "Kinakailangan ang password", "Kinakailangan an password");
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    const ok = await onLogin(form.username, form.password, remember);
    if (ok) {
      if (remember) {
        try {
          localStorage.setItem("ecagraray:saved-username", form.username);
        } catch {}
      }
      try {
        localStorage.setItem(
          "ecagraray:login-attempts",
          JSON.stringify({ count: 0, lockedUntil: 0 }),
        );
      } catch {}
    } else {
      const nextCount = lockout.count + 1;
      if (nextCount >= 5) {
        const lockedUntil = Date.now() + 30_000;
        setLockout({ count: nextCount, lockedUntil, remaining: 30 });
        try {
          localStorage.setItem(
            "ecagraray:login-attempts",
            JSON.stringify({ count: nextCount, lockedUntil }),
          );
        } catch {}
        toast.error(
          t(
            lang,
            "Too many failed attempts. Please wait 30 seconds.",
            "Masyadong maraming failed attempts. Maghintay ng 30 segundo.",
          ),
          { duration: 5000 },
        );
      } else {
        setLockout({ ...lockout, count: nextCount });
      }
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4 sm:space-y-5" noValidate>
      {isLocked && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-xl border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-xs sm:text-sm text-warning-foreground animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <ShieldAlert className="h-4 w-4 shrink-0 text-warning" />
          <p className="font-semibold text-foreground">
            {t(
              lang,
              `Too many failed attempts. Try again in ${lockout.remaining}s.`,
              `Masyadong maraming failed attempts. Subukang muli sa ${lockout.remaining}s.`,
            )}
          </p>
        </div>
      )}

      <Field
        label={t(lang, "Username", "Username", "Username")}
        value={form.username}
        onChange={(v) => {
          setForm({ ...form, username: v });
          if (errors.username) setErrors({ ...errors, username: undefined });
        }}
        placeholder={t(lang, "Enter your username", "Ilagay ang iyong username", "Ilagay an saimong username")}
        icon={User}
        error={errors.username}
        autoComplete="username"
        disabled={isLocked}
        required
      />

      <PasswordField
        label={t(lang, "Password", "Password", "Password")}
        value={form.password}
        onChange={(v) => {
          setForm({ ...form, password: v });
          if (errors.password) setErrors({ ...errors, password: undefined });
        }}
        placeholder={t(lang, "Enter your password", "Ilagay ang iyong password", "Ilagay an saimong password")}
        show={show}
        onToggleShow={() => setShow(!show)}
        error={errors.password}
        autoComplete="current-password"
        disabled={isLocked}
        required
      />

      <div className="flex items-center justify-between text-xs sm:text-sm gap-3 flex-wrap">
        <label className="inline-flex items-center gap-2.5 cursor-pointer select-none text-muted-foreground font-medium min-h-[44px] sm:min-h-0 py-2">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-border/60 text-primary focus:ring-primary/30 cursor-pointer"
          />
          {t(lang, "Remember me", "Tandaan mo ako", "Tandaan mo ako")}
        </label>
        <button
          type="button"
          onClick={onForgot}
          disabled={isLocked}
          className="text-primary font-bold text-xs sm:text-sm hover:underline cursor-pointer min-h-[44px] sm:min-h-0 inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t(lang, "Forgot password?", "Nakalimutan ang password?", "Nakalimutan an password?")}
        </button>
      </div>

      <SubmitButton
        submitting={submitting || isLocked}
        label={t(lang, "Sign In", "Mag-sign In", "Mag-sign In")}
        submittingLabel={
          isLocked
            ? t(lang, `Locked (${lockout.remaining}s)`, `Naka-lock (${lockout.remaining}s)`)
            : t(lang, "Signing in...", "Nag-sign in...", "Nag-sign in...")
        }
        icon={<ArrowRight className="h-4 w-4" />}
      />
    </form>
  );
}

function RegisterForm({
  lang,
  onRegister,
}: {
  lang: Lang;
  onRegister: (data: any) => Promise<boolean>;
}) {
  const nav = useNavigate();
  const [step, setStep] = useState(1);

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (showSuccess) {
      const t = setTimeout(() => nav({ to: "/login", search: { mode: "login" } }), 4000);
      return () => clearTimeout(t);
    }
  }, [showSuccess, nav]);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [captchaA] = useState(() => Math.floor(Math.random() * 8) + 2);
  const [captchaB] = useState(() => Math.floor(Math.random() * 8) + 2);
  const [captchaAns, setCaptchaAns] = useState("");
  const captchaExpected = captchaA + captchaB;

  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem("ecagraray:register-draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") return { ...defaultReg, ...parsed };
      }
    } catch {}
    return defaultReg();
  });

  useEffect(() => {
    try {
      localStorage.setItem("ecagraray:register-draft", JSON.stringify(form));
    } catch {}
  }, [form]);

  const strength = useMemo(() => {
    let s = 0;
    if (form.password.length >= 8) s++;
    if (/[A-Z]/.test(form.password)) s++;
    if (/[0-9]/.test(form.password)) s++;
    if (/[^A-Za-z0-9]/.test(form.password)) s++;
    return s;
  }, [form.password]);

  const strengthLabel = ["Weak", "Fair", "Good", "Strong", "Excellent"][strength];
  const strengthColor = [
    "bg-rose-500",
    "bg-amber-500",
    "bg-amber-500",
    "bg-sky-500",
    "bg-emerald-500",
  ][strength];

  const age = useMemo(() => {
    if (!form.birthdate) return null;
    const b = new Date(form.birthdate);
    if (isNaN(b.getTime())) return null;
    const now = new Date();
    let a = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
    return a;
  }, [form.birthdate]);

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!form.username.trim() || form.username.length < 4)
        errs.username = t(lang, "Username must be at least 4 characters", "Ang username ay dapat 4 na karakter", "An username dapat 4 na karakter");
      if (!/^[a-zA-Z0-9._-]+$/.test(form.username))
        errs.username = t(lang, "Letters, numbers, ._- only", "Mga titik, numero, ._- lang", "Mga titik, numero, ._- sana");
      if (form.password.length < 8)
        errs.password = t(lang, "Password must be at least 8 characters", "Ang password ay dapat 8 karakter", "An password dapat 8 karakter");
      if (form.password !== form.confirm)
        errs.confirm = t(lang, "Passwords do not match", "Hindi tugma ang mga password", "Dai saro an mga password");
    }
    if (s === 2) {
      if (!form.fullName.trim() || form.fullName.trim().length < 2)
        errs.fullName = t(lang, "Full name is required", "Kinakailangan ang buong pangalan", "Kinakailangan an enterong pangaran");
      if (!form.birthdate)
        errs.birthdate = t(lang, "Date of birth is required", "Kinakailangan ang kaarawan", "Kinakailangan an kapanganakan");
      if (age !== null && age < 16)
        errs.birthdate = t(lang, "You must be at least 16 years old", "Dapat ay 16 taong gulang ka", "Dapat 16 na taon ka");
      if (!/^\S+@\S+\.\S+$/.test(form.email))
        errs.email = t(lang, "Please enter a valid email", "Maglagay ng valid na email", "Maglagay nin valid na email");
    }
    if (s === 3) {
      if (!form.address.trim())
        errs.address = t(lang, "Address is required", "Kinakailangan ang address", "Kinakailangan an address");
      if (!form.contact.trim() || form.contact.replace(/\D/g, "").length < 10)
        errs.contact = t(lang, "Please enter a valid contact number", "Maglagay ng valid na numero", "Maglagay nin valid na numero");
    }
    if (s === 4) {
      if (!acceptTerms)
        errs.terms = t(lang, "You must accept the terms to continue", "Dapat tanggapin mo ang mga tuntunin", "Dapat tanggapon mo an mga tunton");
      if (parseInt(captchaAns, 10) !== captchaExpected)
        errs.captcha = t(lang, "Captcha answer is incorrect", "Mali ang sagot sa captcha", "Mali an sagot sa captcha");
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (validateStep(step)) setStep((s) => Math.min(4, s + 1));
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;
    setSubmitting(true);
    const ok = await onRegister({
      username: form.username,
      password: form.password,
      fullName: form.fullName,
      email: form.email,
      contact: form.contact,
      address: `${form.address}${form.purok ? `, ${form.purok}` : ""}`,
      birthdate: form.birthdate,
      gender: form.gender,
      role: "resident",
      occupation: form.occupation,
      isPwd: form.isPwd,
      civilStatus: form.civilStatus,
      bloodType: form.bloodType,
      emergencyContact: form.emergencyContact,
      emergencyPhone: form.emergencyPhone,
      purok: form.purok,
      religion: form.religion,
      nationality: form.nationality,
      educationLevel: form.educationLevel,
      philhealthNo: form.philhealthNo,
      tinNo: form.tinNo,
      voterIdNo: form.voterIdNo,
      newsletter,
    });
    if (ok) {
      setShowSuccess(true);
      try {
        localStorage.removeItem("ecagraray:register-draft");
      } catch {}
    }
    setSubmitting(false);
  };

  if (showSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-8 sm:py-10 px-2 space-y-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-success/20 blur-2xl animate-pulse" />
          <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-success to-emerald-600 flex items-center justify-center shadow-xl shadow-success/20">
            <PartyPopper className="h-10 w-10 sm:h-12 sm:w-12 text-success-foreground" />
          </div>
        </div>
        <div className="space-y-2 max-w-sm">
          <h3 className="font-display text-xl sm:text-2xl font-black text-foreground">
            {t(lang, "Application received!", "Natanggap na ang application!")}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t(
              lang,
              "Your registration has been submitted. A barangay secretary will verify your identity within 1–3 business days.",
              "Isinumite na ang iyong registration. Titingnan ng secretary ang iyong impormasyon sa loob ng 1-3 araw.",
              "Isinumite na an saimong registration. Titingnan nin secretary an saimong impormasyon sa laog nin 1-3 aldaw.",
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-full px-3 py-1.5">
          <CircleDot className="h-3 w-3 text-primary" />
          {t(lang, "Reference: ", "Reference: ")}
          <span className="font-mono font-bold text-foreground">
            REG-{Date.now().toString(36).toUpperCase().slice(-6)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5 sm:space-y-6 flex-1 flex flex-col" noValidate>
      <StepIndicator step={step} lang={lang} onStepClick={(s) => s < step && setStep(s)} />

      <div className="flex-1 min-h-0">
        {step === 1 && (
          <Step1Account
            lang={lang}
            form={form}
            setForm={setForm}
            errors={errors}
            showPass={showPass}
            setShowPass={setShowPass}
            showConfirm={showConfirm}
            setShowConfirm={setShowConfirm}
            strength={strength}
            strengthLabel={strengthLabel}
            strengthColor={strengthColor}
            generatePassword={() => {
              const chars =
                "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*";
              let p = "";
              const randomValues = new Uint8Array(14);
              crypto.getRandomValues(randomValues);
              for (let i = 0; i < 14; i++) p += chars[randomValues[i] % chars.length];
              setForm((f: any) => ({ ...f, password: p, confirm: p }));
              toast.success(t(lang, "Strong password generated!", "Malakas na password ang nabuo!"));
            }}
            copyPassword={async () => {
              try {
                await navigator.clipboard.writeText(form.password);
                toast.success(t(lang, "Password copied", "Na-copy ang password"));
              } catch {}
            }}
          />
        )}
        {step === 2 && (
          <Step2Personal
            lang={lang}
            form={form}
            setForm={setForm}
            errors={errors}
            age={age}
          />
        )}
        {step === 3 && (
          <Step3Address
            lang={lang}
            form={form}
            setForm={setForm}
            errors={errors}
          />
        )}
        {step === 4 && (
          <Step4Review
            lang={lang}
            form={form}
            errors={errors}
            acceptTerms={acceptTerms}
            setAcceptTerms={setAcceptTerms}
            newsletter={newsletter}
            setNewsletter={setNewsletter}
            captchaA={captchaA}
            captchaB={captchaB}
            captchaAns={captchaAns}
            setCaptchaAns={setCaptchaAns}
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/30">
        {step > 1 ? (
          <button
            type="button"
            onClick={back}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-bold border border-border bg-card/70 text-foreground hover:bg-card hover:border-primary/40 transition-colors cursor-pointer min-h-[44px]"
          >
            <ChevronLeft className="h-4 w-4" />
            {t(lang, "Back", "Bumalik", "Bumalik")}
          </button>
        ) : (
          <div />
        )}
        {step < 4 ? (
          <button
            type="button"
            onClick={next}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-5 sm:px-6 h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-bold text-primary-foreground bg-gradient-to-br from-primary to-primary/80 hover:shadow-lg hover:shadow-primary/30 hover:from-primary hover:to-primary/70 transition-all cursor-pointer ml-auto min-h-[44px]"
          >
            {t(lang, "Continue", "Magpatuloy", "Magpadagos")}
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-5 sm:px-6 h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-bold text-primary-foreground bg-gradient-to-br from-primary to-primary/80 hover:shadow-lg hover:shadow-primary/30 hover:from-primary hover:to-primary/70 transition-all cursor-pointer ml-auto min-h-[44px] disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t(lang, "Submitting...", "Isinusumite...")}
              </>
            ) : (
              <>
                {t(lang, "Submit Application", "Isumite ang Application")}
                <Check className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}

function defaultReg() {
  return {
    fullName: "",
    birthdate: "",
    gender: "Male",
    address: "",
    contact: "",
    email: "",
    username: "",
    password: "",
    confirm: "",
    occupation: "Other",
    isPwd: "No",
    civilStatus: "Single",
    bloodType: "O+",
    emergencyContact: "",
    emergencyPhone: "",
    purok: "",
    religion: "Roman Catholic",
    nationality: "Filipino",
    educationLevel: "College Level",
    philhealthNo: "",
    tinNo: "",
    voterIdNo: "",
  };
}

function StepIndicator({
  step,
  lang,
  onStepClick,
}: {
  step: number;
  lang: Lang;
  onStepClick: (s: number) => void;
}) {
  return (
    <ol
      aria-label="Registration progress"
      className="flex items-center justify-between gap-1.5 sm:gap-2 select-none"
    >
      {REG_STEPS.map((s, idx) => {
        const Icon = s.icon;
        const done = step > s.n;
        const active = step === s.n;
        return (
          <li
            key={s.n}
            className="flex-1 flex items-center gap-1.5 sm:gap-2 min-w-0"
          >
            <button
              type="button"
              onClick={() => onStepClick(s.n)}
              disabled={s.n >= step}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 group min-w-0",
                s.n < step ? "cursor-pointer" : "cursor-default",
              )}
            >
              <span
                className={cn(
                  "h-7 w-7 sm:h-9 sm:w-9 shrink-0 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold border-2 transition-all",
                  active
                    ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/30 scale-110"
                    : done
                      ? "bg-success/15 border-success text-success"
                      : "bg-muted/60 border-border/40 text-muted-foreground",
                )}
              >
                {done ? (
                  <Check className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={3} />
                ) : (
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </span>
              <span className="min-w-0 text-left hidden sm:block">
                <span
                  className={cn(
                    "block text-[10px] font-bold uppercase tracking-wider truncate",
                    active ? "text-foreground" : done ? "text-success" : "text-muted-foreground",
                  )}
                >
                  {t(lang, `Step ${s.n}`, `Hakbang ${s.n}`)}
                </span>
                <span
                  className={cn(
                    "block text-[10px] font-medium truncate",
                    active ? "text-foreground" : "text-muted-foreground/70",
                  )}
                >
                  {s.label[lang]}
                </span>
              </span>
            </button>
            {idx < REG_STEPS.length - 1 && (
              <div className="flex-1 h-0.5 bg-border/40 rounded-full overflow-hidden min-w-[8px]">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    done ? "bg-success w-full" : "w-0",
                  )}
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Step1Account({
  lang,
  form,
  setForm,
  errors,
  showPass,
  setShowPass,
  showConfirm,
  setShowConfirm,
  strength,
  strengthLabel,
  strengthColor,
  generatePassword,
  copyPassword,
}: any) {
  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
      <Field
        label={t(lang, "Username *", "Username *", "Username *")}
        value={form.username}
        onChange={(v: string) => setForm({ ...form, username: v })}
        placeholder={t(lang, "Choose a username", "Pumili ng username", "Pumili nin username")}
        icon={User}
        error={errors.username}
        hint={t(
          lang,
          "At least 4 characters. Letters, numbers, . _ - allowed.",
          "Hindi bababa sa 4 na karakter.",
          "Hindi mababa sa 4 na karakter.",
        )}
        autoComplete="username"
      />
      <div>
        <PasswordField
          label={t(lang, "Password *", "Password *", "Password *")}
          value={form.password}
          onChange={(v: string) => setForm({ ...form, password: v })}
          placeholder={t(lang, "Minimum 8 characters", "Hindi bababa sa 8 karakter", "Hindi mababa sa 8 karakter")}
          show={showPass}
          onToggleShow={() => setShowPass(!showPass)}
          error={errors.password}
          autoComplete="new-password"
        />
        {form.password.length > 0 && (
          <div className="mt-2 px-0.5 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden border border-border/30">
                <div
                  className={cn("h-full transition-all duration-500", strengthColor)}
                  style={{ width: `${(strength / 4) * 100}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  strength <= 1
                    ? "text-rose-600 dark:text-rose-400"
                    : strength === 2
                      ? "text-amber-600 dark:text-amber-400"
                      : strength === 3
                        ? "text-sky-600 dark:text-sky-400"
                        : "text-emerald-600 dark:text-emerald-400",
                )}
              >
                {strengthLabel}
              </span>
            </div>
            <ul className="grid grid-cols-2 gap-1.5 text-[10px] text-muted-foreground">
              <ReqLine ok={form.password.length >= 8} label={t(lang, "8+ chars", "8+ na karakter")} />
              <ReqLine ok={/[A-Z]/.test(form.password)} label={t(lang, "Uppercase", "Malaking titik")} />
              <ReqLine ok={/[0-9]/.test(form.password)} label={t(lang, "Number", "Numero")} />
              <ReqLine
                ok={/[^A-Za-z0-9]/.test(form.password)}
                label={t(lang, "Symbol", "Simbolo")}
              />
            </ul>
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={generatePassword}
                className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-primary hover:underline min-h-[44px] px-1.5"
              >
                <Zap className="h-3 w-3" />
                {t(lang, "Generate strong password", "Bumuo ng malakas na password")}
              </button>
              {form.password && (
                <button
                  type="button"
                  onClick={copyPassword}
                  className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-muted-foreground hover:text-foreground min-h-[44px] px-1.5"
                >
                  <Copy className="h-3 w-3" />
                  {t(lang, "Copy", "Copy")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <PasswordField
        label={t(lang, "Confirm Password *", "Kumpirmahin ang Password *", "Kumpirmahon an Password *")}
        value={form.confirm}
        onChange={(v: string) => setForm({ ...form, confirm: v })}
        placeholder={t(lang, "Re-enter password", "Ilagay muli ang password", "Ilagay muli an password")}
        show={showConfirm}
        onToggleShow={() => setShowConfirm(!showConfirm)}
        error={errors.confirm}
        autoComplete="new-password"
      />
    </div>
  );
}

function Step2Personal({ lang, form, setForm, errors, age }: any) {
  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
      <Field
        label={t(lang, "Full Name *", "Buong Pangalan *", "Enterong Pangaran *")}
        value={form.fullName}
        onChange={(v: string) => setForm({ ...form, fullName: v })}
        placeholder={t(lang, "e.g. Maria Santos Dela Cruz", "hal. Maria Santos Dela Cruz", "hal. Maria Santos Dela Cruz")}
        icon={User}
        error={errors.fullName}
        autoComplete="name"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        <Field
          label={t(lang, "Date of Birth *", "Kaarawan *", "Kapanganakan *")}
          type="date"
          value={form.birthdate}
          onChange={(v: string) => setForm({ ...form, birthdate: v })}
          icon={Calendar}
          error={errors.birthdate}
          rightHint={age !== null ? `${age} ${t(lang, "yrs old", "taong gulang", "taon")}` : undefined}
          autoComplete="bday"
          max={new Date().toISOString().split("T")[0]}
        />
        <SelectField
          label={t(lang, "Gender", "Kasarian", "Kasarian")}
          value={form.gender}
          onChange={(v: string) => setForm({ ...form, gender: v })}
          icon={UserCheck}
          options={[
            { value: "Male", label: t(lang, "Male", "Lalaki") },
            { value: "Female", label: t(lang, "Female", "Babae") },
            { value: "Other", label: t(lang, "Other", "Iba pa") },
          ]}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        <SelectField
          label={t(lang, "Civil Status", "Katayuan sa Pag-aasawa", "Katayuan sa Pag-aasawa")}
          value={form.civilStatus}
          onChange={(v: string) => setForm({ ...form, civilStatus: v })}
          icon={Heart}
          options={[
            { value: "Single", label: t(lang, "Single", "Walang asawa") },
            { value: "Married", label: t(lang, "Married", "May asawa") },
            { value: "Widowed", label: t(lang, "Widowed", "Balo") },
            { value: "Separated", label: t(lang, "Separated", "Hiwalay") },
          ]}
        />
        <SelectField
          label={t(lang, "Blood Type", "Uri ng Dugo", "Klase nin Dugo")}
          value={form.bloodType}
          onChange={(v: string) => setForm({ ...form, bloodType: v })}
          icon={Zap}
          options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((v) => ({ value: v, label: v }))}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        <SelectField
          label={t(lang, "Occupation / Sector", "Trabaho / Sektor", "Trabaho / Sektor")}
          value={form.occupation}
          onChange={(v: string) => setForm({ ...form, occupation: v })}
          icon={FileText}
          options={[
            { value: "Farmer", label: t(lang, "Farmer", "Magsasaka") },
            { value: "Fisherfolk", label: t(lang, "Fisherfolk", "Mangingisda") },
            { value: "Student", label: t(lang, "Student", "Mag-aaral") },
            { value: "Teacher", label: t(lang, "Teacher", "Guro") },
            { value: "OFW", label: "OFW" },
            { value: "Government Employee", label: t(lang, "Government Employee", "Empleyado ng Gobyerno") },
            { value: "Private Employee", label: t(lang, "Private Employee", "Pribadong Empleyado") },
            { value: "Self-employed", label: t(lang, "Self-employed", "Sariling Negosyo") },
            { value: "Unemployed", label: t(lang, "Unemployed", "Walang Trabaho") },
            { value: "Retired", label: t(lang, "Retired", "Retirado") },
            { value: "Other", label: t(lang, "Other / None", "Iba pa / Wala") },
          ]}
        />
        <SelectField
          label={t(lang, "PWD Status", "PWD Status", "Status nin PWD")}
          value={form.isPwd}
          onChange={(v: string) => setForm({ ...form, isPwd: v })}
          icon={Shield}
          options={[
            { value: "No", label: t(lang, "No", "Hindi") },
            { value: "Yes", label: t(lang, "Yes", "Oo") },
          ]}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        <SelectField
          label={t(lang, "Religion", "Relihiyon", "Relihiyon")}
          value={form.religion}
          onChange={(v: string) => setForm({ ...form, religion: v })}
          icon={Sparkles}
          options={[
            "Roman Catholic",
            "Iglesia ni Cristo",
            "Muslim",
            "Protestant",
            "Born Again",
            "Jehovah's Witness",
            "Buddhist",
            "Other",
          ].map((v) => ({ value: v, label: v }))}
        />
        <Field
          label={t(lang, "Nationality", "Nasyonalidad", "Nasyonalidad")}
          value={form.nationality}
          onChange={(v: string) => setForm({ ...form, nationality: v })}
          placeholder="Filipino"
          icon={Globe}
        />
      </div>
      <SelectField
        label={t(lang, "Education Level", "Antas ng Edukasyon", "Antas nin Edukasyon")}
        value={form.educationLevel}
        onChange={(v: string) => setForm({ ...form, educationLevel: v })}
        icon={GraduationCap}
        options={[
          { value: "Elementary Level", label: t(lang, "Elementary Level", "Antas Elementarya") },
          { value: "Elementary Graduate", label: t(lang, "Elementary Graduate", "Gradweyt Elementarya") },
          { value: "High School Level", label: t(lang, "High School Level", "Antas High School") },
          { value: "High School Graduate", label: t(lang, "High School Graduate", "Gradweyt High School") },
          { value: "College Level", label: t(lang, "College Level", "Antas Kolehiyo") },
          { value: "College Graduate", label: t(lang, "College Graduate", "Gradweyt Kolehiyo") },
          { value: "Vocational", label: t(lang, "Vocational", "Bokasyonal") },
          { value: "Post Graduate", label: t(lang, "Post Graduate", "Post Gradweyt") },
        ]}
      />
      <Field
        label={t(lang, "Email Address *", "Email Address *", "Email Address *")}
        type="email"
        value={form.email}
        onChange={(v: string) => setForm({ ...form, email: v })}
        placeholder="you@example.com"
        icon={Mail}
        error={errors.email}
        autoComplete="email"
        inputMode="email"
      />
    </div>
  );
}

function Step3Address({ lang, form, setForm, errors }: any) {
  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
      <Field
        label={t(lang, "Home Address *", "Address *", "Address *")}
        value={form.address}
        onChange={(v: string) => setForm({ ...form, address: v })}
        placeholder={t(
          lang,
          "House #, Street, Sitio",
          "Numero ng Bahay, Kalye, Sitio",
          "Numero nin Harong, Kalye, Sitio",
        )}
        icon={MapPin}
        error={errors.address}
        autoComplete="street-address"
      />
      <Field
        label={t(lang, "Purok / Zone", "Purok / Zone", "Purok / Zone")}
        value={form.purok}
        onChange={(v: string) => setForm({ ...form, purok: v })}
        placeholder={t(lang, "e.g. Purok 1, Zone 2", "hal. Purok 1, Zone 2", "hal. Purok 1, Zone 2")}
        icon={MapPin}
      />
      <PhoneField
        label={t(lang, "Contact Number *", "Numero ng Telepono *", "Numero nin Telepono *")}
        value={form.contact}
        onChange={(v: string) => setForm({ ...form, contact: v })}
        placeholder="917 123 4567"
        error={errors.contact}
        autoComplete="tel"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        <Field
          label={t(lang, "Emergency Contact Name", "Pangalan ng Emergency Contact", "Pangalan nin Emergency Contact")}
          value={form.emergencyContact}
          onChange={(v: string) => setForm({ ...form, emergencyContact: v })}
          placeholder={t(lang, "Full name", "Buong pangalan", "Enterong pangaran")}
          icon={UserCheck}
        />
        <PhoneField
          label={t(lang, "Emergency Phone", "Telepono sa Emergency", "Telepono sa Emergency")}
          value={form.emergencyPhone}
          onChange={(v: string) => setForm({ ...form, emergencyPhone: v })}
          placeholder="917 123 4567"
        />
      </div>
      <div className="rounded-xl border border-info/20 bg-info/[0.06] p-3 sm:p-3.5 flex gap-2.5 sm:gap-3 text-xs">
        <Info className="h-4 w-4 shrink-0 text-info mt-0.5" />
        <p className="text-muted-foreground leading-relaxed">
          {t(
            lang,
            "The following IDs are optional but help speed up your verification.",
            "Ang mga sumusunod na ID ay opsyonal ngunit makakatulong sa pag-verify.",
            "An mga sumusunod na ID ay optional pero makakatulong sa pag-verify.",
          )}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        <Field
          label="PhilHealth No."
          value={form.philhealthNo}
          onChange={(v: string) => setForm({ ...form, philhealthNo: v })}
          placeholder="12-345678901-2"
          icon={FileText}
        />
        <Field
          label="TIN No."
          value={form.tinNo}
          onChange={(v: string) => setForm({ ...form, tinNo: v })}
          placeholder="123-456-789-000"
          icon={FileText}
        />
      </div>
      <Field
        label={t(lang, "Voter's ID No.", "Voter's ID No.", "Voter's ID No.")}
        value={form.voterIdNo}
        onChange={(v: string) => setForm({ ...form, voterIdNo: v })}
        placeholder="VTR-2024-00123"
        icon={FileText}
      />
    </div>
  );
}

function Step4Review({
  lang,
  form,
  errors,
  acceptTerms,
  setAcceptTerms,
  newsletter,
  setNewsletter,
  captchaA,
  captchaB,
  captchaAns,
  setCaptchaAns,
}: any) {
  const rows = [
    { label: t(lang, "Full Name", "Buong Pangalan"), value: form.fullName, icon: User },
    {
      label: t(lang, "Username", "Username"),
      value: form.username,
      icon: User,
    },
    { label: t(lang, "Email", "Email"), value: form.email, icon: Mail },
    { label: t(lang, "Contact", "Numero"), value: form.contact, icon: Phone },
    { label: t(lang, "Address", "Address"), value: form.address, icon: MapPin },
    {
      label: t(lang, "Date of Birth", "Kaarawan"),
      value: form.birthdate
        ? new Date(form.birthdate).toLocaleDateString()
        : "—",
      icon: Calendar,
    },
  ];
  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm divide-y divide-border/40">
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.label} className="flex items-center gap-3 px-3.5 py-2.5">
              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-20 sm:w-24 shrink-0">
                {r.label}
              </span>
              <span className="text-xs sm:text-sm font-medium text-foreground truncate flex-1 min-w-0">
                {r.value || "â€”"}
              </span>
            </div>
          );
        })}
      </div>

      <label
        className={cn(
          "flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all",
          acceptTerms
            ? "border-primary/40 bg-primary/5"
            : errors.terms
              ? "border-rose-500/50 bg-rose-500/5"
              : "border-border/40 bg-card/40 hover:border-border",
        )}
      >
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border/60 text-primary focus:ring-primary/30 cursor-pointer shrink-0"
        />
        <span className="text-[11px] sm:text-xs leading-relaxed text-muted-foreground">
          {t(
            lang,
            "I confirm the information above is accurate and I accept the ",
            "Kinukumpirma ko na ang impormasyon ay tama at tinatanggap ko ang ",
          )}
          <a
            href="/"
            onClick={(e) => { e.stopPropagation(); window.location.href = "/"; }}
            className="text-primary font-bold hover:underline"
          >
            {t(lang, "Terms of Service", "Mga Tuntunin")}
          </a>{" "}
          {t(lang, "and", "at")}{" "}
          <a
            href="/"
            onClick={(e) => { e.stopPropagation(); window.location.href = "/#contact"; }}
            className="text-primary font-bold hover:underline"
          >
            {t(lang, "Privacy Policy", "Privacy Policy")}
          </a>
          .
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-xl border border-border/40 bg-card/40 p-3.5 cursor-pointer hover:border-border transition-all">
        <input
          type="checkbox"
          checked={newsletter}
          onChange={(e) => setNewsletter(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border/60 text-primary focus:ring-primary/30 cursor-pointer shrink-0"
        />
        <span className="text-[11px] sm:text-xs leading-relaxed text-muted-foreground">
          {t(
            lang,
            "Send me barangay announcements, weather alerts, and event updates.",
            "Padalahan mo ako ng mga announcement, alert sa panahon, at updates.",
            "Padalahan mo ako nin mga announcement, alert sa panahon, asin updates.",
          )}
        </span>
      </label>

      <div
        className={cn(
          "rounded-xl border p-3.5 space-y-2",
          errors.captcha
            ? "border-rose-500/50 bg-rose-500/5"
            : "border-border/40 bg-card/40",
        )}
      >
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {t(lang, "Security Check", "Security Check", "Security Check")}
          </span>
        </label>
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div
            aria-hidden
            className="h-11 sm:h-12 px-3 sm:px-4 rounded-xl bg-gradient-to-br from-muted to-muted/60 border border-border/40 flex items-center justify-center font-display font-black text-base sm:text-lg tracking-widest select-none"
          >
            {captchaA} + {captchaB} =
          </div>
          <input
            type="number"
            value={captchaAns}
            onChange={(e) => setCaptchaAns(e.target.value)}
            placeholder="?"
            className="flex-1 h-11 sm:h-12 px-3.5 rounded-xl border border-border/40 bg-background/50 text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 min-w-0"
            aria-label="Captcha answer"
          />
        </div>
        {errors.captcha && (
          <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {errors.captcha}
          </p>
        )}
      </div>
    </div>
  );
}

function ForgotForm({
  lang,
  onSent,
  onBack,
}: {
  lang: Lang;
  onSent: (payload: { email: string; maskedEmail: string; expiresInSeconds: number }) => void;
  onBack: () => void;
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(t(lang, "Please enter a valid email", "Maglagay ng valid na email"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await requestPasswordReset({ data: { email: email.trim() } });
      toast.success(
        t(
          lang,
          `Code sent to ${result.maskedEmail}. Check your inbox.`,
          `Naipadala ang code sa ${result.maskedEmail}. Tignan ang inbox.`,
        ),
        { duration: 5000 },
      );
      onSent({
        email: result.email,
        maskedEmail: result.maskedEmail,
        expiresInSeconds: result.expiresInSeconds,
      });
    } catch (err: any) {
      setError(err?.message ?? t(lang, "Something went wrong", "May problema"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 flex-1" noValidate>
      <div className="rounded-2xl border border-info/20 bg-info/[0.06] p-4 sm:p-5 flex gap-3">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-info/15 flex items-center justify-center text-info">
          <Mail className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-semibold text-foreground">
            {t(lang, "We'll email you a code", "Magpapadala kami ng code sa email")}
          </p>
          <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed mt-1">
            {t(
              lang,
              "Enter the email associated with your account and we'll send a 6-digit verification code valid for 5 minutes.",
              "Ilagay ang email na naka-link sa account at magpapadala kami ng 6-digit na code na valid sa loob ng 5 minuto.",
              "Ilagay an email na naka-link sa account asin magpapadala kami nin 6-digit na code na valid sa laog nin 5 minuto.",
            )}
          </p>
        </div>
      </div>

      <Field
        label={t(lang, "Email Address", "Email Address", "Email Address")}
        type="email"
        value={email}
        onChange={(v) => {
          setEmail(v);
          if (error) setError(null);
        }}
        placeholder="you@example.com"
        icon={Mail}
        error={error || undefined}
        autoComplete="email"
        inputMode="email"
        disabled={submitting}
      />

      <SubmitButton
        submitting={submitting}
        label={t(lang, "Send Code", "Ipadala ang Code", "Ipadala an Code")}
        submittingLabel={t(lang, "Sending...", "Ipinapadala...")}
        icon={<ArrowRight className="h-4 w-4" />}
      />

      <button
        type="button"
        onClick={onBack}
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors min-h-[44px] disabled:opacity-50"
      >
        <ArrowLeft className="h-4 w-4" />
        {t(lang, "Back to sign in", "Bumalik sa sign in")}
      </button>
    </form>
  );
}

function OtpForm({
  lang,
  email,
  onVerified,
  onBack,
}: {
  lang: Lang;
  email: string;
  onVerified: () => void;
  onBack: () => void;
}) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(30);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    // Auto-focus the first input on mount
    const id = window.setTimeout(() => inputs.current[0]?.focus(), 150);
    return () => window.clearTimeout(id);
  }, []);

  const setDigit = (i: number, v: string) => {
    if (error) setError(null);
    if (!/^\d?$/.test(v)) return;
    const next = [...code];
    next[i] = v;
    setCode(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
    if (next.every((d) => d !== "")) {
      // Auto-submit when all 6 are filled
      window.setTimeout(() => handleVerify(next.join("")), 50);
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) {
      inputs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < 5) {
      inputs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!data) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < data.length; i++) next[i] = data[i];
    setCode(next);
    setAutoFilled(true);
    if (data.length === 6) {
      window.setTimeout(() => handleVerify(next.join("")), 50);
    } else {
      inputs.current[Math.min(5, data.length)]?.focus();
    }
  };

  const handleVerify = async (fullCode: string) => {
    if (!email) {
      setError(t(lang, "Missing email. Please go back and try again.", "Walang email. Bumalik at subukan muli."));
      return;
    }
    if (fullCode.length < 6) {
      setError(t(lang, "Please enter the full 6-digit code", "Ilagay ang buong 6-digit na code"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await verifyResetCode({ data: { email, code: fullCode } });
      if (result.success) {
        toast.success(
          t(lang, "Code verified! Set your new password.", "Na-verify! Itakda ang bagong password."),
          { duration: 3000 },
        );
        if (typeof result.attemptsRemaining === "number") {
          setAttemptsLeft(result.attemptsRemaining);
        }
        onVerified();
      } else if (result.reason === "expired") {
        setError(t(lang, "Code has expired. Please request a new one.", "Expired na ang code. Mag-request ng bago."));
        setCode(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
      } else if (result.reason === "too_many_attempts") {
        setError(
          t(
            lang,
            "Too many wrong attempts. Please request a new code.",
            "Masyadong maraming mali. Mag-request ng bagong code.",
          ),
        );
      } else {
        setError(t(lang, "Invalid code. Please try again.", "Maling code. Subukan muli."));
        if ("attemptsRemaining" in result && typeof result.attemptsRemaining === "number") {
          setAttemptsLeft(result.attemptsRemaining);
        }
        setCode(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err?.message ?? t(lang, "Verification failed", "Hindi na-verify"));
    } finally {
      setSubmitting(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(code.join(""));
  };

  const handleResend = async () => {
    if (resendIn > 0 || resending) return;
    if (!email) {
      onBack();
      return;
    }
    setResending(true);
    try {
      const result = await requestPasswordReset({ data: { email } });
      toast.success(
        t(lang, "A fresh code has been sent.", "Bagong code na ang ipinadala."),
        { duration: 4000 },
      );
      setResendIn(30);
      setCode(["", "", "", "", "", ""]);
      setError(null);
      setAutoFilled(false);
      inputs.current[0]?.focus();
    } catch (err: any) {
      toast.error(err?.message ?? t(lang, "Could not resend code", "Hindi maipadala"));
    } finally {
      setResending(false);
    }
  };

  const filled = code.filter((d) => d).length;

  return (
    <form onSubmit={submit} className="space-y-5 flex-1" noValidate>
      <div className="rounded-2xl border border-primary/20 bg-primary/[0.06] p-4 sm:p-5 flex gap-3">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
          <Key className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-semibold text-foreground">
            {t(lang, "Enter your verification code", "Ilagay ang verification code")}
          </p>
          <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed mt-1">
            {t(
              lang,
              "Type the 6 digits we sent. The code expires in 5 minutes.",
              "I-type ang 6 na digit na ipinadala namin. Expired ang code sa 5 minuto.",
            )}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {t(lang, "Verification Code", "Verification Code", "Verification Code")}
          </span>
          <span
            className={cn(
              "text-[10px] font-bold tabular-nums",
              filled === 6 ? "text-success" : "text-muted-foreground",
            )}
            aria-live="polite"
          >
            {filled}/6
          </span>
        </div>
        <div
          className="grid grid-cols-6 gap-1.5 sm:gap-2"
          onPaste={handlePaste}
        >
          {code.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={1}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={(e) => e.currentTarget.select()}
              aria-label={`Digit ${i + 1}`}
              disabled={submitting}
              className={cn(
                "h-12 sm:h-14 w-full text-center text-[18px] sm:text-2xl font-display font-black rounded-xl border bg-background/50 text-foreground outline-none transition-all duration-200 caret-primary",
                error
                  ? "border-rose-500/60 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-500/5"
                  : d
                    ? "border-primary bg-primary/5 focus:border-primary focus:ring-2 focus:ring-primary/15"
                    : "border-border/40 focus:border-primary focus:ring-2 focus:ring-primary/15 hover:border-border/70",
                "disabled:opacity-60",
                autoFilled && d && "animate-in fade-in duration-200",
              )}
            />
          ))}
        </div>
        {error ? (
          <p
            role="alert"
            className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200"
          >
            <AlertTriangle className="h-3 w-3" />
            {error}
            {attemptsLeft !== null && attemptsLeft > 0 && attemptsLeft < 3 && !error.includes("expired") && (
              <span className="ml-1 text-muted-foreground font-medium normal-case">
                · {attemptsLeft} {t(lang, "attempts left", "attempts na lang")}
              </span>
            )}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
        <span className="text-muted-foreground">
          {t(lang, "Didn't get the code?", "Hindi mo natanggap ang code?")}
        </span>
        <button
          type="button"
          disabled={resendIn > 0 || resending}
          onClick={handleResend}
          className={cn(
            "inline-flex items-center gap-1 font-bold text-primary min-h-[36px] px-2 -mx-2 rounded-md transition-colors",
            resendIn > 0 || resending
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-primary/10 cursor-pointer",
          )}
        >
          {resending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          {resendIn > 0
            ? t(lang, `Resend in ${resendIn}s`, `Ipadala muli sa ${resendIn}s`)
            : t(lang, "Resend code", "Ipadala muli")}
        </button>
      </div>

      <SubmitButton
        submitting={submitting}
        disabled={filled < 6}
        label={t(lang, "Verify & Continue", "I-verify at Magpatuloy", "I-verify asin Magpadagos")}
        submittingLabel={t(lang, "Verifying...", "Vine-verify...")}
        icon={<Check className="h-4 w-4" />}
      />

      <button
        type="button"
        onClick={onBack}
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors min-h-[44px] disabled:opacity-50"
      >
        <ArrowLeft className="h-4 w-4" />
        {t(lang, "Use a different email", "Gumamit ng ibang email")}
      </button>
    </form>
  );
}

function ResetForm({
  lang,
  email,
  onDone,
  onBack,
}: {
  lang: Lang;
  email: string;
  onDone: () => void;
  onBack: () => void;
}) {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const strength = useMemo(() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);
  const strengthLabel = ["Weak", "Fair", "Good", "Strong", "Excellent"][strength];
  const strengthColor = [
    "bg-rose-500",
    "bg-amber-500",
    "bg-amber-500",
    "bg-sky-500",
    "bg-emerald-500",
  ][strength];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCodeError(null);
    if (code.length !== 6) {
      setCodeError(t(lang, "Enter the 6-digit code", "Ilagay ang 6-digit na code"));
      return;
    }
    if (password.length < 8) {
      setError(t(lang, "Password must be at least 8 characters", "Ang password ay dapat 8 karakter"));
      return;
    }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError(
        t(
          lang,
          "Password needs an uppercase letter and a number.",
          "Kailangan ng uppercase letter at numero ang password.",
        ),
      );
      return;
    }
    if (password !== confirm) {
      setError(t(lang, "Passwords do not match", "Hindi tugma ang mga password"));
      return;
    }
    if (!email) {
      setError(t(lang, "Missing email. Please start over.", "Walang email. Magsimula muli."));
      return;
    }
    setSubmitting(true);
    try {
      await completePasswordReset({ data: { email, code, newPassword: password } });
      toast.success(
        t(
          lang,
          "Password updated! Please sign in with your new password.",
          "Na-update ang password! Mag-sign in gamit ang bagong password.",
        ),
        { duration: 5000 },
      );
      onDone();
    } catch (err: any) {
      setError(err?.message ?? t(lang, "Could not update password", "Hindi ma-update"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 sm:space-y-5 flex-1" noValidate>
      <div className="rounded-2xl border border-success/20 bg-success/[0.06] p-4 sm:p-5 flex gap-3">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-success/15 flex items-center justify-center text-success">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-semibold text-foreground">
            {t(lang, "Identity verified", "Na-verify ang pagkakakilanlan")}
          </p>
          <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed mt-1">
            {t(
              lang,
              "For your security, re-enter the 6-digit code and choose a new password.",
              "Para sa seguridad, ilagay muli ang 6-digit na code at pumili ng bagong password.",
            )}
          </p>
        </div>
      </div>

      <Field
        label={t(lang, "Verification Code *", "Verification Code *", "Verification Code *")}
        value={code}
        onChange={(v) => {
          const digits = v.replace(/\D/g, "").slice(0, 6);
          setCode(digits);
          if (codeError) setCodeError(null);
        }}
        placeholder="123456"
        icon={Key}
        error={codeError || undefined}
        inputMode="numeric"
        autoComplete="one-time-code"
        disabled={submitting}
      />

      <div>
        <PasswordField
          label={t(lang, "New Password *", "Bagong Password *", "Bagong Password *")}
          value={password}
          onChange={(v) => {
            setPassword(v);
            if (error) setError(null);
          }}
          placeholder={t(lang, "Minimum 8 characters", "Hindi bababa sa 8 karakter")}
          show={show}
          onToggleShow={() => setShow(!show)}
          autoComplete="new-password"
          disabled={submitting}
        />
        {password.length > 0 && (
          <div className="mt-2 px-0.5 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden border border-border/30">
                <div
                  className={cn("h-full transition-all duration-500", strengthColor)}
                  style={{ width: `${(strength / 4) * 100}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  strength <= 1
                    ? "text-rose-600 dark:text-rose-400"
                    : strength === 2
                      ? "text-amber-600 dark:text-amber-400"
                      : strength === 3
                        ? "text-sky-600 dark:text-sky-400"
                        : "text-emerald-600 dark:text-emerald-400",
                )}
              >
                {strengthLabel}
              </span>
            </div>
            <ul className="grid grid-cols-2 gap-1.5 text-[10px] text-muted-foreground">
              <ReqLine ok={password.length >= 8} label={t(lang, "8+ chars", "8+ na karakter")} />
              <ReqLine ok={/[A-Z]/.test(password)} label={t(lang, "Uppercase", "Malaking titik")} />
              <ReqLine ok={/[0-9]/.test(password)} label={t(lang, "Number", "Numero")} />
              <ReqLine
                ok={/[^A-Za-z0-9]/.test(password)}
                label={t(lang, "Symbol", "Simbolo")}
              />
            </ul>
          </div>
        )}
      </div>

      <PasswordField
        label={t(lang, "Confirm Password *", "Kumpirmahin ang Password *", "Kumpirmahon an Password *")}
        value={confirm}
        onChange={(v) => {
          setConfirm(v);
          if (error) setError(null);
        }}
        placeholder={t(lang, "Re-enter password", "Ilagay muli ang password")}
        show={show}
        onToggleShow={() => setShow(!show)}
        autoComplete="new-password"
        disabled={submitting}
        error={
          confirm && password !== confirm
            ? t(lang, "Passwords do not match", "Hindi tugma ang mga password")
            : undefined
        }
      />

      {error && (
        <p
          role="alert"
          className="text-[11px] sm:text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}

      <SubmitButton
        submitting={submitting}
        label={t(lang, "Update Password", "I-update ang Password", "I-update an Password")}
        submittingLabel={t(lang, "Updating...", "Ina-update...")}
        icon={<Check className="h-4 w-4" />}
      />

      <button
        type="button"
        onClick={onBack}
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors min-h-[44px] disabled:opacity-50"
      >
        <ArrowLeft className="h-4 w-4" />
        {t(lang, "Back to verification", "Bumalik sa verification")}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  icon: Icon,
  error,
  hint,
  rightHint,
  className,
  autoComplete,
  inputMode,
  required,
  max,
  disabled,
  onKeyDown,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  icon?: any;
  error?: string;
  hint?: string;
  rightHint?: string;
  className?: string;
  autoComplete?: string;
  inputMode?: any;
  required?: boolean;
  max?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const [focused, setFocused] = useState(false);
  const hasValue = value && value.length > 0;
  return (
    <div className={cn("space-y-1.5 text-left", className)}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </label>
        {rightHint && (
          <span className="text-[10px] font-bold text-primary">{rightHint}</span>
        )}
      </div>
      <div
        className={cn(
          "relative group transition-all duration-200",
          error && "animate-[shake_0.4s_ease-in-out]",
        )}
      >
        {Icon && (
          <div
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none",
              focused || hasValue ? "text-primary" : "text-muted-foreground/60",
              disabled && "opacity-50",
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          required={required}
          max={max}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${label}-err` : hint ? `${label}-hint` : undefined}
          className={cn(
            "w-full rounded-xl border bg-background/50 py-3 sm:py-3.5 text-[16px] sm:text-sm text-foreground outline-none transition-all duration-200 font-medium placeholder:text-muted-foreground/60 min-h-[48px] disabled:opacity-60 disabled:cursor-not-allowed",
            Icon ? "pl-11 sm:pl-12 pr-4" : "px-4",
            error
              ? "border-rose-500/60 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-500/5"
              : focused
                ? "border-primary focus:ring-2 focus:ring-primary/15"
                : "border-border/40 hover:border-border/70",
          )}
        />
      </div>
      {error ? (
        <p
          id={`${label}-err`}
          className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1"
        >
          <AlertTriangle className="h-3 w-3" />
          {error}
        </p>
      ) : hint ? (
        <p
          id={`${label}-hint`}
          className="text-[10px] text-muted-foreground font-medium"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  show,
  onToggleShow,
  error,
  autoComplete,
  disabled,
}: any) {
  const [focused, setFocused] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const handleKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === "function") {
      setCapsLock(e.getModifierState("CapsLock"));
    }
  };

  return (
    <div className="space-y-1.5 text-left">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </label>
      <div
        className={cn(
          "relative group transition-all duration-200",
          error && "animate-[shake_0.4s_ease-in-out]",
        )}
      >
        <div
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none",
            focused || value ? "text-primary" : "text-muted-foreground/60",
            disabled && "opacity-50",
          )}
        >
          <Lock className="h-4 w-4" />
        </div>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyEvent}
          onKeyUp={handleKeyEvent}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={!!error}
          className={cn(
            "w-full rounded-xl border bg-background/50 pl-11 sm:pl-12 pr-12 py-3 sm:py-3.5 text-[16px] sm:text-sm text-foreground outline-none transition-all duration-200 font-medium placeholder:text-muted-foreground/60 min-h-[48px] disabled:opacity-60 disabled:cursor-not-allowed",
            error
              ? "border-rose-500/60 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-500/5"
              : focused
                ? "border-primary focus:ring-2 focus:ring-primary/15"
                : "border-border/40 hover:border-border/70",
          )}
        />
        <button
          type="button"
          onClick={onToggleShow}
          disabled={disabled}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors min-h-[36px] min-w-[36px] disabled:opacity-50"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {capsLock && !error && (
        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 animate-in fade-in duration-200">
          <AlertTriangle className="h-3 w-3" />
          Caps Lock is on
        </p>
      )}
      {error && (
        <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  icon: Icon,
  options,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: any;
  options: { value: string; label: string }[] | string[];
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div className="space-y-1.5 text-left">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none",
              focused || value ? "text-primary" : "text-muted-foreground/60",
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={!!error}
          className={cn(
            "w-full rounded-xl border bg-background/50 py-3 sm:py-3.5 text-sm text-foreground outline-none transition-all duration-200 font-medium appearance-none cursor-pointer min-h-[48px]",
            Icon ? "pl-11 sm:pl-12 pr-10" : "px-4 pr-10",
            error
              ? "border-rose-500/60 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-500/5"
              : focused
                ? "border-primary focus:ring-2 focus:ring-primary/15"
                : "border-border/40 hover:border-border/70",
          )}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.9rem center",
            backgroundSize: "0.75rem",
          }}
        >
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

function PhoneField({
  label,
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-1.5 text-left">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </label>
      <div
        className={cn(
          "relative flex items-stretch rounded-xl border bg-background/50 transition-all duration-200 overflow-hidden min-h-[48px]",
          error
            ? "border-rose-500/60 bg-rose-500/5"
            : focused
              ? "border-primary ring-2 ring-primary/15"
              : "border-border/40 hover:border-border/70",
        )}
      >
        <div className="flex items-center gap-1.5 px-3 sm:px-4 border-r border-border/40 bg-muted/30">
          <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
          <span className="text-xs sm:text-sm font-bold text-foreground">+63</span>
        </div>
        <input
          type="tel"
          value={value}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
            const formatted = digits.replace(/(\d{3})(\d{3})(\d{0,4})/, (_, a, b, c) =>
              [a, b, c].filter(Boolean).join(" "),
            );
            onChange(formatted);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder || "917 123 4567"}
          autoComplete={autoComplete}
          inputMode="tel"
          aria-invalid={!!error}
          className="flex-1 min-w-0 px-3 sm:px-4 py-3 sm:py-3.5 bg-transparent text-sm text-foreground outline-none font-medium placeholder:text-muted-foreground/60"
        />
      </div>
      {error && (
        <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

function ReqLine({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li
      className={cn(
        "flex items-center gap-1.5 transition-colors",
        ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "h-2.5 w-2.5 rounded-full flex items-center justify-center shrink-0",
          ok ? "bg-emerald-500" : "bg-muted-foreground/30",
        )}
      >
        {ok && <Check className="h-1.5 w-1.5 text-success-foreground" strokeWidth={4} />}
      </span>
      {label}
    </li>
  );
}

function SubmitButton({
  submitting,
  label,
  submittingLabel,
  icon,
  disabled,
}: {
  submitting: boolean;
  label: string;
  submittingLabel: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={submitting || disabled}
      className="w-full h-12 sm:h-12 rounded-xl text-sm font-bold text-primary-foreground bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:from-primary hover:to-primary/70 active:scale-[0.99] transition-all cursor-pointer inline-flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg disabled:active:scale-100"
    >
      {submitting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {submittingLabel}
        </>
      ) : (
        <>
          {label}
          {icon}
        </>
      )}
    </button>
  );
}

function FooterLinks({ lang }: { lang: Lang }) {
  return (
    <div className="mt-5 sm:mt-6 pt-4 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 text-[10px] sm:text-[11px] text-muted-foreground font-medium">
      <p className="flex items-center gap-1.5">
        <ShieldCheck className="h-3 w-3 text-success shrink-0" />
        <span>
          {t(
            lang,
            "256-bit TLS · End-to-end encrypted",
            "256-bit TLS · End-to-end na encryption",
          )}
        </span>
      </p>
      <div className="flex items-center gap-3 sm:gap-4">
        <a
          href="/#contact"
          className="hover:text-foreground transition-colors min-h-[32px] inline-flex items-center"
        >
          {t(lang, "Privacy", "Privacy")}
        </a>
        <a
          href="/"
          className="hover:text-foreground transition-colors min-h-[32px] inline-flex items-center"
        >
          {t(lang, "Help", "Tulong")}
        </a>
      </div>
    </div>
  );
}
