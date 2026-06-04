import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Shield, Users, Megaphone, AlertTriangle, FileText, HeartHandshake,
  Sparkles, BarChart3, MapPin, Phone, Mail, Building2, Sun, Moon,
  Terminal, Activity, CloudSun, ShieldCheck, Lock, RefreshCw,
} from "lucide-react";
import { getBarangayInfo, getDashboardStats } from "../lib/api/auth.functions";
import { useTheme } from "../lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "e-Cagraray — Smart Barangay Command Center" },
      { name: "description", content: "Smart Governance, Disaster Preparedness, and Community Operations for Barangay Cagraray." },
      { property: "og:title", content: "e-Cagraray" },
      { property: "og:description", content: "Smart Barangay Operations, Disaster Alerts & Community Governance." },
    ],
  }),
  component: Landing,
});

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-[2rem] border border-border/50 bg-card/40 backdrop-blur-md p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:bg-slate-900/30">
      <div className="text-4xl font-extrabold text-primary glow-text-primary">{value}</div>
      <div className="mt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function Landing() {
  const { theme, toggle } = useTheme();
  const [stats, setStats] = useState({ residents: 0, households: 0, volunteers: 0, events: 0 });
  const [info, setInfo] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [ping, setPing] = useState(14);
  const [logs, setLogs] = useState<string[]>([
    "SECURE CHANNEL SHAKE: SUCCESS",
    "CLOUD STORAGE D1 NODE: CONNECTED",
    "INTEGRITY METRICS CHECK: STATUS OK"
  ]);

  useEffect(() => {
    setMounted(true);
    void getDashboardStats().then((stats) => {
      if (stats) setStats(stats);
    });
    void getBarangayInfo().then((info) => {
      setInfo(info);
    });

    // Simulated latency timer
    const pingInterval = setInterval(() => {
      setPing(Math.floor(Math.random() * 8) + 8);
    }, 4000);

    // Simulated logs timer
    const logPool = [
      "DB PACKET REPLICATION COMPLETE",
      "SECURITY INTERFACE ENCRYPTION: TLS v1.3",
      "HEALTH STATUS SYNCED TO PH-MNL-EDGE",
      "LOCAL RESIDENT STORE INITIALIZED",
      "ACTIVE TELEMETRY PROTOCOL ENABLED"
    ];
    const logInterval = setInterval(() => {
      setLogs((prev) => {
        const next = [...prev];
        next.shift();
        next.push(logPool[Math.floor(Math.random() * logPool.length)]);
        return next;
      });
    }, 6000);

    return () => {
      clearInterval(pingInterval);
      clearInterval(logInterval);
    };
  }, []);

  const features = [
    { icon: Users, t: "Resident Profiling", d: "Complete digital database with searching, filtering, and household link nodes." },
    { icon: AlertTriangle, t: "Disaster Alerts", d: "Broadcast real-time storm signal, earthquake, and flash flood alerts instantly." },
    { icon: Megaphone, t: "Community Notices", d: "Publish official announcements by priority tags to keep citizens informed." },
    { icon: FileText, t: "Online Requests", d: "Apply for clearances, residency cards, and indigency forms directly from home." },
    { icon: Sparkles, t: "Youth Programs", d: "SK engagement hubs, sports tournaments, and capacity training tracking." },
    { icon: HeartHandshake, t: "Emergency Volunteers", d: "Skills registry and responder allocation maps for localized emergencies." },
    { icon: Shield, t: "Incident Logging", d: "Resident-submitted emergency logs with instant notifications to admin desks." },
    { icon: BarChart3, t: "Command Analytics", d: "Interactive visual reports tracking population stats, complaints, and alerts." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground cyber-grid transition-colors duration-300">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[1.25rem] gov-gradient text-white shadow-lg shadow-primary/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight">e-Cagraray</div>
              <div className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-muted-foreground">Barangay Smart Hub</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 text-xs font-bold uppercase tracking-wider text-muted-foreground md:flex">
            <a href="#about" className="transition hover:text-primary">Console</a>
            <a href="#features" className="transition hover:text-primary">Features</a>
            <a href="#stats" className="transition hover:text-primary">Statistics</a>
            <a href="#contact" className="transition hover:text-primary">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            {mounted && (
              <button
                onClick={toggle}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted/80 hover:text-foreground transition"
                aria-label="Toggle Theme"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            )}
            <Link to="/login" className="rounded-full border border-border/70 px-5 py-2 text-xs font-bold uppercase tracking-wider transition hover:border-primary hover:text-primary">Login</Link>
            <Link to="/register" className="rounded-full bg-primary px-5 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-90">Register</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        <div className="absolute inset-0 hero-glow opacity-60 pointer-events-none" />
        <div className="absolute top-20 left-10 h-[28rem] w-[28rem] rounded-full glow-orb-primary animate-float opacity-40 pointer-events-none" />
        <div className="absolute bottom-20 right-10 h-[32rem] w-[32rem] rounded-full glow-orb-accent animate-float-reverse opacity-30 pointer-events-none" />
        
        <div className="relative mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
            
            {/* Left Block */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/60 px-4 py-2 text-xs font-semibold shadow-sm backdrop-blur-md glass-premium">
                <span className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
                <span className="text-muted-foreground uppercase tracking-widest text-[10px]">Cloud Infrastructure Live</span>
              </div>
              <div className="space-y-5">
                <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 dark:text-white md:text-5xl lg:text-6xl">
                  Unified Command <br />
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Barangay Governance</span>
                </h1>
                <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                  e-Cagraray integrates database systems, real-time alert logs, and citizen certificate portals into one secure, highly responsive command hub.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-95 active:scale-[0.98]">
                  Access Console
                </Link>
                <a href="#features" className="inline-flex items-center rounded-full border border-border/80 px-7 py-3.5 text-xs font-bold uppercase tracking-wider transition hover:border-primary hover:text-primary active:scale-[0.98]">
                  Explore Node Features
                </a>
              </div>
              
              {/* Quick Status Bar */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div className="rounded-[1.75rem] border border-border/40 bg-card/30 p-5 backdrop-blur-md glass-panel">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-success/10 text-success border border-success/20">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Security</div>
                      <div className="text-sm font-extrabold">AES-256 Protocol</div>
                    </div>
                  </div>
                </div>
                <div className="rounded-[1.75rem] border border-border/40 bg-card/30 p-5 backdrop-blur-md glass-panel">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                      <RefreshCw className="h-5 w-5 animate-spin" style={{ animationDuration: "12s" }} />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vite-D1 Link</div>
                      <div className="text-sm font-extrabold">Auto-Sync Active</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Block - Interactive Console Hub */}
            <div className="rounded-[2.5rem] border border-border/50 p-6 shadow-2xl backdrop-blur-lg glass-premium bg-card/40 dark:bg-slate-900/30">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" /><span className="relative inline-flex rounded-full h-3 w-3 bg-success" /></span>
                  <span className="text-xs font-extrabold uppercase tracking-widest">Barangay Operations Hub</span>
                </div>
                <Badge label="Bato, Catanduanes" />
              </div>

              {/* Grid Widgets */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {/* Weather Node */}
                <div className="rounded-2xl border border-border/30 bg-background/40 p-4.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Weather Telemetry</span>
                    <CloudSun className="h-4 w-4 text-accent" />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black text-foreground">28°C</div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                      <span>Catanduanes Hub</span>
                      <span className="text-success uppercase">Optimal</span>
                    </div>
                  </div>
                </div>

                {/* Cloud Node Ping */}
                <div className="rounded-2xl border border-border/30 bg-background/40 p-4.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">D1 Node Latency</span>
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black text-foreground">{ping} ms</div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                      <span>ph-mnl-d1-edge</span>
                      <span className="text-success uppercase">Excellent</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Telemetry Diagnostics */}
              <div className="mt-5 rounded-2xl border border-border/30 bg-slate-950 p-4 text-slate-200">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                  <span className="flex items-center gap-1.5"><Terminal className="h-3.5 w-3.5 text-success" /> Security Log Console</span>
                  <span className="text-[9px]">v2.4.0</span>
                </div>
                <div className="mt-3 space-y-1.5 font-mono text-[10.5px]">
                  {logs.map((log, index) => (
                    <div key={index} className="flex gap-2 text-success/90">
                      <span className="text-slate-500 font-semibold">[{new Date().toLocaleTimeString("en-PH", { hour12: false })}]</span>
                      <span className="truncate">{log}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Nodes */}
              <div className="mt-5 space-y-2.5">
                {[
                  { name: "Disaster Preparedness Center", status: "STANDBY READY", tone: "success" },
                  { name: "Public Documents Registry", status: "ONLINE", tone: "success" },
                  { name: "Community Broadcast Node", status: "MUTED ACTIVE", tone: "info" }
                ].map((s) => (
                  <div key={s.name} className="flex items-center justify-between rounded-xl border border-border/30 bg-background/25 px-4 py-2.5 text-xs">
                    <span className="font-semibold text-muted-foreground">{s.name}</span>
                    <span className={`text-[10px] font-bold uppercase ${s.tone === "success" ? "text-success" : "text-info"}`}>{s.status}</span>
                  </div>
                ))}
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Control Details Console */}
      <section id="about" className="border-y border-border/50 bg-muted/20 py-24 transition-colors">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Barangay Operating Framework</div>
            <h2 className="text-3xl font-black md:text-4xl text-slate-950 dark:text-white">Smart Command Node Framework</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Unifying citizen profiling, emergency logistics, and local administrative tasks into a single high-performance digital environment.
            </p>
          </div>
          
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { t: "Demographic Sync", d: "Auto-synced digital profiles mapped directly to zones." },
              { t: "Disaster Protocols", d: "Instantly broadcast storm hazard logs and flood maps." },
              { t: "E-Governance Portal", d: "Digitized request queues for clearances and indigency forms." },
              { t: "Youth Programs", d: "SK tracking for event programs and localized seminars." },
            ].map((x) => (
              <div key={x.t} className="group rounded-[2rem] border border-border/50 p-6 backdrop-blur-md bg-card/40 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 transition-all duration-300 dark:bg-slate-900/20">
                <div className="text-base font-extrabold text-slate-900 dark:text-white">{x.t}</div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Built-In Services</div>
            <h2 className="text-3xl font-black md:text-4xl text-slate-950 dark:text-white">Fully Integrated Modules</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Every role-specific tool operates within the same secured network framework to guarantee speed and stability.
            </p>
          </div>
          
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.t} className="group rounded-[2rem] border border-border/50 p-6 bg-card/40 backdrop-blur-md hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 transition-all duration-300 dark:bg-slate-900/20">
                <div className="grid h-12 w-12 place-items-center rounded-2xl gov-gradient text-white shadow-md shadow-primary/10">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="mt-5 text-base font-extrabold text-slate-900 dark:text-white">{f.t}</div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section id="stats" className="border-y border-border/50 bg-muted/20 py-16 transition-colors">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 md:grid-cols-4 md:px-6">
          <Stat value={stats.residents} label="Registered Residents" />
          <Stat value={stats.households} label="Barangay Households" />
          <Stat value={stats.volunteers} label="Ready Volunteers" />
          <Stat value={stats.events} label="Community Projects" />
        </div>
      </section>

      {/* Contact Panel */}
      <section id="contact" className="py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 md:grid-cols-2 md:px-6">
          <div className="space-y-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Barangay Info</div>
            <h2 className="text-3xl font-black text-slate-950 dark:text-white">Command Headquarters</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Official communication coordinates are handled by the Secretariat node. Submit inquiries directly.
            </p>
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
                  <div className="text-xs text-muted-foreground font-semibold">{info?.email || "info@ecagraray.gov.ph"}</div>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="rounded-[2.5rem] border border-border/50 p-8 shadow-2xl backdrop-blur-lg bg-card/40 dark:bg-slate-900/30">
            <h3 className="text-lg font-extrabold">Send System Message</h3>
            <form className="mt-6 space-y-4.5" onSubmit={(e) => { e.preventDefault(); alert("System Message Transmitted Locally."); }}>
              <input className="w-full rounded-2xl border border-border/50 bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" placeholder="Your full name" required />
              <input className="w-full rounded-2xl border border-border/50 bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" placeholder="Verification Email" type="email" required />
              <textarea className="w-full rounded-2xl border border-border/50 bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" placeholder="Message details..." rows={5} required />
              <button className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-95 shadow-lg shadow-primary/20">Transmit Message</button>
            </form>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 bg-muted/20 transition-colors">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" /> © {new Date().getFullYear()} e-Cagraray LGU · Secure Command System
          </div>
          <nav className="flex flex-wrap gap-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <a href="#" className="hover:text-primary">Home</a>
            <a href="#about" className="hover:text-primary">Console</a>
            <a href="#features" className="hover:text-primary">Features</a>
            <a href="#contact" className="hover:text-primary">Contact</a>
            <Link to="/login" className="hover:text-primary">Login</Link>
            <Link to="/register" className="hover:text-primary">Register</Link>
          </nav>
        </div>
      </footer>
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
