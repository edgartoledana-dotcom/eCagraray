import { ReactNode, useState, useEffect, useRef } from "react";
import { Inbox, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

export function useAnimatedMount(open: boolean, duration = 200) {
  const [mounted, setMounted] = useState(false);
  const [dataState, setDataState] = useState<"open" | "closed">("closed");
  const durationRef = useRef(duration);
  durationRef.current = duration;

  useEffect(() => {
    if (open) {
      setMounted(true);
      const timer = setTimeout(() => setDataState("open"), 10);
      return () => clearTimeout(timer);
    } else {
      setDataState("closed");
      const timer = setTimeout(() => setMounted(false), durationRef.current);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return { mounted, dataState };
}

/* ─── Scroll-triggered reveal ─── */
export function useReveal<T extends HTMLElement>(threshold = 0.12) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -60px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ─── Staggered children reveal ─── */
export function StaggerContainer({
  children,
  className,
  fast = false,
}: {
  children: ReactNode;
  className?: string;
  fast?: boolean;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn(
        visible ? (fast ? "stagger-fade-in-fast" : "stagger-fade-in") : "opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, action, actions }: { title: string; subtitle?: string; action?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-bold sm:text-2xl md:text-3xl leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {(action || actions) && <div className="shrink-0 flex flex-wrap gap-2">{action || actions}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border bg-card/60 backdrop-blur-md p-4 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-card/40 ${className}`}>
      {children}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: { icon?: any; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border/60 bg-card/30 p-6 sm:p-12 text-center backdrop-blur-sm">
      <div className="grid h-12 w-12 sm:h-16 sm:w-16 place-items-center rounded-2xl sm:rounded-3xl bg-primary/5 text-primary shadow-inner">
        <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary/75" />
      </div>
      <h3 className="mt-4 sm:mt-5 text-base sm:text-lg font-semibold tracking-tight">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-xs sm:text-sm text-muted-foreground leading-relaxed">{description}</p>}
      {action && <div className="mt-4 sm:mt-6">{action}</div>}
    </div>
  );
}

export function Badge({ children, tone = "default", className = "" }: { children: ReactNode; tone?: "default" | "success" | "warning" | "danger" | "info" | "muted"; className?: string }) {
  const map: Record<string, string> = {
    default: "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_8px_rgba(59,130,246,0.1)]",
    success: "bg-success/10 text-success border border-success/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]",
    warning: "bg-warning/10 text-warning-foreground border border-warning/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]",
    danger: "bg-destructive/10 text-destructive border border-destructive/20 shadow-[0_0_8px_rgba(239,68,68,0.1)]",
    info: "bg-info/10 text-info border border-info/20 shadow-[0_0_8px_rgba(6,182,212,0.1)]",
    muted: "bg-muted text-muted-foreground border border-muted-foreground/10",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${map[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function Button({ children, variant = "primary", size = "md", className = "", leftIcon, ...rest }: { children: ReactNode; variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"; size?: "sm" | "md" | "lg"; leftIcon?: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const map: Record<string, string> = {
    primary: "bg-primary text-primary-foreground shadow-lg shadow-primary/10 hover:opacity-95 hover:shadow-primary/20 active:scale-[0.98]",
    secondary: "bg-card/80 text-foreground border border-border/60 hover:bg-muted hover:border-primary/30 active:scale-[0.98] shadow-sm",
    outline: "border border-border/75 bg-card/60 backdrop-blur-sm hover:bg-muted hover:border-primary/30 active:scale-[0.98]",
    ghost: "hover:bg-muted active:scale-[0.98]",
    danger: "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/10 hover:opacity-95 active:scale-[0.98]",
  };
  const sizeMap: Record<string, string> = {
    sm: "px-3 py-1.5 text-[10px] min-h-[32px]",
    md: "px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm min-h-[44px]",
    lg: "px-6 py-3 text-sm sm:text-base min-h-[48px]",
  };
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-wide transition-all duration-200 cursor-pointer ${map[variant]} ${sizeMap[size]} ${className}`}
    >
      {leftIcon}{children}
    </button>
  );
}

export function Input({ label, className = "", ...rest }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>}
      <input
        {...rest}
        className={`w-full rounded-2xl border border-border/60 bg-background/50 px-4 py-3 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background/80 min-h-[44px] ${className}`}
      />
    </label>
  );
}

export function Textarea({ label, className = "", ...rest }: { label?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>}
      <textarea
        {...rest}
        className={`w-full rounded-2xl border border-border/60 bg-background/50 px-4 py-3 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background/80 min-h-[44px] ${className}`}
      />
    </label>
  );
}

export function Select({ label, children, className = "", ...rest }: { label?: string; children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>}
      <select
        {...rest}
        className={`w-full rounded-2xl border border-border/60 bg-background/50 px-4 py-3 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background/80 min-h-[44px] ${className}`}
      >
        {children}
      </select>
    </label>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const { mounted, dataState } = useAnimatedMount(open, 200);
  if (!mounted) return null;
  return (
    <div
      data-state={dataState}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-4 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        data-state={dataState}
        className="relative my-4 sm:my-auto w-full max-w-lg rounded-2xl sm:rounded-3xl border border-border/50 bg-card/90 p-4 sm:p-6 md:p-8 shadow-2xl backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200 dark:bg-card/95 max-h-[90vh] flex flex-col"
      >
        <div className="mb-4 sm:mb-6 flex items-center justify-between shrink-0">
          <h3 className="text-base sm:text-lg md:text-xl font-bold tracking-tight pr-4">{title}</h3>
          <button onClick={onClose} className="shrink-0 rounded-full p-2.5 hover:bg-muted transition text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Close">
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 pr-1.5 -mr-1.5">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Pagination({
  currentPage, totalPages, onPageChange,
}: {
  currentPage: number; totalPages: number; onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }
  return (
    <div className="flex items-center justify-center gap-1 pt-4 pb-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="min-h-[36px] min-w-[36px] rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition disabled:opacity-30 disabled:pointer-events-none"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground/50 text-sm">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`min-h-[36px] min-w-[36px] rounded-lg text-sm font-bold transition ${
              p === currentPage
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="min-h-[36px] min-w-[36px] rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition disabled:opacity-30 disabled:pointer-events-none"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 sm:h-14 rounded-2xl bg-muted/40" />
      ))}
    </div>
  );
}

export function exportToCSV<T extends Record<string, any>>(items: T[], filename: string, labelMap?: Partial<Record<keyof T, string>>) {
  if (!items.length) return;
  const keys = Object.keys(items[0]) as (keyof T)[];
  const headers = keys.map((k) => {
    const label = labelMap?.[k] || String(k);
    return `"${label.replace(/"/g, '""')}"`;
  });
  const rows = items.map((item) =>
    keys.map((k) => {
      const v = item[k];
      const s = v == null ? "" : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    }).join(","),
  );
  const csv = [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
