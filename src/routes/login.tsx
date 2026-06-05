import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Shield, ArrowLeft, ShieldCheck, Lock, ShieldAlert } from "lucide-react";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: (search.mode as string) || "login",
  }),
  head: () => ({ meta: [{ title: "Access Key Gateway · e-Cagraray" }] }),
  component: Login,
});

function Login() {
  const { mode } = Route.useSearch();
  const isRegister = mode === "register";
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate({ to: "/dashboard" });
    }
  }, [user, navigate]);

  // Login Form State
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [form, setForm] = useState({ username: "", password: "" });
  const [forgot, setForgot] = useState(false);

  // Register Form State
  const [regForm, setRegForm] = useState({
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
  });

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) return toast.error("All security parameters are required");
    try {
      const u = await login(form.username, form.password, remember);
      if (!u) return toast.error("Verification failed. Invalid credentials.");
      toast.success(`Access Authorization Granted. Welcome, ${u.fullName}`);
      navigate({ to: "/dashboard" });
    } catch (error: any) {
      toast.error(error?.message ?? "Authorization handshake failed.");
    }
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.fullName || !regForm.email || !regForm.username || !regForm.password) {
      return toast.error("Please complete all required verification fields");
    }
    if (!/^\S+@\S+\.\S+$/.test(regForm.email)) return toast.error("Invalid email configuration");
    if (regForm.password.length < 8) return toast.error("Security keys must be at least 8 characters");
    if (regForm.password !== regForm.confirm) return toast.error("Access passwords do not match");

    try {
      await register({
        fullName: regForm.fullName,
        birthdate: regForm.birthdate,
        gender: regForm.gender,
        address: regForm.address,
        contact: regForm.contact,
        email: regForm.email,
        username: regForm.username,
        password: regForm.password,
        occupation: regForm.occupation,
        isPwd: regForm.isPwd,
      });
      toast.success("Identity Node Registered. Awaiting system administration approval.");
      navigate({ to: "/login", search: { mode: "login" } });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const strength = (p: string) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const regStrengthScore = strength(regForm.password);
  const regStrengthLabel = ["Very weak Key", "Weak Key", "Fair Security", "Strong Key", "Military Grade Security"][regStrengthScore];
  const regStrengthColor = ["bg-destructive", "bg-destructive", "bg-warning", "bg-info", "bg-success"][regStrengthScore];
  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground cyber-grid flex items-center justify-center p-4">
      <div className="absolute top-10 left-10 h-72 w-72 rounded-full glow-orb-primary animate-float opacity-30 pointer-events-none" />
      <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full glow-orb-accent animate-float-reverse opacity-20 pointer-events-none" />
      
      <div className="relative w-full max-w-5xl md:h-[680px] h-[calc(100vh-2rem)] min-h-[580px] rounded-[2.5rem] border border-border/50 bg-card/40 shadow-2xl overflow-hidden glass-premium auth-card-static flex flex-col md:flex-row">
        
        {/* Left Security Column - Desktop Only */}
        <div className="relative hidden md:flex w-[52%] flex-col justify-between p-12 bg-primary/[0.02] border-r border-border/40 shrink-0 select-none">
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
            <div className="font-bold text-slate-950 dark:text-white uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-primary" /> SECURED TERMINAL
              </span>
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            </div>
            
            <div className="tech-terminal space-y-1 text-[9px]">
              <div>&gt; LINK: CLOUDFLARE_D1_ACTIVE</div>
              <div>&gt; TARGET: ecagraray.workers.dev</div>
              <div>&gt; CIPHER: TLS_AES_256_GCM</div>
              <div>&gt; PORTAL STATE: SYSTEM_READY</div>
            </div>
          </div>
        </div>

        {/* Right Verification & Registration Column */}
        <div className="w-full md:w-[48%] h-full flex flex-col p-8 sm:p-10 overflow-hidden relative shrink-0">
          {/* tech corners for cyber look */}
          <div className="tech-corner tech-corner-tl" />
          <div className="tech-corner tech-corner-tr" />
          <div className="tech-corner tech-corner-bl" />
          <div className="tech-corner tech-corner-br" />

          {/* Mobile Cancel Header (Hidden on Desktop) */}
          <div className="md:hidden flex justify-between items-center mb-5 shrink-0 select-none">
            <Link to="/" className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-extrabold text-sm tracking-tight">e-Cagraray</span>
            </Link>
            <Link to="/" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary">Cancel</Link>
          </div>

          {/* Form Header */}
          <div className="mb-5 shrink-0">
            <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-slate-950 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              {isRegister ? "Request Enrollment" : "Verify Identity"}
            </h2>
            <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest mt-1">
              {isRegister ? "LGU Identity Registry" : "LGU Portal Handshake"}
            </p>
          </div>

          {/* Segmented Switch Slider */}
          <div className="relative flex p-1 bg-muted/60 dark:bg-slate-900/50 rounded-full mb-6 border border-border/30 shrink-0 select-none">
            <div
              className="absolute top-1 bottom-1 rounded-full bg-background dark:bg-card shadow-sm border border-border/30 transition-all duration-300 ease-out"
              style={{
                left: isRegister ? "50%" : "4px",
                width: "calc(50% - 6px)",
              }}
            />
            <button
              type="button"
              onClick={() => navigate({ to: "/login", search: { mode: "login" } })}
              className={`relative z-10 w-1/2 text-center py-2 text-xs font-bold transition-colors duration-200 cursor-pointer ${
                !isRegister ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Verify Identity
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/login", search: { mode: "register" } })}
              className={`relative z-10 w-1/2 text-center py-2 text-xs font-bold transition-colors duration-200 cursor-pointer ${
                isRegister ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Request Access
            </button>
          </div>

          {/* Form Content Slider */}
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <div
              className="absolute inset-0 flex transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) h-full"
              style={{
                transform: isRegister ? "translateX(-50%)" : "translateX(0%)",
                width: "200%",
              }}
            >
              {/* 1. LOGIN FORM PANEL */}
              <form onSubmit={submitLogin} className="auth-form-panel pr-4 h-full flex flex-col justify-between">
                <div className="auth-fields-scroll flex-1 space-y-4 py-2">
                  {forgot ? (
                    <div className="rounded-2xl border border-border bg-background/50 p-6 text-sm text-slate-700 dark:text-slate-300">
                      <div className="font-bold text-slate-950 dark:text-white uppercase tracking-wider text-xs">Credential Recovery</div>
                      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Please consult your local Secretariat Desk or the Head Administrator node to reset password configurations.</p>
                      <button type="button" className="mt-6 w-full rounded-full bg-primary px-5 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-95 cursor-pointer" onClick={() => setForgot(false)}>Back to Credentials</button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">System Username</label>
                        <input
                          value={form.username}
                          onChange={(e) => setForm({ ...form, username: e.target.value })}
                          className="w-full rounded-2xl border border-border/60 bg-background/40 px-4.5 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                          placeholder="Enter official identifier"
                        />
                      </div>
                      
                      <div className="space-y-1.5 text-left">
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
                            className="absolute right-4.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition cursor-pointer"
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
                        <button type="button" onClick={() => setForgot(true)} className="text-primary font-bold hover:underline cursor-pointer">Forgot Key?</button>
                      </div>
                    </>
                  )}
                </div>
                
                {!forgot && (
                  <div className="pt-4 border-t border-border/20 shrink-0 space-y-4 select-none">
                    <button type="submit" className="w-full rounded-full bg-primary py-3.5 text-xs font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-95 shadow-lg shadow-primary/20 cursor-pointer">
                      Authenticate credentials
                    </button>

                    <div className="flex justify-center">
                      <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" /> Cancel Handshake
                      </Link>
                    </div>
                  </div>
                )}
              </form>

              {/* 2. REGISTER FORM PANEL */}
              <form onSubmit={submitRegister} className="auth-form-panel pl-4 h-full flex flex-col justify-between">
                <div className="auth-fields-scroll flex-1 space-y-4 py-2">
                  <Field
                    label="Full Name *"
                    value={regForm.fullName}
                    onChange={(v) => setRegForm({ ...regForm, fullName: v })}
                    placeholder="Edgar Jr. Toledana"
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      label="Birthdate *"
                      type="date"
                      value={regForm.birthdate}
                      onChange={(v) => setRegForm({ ...regForm, birthdate: v })}
                    />
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gender Node</label>
                      <select
                        value={regForm.gender}
                        onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                        className="w-full rounded-2xl border border-border/60 bg-background/40 px-4 py-2.5 sm:px-4.5 sm:py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Occupation / Sector</label>
                      <select
                        value={regForm.occupation}
                        onChange={(e) => setRegForm({ ...regForm, occupation: e.target.value })}
                        className="w-full rounded-2xl border border-border/60 bg-background/40 px-4 py-2.5 sm:px-4.5 sm:py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                      >
                        <option value="Farmer">Farmer</option>
                        <option value="Fisherfolk">Fisherfolk</option>
                        <option value="Student">Student</option>
                        <option value="Other">Other / None</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">PWD Status</label>
                      <select
                        value={regForm.isPwd}
                        onChange={(e) => setRegForm({ ...regForm, isPwd: e.target.value })}
                        className="w-full rounded-2xl border border-border/60 bg-background/40 px-4 py-2.5 sm:px-4.5 sm:py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  </div>

                  <Field
                    label="Address Map Node"
                    value={regForm.address}
                    onChange={(v) => setRegForm({ ...regForm, address: v })}
                    placeholder="Zone, Street, Sitio"
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      label="Contact Number"
                      value={regForm.contact}
                      onChange={(v) => setRegForm({ ...regForm, contact: v })}
                      placeholder="e.g. +63 900"
                    />
                    <Field
                      label="Email Address *"
                      type="email"
                      value={regForm.email}
                      onChange={(v) => setRegForm({ ...regForm, email: v })}
                      placeholder="e.g. contact@email.com"
                    />
                  </div>

                  <Field
                    label="System Username *"
                    value={regForm.username}
                    onChange={(v) => setRegForm({ ...regForm, username: v })}
                    placeholder="Choose system login ID"
                  />
                  
                  <div className="space-y-2">
                    <Field
                      label="Access Security Key *"
                      type="password"
                      value={regForm.password}
                      onChange={(v) => setRegForm({ ...regForm, password: v })}
                      placeholder="Minimum 8 characters"
                    />
                    {regForm.password && (
                      <div className="px-1.5">
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted border border-border/20">
                          <div className={`h-full transition-all duration-300 ${regStrengthColor}`} style={{ width: `${(regStrengthScore / 4) * 100}%` }} />
                        </div>
                        <div className="mt-1 text-[9px] font-bold uppercase text-muted-foreground">Complexity: {regStrengthLabel}</div>
                      </div>
                    )}
                  </div>

                  <Field
                    label="Verify Security Key *"
                    type="password"
                    value={regForm.confirm}
                    onChange={(v) => setRegForm({ ...regForm, confirm: v })}
                    placeholder="Re-enter security key"
                  />

                  <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4 flex gap-3 text-xs leading-relaxed text-warning-foreground">
                    <ShieldAlert className="h-5 w-5 shrink-0 text-warning" />
                    <div>
                      <span className="font-bold uppercase tracking-wider text-[10px]">Verification Advisory:</span> By requesting enrollment, you confirm that all provided details match official barangay documents.
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/20 shrink-0">
                  <button type="submit" className="w-full rounded-full bg-primary py-3.5 text-xs font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-95 shadow-lg shadow-primary/20 cursor-pointer">
                    Submit Enrollment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  className = "",
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
  placeholder?: string;
}) {
  return (
    <div className={className + " space-y-1.5 text-left"}>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-border/60 bg-background/40 px-4 py-2.5 sm:px-4.5 sm:py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
    </div>
  );
}
