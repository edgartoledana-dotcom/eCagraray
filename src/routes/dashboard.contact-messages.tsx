import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Button, Card, EmptyState, Modal, PageHeader, Badge } from "../components/ui-kit";
import {
  MessageCircleQuestion, Trash2, Mail, User, CalendarDays, Search, X,
  Bug, Lightbulb, Star, Inbox, Loader2, CheckCircle2, Clock, Eye, Send,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import {
  getTableData, saveTableData,
  listInquiries, updateInquiryStatus, deleteInquiry, sendInquiryReply,
} from "../lib/api/auth.functions";
import { useStored, canRole, withToken } from "../lib/store";
import { DeleteModal } from "../components/delete-modal";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/dashboard/contact-messages")({ component: Page });

type InquiryType = "general" | "bug" | "feature" | "feedback";
type InquiryStatus = "new" | "in_review" | "resolved" | "closed";

const TYPE_META: Record<InquiryType, { label: string; icon: any; color: string; bg: string; ring: string }> = {
  general: {
    label: "General",
    icon: MessageCircleQuestion,
    color: "text-slate-700 dark:text-slate-300",
    bg: "bg-slate-100 dark:bg-slate-800/60",
    ring: "ring-slate-300 dark:ring-slate-700",
  },
  bug: {
    label: "Bug",
    icon: Bug,
    color: "text-red-700 dark:text-red-300",
    bg: "bg-red-100 dark:bg-red-900/40",
    ring: "ring-red-300 dark:ring-red-800",
  },
  feature: {
    label: "Feature",
    icon: Lightbulb,
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-100 dark:bg-amber-900/40",
    ring: "ring-amber-300 dark:ring-amber-800",
  },
  feedback: {
    label: "Feedback",
    icon: Star,
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    ring: "ring-emerald-300 dark:ring-emerald-800",
  },
};

const STATUS_META: Record<InquiryStatus, { label: string; color: string; bg: string; dot: string }> = {
  new: {
    label: "New",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-100 dark:bg-blue-900/40",
    dot: "bg-blue-500",
  },
  in_review: {
    label: "In review",
    color: "text-violet-700 dark:text-violet-300",
    bg: "bg-violet-100 dark:bg-violet-900/40",
    dot: "bg-violet-500",
  },
  resolved: {
    label: "Resolved",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    dot: "bg-emerald-500",
  },
  closed: {
    label: "Closed",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800/60",
    dot: "bg-slate-400",
  },
};

const TYPE_FILTERS: { key: "all" | InquiryType; label: string; icon: any }[] = [
  { key: "all", label: "All", icon: Inbox },
  { key: "bug", label: "Bugs", icon: Bug },
  { key: "feature", label: "Features", icon: Lightbulb },
  { key: "feedback", label: "Feedback", icon: Star },
  { key: "general", label: "General", icon: MessageCircleQuestion },
];

function TypeBadge({ type }: { type?: string }) {
  const meta = TYPE_META[(type as InquiryType) ?? "general"] ?? TYPE_META.general;
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset",
        meta.color,
        meta.bg,
        meta.ring,
      )}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const meta = STATUS_META[(status as InquiryStatus) ?? "new"] ?? STATUS_META.new;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        meta.color,
        meta.bg,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

