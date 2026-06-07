import { useState, useEffect, useRef, useCallback } from "react";
import { Terminal, Command, X, Send, AlertTriangle, Check, Loader2, Shield } from "lucide-react";
import { useAuth } from "../lib/auth";
import { parseAdminCommand, executeToolAction } from "../lib/api/admin-copilot.functions";
import type { CopilotToolCall } from "../lib/admin-copilot.server";
import { useAnimatedMount } from "./ui-kit";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolCall?: CopilotToolCall;
  result?: any;
}

export default function AdminCopilot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { mounted, dataState } = useAnimatedMount(open, 200);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Ready. Type a command or press Ctrl+K to toggle." },
  ]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState<CopilotToolCall | null>(null);
  const [executing, setExecuting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (user?.role !== "super_admin") return;
        setOpen((p) => !p);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [user]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || loading) return;
    const cmd = input.trim();
    setInput("");
    setMessages((p) => [...p, { role: "user", content: cmd }]);
    setLoading(true);
    setConfirming(null);

    try {
      const res = await parseAdminCommand({ data: { command: cmd } });
      setMessages((p) => [
        ...p,
        {
          role: "assistant",
          content: res.explanation,
          toolCall: res.toolCall || undefined,
        },
      ]);
      if (res.toolCall) {
        if (res.needsConfirmation) {
          setConfirming(res.toolCall);
        } else {
          execute(res.toolCall);
        }
      }
    } catch (err: any) {
      setMessages((p) => [
        ...p,
        { role: "assistant", content: `Error: ${err?.message || "Command failed"}` },
      ]);
    }
    setLoading(false);
  }, [input, loading]);

  const execute = async (toolCall: CopilotToolCall) => {
    setExecuting(true);
    try {
      const res = await executeToolAction({
        data: { action: toolCall.action, params: toolCall.params, confirmed: true as const },
      });
      setMessages((p) => [
        ...p,
        {
          role: "assistant",
          content: res.ok
            ? `Done. ${typeof res.data === "object" ? JSON.stringify(res.data, null, 2).slice(0, 500) : res.data}`
            : `Failed: ${res.error}`,
          result: res,
        },
      ]);
    } catch (err: any) {
      setMessages((p) => [
        ...p,
        { role: "assistant", content: `Execution error: ${err?.message || "Unknown"}` },
      ]);
    }
    setExecuting(false);
    setConfirming(null);
  };

  if (!mounted) return null;

  const riskBadge = (level: string) => {
    const colors: Record<string, string> = {
      low: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
      medium: "border-amber-500/40 text-amber-400 bg-amber-500/10",
      high: "border-orange-500/40 text-orange-400 bg-orange-500/10",
      critical: "border-rose-500/40 text-rose-400 bg-rose-500/10",
    };
    return colors[level] || colors.low;
  };

  return (
    <div data-state={dataState} className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
      <div data-state={dataState} className="w-full max-w-2xl rounded-2xl border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-black/50 overflow-hidden backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-indigo-500/15 p-1.5">
              <Terminal className="h-4 w-4 text-indigo-400" />
            </div>
            <span className="text-sm font-bold text-slate-200">Admin Co-Pilot</span>
            <span className="rounded border border-slate-600/50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Super Admin</span>
          </div>
          <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="h-72 overflow-y-auto space-y-2 p-3 text-xs font-mono">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="mt-0.5 shrink-0 rounded-full bg-indigo-500/20 p-1">
                  <Shield className="h-3 w-3 text-indigo-400" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-xl px-3 py-2 leading-relaxed ${m.role === "user" ? "bg-indigo-600/20 text-indigo-200 border border-indigo-500/20" : "bg-slate-800/60 text-slate-300 border border-slate-700/30"}`}>
                <div className="whitespace-pre-wrap break-words">{m.content}</div>
                {m.toolCall && (
                  <div className="mt-2 rounded-lg border border-slate-600/30 bg-slate-800/80 p-2 text-[10px]">
                    <div className="flex items-center gap-1.5 text-indigo-300 mb-1">
                      <Terminal className="h-3 w-3" />
                      <span className="font-bold">{m.toolCall.action}</span>
                      <span className={`ml-auto px-1.5 py-0.5 rounded border text-[8px] font-bold uppercase tracking-wider ${riskBadge(m.toolCall.riskLevel)}`}>{m.toolCall.riskLevel}</span>
                    </div>
                    <div className="text-slate-400">{m.toolCall.description}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-slate-400 px-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Processing...</span>
            </div>
          )}
          {executing && (
            <div className="flex items-center gap-2 text-indigo-400 px-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Executing action...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Confirmation */}
        {confirming && (
          <div className="mx-3 mb-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold mb-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Confirm {confirming.riskLevel === "critical" ? "Critical" : confirming.riskLevel === "high" ? "High-Risk" : "Action"}
            </div>
            <div className="text-[11px] text-amber-200/80 mb-2">{confirming.description}</div>
            <div className="flex gap-2">
              <ButtonCopilot variant="danger" onClick={() => execute(confirming)} disabled={executing}>
                {executing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Confirm & Execute
              </ButtonCopilot>
              <ButtonCopilot variant="ghost" onClick={() => setConfirming(null)}>Cancel</ButtonCopilot>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-slate-700/50 p-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-600/50 bg-slate-800/60 px-3 py-2 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20 transition">
            <Command className="h-4 w-4 shrink-0 text-slate-500" />
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              placeholder="Type an admin command..."
              className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500 font-mono"
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || loading}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-500/20 hover:text-indigo-300 disabled:opacity-30 transition"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-1.5 flex gap-2 text-[9px] text-slate-500 px-1">
            <span>Try: "Show recent audit logs"</span>
            <span className="text-slate-600">|</span>
            <span>"List all users"</span>
            <span className="text-slate-600">|</span>
            <span>"Run backup"</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ButtonCopilot({ children, variant = "primary", onClick, disabled }: {
  children: React.ReactNode;
  variant?: "primary" | "danger" | "ghost";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const base = "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold tracking-wide transition disabled:opacity-40";
  const styles: Record<string, string> = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
    ghost: "text-slate-400 hover:text-slate-200 hover:bg-slate-800",
  };
  return (
    <button className={`${base} ${styles[variant]}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
