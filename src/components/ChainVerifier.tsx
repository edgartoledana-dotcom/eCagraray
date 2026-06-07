import { useState, useCallback } from "react";
import { Shield, ShieldCheck, ShieldAlert, Loader2, ChevronDown, ChevronRight, Hash, Link, Clock, User, Activity } from "lucide-react";
import { verifyAuditChain } from "../lib/api/chain-audit.functions";
import type { ChainVerificationResult } from "../lib/chain-audit.server";

export default function ChainVerifier() {
  const [result, setResult] = useState<ChainVerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const runVerification = useCallback(async () => {
    setLoading(true);
    try {
      const res = await verifyAuditChain({ data: { limit: 1000 } });
      setResult(res);
    } catch (err: any) {
      setResult({
        valid: false,
        totalEntries: 0,
        verified: 0,
      });
    }
    setLoading(false);
  }, []);

  const isValid = result?.valid;
  const pct = result?.totalEntries ? Math.round((result.verified / result.totalEntries) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-700/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={`rounded-lg p-1.5 ${isValid === undefined ? "bg-slate-700/30" : isValid ? "bg-emerald-500/15" : "bg-rose-500/15"}`}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            ) : isValid === undefined ? (
              <Shield className="h-4 w-4 text-slate-400" />
            ) : isValid ? (
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-rose-400" />
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">Blockchain Chain Verifier</div>
            <div className="text-[9px] text-slate-500 mt-0.5">SHA-256 cryptographic integrity check</div>
          </div>
        </div>
        <button
          onClick={runVerification}
          disabled={loading}
          className="rounded-xl border border-slate-600/40 px-3 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-slate-800 hover:border-slate-500/50 disabled:opacity-40 transition min-h-[36px]"
        >
          {loading ? "Verifying..." : "Verify Chain"}
        </button>
      </div>

      {result && (
        <div className="p-4 space-y-3">
          {/* Status indicator */}
          <div className={`rounded-xl border p-3 ${isValid ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}>
            <div className="flex items-center gap-2">
              {isValid ? (
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-rose-400" />
              )}
              <div>
                <div className={`text-sm font-bold ${isValid ? "text-emerald-300" : "text-rose-300"}`}>
                  {isValid ? "System Integrity: Cryptographically Verified" : "Chain Integrity Compromised"}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {result.totalEntries === 0
                    ? "No audit entries to verify"
                    : isValid
                      ? `All ${result.totalEntries} entries verified — hash chain intact`
                      : `Entry #${result.brokenAt} of ${result.totalEntries} failed verification`}
                </div>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-lg border border-slate-700/30 p-2.5">
              <div className="flex items-center gap-1 text-[9px] text-slate-400 mb-1"><Hash className="h-3 w-3" /> Chain Length</div>
              <div className="text-lg font-black text-slate-200">{result.totalEntries}</div>
            </div>
            <div className="rounded-lg border border-slate-700/30 p-2.5">
              <div className="flex items-center gap-1 text-[9px] text-slate-400 mb-1"><Activity className="h-3 w-3" /> Verified</div>
              <div className="text-lg font-black text-emerald-300">{result.verified}</div>
            </div>
            <div className="rounded-lg border border-slate-700/30 p-2.5">
              <div className="flex items-center gap-1 text-[9px] text-slate-400 mb-1"><Link className="h-3 w-3" /> Integrity</div>
              <div className="text-lg font-black" style={{ color: isValid ? "#34d399" : "#f43f5e" }}>{pct}%</div>
            </div>
            <div className="rounded-lg border border-slate-700/30 p-2.5">
              <div className="flex items-center gap-1 text-[9px] text-slate-400 mb-1"><Clock className="h-3 w-3" /> Broken Links</div>
              <div className="text-lg font-black text-rose-400">{result.brokenAt !== undefined ? 1 : 0}</div>
            </div>
          </div>

          {/* Full hashes (collapsed) */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {expanded ? "Hide" : "Show"} cryptographic hashes
          </button>

          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="space-y-1.5 font-mono text-[9px] break-all pt-2">
              {result.firstEntryHash && (
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 shrink-0 mt-0.5">Genesis:</span>
                  <span className="text-slate-300">{result.firstEntryHash}</span>
                </div>
              )}
              {result.lastEntryHash && (
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 shrink-0 mt-0.5">Latest:</span>
                  <span className="text-slate-300">{result.lastEntryHash}</span>
                </div>
              )}
              {result.brokenAt !== undefined && (
                <div className="flex items-start gap-2 text-rose-400">
                  <span className="shrink-0 mt-0.5">Broken:</span>
                  <span>Entry #{result.brokenAt + 1} hash mismatch</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="p-6 text-center">
          <div className="text-[11px] text-slate-500">Click "Verify Chain" to audit the full cryptographic integrity of every audit log entry.</div>
        </div>
      )}
    </div>
  );
}
