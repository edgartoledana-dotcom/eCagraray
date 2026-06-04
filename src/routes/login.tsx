import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Shield, ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Access Key Gateway · e-Cagraray" }] }),
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
    if (!form.username || !form.password) return toast.error("All security parameters are required");
    try {
      const u = await login(form.username, form.password, remember);
      if (!u) return toast.error("Verification failed. Invalid credentials.");
      toast.success(`Access Authorization Granted. Welcome, ${u.fullName}`);
      nav({ to: "/dashboard" });
    } catch (error: any) {
      toast.error(error?.message ?? "Authorization handshake failed.");
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground cyber-grid flex items-center justify-center p-4">
      <div className="absolute top-10 left-10 h-72 w-72 rounded-full glow-orb-primary animate-float opacity-30 pointer-events-none" />
      <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full glow-orb-accent animate-float-reverse opacity-20 pointer-events-none" />
      
      <div className="relative w-full max-w-5xl rounded-[2.5rem] border border-border/50 bg-card/40 shadow-2xl backdrop-blur-xl overflow-hidden glass-premium">
        <div className="grid md:grid-cols-[1.1fr_0.9fr]">
          
          {/* Left Security Column - Desktop Only */}
          <div className="relative hidden md:flex flex-col justify-between p-12 bg-primary/[0.02] border-r border-border/40">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            
            <Link to="/" className="relative z-10 inline-flex items-center gap-3 self-start rounded-full border border-border/50 bg-background/50 px-4.5 py-2 text-xs font-bold uppercase tracking-wider transition hover:border-primary">
              <Shield className="h-4.5 w-4.5 text-primary" /> e-Cagraray
            </Link>

            <div className="relative z-10 space-y-6 max-w-sm">
              <div className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/5 px-3.5 py-1 text-[9px] font-extrabold uppercase tracking-widest text-success">
                <ShieldCheck className="h-3.5 w-3.5" /> SECURED ENDPOINT
              </div>
              <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 dark:text-white">
                Authorized <br />
                Operations Gateway.
              </h1>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Authenticate with your system security key credentials to gain access to resident records, dispatch channels, and barangay logistics.
              </p>
            </div>

            <div className="relative z-10 space-y-3 rounded-2xl border border-border/40 bg-background/30 p-5 text-[11px] leading-relaxed text-muted-foreground backdrop-blur-md">
              <div className="font-bold text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-primary" /> SECURE SESSION PROTOCOL
              </div>
              <p>
                Session traffic is fully encrypted using industry-standard TLS protocols. Database actions are audited.
              </p>
              <p className="text-[10px] text-slate-400">
                Unauthorized access attempts will trigger security logs and IP blocklists.
              </p>
            </div>
          </div>

          {/* Right Verification Column */}
          <div className="p-8 sm:p-12 flex flex-col justify-center">
            <div className="md:hidden flex justify-between items-center mb-8">
              <Link to="/" className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-extrabold text-sm tracking-tight">e-Cagraray</span>
              </Link>
              <Link to="/" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary">Cancel</Link>
            </div>

            <div className="space-y-2 mb-8">
              <h2 className="text-3xl font-black tracking-tight">Verify Identity</h2>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">LGU PORTAL HANDSHAKE</p>
            </div>

            {forgot ? (
              <div className="rounded-2xl border border-border bg-background/50 p-6 text-sm text-slate-700 dark:text-slate-300">
                <div className="font-bold text-slate-950 dark:text-white uppercase tracking-wider text-xs">Credential Recovery</div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Please consult your local Secretariat Desk or the Head Administrator node to reset password configurations.</p>
                <button className="mt-6 w-full rounded-full bg-primary px-5 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-95" onClick={() => setForgot(false)}>Back to Credentials</button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">System Username</label>
                  <input
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full rounded-2xl border border-border/60 bg-background/40 px-4.5 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="Enter official identifier"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Access Key Password</label>
                  <div className="relative">
                    <input
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      type={show ? "text" : "password"}
                      className="w-full rounded-2xl border border-border/60 bg-background/40 px-4.5 py-3 pr-12 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                      placeholder="Enter security key"
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      className="absolute right-4.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    >
                      {show ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1.5">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none text-muted-foreground font-semibold">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary/10"
                    />
                    Keep session keys
                  </label>
                  <button type="button" onClick={() => setForgot(true)} className="text-primary font-bold hover:underline">Forgot Key?</button>
                </div>

                <button type="submit" className="w-full rounded-full bg-primary py-3.5 text-xs font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-95 shadow-lg shadow-primary/20 cursor-pointer">
                  Authenticate credentials
                </button>

                <div className="text-center text-xs text-muted-foreground pt-4">
                  Need a secure local account? <Link to="/register" className="text-primary font-bold hover:underline">Request Registration</Link>
                </div>
              </form>
            )}
            
            <div className="mt-8 flex justify-center">
              <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Cancel Handshake
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
