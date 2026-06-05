import { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border bg-card/60 backdrop-blur-md p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-card/40 ${className}`}>
      {children}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: { icon?: any; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border/60 bg-card/30 p-12 text-center backdrop-blur-sm">
      <div className="grid h-16 w-16 place-items-center rounded-3xl bg-primary/5 text-primary shadow-inner">
        <Icon className="h-8 w-8 text-primary/75" />
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "success" | "warning" | "danger" | "info" | "muted" }) {
  const map: Record<string, string> = {
    default: "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_8px_rgba(59,130,246,0.1)]",
    success: "bg-success/10 text-success border border-success/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]",
    warning: "bg-warning/10 text-warning-foreground border border-warning/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]",
    danger: "bg-destructive/10 text-destructive border border-destructive/20 shadow-[0_0_8px_rgba(239,68,68,0.1)]",
    info: "bg-info/10 text-info border border-info/20 shadow-[0_0_8px_rgba(6,182,212,0.1)]",
    muted: "bg-muted text-muted-foreground border border-muted-foreground/10",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${map[tone]}`}>
      {children}
    </span>
  );
}

export function Button({ children, variant = "primary", className = "", ...rest }: { children: ReactNode; variant?: "primary" | "outline" | "ghost" | "danger" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const map: Record<string, string> = {
    primary: "bg-primary text-primary-foreground shadow-lg shadow-primary/10 hover:opacity-95 hover:shadow-primary/20 active:scale-[0.98]",
    outline: "border border-border/75 bg-card/60 backdrop-blur-sm hover:bg-muted hover:border-primary/30 active:scale-[0.98]",
    ghost: "hover:bg-muted active:scale-[0.98]",
    danger: "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/10 hover:opacity-95 active:scale-[0.98]",
  };
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer ${map[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input({ label, className = "", ...rest }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>}
      <input
        {...rest}
        className={`w-full rounded-2xl border border-border/60 bg-background/50 px-4.5 py-3 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background/80 ${className}`}
      />
    </label>
  );
}

export function Textarea({ label, className = "", ...rest }: { label?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>}
      <textarea
        {...rest}
        className={`w-full rounded-2xl border border-border/60 bg-background/50 px-4.5 py-3 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background/80 ${className}`}
      />
    </label>
  );
}

export function Select({ label, children, className = "", ...rest }: { label?: string; children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>}
      <select
        {...rest}
        className={`w-full rounded-2xl border border-border/60 bg-background/50 px-4.5 py-3 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background/80 ${className}`}
      >
        {children}
      </select>
    </label>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm transition-opacity duration-300" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative my-auto w-full max-w-lg rounded-2xl sm:rounded-3xl border border-border/50 bg-card/90 p-5 sm:p-8 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 dark:bg-card/95 max-h-[90vh] flex flex-col"
      >
        <div className="mb-6 flex items-center justify-between shrink-0">
          <h3 className="text-lg sm:text-xl font-bold tracking-tight">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted transition text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 pr-1.5 -mr-1.5">
          {children}
        </div>
      </div>
    </div>
  );
}
