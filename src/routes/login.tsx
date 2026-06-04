import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Shield, ArrowLeft } from "lucide-react";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login · e-Cagraray" }] }),
  component: Login,
});

function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [form, setForm] = useState({ username: "", password: "" });
  const [forgot, setForgot] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) return toast.error("All fields are required");
    try {
      const u = await login(form.username, form.password, remember);
      if (!u) return toast.error("Invalid username or password");
      toast.success(`Welcome, ${u.fullName}`);
      nav({ to: "/dashboard" });
    } catch (error: any) {
      toast.error(error?.message ?? "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.11),_transparent_24%),#f8fbff] text-foreground">
      <div className="grid min-h-screen grid-cols-1 overflow-hidden md:grid-cols-[1.2fr_0.95fr]">
        <div className="relative hidden md:flex items-center bg-white/80 px-12 py-14 text-slate-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.1),transparent_24%)]" />
          <div className="absolute inset-0 bg-white/60 backdrop-blur-xl" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-12">
            <Link to="/" className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm shadow-slate-900/5 transition hover:bg-white">
              <Shield className="h-5 w-5" /> e-Cagraray
            </Link>
            <div className="max-w-xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-600 shadow-sm shadow-slate-900/5">
                Ready access for barangay roles
              </div>
              <div>
                <h1 className="text-5xl font-bold leading-tight">A secure gateway for community operations.</h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">Log in to manage residents, announcements, disasters, and barangay programs from one polished control center.</p>
              </div>
            </div>
            <div className="space-y-3 rounded-[2rem] border border-slate-200/70 bg-white/85 p-6 text-sm text-slate-700 shadow-2xl shadow-slate-900/10">
              <div className="font-semibold text-slate-900">Role-based access ready</div>
              <div className="grid gap-2 text-sm text-slate-600">
                <span>admin / admin123</span>
                <span>captain / captain123</span>
                <span>resident / resident123</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/95 p-8 shadow-[0_30px_80px_-28px_rgba(15,23,42,0.18)]">
            <div className="pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
            <div className="pointer-events-none absolute right-6 top-10 h-24 w-24 rounded-full bg-cyan-400/15 blur-3xl" />
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
            <div className="mt-6 space-y-3">
              <h2 className="text-3xl font-bold tracking-tight">Sign in</h2>
              <p className="text-sm text-slate-500">Use your barangay account to continue.</p>
            </div>

            {forgot ? (
              <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700 shadow-sm shadow-slate-900/5">
                <div className="font-semibold text-slate-900">Forgot Password</div>
                <p className="mt-3 text-sm text-slate-600">Please contact the Barangay Secretary or Super Admin to reset your password.</p>
                <button className="mt-5 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-95" onClick={() => setForgot(false)}>Back to login</button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Username</label>
                  <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" placeholder="admin" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <div className="relative">
                    <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type={show ? "text" : "password"} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" placeholder="••••••••" />
                    <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700">
                      {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <label className="inline-flex items-center gap-2 text-slate-600"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20" /> Remember me</label>
                  <button type="button" onClick={() => setForgot(true)} className="text-primary hover:underline">Forgot password?</button>
                </div>
                <button type="submit" className="w-full rounded-3xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95">Login</button>
                <div className="text-center text-sm text-slate-500">
                  Don&apos;t have an account? <Link to="/register" className="text-primary hover:underline">Register</Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
