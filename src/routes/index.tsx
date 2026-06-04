import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Shield, Users, Megaphone, AlertTriangle, FileText, HeartHandshake,
  Sparkles, BarChart3, ArrowRight, MapPin, Phone, Mail, Building2,
} from "lucide-react";
import { getBarangayInfo, getDashboardStats } from "../lib/api/auth.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "e-Cagraray — Smart Barangay Management System" },
      { name: "description", content: "Smart Governance, Disaster Preparedness, and Community Engagement for a Better Barangay." },
      { property: "og:title", content: "e-Cagraray" },
      { property: "og:description", content: "Smart Barangay Management, Disaster Response & Community Engagement." },
    ],
  }),
  component: Landing,
});

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border bg-card/70 backdrop-blur p-6 text-center">
      <div className="text-4xl font-bold text-primary">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function Landing() {
  const [stats, setStats] = useState({ residents: 0, households: 0, volunteers: 0, events: 0 });
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    void getDashboardStats().then((stats) => {
      if (stats) setStats(stats);
    });
    void getBarangayInfo().then((info) => {
      setInfo(info);
    });
  }, []);

  const features = [
    { icon: Users, t: "Resident Profiling", d: "Complete digital records with search, filter, and household linking." },
    { icon: AlertTriangle, t: "Disaster Alerts", d: "Push real-time alerts for typhoons, floods, fires, and emergencies." },
    { icon: Megaphone, t: "Announcements", d: "Publish official notices to the community by category." },
    { icon: FileText, t: "Online Requests", d: "Clearances, residency, and indigency certificates online." },
    { icon: Sparkles, t: "Youth Engagement", d: "SK programs, events, and participation tracking." },
    { icon: HeartHandshake, t: "Volunteer Coordination", d: "Skill registry and deployment for disaster response." },
    { icon: Shield, t: "Incident Reporting", d: "Resident-submitted incidents with workflow tracking." },
    { icon: BarChart3, t: "Analytics Dashboard", d: "Live charts of population, incidents, and events." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-3xl gov-gradient text-white shadow-lg shadow-primary/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-semibold tracking-wide">e-Cagraray</div>
              <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">Smart Barangay System</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#about" className="transition hover:text-primary">About</a>
            <a href="#features" className="transition hover:text-primary">Features</a>
            <a href="#stats" className="transition hover:text-primary">Statistics</a>
            <a href="#contact" className="transition hover:text-primary">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary">Login</Link>
            <Link to="/register" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-95">Register</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-background/80 py-20">
        <div className="absolute inset-0 hero-glow opacity-80" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-4 py-2 text-xs font-semibold text-muted-foreground shadow-sm shadow-slate-900/5 glass-panel">
                <span className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
                Republic of the Philippines · Local Government Unit
              </div>
              <div className="space-y-5">
                <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-slate-950 md:text-6xl">Barangay management with clarity, speed, and community focus.</h1>
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground">e-Cagraray modernizes operations from resident profiling to disaster alerts, giving officials and citizens a polished digital command center.</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-95">Access Dashboard</Link>
                <a href="#features" className="inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary">Explore Features</a>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:max-w-xl">
                <div className="rounded-3xl border border-border bg-card p-6 shadow-sm shadow-slate-900/5 glass-panel">
                  <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">What’s new</div>
                  <div className="mt-3 space-y-2 text-sm text-slate-950">
                    <p>Responsive dashboard for all barangay roles.</p>
                    <p>Improved access to announcements, alerts, and requests.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-2xl shadow-primary/10 glass-panel">
              <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-4 text-sm text-muted-foreground">
                <span>Barangay Operations Console</span>
                <span className="rounded-full bg-success/10 px-3 py-1 text-success">Live</span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  { l: "Active Alerts", v: 0, c: "bg-destructive/10 text-destructive" },
                  { l: "Pending Requests", v: 0, c: "bg-info/10 text-info" },
                  { l: "Events This Week", v: 0, c: "bg-accent/20 text-accent-foreground" },
                  { l: "Volunteers Online", v: 0, c: "bg-success/10 text-success" },
                ].map((s) => (
                  <div key={s.l} className={`rounded-3xl p-5 ${s.c}`}>
                    <div className="text-3xl font-semibold">{s.v}</div>
                    <div className="mt-2 text-sm font-medium">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-3">
                {['Disaster Operations Center', 'Document Releasing', 'Community Updates'].map((x) => (
                  <div key={x} className="rounded-3xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-slate-700 shadow-sm shadow-slate-900/5">
                    <div className="font-medium">{x}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Real-time readiness</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-y border-border/70 bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="section-title text-3xl font-bold md:text-4xl">A modern operating system for the barangay</h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">Unifying records, disaster response, and citizen participation in one place with a polished, role-aware interface.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {[
              { t: "Resident Management", d: "Centralized digital records." },
              { t: "Disaster Preparedness", d: "Alerts and rescue coordination." },
              { t: "Community Participation", d: "Polls, events, and volunteerism." },
              { t: "SK Engagement", d: "Programs for the youth sector." },
            ].map((x) => (
              <div key={x.t} className="rounded-3xl border border-border bg-card p-6 shadow-sm shadow-slate-900/5 glass-panel">
                <div className="text-lg font-semibold text-slate-950">{x.t}</div>
                <p className="mt-3 text-sm text-muted-foreground">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="section-title text-3xl font-bold md:text-4xl">Everything your barangay needs</h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">Designed for officials, responders, and residents alike with clear action and simplified workflows.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.t} className="group rounded-[1.75rem] border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 glass-panel">
                <div className="grid h-12 w-12 place-items-center rounded-3xl gov-gradient text-white shadow-lg shadow-primary/10">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="mt-5 text-lg font-semibold text-slate-950">{f.t}</div>
                <p className="mt-3 text-sm text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="border-y bg-muted/30 py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 md:grid-cols-4">
          <Stat value={stats.residents} label="Registered Residents" />
          <Stat value={stats.households} label="Households" />
          <Stat value={stats.volunteers} label="Volunteers" />
          <Stat value={stats.events} label="Community Events" />
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 md:grid-cols-2 md:px-6">
          <div className="space-y-6">
            <div className="section-title text-3xl font-bold md:text-4xl">Contact the Barangay</div>
            <p className="text-base leading-8 text-muted-foreground">Information can be updated from the admin settings panel or shared directly with residents through announcements.</p>
            <ul className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm shadow-slate-900/5 glass-panel">
              <li className="flex items-start gap-3"><Building2 className="mt-0.5 h-5 w-5 text-primary" /><div><div className="font-semibold">{info?.name}</div><div className="text-sm text-muted-foreground">{info?.municipality}, {info?.province}</div></div></li>
              <li className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 text-primary" /><div className="text-sm text-muted-foreground">{info?.address}</div></li>
              <li className="flex items-start gap-3"><Phone className="mt-0.5 h-5 w-5 text-primary" /><div className="text-sm text-muted-foreground">{info?.contact}</div></li>
              <li className="flex items-start gap-3"><Mail className="mt-0.5 h-5 w-5 text-primary" /><div className="text-sm text-muted-foreground">{info?.email}</div></li>
            </ul>
          </div>
          <div className="rounded-[2rem] border border-border bg-card p-8 shadow-2xl shadow-primary/10 glass-panel">
            <div className="text-xl font-semibold">Send a quick message</div>
            <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Thanks! Message recorded locally."); }}>
              <input className="w-full rounded-3xl border border-border bg-background/80 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Your name" required />
              <input className="w-full rounded-3xl border border-border bg-background/80 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Email" type="email" required />
              <textarea className="w-full rounded-3xl border border-border bg-background/80 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Message" rows={5} required />
              <button className="inline-flex w-full items-center justify-center rounded-3xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95">Send Message</button>
            </form>
          </div>
        </div>
      </section>

      <footer className="border-t bg-muted/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" /> © {new Date().getFullYear()} e-Cagraray · All rights reserved
          </div>
          <nav className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary">Home</a>
            <a href="#about" className="hover:text-primary">About</a>
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