function Page() {
  const { user } = useAuth();
  const canManage = canRole(user?.role, "contactMessages");
  const isAdmin = user?.role === "super_admin";
  const [inquiries, setInquiries] = useStored<any[]>("inquiries", []);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [viewing, setViewing] = useState<any | null>(null);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | InquiryType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | InquiryStatus>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyTarget, setReplyTarget] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);

  const secretaryTypeFilter: InquiryType = "general";

  if (!canManage) {
    return (
      <Card>
        <EmptyState
          icon={MessageCircleQuestion}
          title="Access Restricted"
          description="You do not have permission to view contact messages."
        />
      </Card>
    );
  }

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await listInquiries({ data: withToken({}) });
      if (Array.isArray(data)) setInquiries(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const counts = useMemo(() => {
    const base = isAdmin ? inquiries : inquiries.filter((i: any) => (i.type ?? "general") === secretaryTypeFilter);
    const c: Record<string, number> = { all: base.length, bug: 0, feature: 0, feedback: 0, general: 0 };
    for (const i of base) {
      const t = (i.type as string) ?? "general";
      c[t] = (c[t] ?? 0) + 1;
    }
    return c;
  }, [inquiries, isAdmin]);

  const filtered = useMemo(() => {
    let list = isAdmin ? inquiries : inquiries.filter((i: any) => (i.type ?? "general") === secretaryTypeFilter);
    if (isAdmin && typeFilter !== "all") list = list.filter((i: any) => (i.type ?? "general") === typeFilter);
    if (statusFilter !== "all") list = list.filter((i: any) => (i.status ?? "new") === statusFilter);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(
        (m: any) =>
          m.name?.toLowerCase().includes(s) ||
          m.email?.toLowerCase().includes(s) ||
          m.subject?.toLowerCase().includes(s) ||
          m.message?.toLowerCase().includes(s),
      );
    }
    return list;
  }, [inquiries, q, typeFilter, statusFilter, isAdmin]);

  const changeStatus = async (inq: any, next: InquiryStatus) => {
    setBusy(inq.id + ":" + next);
    try {
      await updateInquiryStatus({ data: withToken({ id: inq.id, status: next }) });
      setInquiries(
        inquiries.map((i: any) =>
          i.id === inq.id
            ? { ...i, status: next, updatedAt: new Date().toISOString() }
            : i,
        ),
      );
      toast.success(`Marked as ${STATUS_META[next].label}`);
      if (viewing?.id === inq.id) setViewing({ ...viewing, status: next });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update status");
    } finally {
      setBusy(null);
    }
  };

  const handleSendReply = async () => {
    if (!replyTarget || !replyMessage.trim()) return;
    setSending(true);
    try {
      const result = await sendInquiryReply({
        data: withToken({
          to: replyTarget.email,
          name: replyTarget.name,
          originalSubject: replyTarget.subject || "",
          originalMessage: replyTarget.message,
          replyMessage: replyMessage.trim(),
        }),
      });
      if (result.success) {
        toast.success(`Reply sent to ${replyTarget.email}`);
        setReplyTarget(null);
        setReplyMessage("");
      } else {
        toast.error(result.error ?? "Failed to send reply");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(deleteTarget.id);
    try {
      await deleteInquiry({ data: withToken({ id: deleteTarget.id }) });
      setInquiries(inquiries.filter((i: any) => i.id !== deleteTarget.id));
      toast.success("Message deleted");
      if (viewing?.id === deleteTarget.id) setViewing(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete");
    } finally {
      setBusy(null);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inbox · Submissions"
        subtitle={isAdmin ? "Bug reports, feature requests, feedback, and contact inquiries from the landing page." : "General inquiries and contact messages from the landing page."}
        actions={
          <Button variant="secondary" size="sm" onClick={refresh} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        }
      />

      {/* Type filter tabs — admin only */}
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2">
          {TYPE_FILTERS.map((f) => {
            const Icon = f.icon;
            const active = typeFilter === f.key;
            const count = counts[f.key] ?? 0;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setTypeFilter(f.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition min-h-[40px] lg:min-h-[36px]",
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background/40 hover:bg-primary/5 border-border/60 text-foreground/80",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {f.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] font-extrabold min-w-[18px] text-center",
                    active
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Secretary label */}
      {!isAdmin && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MessageCircleQuestion className="h-4 w-4" />
          <span>Showing <b className="text-foreground">General</b> inquiries only</span>
        </div>
      )}

      {/* Search + status filter */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, subject, or message..."
            className="w-full rounded-2xl border border-border/60 bg-background/40 py-2.5 pl-10 pr-9 text-xs font-semibold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="rounded-2xl border border-border/60 bg-background/40 py-2.5 px-3 text-xs font-semibold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 min-h-[40px]"
        >
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="in_review">In review</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={MessageCircleQuestion}
            title={q || typeFilter !== "all" || statusFilter !== "all" ? "No matches" : "Inbox zero"}
            description={
              q || typeFilter !== "all" || statusFilter !== "all"
                ? "Try clearing your filters or search."
                : "Bug reports, feature requests, feedback, and contact inquiries will appear here."
            }
          />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/50 text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="pb-3 pr-3 font-semibold">Type</th>
                    <th className="pb-3 pr-3 font-semibold">From</th>
                    <th className="pb-3 pr-3 font-semibold">Subject</th>
                    <th className="pb-3 pr-3 font-semibold">Status</th>
                    <th className="pb-3 pr-3 font-semibold">Date</th>
                    <th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filtered.map((msg: any) => (
                    <tr key={msg.id} className="hover:bg-primary/[0.02] transition">
                      <td className="py-3 pr-3"><TypeBadge type={msg.type} /></td>
                      <td className="py-3 pr-3">
                        <div className="font-semibold text-foreground">{msg.name}</div>
                        <div className="text-xs text-muted-foreground">{msg.email}</div>
                      </td>
                      <td className="py-3 pr-3 max-w-[300px]">
                        <button
                          onClick={() => setViewing(msg)}
                          className="text-left text-foreground/90 hover:text-primary transition line-clamp-1 font-medium"
                        >
                          {msg.subject || msg.message?.substring(0, 60) || "(no subject)"}
                        </button>
                      </td>
                      <td className="py-3 pr-3">
                        <select
                          value={msg.status ?? "new"}
                          onChange={(e) => changeStatus(msg, e.target.value as InquiryStatus)}
                          disabled={!canManage || busy === msg.id + ":new" || busy === msg.id + ":in_review" || busy === msg.id + ":resolved" || busy === msg.id + ":closed"}
                          className="rounded-lg border border-border/60 bg-background/60 px-2 py-1 text-[11px] font-semibold outline-none focus:border-primary disabled:opacity-50"
                        >
                          <option value="new">New</option>
                          <option value="in_review">In review</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(msg.createdAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => setViewing(msg)}
                            className="rounded-full p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canManage && (
                            <button
                              onClick={() => setDeleteTarget(msg)}
                              className="rounded-full p-2 text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {filtered.map((msg: any) => (
                <div key={msg.id} className="rounded-2xl border border-border/50 bg-background/30 p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <TypeBadge type={msg.type} />
                        <StatusBadge status={msg.status} />
                      </div>
                      <div className="font-extrabold text-sm text-foreground mt-2 truncate">
                        {msg.subject || "(no subject)"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {msg.name} · {msg.email}
                      </div>
                    </div>
                    {canManage && (
                      <button
                        onClick={() => setDeleteTarget(msg)}
                        className="rounded-full p-1.5 text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setViewing(msg)}
                    className="text-left text-xs text-muted-foreground hover:text-primary transition line-clamp-2 border-t border-border/20 pt-3 w-full"
                  >
                    {msg.message}
                  </button>
                  <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground border-t border-border/20 pt-2">
                    <span>{new Date(msg.createdAt).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</span>
                    <button
                      onClick={() => setViewing(msg)}
                      className="inline-flex items-center gap-1 text-primary font-bold uppercase tracking-wider"
                    >
                      <Eye className="h-3 w-3" /> Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* View modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="">
        {viewing && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                {(() => {
                  const Icon = TYPE_META[(viewing.type as InquiryType) ?? "general"]?.icon ?? MessageCircleQuestion;
                  return <Icon className="h-5 w-5" />;
                })()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <TypeBadge type={viewing.type} />
                  <StatusBadge status={viewing.status} />
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-foreground leading-tight">
                  {viewing.subject || "(no subject)"}
                </h3>
                <div className="text-xs text-muted-foreground mt-1">
                  From <b className="text-foreground">{viewing.name}</b> ·{" "}
                  <a href={`mailto:${viewing.email}`} className="text-primary hover:underline">
                    {viewing.email}
                  </a>
                  {" · "}
                  {new Date(viewing.createdAt).toLocaleString("en-PH", { dateStyle: "long", timeStyle: "short" })}
                </div>
              </div>
            </div>

            {/* Meta table (extra fields for bug/feature/feedback) */}
            {viewing.meta && Object.keys(viewing.meta).length > 0 && (
              <div className="rounded-2xl border border-border/40 bg-muted/20 overflow-hidden">
                <table className="w-full text-xs">
                  <tbody>
                    {Object.entries(viewing.meta).map(([k, v]) => (
                      <tr key={k} className="border-b border-border/20 last:border-b-0">
                        <td className="px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] w-1/3 align-top">
                          {k}
                        </td>
                        <td className="px-3 py-2 text-foreground whitespace-pre-wrap break-words">
                          {String(v)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="rounded-2xl border border-border/40 bg-muted/20 p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {viewing.message}
            </div>

            {/* Quick status change */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Update status:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(["new", "in_review", "resolved", "closed"] as InquiryStatus[]).map((s) => {
                  const meta = STATUS_META[s];
                  const active = (viewing.status ?? "new") === s;
                  return (
                    <button
                      key={s}
                      onClick={() => changeStatus(viewing, s)}
                      disabled={active || busy !== null || !canManage}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition min-h-[28px]",
                        active
                          ? `${meta.bg} ${meta.color} ring-2 ring-primary`
                          : "bg-background/40 text-muted-foreground hover:bg-muted/60 disabled:opacity-40",
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-border/30">
              {canManage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(viewing)}
                  leftIcon={<Trash2 className="h-4 w-4" />}
                >
                  Delete
                </Button>
              )}
              {canManage && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => { setReplyTarget(viewing); setReplyMessage(""); }}
                  leftIcon={<Mail className="h-4 w-4" />}
                >
                  Reply via email
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Reply modal */}
      <Modal open={!!replyTarget} onClose={() => { if (!sending) setReplyTarget(null); }} title="">
        {replyTarget && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg font-bold text-foreground leading-tight">
                  Reply to {replyTarget.name}
                </h3>
                <div className="text-xs text-muted-foreground mt-1">
                  <a href={`mailto:${replyTarget.email}`} className="text-primary hover:underline">
                    {replyTarget.email}
                  </a>
                  {" · "}Re: {replyTarget.subject || "(no subject)"}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/40 bg-muted/20 p-3 text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground max-h-28 overflow-y-auto">
              {replyTarget.message}
            </div>

            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply here..."
              rows={6}
              className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <div className="flex justify-end gap-2 pt-1 border-t border-border/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setReplyTarget(null); setReplyMessage(""); }}
                disabled={sending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSendReply}
                disabled={!replyMessage.trim() || sending}
                leftIcon={sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              >
                {sending ? "Sending..." : "Send Reply"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <DeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        itemName={deleteTarget?.subject || deleteTarget?.name}
        message="Delete this submission? The sender will not be notified. This action cannot be undone."
      />
    </div>
  );
}
