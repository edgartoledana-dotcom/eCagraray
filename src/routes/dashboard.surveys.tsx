import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSyncable, uid, canRole } from "../lib/store";
import { Button, Card, EmptyState, Input, Modal, PageHeader } from "../components/ui-kit";
import { ListChecks, Plus, Trash2, Search, X } from "lucide-react";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { DeleteModal } from "../components/delete-modal";

export const Route = createFileRoute("/dashboard/surveys")({ component: Page });

interface Poll { id: string; question: string; options: string[]; votes: Record<string, number>; voters: string[]; createdAt: string }

function Page() {
  const { user } = useAuth();
  const canManage = canRole(user?.role, "surveysManage");
  const [polls, setPolls, updatePollsAndSync, refreshFromServer] = useSyncable<Poll[]>("polls", [], { refreshInterval: 30000 });
  const [open, setOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [opts, setOpts] = useState(["", ""]);
  const [deleteTarget, setDeleteTarget] = useState<Poll | null>(null);

  useEffect(() => { refreshFromServer(); }, []);

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = opts.map((o) => o.trim()).filter(Boolean);
    if (!newQuestion.trim() || cleaned.length < 2) return toast.error("Question and 2+ options required");
    if (cleaned.length > 10) return toast.error("Maximum 10 options allowed");
    const p: Poll = { id: uid(), question: newQuestion, options: cleaned, votes: Object.fromEntries(cleaned.map((o) => [o, 0])), voters: [], createdAt: new Date().toISOString() };
    void updatePollsAndSync([p, ...polls]);
    setOpen(false); setNewQuestion(""); setOpts(["", ""]); toast.success("Poll created");
  };

  const vote = (p: Poll, opt: string) => {
    if (!user) return;
    if (p.voters.includes(user.id)) return toast.error("You already voted");
    const next = { ...p, votes: { ...p.votes, [opt]: (p.votes[opt] || 0) + 1 }, voters: [...p.voters, user.id] };
    void updatePollsAndSync(polls.map((x) => x.id === p.id ? next : x));
  };

  const remove = () => {
    if (!deleteTarget) return;
    void updatePollsAndSync(polls.filter((x) => x.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success("Poll deleted");
  };

  const filtered = searchQ.trim()
    ? polls.filter((p) => p.question.toLowerCase().includes(searchQ.toLowerCase()))
    : polls;

  if (!user || (user.role !== "super_admin" && user.role !== "sk_officer" && user.role !== "captain" && user.role !== "resident")) {
    return <Card><EmptyState icon={ListChecks} title="Access Restricted" description="You do not have permission to access Surveys & Polls." /></Card>;
  }

  return (
    <div>
      <PageHeader title="Surveys & Polls" subtitle="Engage the community with quick polls." action={
        canManage ? <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Create Poll</Button> : undefined
      } />
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search polls..." className="w-full rounded-2xl border border-border/60 bg-background/40 py-2.5 pl-10 pr-9 text-xs font-semibold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" />
            {searchQ && <button onClick={() => setSearchQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-full">{filtered.length} poll{filtered.length !== 1 ? "s" : ""}</div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={ListChecks} title="No polls yet" description={searchQ ? "No polls match your search." : "Create your first poll to engage the community."} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((p) => {
              const total = Object.values(p.votes).reduce((a, b) => a + b, 0);
              const voted = user && p.voters.includes(user.id);
              return (
                <Card key={p.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold">{p.question}</div>
                    {canManage && <button onClick={() => setDeleteTarget(p)} className="text-destructive/60 hover:text-destructive transition"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                  <div className="mt-3 space-y-2">
                    {p.options.map((o) => {
                      const pct = total ? Math.round(((p.votes[o] || 0) / total) * 100) : 0;
                      return (
                        <button key={o} disabled={!!voted} onClick={() => vote(p, o)} className={`block w-full text-left rounded-lg border p-2 transition ${voted ? "cursor-default" : "hover:border-primary/40 hover:bg-primary/5 cursor-pointer"}`}>
                          <div className="flex justify-between text-sm"><span>{o}</span><span className="text-muted-foreground font-semibold">{p.votes[o] || 0} · {pct}%</span></div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} /></div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{total} vote{total !== 1 ? "s" : ""}{voted ? " · you voted" : ""}</span>
                    <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Create Poll">
        <form onSubmit={create} className="space-y-3">
          <Input label="Question *" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} />
          {opts.map((o, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1"><Input label={`Option ${i + 1}${i < 2 ? " *" : ""}`} value={o} onChange={(e) => { const c = [...opts]; c[i] = e.target.value; setOpts(c); }} /></div>
              {opts.length > 2 && <button type="button" onClick={() => setOpts(opts.filter((_, idx) => idx !== i))} className="mb-3 rounded-lg p-2 text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition"><Trash2 className="h-4 w-4" /></button>}
            </div>
          ))}
          {opts.length < 10 && <Button type="button" variant="outline" onClick={() => setOpts([...opts, ""])}>+ Add option</Button>}
          <div className="text-[10px] text-muted-foreground">{opts.filter(Boolean).length}/10 options</div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Create</Button></div>
        </form>
      </Modal>

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={remove} itemName={deleteTarget?.question} message="Delete this poll? All votes will be lost." />
    </div>
  );
}
