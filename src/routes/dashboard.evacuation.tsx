import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useSyncable, useStored, uid, canRole } from "../lib/store";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Badge } from "../components/ui-kit";
import { Building, Plus, Pencil, Trash2, Users, DoorOpen, AlertTriangle, Minus, MapPin, TrendingUp, TrendingDown, Bell, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { DeleteModal } from "../components/delete-modal";

export const Route = createFileRoute("/dashboard/evacuation")({ component: Page });

interface OccupancyLog { ts: string; occupants: number }
interface C { id: string; name: string; location: string; capacity: number; occupants: number; manager: string; createdAt: string; history?: OccupancyLog[] }

function logOccupancy(center: C, prevOcc: number, newOcc: number): OccupancyLog[] {
  const now = new Date().toISOString();
  if (prevOcc === newOcc) return center.history || [];
  const entry: OccupancyLog = { ts: now, occupants: newOcc };
  return [...(center.history || []).slice(-48), entry];
}

function Page() {
  const { user } = useAuth();
  const [items, setItems, updateItemsAndSync, refreshFromServer] = useSyncable<C[]>("evac_centers", [], { refreshInterval: 30000 });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<C | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<C | null>(null);
  const [alerts] = useStored<any[]>("alerts", []);
  const [showOccupied, setShowOccupied] = useState(false);

  useEffect(() => { refreshFromServer(); }, []);

  const stats = useMemo(() => {
    const totalCapacity = items.reduce((s, c) => s + (c.capacity || 0), 0);
    const totalOccupants = items.reduce((s, c) => s + (c.occupants || 0), 0);
    const remaining = totalCapacity - totalOccupants;
    const atCapacity = items.filter((c) => c.capacity > 0 && (c.occupants / c.capacity) >= 0.9).length;
    const fullCount = items.filter((c) => c.capacity > 0 && (c.occupants / c.capacity) >= 1).length;
    return { totalCapacity, totalOccupants, remaining, atCapacity, fullCount, count: items.length };
  }, [items]);

  const activeCriticalAlerts = useMemo(() =>
    alerts.filter((a: any) => a.status === "active" && (a.level === "Critical" || a.level === "High")).length,
  [alerts]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.name) return toast.error("Name required");
    const isNew = !editing.id;
    const p = isNew ? { ...editing, id: uid(), createdAt: new Date().toISOString(), history: [] } : editing;
    const nextItems = isNew ? [p, ...items] : items.map((x) => x.id === p.id ? p : x);
    void updateItemsAndSync(nextItems);
    setOpen(false); toast.success("Saved");
  };

  const remove = () => {
    if (!deleteTarget) return;
    void updateItemsAndSync(items.filter((x) => x.id !== deleteTarget.id));
    setDeleteTarget(null); toast.success("Deleted");
  };

  const quickAdjust = (c: C, delta: number) => {
    const prev = c.occupants;
    const newOccupants = Math.max(0, Math.min(c.capacity, prev + delta));
    const updated = { ...c, occupants: newOccupants, history: logOccupancy(c, prev, newOccupants) };
    void updateItemsAndSync(items.map((x) => x.id === c.id ? updated : x));

    if (newOccupants >= c.capacity * 0.9 && prev < c.capacity * 0.9) {
      toast.warning(`${c.name} is near capacity (${Math.round((newOccupants / c.capacity) * 100)}%)`);
    }
  };

  const getOccupancyTrend = (c: C): "up" | "down" | "stable" => {
    const h = c.history || [];
    if (h.length < 2) return "stable";
    const recent = h.slice(-3);
    const first = recent[0]?.occupants ?? c.occupants;
    const last = recent[recent.length - 1]?.occupants ?? c.occupants;
    if (last > first) return "up";
    if (last < first) return "down";
    return "stable";
  };

  if (user?.role !== "super_admin" && user?.role !== "disaster" && user?.role !== "captain") {
    return <Card><EmptyState title="Access Restricted" description="Only System Administrator, Disaster Response, and Barangay Captain accounts possess Evacuation Centers clearance." /></Card>;
  }

  const canManage = canRole(user?.role, "evacuationManage");

  return (
    <div>
      <PageHeader title="Evacuation Centers" subtitle="Capacity monitoring and occupancy tracking linked to active alerts." action={
        canManage ? (
          <Button onClick={() => { setEditing({ id: "", name: "", location: "", capacity: 100, occupants: 0, manager: "", createdAt: "" }); setOpen(true); }}>
            <Plus className="h-4 w-4" /> Add Center
          </Button>
        ) : undefined
      } />

      {/* Alert Banner */}
      {activeCriticalAlerts > 0 && (
        <Link to="/dashboard/alerts" className="block mb-4 rounded-xl bg-destructive/10 border border-destructive/20 p-3 hover:bg-destructive/15 transition">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
            <span className="text-xs font-bold text-destructive">{activeCriticalAlerts} active critical alert(s) — prepare evacuation centers</span>
          </div>
        </Link>
      )}

      {/* Summary Stats */}
      {items.length > 0 && (
        <div className="grid gap-2 sm:gap-3 mb-4 sm:mb-6 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border/40 bg-card/60 p-3 sm:p-4">
            <div className="flex items-center gap-2 text-info mb-1">
              <Building className="h-4 w-4" />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Centers</span>
            </div>
            <div className="text-xl sm:text-2xl font-black">{stats.count}</div>
          </div>
          <div className="rounded-xl border border-border/40 bg-card/60 p-3 sm:p-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Users className="h-4 w-4" />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Total Capacity</span>
            </div>
            <div className="text-xl sm:text-2xl font-black">{stats.totalCapacity}</div>
          </div>
          <div className="rounded-xl border border-border/40 bg-card/60 p-3 sm:p-4">
            <div className="flex items-center gap-2 text-accent mb-1">
              <DoorOpen className="h-4 w-4" />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Occupied</span>
            </div>
            <div className="text-xl sm:text-2xl font-black">{stats.totalOccupants}</div>
          </div>
          <div className="rounded-xl border border-border/40 bg-card/60 p-3 sm:p-4">
            <div className="flex items-center gap-2 text-success mb-1">
              <Users className="h-4 w-4" />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Remaining</span>
            </div>
            <div className="text-xl sm:text-2xl font-black">{stats.remaining}</div>
            <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">
              {stats.atCapacity > 0 && <span className="text-destructive font-bold">{stats.atCapacity} center(s) near capacity</span>}
            </div>
          </div>
        </div>
      )}

      {/* Filter toggle */}
      {items.filter((c) => c.occupants > 0).length > 0 && (
        <button
          onClick={() => setShowOccupied(!showOccupied)}
          className="flex items-center gap-1.5 mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition"
        >
          <Users className="h-3.5 w-3.5" />
          {showOccupied ? "Show all centers" : "Show only occupied centers"}
          {showOccupied ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      )}

      {items.length === 0 ? (
        <Card><EmptyState icon={Building} title="No evacuation centers" description="Add evacuation centers to monitor capacity during emergencies." /></Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {(showOccupied ? items.filter((c) => c.occupants > 0) : items).map((c) => {
            const pct = Math.min(100, Math.round((c.occupants / Math.max(1, c.capacity)) * 100));
            const isFull = pct >= 100;
            const isWarning = pct >= 70 && pct < 100;
            const trend = getOccupancyTrend(c);

            return (
              <Card key={c.id} className={`relative ${isFull ? "ring-2 ring-destructive/30" : isWarning ? "ring-1 ring-warning/30" : ""}`}>
                {isFull && (
                  <span className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-widest text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">Full</span>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{c.name}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground truncate flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" /> {c.location || "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isFull && <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />}
                    <Badge tone={isFull ? "danger" : isWarning ? "warning" : "success"} className="text-[9px]">{pct}%</Badge>
                    {trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-destructive/70" />}
                    {trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-success/70" />}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] sm:text-xs">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c.occupants} occupants</span>
                    <span>capacity {c.capacity}</span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isFull ? "bg-destructive" : isWarning ? "bg-warning" : "bg-success"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                {/* Quick Occupant Adjust */}
                {canManage && (
                  <div className="mt-3 flex items-center justify-center gap-3">
                    <button
                      onClick={() => quickAdjust(c, -1)}
                      disabled={c.occupants <= 0}
                      className="rounded-lg border border-border/50 p-2 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition disabled:opacity-30 disabled:cursor-not-allowed min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-bold min-w-[40px] text-center tabular-nums">{c.occupants}</span>
                    <button
                      onClick={() => quickAdjust(c, 1)}
                      disabled={c.occupants >= c.capacity}
                      className="rounded-lg border border-border/50 p-2 text-muted-foreground hover:text-success hover:border-success/40 transition disabled:opacity-30 disabled:cursor-not-allowed min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {/* Occupancy History */}
                {(c.history?.length || 0) > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-[8px] sm:text-[9px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Last change: {new Date(c.history![c.history!.length - 1].ts).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                )}
                <div className="mt-2 text-[10px] text-muted-foreground">
                  Manager: <span className="font-semibold">{c.manager || "—"}</span>
                </div>
                {canManage && (
                  <div className="mt-2 flex gap-1">
                    <button onClick={() => { setEditing(c); setOpen(true); }} className="rounded p-1.5 hover:bg-muted transition" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteTarget(c)} className="rounded p-1.5 text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Evacuation Center">
        {editing && (
          <form onSubmit={save} className="space-y-3">
            <Input label="Name *" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Input label="Location" value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Capacity" type="number" min={1} value={editing.capacity} onChange={(e) => setEditing({ ...editing, capacity: Number(e.target.value) })} />
              <Input label="Current Occupants" type="number" min={0} max={editing.capacity} value={editing.occupants} onChange={(e) => setEditing({ ...editing, occupants: Math.min(Number(e.target.value), editing.capacity) })} />
            </div>
            <Input label="Manager" value={editing.manager} onChange={(e) => setEditing({ ...editing, manager: e.target.value })} />
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Save</Button></div>
          </form>
        )}
      </Modal>

      <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={remove} itemName={deleteTarget?.name} message="Delete this evacuation center?" />
    </div>
  );
}
