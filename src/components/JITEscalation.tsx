import { useState, useEffect, useCallback } from "react";
import { Shield, ShieldOff, Clock, Check, X, Loader2, AlertTriangle, Zap, User } from "lucide-react";
import { useAuth } from "../lib/auth";
import { requestJITEscalation, approveJITEscalation, revokeJITEscalation, getActiveJITEscalation, listJITEscalations } from "../lib/api/jit-escalation.functions";

const ESCALATION_PERMISSIONS = [
  { id: "config_edit", label: "Edit System Configuration", risk: "high" },
  { id: "security_blotter_view", label: "View Security Blotters", risk: "high" },
  { id: "user_suspend", label: "Suspend User Accounts", risk: "critical" },
  { id: "database_export", label: "Export Full Database", risk: "high" },
  { id: "audit_log_clear", label: "Clear Audit Log", risk: "critical" },
];

interface JITEscalationProps {
  embedded?: boolean;
}

export default function JITEscalation({ embedded }: JITEscalationProps) {
  const { user } = useAuth();
  const [activeEscalation, setActiveEscalation] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [justification, setJustification] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ttlRemaining, setTtlRemaining] = useState("");
  const isSuperAdmin = user?.role === "super_admin";

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (user?.id) {
        const active = await getActiveJITEscalation({ data: { userId: user.id } });
        setActiveEscalation(active);
      }
      if (isSuperAdmin) {
        const pending = await listJITEscalations({ data: { status: "active" } });
        setPendingRequests(pending || []);
      }
    } catch {}
    setRefreshing(false);
  }, [user, isSuperAdmin]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!activeEscalation?.expires_at) { setTtlRemaining(""); return; }
    const update = () => {
      const diff = new Date(activeEscalation.expires_at).getTime() - Date.now();
      if (diff <= 0) { setTtlRemaining("Expired"); setActiveEscalation(null); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTtlRemaining(`${mins}m ${secs}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [activeEscalation]);

  const handleRequest = async () => {
    if (!user || selectedPerms.length === 0 || justification.length < 10) return;
    setLoading(true);
    try {
      await requestJITEscalation({
        data: {
          userId: user.id,
          userName: user.fullName || user.username,
          role: user.role,
          permissions: selectedPerms,
          justification,
        },
      });
      setShowRequestForm(false);
      setSelectedPerms([]);
      setJustification("");
      await refresh();
    } catch {}
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    if (!user) return;
    await approveJITEscalation({
      data: { id, approvedBy: user.id, approvedByName: user.fullName || user.username },
    });
    await refresh();
  };

  const handleRevoke = async (id: string) => {
    await revokeJITEscalation({ data: { id } });
    await refresh();
  };

  const content = (
    <div className="space-y-3">
      {/* Active escalation status */}
      {activeEscalation ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300">JIT Escalation Active</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">{ttlRemaining}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {JSON.parse(activeEscalation.permissions || "[]").map((p: string) => (
              <span key={p} className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300">{ESCALATION_PERMISSIONS.find((e) => e.id === p)?.label || p}</span>
            ))}
          </div>
          <button
            onClick={() => handleRevoke(activeEscalation.id)}
            className="mt-2 text-[10px] text-rose-400 hover:text-rose-300 transition flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Revoke escalation
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700/30 bg-slate-800/40 p-3">
          <div className="flex items-center gap-2">
            <ShieldOff className="h-4 w-4 text-slate-500" />
            <span className="text-xs text-slate-400">Baseline permissions active</span>
          </div>
          <div className="text-[9px] text-slate-500 mt-1">Request elevated access for privileged operations.</div>
        </div>
      )}

      {/* Request form */}
      {!activeEscalation && !showRequestForm && (
        <button
          onClick={() => setShowRequestForm(true)}
          className="w-full rounded-xl border border-dashed border-indigo-500/30 py-2.5 text-[10px] font-bold text-indigo-400 hover:bg-indigo-500/10 transition min-h-[36px]"
        >
          Request JIT Escalation
        </button>
      )}

      {showRequestForm && !activeEscalation && (
        <div className="rounded-xl border border-slate-700/40 bg-slate-800/60 p-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="text-[10px] font-bold text-slate-300">Select permissions to escalate:</div>
          <div className="space-y-1.5">
            {ESCALATION_PERMISSIONS.map((perm) => (
              <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPerms.includes(perm.id)}
                  onChange={() => setSelectedPerms((p) => p.includes(perm.id) ? p.filter((x) => x !== perm.id) : [...p, perm.id])}
                  className="rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500/30"
                />
                <span className="text-[11px] text-slate-300 flex-1">{perm.label}</span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${perm.risk === "critical" ? "text-rose-400 bg-rose-500/10" : "text-amber-400 bg-amber-500/10"}`}>{perm.risk}</span>
              </label>
            ))}
          </div>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Justification for escalation (min 10 characters)..."
            className="w-full rounded-xl border border-slate-600/50 bg-slate-800/60 px-3 py-2 text-[11px] text-slate-200 outline-none focus:border-indigo-500/50 min-h-[60px] resize-none placeholder:text-slate-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleRequest}
              disabled={selectedPerms.length === 0 || justification.length < 10 || loading}
              className="flex-1 rounded-xl bg-indigo-600 py-2 text-[10px] font-bold text-white hover:bg-indigo-500 disabled:opacity-40 transition min-h-[36px] flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3" />}
              Submit Request (30min TTL)
            </button>
            <button
              onClick={() => setShowRequestForm(false)}
              className="rounded-xl border border-slate-600/40 px-3 text-[10px] text-slate-400 hover:bg-slate-800 transition min-h-[36px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Super Admin: Pending approvals */}
      {isSuperAdmin && pendingRequests.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-300">Active Escalations</span>
          </div>
          <div className="space-y-1.5">
            {pendingRequests.map((req: any) => (
              <div key={req.id} className="flex items-center justify-between rounded-lg bg-slate-800/60 p-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-200 truncate">{req.user_name || req.user_id}</div>
                  <div className="text-[9px] text-slate-400 truncate">{req.justification}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!req.approved_by && (
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="rounded-lg bg-emerald-600/20 p-1.5 text-emerald-400 hover:bg-emerald-600/30 transition"
                      title="Approve"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    onClick={() => handleRevoke(req.id)}
                    className="rounded-lg bg-rose-600/20 p-1.5 text-rose-400 hover:bg-rose-600/30 transition"
                    title="Revoke"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {refreshing && (
        <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-500">
          <Loader2 className="h-3 w-3 animate-spin" /> Refreshing...
        </div>
      )}
    </div>
  );

  if (embedded) return content;

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-700/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-violet-500/15 p-1.5">
            <Zap className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">JIT Privilege Escalation</div>
            <div className="text-[9px] text-slate-500 mt-0.5">Just-In-Time elevated access with auto-expiry</div>
          </div>
        </div>
      </div>
      <div className="p-4">{content}</div>
    </div>
  );
}
