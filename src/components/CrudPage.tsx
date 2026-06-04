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
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm" />
          </div>
          <div className="text-xs text-muted-foreground">{filtered.length} of {rows.length}</div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={Inbox} title={config.emptyTitle || "No records yet"} description={config.emptyDescription || "Start by adding the first one."} action={canCreate ? <Button onClick={openNew}><Plus className="h-4 w-4" /> Add New</Button> : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>{config.columns.map((c) => <th key={String(c.key)} className="py-2 pr-3 font-medium">{c.label}</th>)}<th /></tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40">
                    {config.columns.map((c) => (
                      <td key={String(c.key)} className="py-3 pr-3">{c.render ? c.render(r) : String((r as any)[c.key] ?? "—")}</td>
                    ))}
                    <td className="py-3 text-right">
                      {canEdit && <button onClick={() => openEdit(r)} className="mr-1 rounded p-1.5 hover:bg-muted"><Pencil className="h-4 w-4" /></button>}
                      {canDelete && <button onClick={() => remove(r)} className="rounded p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing?.id ? `Edit ${config.title}` : `New ${config.title}`}>
        <form onSubmit={save} className="space-y-3">
          {config.fields.map((f) => {
            const val = (editing as any)?.[f.name] ?? "";
            const set = (v: any) => setEditing({ ...(editing as any), [f.name]: v });
            if (f.type === "textarea")
              return <label key={f.name} className="block"><span className="mb-1 block text-sm font-medium">{f.label}{f.required && " *"}</span><textarea value={val} onChange={(e) => set(e.target.value)} rows={3} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" /></label>;
            if (f.type === "select")
              return <label key={f.name} className="block"><span className="mb-1 block text-sm font-medium">{f.label}{f.required && " *"}</span><select value={val} onChange={(e) => set(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm"><option value="">Select…</option>{f.options!.map((o) => <option key={o}>{o}</option>)}</select></label>;
            return <Input key={f.name} label={`${f.label}${f.required ? " *" : ""}`} type={f.type || "text"} value={val} onChange={(e) => set(e.target.value)} />;
          })}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
