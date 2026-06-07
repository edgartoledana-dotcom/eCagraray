import { AlertTriangle, X } from "lucide-react";
import { useAnimatedMount } from "./ui-kit";

interface DeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
  message?: string;
  loading?: boolean;
}

export function DeleteModal({ open, onClose, onConfirm, itemName, message, loading }: DeleteModalProps) {
  const { mounted, dataState } = useAnimatedMount(open, 200);
  if (!mounted) return null;
  return (
    <div data-state={dataState} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        data-state={dataState}
        className="relative w-full max-w-md rounded-2xl border border-border/50 bg-card/90 p-6 shadow-2xl backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200 dark:bg-card/95"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex flex-col items-center text-center py-2">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-destructive/10 text-destructive mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold tracking-tight">Delete Record</h3>
          <p className="mt-3 text-sm text-muted-foreground max-w-xs leading-relaxed">
            {message || "Are you sure you want to delete this record? This action cannot be undone."}
          </p>
          {itemName && (
            <p className="mt-3 text-base font-bold tracking-tight text-foreground/80">"{itemName}"</p>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border/75 bg-card/60 px-5 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 hover:bg-muted hover:border-primary/30 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-destructive text-destructive-foreground px-5 py-2.5 text-sm font-semibold tracking-wide shadow-lg shadow-destructive/10 transition-all duration-200 hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
