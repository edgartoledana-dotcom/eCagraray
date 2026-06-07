import { useState, useEffect, useCallback } from "react";
import { Shield, AlertTriangle, Fingerprint, Lock, Loader2, Check } from "lucide-react";
import { useAnimatedMount } from "./ui-kit";

interface BiometricsGateProps {
  open: boolean;
  onVerify: () => void;
  onCancel: () => void;
  title?: string;
}

export default function BiometricsGate({ open, onVerify, onCancel, title }: BiometricsGateProps) {
  const { mounted, dataState } = useAnimatedMount(open, 200);
  const [step, setStep] = useState<"notice" | "verify" | "success" | "failed">("notice");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) setStep("notice");
  }, [open]);

  const handleDigit = useCallback((idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...code];
    next[idx] = val.slice(-1);
    setCode(next);
    setError("");

    if (val && idx < 5) {
      const nextInput = document.getElementById(`bg-code-${idx + 1}`);
      nextInput?.focus();
    }
  }, [code]);

  const handleKeyDown = useCallback((idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      const prevInput = document.getElementById(`bg-code-${idx - 1}`);
      prevInput?.focus();
    }
  }, [code]);

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));

    if (fullCode === "000000") {
      setStep("success");
      setTimeout(() => { onVerify(); setStep("notice"); }, 800);
    } else {
      setStep("failed");
      setError("Invalid verification code");
      setTimeout(() => {
        setCode(["", "", "", "", "", ""]);
        setStep("verify");
        document.getElementById("bg-code-0")?.focus();
      }, 1500);
    }
    setLoading(false);
  };

  const resendCode = () => {
    setCode(["", "", "", "", "", ""]);
    setError("");
    setStep("verify");
    document.getElementById("bg-code-0")?.focus();
  };

  if (!mounted) return null;

  return (
    <div data-state={dataState} className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
      <div data-state={dataState} className="w-full max-w-sm rounded-2xl border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-black/50 overflow-hidden backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">
        {/* Header */}
        <div className={`flex items-center gap-3 border-b border-slate-700/50 px-5 py-4 ${step === "success" ? "bg-emerald-500/10" : step === "failed" ? "bg-rose-500/10" : ""}`}>
          <div className={`rounded-xl p-2 ${step === "success" ? "bg-emerald-500/20" : step === "failed" ? "bg-rose-500/20" : "bg-amber-500/20"}`}>
            {step === "success" ? (
              <Check className="h-5 w-5 text-emerald-400" />
            ) : step === "failed" ? (
              <Lock className="h-5 w-5 text-rose-400" />
            ) : (
              <Shield className="h-5 w-5 text-amber-400" />
            )}
          </div>
          <div>
            <div className="text-sm font-bold text-slate-200">{title || "Security Verification"}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {step === "success" ? "Identity verified" : step === "failed" ? "Verification failed" : "Step-up authentication required"}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          {step === "notice" && (
            <>
              <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Unusual activity pattern detected. Verify your identity to continue.</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <Fingerprint className="h-3.5 w-3.5" />
                <span>A 6-digit code was sent to your registered email and mobile.</span>
              </div>
              <button
                onClick={() => { setStep("verify"); setTimeout(() => document.getElementById("bg-code-0")?.focus(), 100); }}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition min-h-[44px]"
              >
                Continue Verification
              </button>
              <button onClick={onCancel} className="w-full text-[11px] text-slate-500 hover:text-slate-300 transition">
                Lock session instead
              </button>
            </>
          )}

          {step === "verify" && (
            <>
              <div className="text-center">
                <div className="text-[11px] text-slate-400 mb-3">Enter the 6-digit verification code</div>
                <div className="flex justify-center gap-2">
                  {code.map((d, i) => (
                    <input
                      key={i}
                      id={`bg-code-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleDigit(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className="h-12 w-10 rounded-xl border border-slate-600/60 bg-slate-800/60 text-center text-lg font-bold text-slate-200 outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  ))}
                </div>
                {error && <div className="text-[10px] text-rose-400 mt-2">{error}</div>}
              </div>
              <button
                onClick={handleVerify}
                disabled={loading || code.some((d) => !d)}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-40 transition min-h-[44px] flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                Verify Identity
              </button>
              <div className="flex justify-between text-[10px]">
                <button onClick={resendCode} className="text-indigo-400 hover:text-indigo-300 transition">Resend code</button>
                <button onClick={onCancel} className="text-slate-500 hover:text-slate-300 transition">Cancel</button>
              </div>
            </>
          )}

          {step === "success" && (
            <div className="text-center py-4">
              <Check className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-emerald-300">Verified</div>
              <div className="text-[10px] text-slate-400 mt-1">Session security restored</div>
            </div>
          )}

          {step === "failed" && (
            <div className="text-center py-4">
              <Lock className="h-10 w-10 text-rose-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-rose-300">Verification Failed</div>
              <div className="text-[10px] text-slate-400 mt-1">Please try again or contact your administrator</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
