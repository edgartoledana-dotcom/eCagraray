import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStored, uid, canRole } from "../lib/store";
import { Button, Card, EmptyState, Input, Modal, PageHeader } from "../components/ui-kit";
import { ListChecks, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { getTableData, saveTableData } from "../lib/api/auth.functions";

export const Route = createFileRoute("/dashboard/surveys")({ component: Page });

interface Poll { id: string; question: string; options: string[]; votes: Record<string, number>; voters: string[]; createdAt: string }

function Page() {
  const { user } = useAuth();
  const canManage = canRole(user?.role, "surveysManage");
  const [polls, setPolls] = useStored<Poll[]>("polls", []);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState(["", ""]);

  useEffect(() => {
    getTableData({ data: { table: "polls" } })
      .then((serverData) => {
        if (serverData && Array.isArray(serverData)) {
          setPolls(serverData as Poll[]);
        }
      })
      .catch((err) => console.warn("Could not sync load polls:", err));
  }, []);

  const updatePollsAndSync = async (nextPolls: Poll[]) => {
    setPolls(nextPolls);
    try {
      await saveTableData({ data: { table: "polls", data: nextPolls } });
    } catch (err) {
      console.error("Could not sync polls on server:", err);
    }
  };

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = opts.map((o) => o.trim()).filter(Boolean);
    if (!q.trim() || cleaned.length < 2) return toast.error("Question and 2+ options required");
    const p: Poll = { id: uid(), question: q, options: cleaned, votes: Object.fromEntries(cleaned.map((o) => [o, 0])), voters: [], createdAt: new Date().toISOString() };
    const nextPolls = [p, ...polls];
    void updatePollsAndSync(nextPolls);
    setOpen(false); setQ(""); setOpts(["",""]); toast.success("Poll created");
  };

  const vote = (p: Poll, opt: string) => {
    if (!user) return;
    if (p.voters.includes(user.id)) return toast.error("You already voted");
    const next = { ...p, votes: { ...p.votes, [opt]: (p.votes[opt] || 0) + 1 }, voters: [...p.voters, user.id] };
    const nextPolls = polls.map((x) => x.id === p.id ? next : x);
    void updatePollsAndSync(nextPolls);
  };

  return (
    <div>
      <PageHeader title="Surveys & Polls" subtitle="Engage the community with quick polls." action={
        canManage ? <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Create Poll</Button> : undefined
      } />
      {polls.length === 0 ? (
        <Card><EmptyState icon={ListChecks} title="No polls yet" /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {polls.map((p) => {
            const total = Object.values(p.votes).reduce((a, b) => a + b, 0);
            const voted = user && p.voters.includes(user.id);
            return (
              <Card key={p.id}>
                <div className="flex items-start justify-between">
                  <div className="font-semibold">{p.question}</div>
                  {canManage && <button onClick={() => { if (confirm("Delete?")) updatePollsAndSync(polls.filter((x) => x.id !== p.id)); }} className="text-destructive"><Trash2 className="h-4 w-4" /></button>}
                </div>
                <div className="mt-3 space-y-2">
                  {p.options.map((o) => {
                    const pct = total ? Math.round(((p.votes[o] || 0) / total) * 100) : 0;
                    return (
                      <button key={o} disabled={!!voted} onClick={() => vote(p, o)} className="block w-full text-left">
                        <div className="flex justify-between text-sm"><span>{o}</span><span className="text-muted-foreground">{p.votes[o] || 0} · {pct}%</span></div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 text-xs text-muted-foreground">{total} vote{total !== 1 ? "s" : ""}{voted ? " · you voted" : ""}</div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create Poll">
        <form onSubmit={create} className="space-y-3">
          <Input label="Question *" value={q} onChange={(e) => setQ(e.target.value)} />
          {opts.map((o, i) => (
            <Input key={i} label={`Option ${i+1}`} value={o} onChange={(e) => { const c = [...opts]; c[i] = e.target.value; setOpts(c); }} />
          ))}
          <Button type="button" variant="outline" onClick={() => setOpts([...opts, ""])}>+ Add option</Button>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Create</Button></div>
        </form>
      </Modal>
    </div>
  );
}
