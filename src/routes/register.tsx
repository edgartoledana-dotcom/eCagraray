import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Shield, ShieldAlert, Cpu } from "lucide-react";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Access Enrollment · e-Cagraray" }] }),
  component: Register,
});

function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({
    fullName: "", birthdate: "", gender: "Male", address: "", contact: "", email: "",
    username: "", password: "", confirm: "",
  });

  const strength = (p: string) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.fullName || !f.email || !f.username || !f.password) return toast.error("Please complete all required verification fields");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return toast.error("Invalid email configuration");
    if (f.password.length < 8) return toast.error("Security keys must be at least 8 characters");
    if (f.password !== f.confirm) return toast.error("Access passwords do not match");
    try {
      await register({
        fullName: f.fullName,
        birthdate: f.birthdate,
        gender: f.gender,
        address: f.address,
        contact: f.contact,
        email: f.email,
        username: f.username,
        password: f.password,
      });
      toast.success("Identity Node Registered. You can now authenticate.");
      nav({ to: "/login" });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const s = strength(f.password);
  const strengthLabel = ["Very weak Key", "Weak Key", "Fair Security", "Strong Key", "Military Grade Security"][s];
  const strengthColor = ["bg-destructive", "bg-destructive", "bg-warning", "bg-info", "bg-success"][s];

  return (
    <div className="min-h-screen bg-background text-foreground cyber-grid py-12 px-4 flex flex-col justify-center items-center">
      <div className="absolute top-10 right-10 h-80 w-80 rounded-full glow-orb-primary animate-float opacity-30 pointer-events-none" />
      <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full glow-orb-accent animate-float-reverse opacity-25 pointer-events-none" />

      <div className="w-full max-w-4xl space-y-6 relative z-10">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between gap-4 rounded-3xl border border-border/50 bg-card/45 p-4.5 shadow-lg backdrop-blur-md glass-panel">
          <div className="inline-flex items-center gap-3 text-sm font-black tracking-tight text-slate-950 dark:text-white">
            <div className="grid h-10 w-10 place-items-center rounded-2xl gov-gradient text-white shadow-lg shadow-primary/10">
              <Shield className="h-5 w-5" />
            </div>
            <span>e-Cagraray Identity Desk</span>
          </div>
          <Link to="/login" className="rounded-full border border-border/70 bg-background/50 px-5 py-2 text-xs font-bold uppercase tracking-wider transition hover:border-primary hover:text-primary">Cancel & Login</Link>
        </div>

        {/* Enrollment Card */}
        <div className="rounded-[2.5rem] border border-border/50 bg-card/45 p-8 sm:p-12 shadow-2xl backdrop-blur-xl glass-premium">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-border/30 pb-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Identity Registration</h1>
              <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted-foreground">Register your resident demographics to obtain community operations dashboard privileges.</p>
            </div>
            {f.password && (
              <div className="rounded-full border border-border/50 bg-background/60 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Complexity: <span className="font-extrabold text-foreground">{strengthLabel}</span>
              </div>
            )}
          </div>

          <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
            <Field label="Full Name *" value={f.fullName} onChange={(v) => setF({ ...f, fullName: v })} className="sm:col-span-2" placeholder="e.g. Juan Dela Cruz" />
            <Field label="Birthdate" type="date" value={f.birthdate} onChange={(v) => setF({ ...f, birthdate: v })} />
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gender Node</label>
              <select value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })} className="w-full rounded-2xl border border-border/60 bg-background/40 px-4.5 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            
            <Field label="Address Map Node" value={f.address} onChange={(v) => setF({ ...f, address: v })} className="sm:col-span-2" placeholder="Zone, Street, Sitio" />
            <Field label="Contact Number" value={f.contact} onChange={(v) => setF({ ...f, contact: v })} placeholder="e.g. +63 900 000 0000" />
            <Field label="Email Address *" type="email" value={f.email} onChange={(v) => setF({ ...f, email: v })} placeholder="e.g. contact@email.com" />
            <Field label="System Username *" value={f.username} onChange={(v) => setF({ ...f, username: v })} placeholder="Choose system login ID" />
            
            <div className="space-y-2">
              <Field label="Access Security Key *" type="password" value={f.password} onChange={(v) => setF({ ...f, password: v })} placeholder="Minimum 8 characters" />
              {f.password && (
                <div className="px-1.5">
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted border border-border/20">
                    <div className={`h-full transition-all duration-300 ${strengthColor}`} style={{ width: `${(s / 4) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
            
            <Field label="Verify Security Key *" type="password" value={f.confirm} onChange={(v) => setF({ ...f, confirm: v })} className="sm:col-span-2" placeholder="Re-enter security key" />
            
            {/* Warning advisory */}
            <div className="sm:col-span-2 rounded-2xl border border-warning/20 bg-warning/5 p-4 flex gap-3 text-xs leading-relaxed text-warning-foreground">
              <ShieldAlert className="h-5 w-5 shrink-0 text-warning" />
              <div>
                <span className="font-bold uppercase tracking-wider text-[10px]">Verification Advisory:</span> By requesting enrollment, you confirm that all provided details match official barangay documents.
              </div>
            </div>

            <div className="sm:col-span-2 flex flex-col gap-3 pt-4 sm:flex-row sm:justify-between items-center">
              <button type="submit" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-95 cursor-pointer">
                <Cpu className="h-4 w-4" /> Enroll Profile Node
              </button>
              <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Back to Key Gateway
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", className = "", placeholder = "" }: { label: string; value: string; onChange: (v: string) => void; type?: string; className?: string; placeholder?: string }) {
  return (
    <div className={className + " space-y-1.5"}>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-border/60 bg-background/40 px-4.5 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
    </div>
  );
}
