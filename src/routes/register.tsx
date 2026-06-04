import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Shield } from "lucide-react";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Register · e-Cagraray" }] }),
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
    if (!f.fullName || !f.email || !f.username || !f.password) return toast.error("Please complete all required fields");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return toast.error("Invalid email address");
    if (f.password.length < 8) return toast.error("Password must be at least 8 characters");
    if (f.password !== f.confirm) return toast.error("Passwords do not match");
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
      toast.success("Account created. You can now log in.");
      nav({ to: "/login" });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const s = strength(f.password);
  const strengthLabel = ["Very weak", "Weak", "Fair", "Good", "Strong"][s];
  const strengthColor = ["bg-destructive", "bg-destructive", "bg-warning", "bg-info", "bg-success"][s];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 rounded-full border border-border bg-card/80 p-4 shadow-sm shadow-slate-900/5 backdrop-blur glass-panel">
          <div className="inline-flex items-center gap-3 text-sm font-semibold text-slate-950">
            <div className="grid h-10 w-10 place-items-center rounded-3xl gov-gradient text-white"><Shield className="h-5 w-5" /></div>
            e-Cagraray Registration
          </div>
          <Link to="/login" className="rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary">Back to Login</Link>
        </div>

        <div className="mt-10 rounded-[2rem] border border-border bg-card p-10 shadow-2xl shadow-primary/10 glass-panel lg:p-12">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Create your account</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Residents may register to access services, monitor updates, and receive community announcements.</p>
            </div>
            <div className="rounded-full border border-border bg-background/80 px-4 py-2 text-sm text-slate-700">Password strength: <span className="font-semibold">{strengthLabel}</span></div>
          </div>

          <form onSubmit={submit} className="mt-8 grid gap-4 sm:grid-cols-2">
            <Field label="Full Name *" value={f.fullName} onChange={(v) => setF({ ...f, fullName: v })} className="sm:col-span-2" />
            <Field label="Birthdate" type="date" value={f.birthdate} onChange={(v) => setF({ ...f, birthdate: v })} />
            <div>
              <label className="text-sm font-medium">Gender</label>
              <select value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })} className="mt-1 w-full rounded-3xl border border-border bg-background/80 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <Field label="Address" value={f.address} onChange={(v) => setF({ ...f, address: v })} className="sm:col-span-2" />
            <Field label="Contact Number" value={f.contact} onChange={(v) => setF({ ...f, contact: v })} />
            <Field label="Email *" type="email" value={f.email} onChange={(v) => setF({ ...f, email: v })} />
            <Field label="Username *" value={f.username} onChange={(v) => setF({ ...f, username: v })} />
            <div>
              <Field label="Password *" type="password" value={f.password} onChange={(v) => setF({ ...f, password: v })} />
              {f.password && (
                <div className="mt-3">
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full transition-all ${strengthColor}`} style={{ width: `${(s / 4) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
            <Field label="Confirm Password *" type="password" value={f.confirm} onChange={(v) => setF({ ...f, confirm: v })} className="sm:col-span-2" />
            <div className="sm:col-span-2 flex flex-col gap-3 pt-2 sm:flex-row sm:justify-between">
              <button type="submit" className="rounded-3xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95">Register</button>
              <Link to="/login" className="inline-flex items-center justify-center rounded-3xl border border-border px-6 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary">Back to Login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", className = "" }: { label: string; value: string; onChange: (v: string) => void; type?: string; className?: string }) {
  return (
    <div className={className}>
      <label className="text-sm font-medium">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2.5" />
    </div>
  );
}
