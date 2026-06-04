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
  return <div className={`rounded-xl border bg-card p-5 shadow-sm ${className}`}>{children}</div>;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: { icon?: any; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed bg-card/50 p-12 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "success" | "warning" | "danger" | "info" | "muted" }) {
  const map: Record<string, string> = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    danger: "bg-destructive/15 text-destructive",
    info: "bg-info/15 text-info",
    muted: "bg-muted text-muted-foreground",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${map[tone]}`}>{children}</span>;
}

export function Button({ children, variant = "primary", className = "", ...rest }: { children: ReactNode; variant?: "primary" | "outline" | "ghost" | "danger" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const map: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    outline: "border bg-card hover:bg-muted",
    ghost: "hover:bg-muted",
    danger: "bg-destructive text-destructive-foreground hover:opacity-90",
  };
  return <button {...rest} className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition ${map[variant]} ${className}`}>{children}</button>;
}

export function Input({ label, className = "", ...rest }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium">{label}</span>}
      <input {...rest} className={`w-full rounded-lg border bg-background px-3 py-2 text-sm ${className}`} />
    </label>
  );
}

export function Textarea({ label, className = "", ...rest }: { label?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium">{label}</span>}
      <textarea {...rest} className={`w-full rounded-lg border bg-background px-3 py-2 text-sm ${className}`} />
    </label>
  );
}

export function Select({ label, children, className = "", ...rest }: { label?: string; children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium">{label}</span>}
      <select {...rest} className={`w-full rounded-lg border bg-background px-3 py-2 text-sm ${className}`}>{children}</select>
    </label>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
