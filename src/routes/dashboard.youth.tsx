import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useSyncable, uid, hasPermission } from "../lib/store";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Badge, Pagination } from "../components/ui-kit";
import { Plus, Pencil, Trash2, Search, X, Users, GraduationCap, School, Calendar, Phone, TrendingUp } from "lucide-react";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { DeleteModal } from "../components/delete-modal";

export const Route = createFileRoute("/dashboard/youth")({ component: Page });

interface Y { id: string; createdAt?: string; fullName: string; birthdate: string; school: string; contact: string; program: string; attendance: number }

function getAge(birthdate: string) {
  if (!birthdate) return 0;
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function Page() {
  const { user } = useAuth();
  const canManage = user && hasPermission(user.role, "youthManage");
  const [items, setItems, updateItemsAndSync, refreshFromServer] = useSyncable<Y[]>("youth", [], { refreshInterval: 30000 });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Y | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Y | null>(null);
  const [q, setQ] = useState("");
  const [filterProgram, setFilterProgram] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  useEffect(() => { setPage(1); }, [q, filterProgram]);

  useEffect(() => { refreshFromServer(); }, []);

  const programs = useMemo(() => {
    const set = new Set<string>();
    items.forEach((y) => { if (y.program) set.add(y.program); });
    return [...set].sort();
  }, [items]);

  const stats = useMemo(() => {
    const byProgram: Record<string, number> = {};
    const bySchool: Record<string, number> = {};
    let totalAttendance = 0;
    for (const y of items) {
      if (y.program) byProgram[y.program] = (byProgram[y.program] || 0) + 1;
      if (y.school) bySchool[y.school] = (bySchool[y.school] || 0) + 1;
      totalAttendance += y.attendance || 0;
    }
    return {
      byProgram,
      bySchool,
      totalAttendance,
      count: items.length,
      topPrograms: Object.entries(byProgram).sort((a, b) => b[1] - a[1]).slice(0, 5),
      topSchools: Object.entries(bySchool).sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }, [items]);

  const filtered = useMemo(() => {
    let result = items;
    if (q.trim()) {
      const s = q.toLowerCase();
      result = result.filter((r) => [r.fullName, r.school, r.program].some((v) => v?.toLowerCase().includes(s)));
    }
    if (filterProgram) result = result.filter((r) => r.program === filterProgram);
    return result;
  }, [items, q, filterProgram]);

  if (!user || (user.role !== "super_admin" && user.role !== "sk_officer")) {
    return <Card><EmptyState title="Access Restricted" description="Only System Administrator and SK Officer accounts possess SK Youth Registry clearance." /></Card>;
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.fullName) return toast.error("Name required");
    const isNew = !editing.id;
    const p = isNew ? { ...editing, id: uid(), createdAt: new Date().toISOString(), attendance: editing.attendance || 0 } : editing;
    const next = isNew ? [p, ...items] : items.map((x) => x.id === p.id ? p : x);
    void updateItemsAndSync(next);
    setOpen(false); toast.success(isNew ? "Youth added" : "Updated");
  };

  const remove = () => {
    if (!deleteTarget) return;
    void updateItemsAndSync(items.filter((x) => x.id !== deleteTarget.id));
    setDeleteTarget(null); toast.success("Deleted");
  };

  return (
    <div>
      <PageHeader title="SK Youth Registry" subtitle="Manage youth profiles, attendance, and participation." action={
        canManage ? <Button onClick={() => { setEditing({ id: "", fullName: "", birthdate: "", school: "", contact: "", program: "", attendance: 0 }); setOpen(true); }}><Plus className="h-4 w-4" /> Add Youth</Button> : undefined
      } />

      <div className="grid gap-2 sm:gap-3 mb-4 sm:mb-6 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-xl border border-border/40 bg-card/60 p-3 sm:p-4">
          <div className="flex items-center gap-1.5 mb-1"><Users className="h-3.5 w-3.5 text-primary" /><span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Youth</span></div>
          <div className="text-xl sm:text-2xl font-black">{stats.count}</div>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/60 p-3 sm:p-4">
          <div className="flex items-center gap-1.5 mb-1"><TrendingUp className="h-3.5 w-3.5 text-success" /><span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Attendance</span></div>
          <div className="text-xl sm:text-2xl font-black">{stats.totalAttendance}</div>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/60 p-3 sm:p-4">
          <div className="flex items-center gap-1.5 mb-1"><GraduationCap className="h-3.5 w-3.5 text-info" /><span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Programs</span></div>
          <div className="text-xl sm:text-2xl font-black">{programs.length}</div>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/60 p-3 sm:p-4">
          <div className="flex items-center gap-1.5 mb-1"><School className="h-3.5 w-3.5 text-accent" /><span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Schools</span></div>
          <div className="text-xl sm:text-2xl font-black">{Object.keys(stats.bySchool).length}</div>
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search youth..." className="w-full rounded-2xl border border-border/60 bg-background/40 py-2.5 pl-10 pr-9 text-xs font-semibold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 min-h-[44px]" />
          {q && <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {programs.slice(0, 8).map((p) => (
            <button key={p} onClick={() => setFilterProgram(filterProgram === p ? "" : p)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition min-h-[36px] ${filterProgram === p ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground hover:border-primary/40"}`}>{p}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={Users} title="No youth registered" description={q || filterProgram ? "No youth match your filters." : "Register the first youth member to get started."} /></Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.slice((page - 1) * pageSize, page * pageSize).map((y) => {
            const age = getAge(y.birthdate);
            return (
              <Card key={y.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{y.fullName}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                      {y.birthdate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Age {age}</span>}
                      {y.attendance > 0 && <Badge tone="info" className="text-[8px]">{y.attendance} attended</Badge>}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                  {y.school && <span className="flex items-center gap-1"><School className="h-3 w-3" /> {y.school}</span>}
                  {y.program && <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {y.program}</span>}
                  {y.contact && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {y.contact}</span>}
                </div>
                {canManage && (
                  <div className="mt-3 flex gap-1">
                    <button onClick={() => { setEditing(y); setOpen(true); }} className="rounded p-1.5 hover:bg-muted transition min-h-[40px] min-w-[40px] lg:min-h-[36px] lg:min-w-[36px] flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteTarget(y)} className="rounded p-1.5 text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition min-h-[40px] min-w-[40px] lg:min-h-[36px] lg:min-w-[36px] flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <Pagination currentPage={page} totalPages={Math.max(1, Math.ceil(filtered.length / pageSize))} onPageChange={setPage} />

      <Modal open={open} onClose={() => setOpen(false)} title={editing?.id ? "Update Youth" : "Add Youth"}>
        {editing && (
          <form onSubmit={save} className="space-y-3">
            <Input label="Full Name *" value={editing.fullName} onChange={(e) => setEditing({ ...editing, fullName: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Birthdate" type="date" value={editing.birthdate} onChange={(e) => setEditing({ ...editing, birthdate: e.target.value })} />
              <Input label="Contact" value={editing.contact} onChange={(e) => setEditing({ ...editing, contact: e.target.value })} />
            </div>
            <Input label="School" value={editing.school} onChange={(e) => setEditing({ ...editing, school: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Program / Committee" value={editing.program} onChange={(e) => setEditing({ ...editing, program: e.target.value })} />
              <Input label="Attendance Count" type="number" min={0} value={editing.attendance} onChange={(e) => setEditing({ ...editing, attendance: Number(e.target.value) })} />
            </div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Save</Button></div>
          </form>
        )}
      </Modal>

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={remove} itemName={deleteTarget?.fullName} message="Delete this youth record permanently?" />
    </div>
  );
}
