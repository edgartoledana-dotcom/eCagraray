// Generic CRUD page builder for simple list/edit modules
import { ReactNode, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, Inbox } from "lucide-react";
import { Button, Card, EmptyState, Input, Modal, PageHeader } from "./ui-kit";
import { useStored, uid, type PermissionConfig, type Role, hasPermission } from "../lib/store";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";

export interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "textarea" | "select" | "date" | "number" | "email";
  options?: string[];
  required?: boolean;
}

export interface CrudConfig<T> {
  storeKey: string;
  title: string;
  subtitle?: string;
  fields: FieldDef[];
  columns: { key: keyof T | string; label: string; render?: (row: T) => ReactNode }[];
  searchKeys: (keyof T)[];
  emptyTitle?: string;
  emptyDescription?: string;
  beforeSave?: (item: any, isNew: boolean) => any;
  permissions?: {
    create?: PermissionConfig;
    edit?: PermissionConfig;
    delete?: PermissionConfig;
  };
}

export function CrudPage<T extends { id: string; createdAt?: string }>({ config }: { config: CrudConfig<T> }) {
  const { user } = useAuth();
  const [rows, setRows] = useStored<T[]>(config.storeKey, []);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<T | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.toLowerCase();
    return rows.filter((r) => config.searchKeys.some((k) => String((r as any)[k] || "").toLowerCase().includes(s)));
  }, [rows, q, config.searchKeys]);

  const canCreate = !config.permissions?.create || (user && hasPermission(user.role, config.permissions.create));
  const canEdit = !config.permissions?.edit || (user && hasPermission(user.role, config.permissions.edit));
  const canDelete = !config.permissions?.delete || (user && hasPermission(user.role, config.permissions.delete));

  const openNew = () => { if (!canCreate) return; setEditing({ id: "" } as T); setOpen(true); };
  const openEdit = (r: T) => { if (!canEdit) return; setEditing({ ...r }); setOpen(true); };
  const remove = (r: T) => {
    if (!canDelete) return;
    if (!confirm("Delete this record?")) return;
    setRows(rows.filter((x) => x.id !== r.id));
    toast.success("Deleted");
  };
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const missing = config.fields.find((f) => f.required && !String((editing as any)[f.name] || "").trim());
    if (missing) return toast.error(`${missing.label} is required`);
    const isNew = !editing.id;
    let payload: any = { ...editing };
    if (isNew) { payload.id = uid(); payload.createdAt = new Date().toISOString(); }
    if (config.beforeSave) payload = config.beforeSave(payload, isNew);
    setRows(isNew ? [payload, ...rows] : rows.map((r) => (r.id === payload.id ? payload : r)));
    setOpen(false); setEditing(null);
    toast.success(isNew ? "Created" : "Updated");
  };

  return (
    <div>
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        action={canCreate ? <Button onClick={openNew}><Plus className="h-4 w-4" /> Add New</Button> : undefined}
      />
      <Card>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search data nodes..."
              className="w-full rounded-2xl border border-border/60 bg-background/50 py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-3.5 py-1.5 rounded-full border border-border/40">
            {filtered.length} / {rows.length} Records
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={Inbox} title={config.emptyTitle || "No records yet"} description={config.emptyDescription || "Start by adding the first database node."} action={canCreate ? <Button onClick={openNew}><Plus className="h-4 w-4" /> Add New Node</Button> : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/50 text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr>{config.columns.map((c) => <th key={String(c.key)} className="pb-3 pr-3 font-semibold">{c.label}</th>)}<th /></tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-primary/[0.02] dark:hover:bg-primary/[0.04] transition-colors duration-150">
                    {config.columns.map((c) => (
                      <td key={String(c.key)} className="py-4 pr-3 text-slate-800 dark:text-slate-250 font-medium">{c.render ? c.render(r) : String((r as any)[c.key] ?? "—")}</td>
                    ))}
                    <td className="py-4 text-right">
                      <div className="inline-flex gap-1.5">
                        {canEdit && <button onClick={() => openEdit(r)} className="rounded-full p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition"><Pencil className="h-4.5 w-4.5" /></button>}
                        {canDelete && <button onClick={() => remove(r)} className="rounded-full p-2 text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition"><Trash2 className="h-4.5 w-4.5" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing?.id ? `Update ${config.title}` : `New ${config.title}`}>
        <form onSubmit={save} className="space-y-4">
          {config.fields.map((f) => {
            const val = (editing as any)?.[f.name] ?? "";
            const set = (v: any) => setEditing({ ...(editing as any), [f.name]: v });
            if (f.type === "textarea")
              return (
                <label key={f.name} className="block space-y-1.5">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.label}{f.required && " *"}</span>
                  <textarea
                    value={val}
                    onChange={(e) => set(e.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-border/60 bg-background/50 px-4.5 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background/80"
                  />
                </label>
              );
            if (f.type === "select")
              return (
                <label key={f.name} className="block space-y-1.5">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.label}{f.required && " *"}</span>
                  <select
                    value={val}
                    onChange={(e) => set(e.target.value)}
                    className="w-full rounded-2xl border border-border/60 bg-background/50 px-4.5 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background/80"
                  >
                    <option value="">Select Option…</option>
                    {f.options!.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
              );
            return <Input key={f.name} label={`${f.label}${f.required ? " *" : ""}`} type={f.type || "text"} value={val} onChange={(e) => set(e.target.value)} />;
          })}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Commit Record</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
