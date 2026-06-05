// Generic CRUD page builder for simple list/edit modules
import { ReactNode, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, Inbox, Upload } from "lucide-react";
import { Button, Card, EmptyState, Input, Modal, PageHeader } from "./ui-kit";
import { useStored, uid, type PermissionConfig, type Role, hasPermission } from "../lib/store";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { getTableData, saveTableData } from "../lib/api/auth.functions";

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

  useEffect(() => {
    getTableData({ data: { table: config.storeKey } })
      .then((serverData) => {
        if (serverData && Array.isArray(serverData)) {
          setRows(serverData as T[]);
        }
      })
      .catch((err) => {
        console.warn(`Could not sync load ${config.storeKey} from database:`, err);
      });
  }, [config.storeKey]);

  const updateRowsAndSync = async (nextRows: T[]) => {
    setRows(nextRows);
    try {
      await saveTableData({ data: { table: config.storeKey, data: nextRows } });
    } catch (err) {
      console.error(`Could not save table data for ${config.storeKey} on server:`, err);
    }
  };

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
    const nextRows = rows.filter((x) => x.id !== r.id);
    void updateRowsAndSync(nextRows);
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
    const nextRows = isNew ? [payload, ...rows] : rows.map((r) => (r.id === payload.id ? payload : r));
    void updateRowsAndSync(nextRows);
    setOpen(false); setEditing(null);
    toast.success(isNew ? "Created" : "Updated");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const parseCSV = (t: string) => {
          const lines: string[][] = [];
          let row: string[] = [""];
          let inQuotes = false;
          for (let i = 0; i < t.length; i++) {
            const c = t[i];
            const next = t[i + 1];
            if (c === '"') {
              if (inQuotes && next === '"') {
                row[row.length - 1] += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (c === ',' && !inQuotes) {
              row.push("");
            } else if ((c === '\r' || c === '\n') && !inQuotes) {
              if (c === '\r' && next === '\n') i++;
              lines.push(row);
              row = [""];
            } else {
              row[row.length - 1] += c;
            }
          }
          if (row.length > 1 || row[0] !== "") lines.push(row);
          return lines;
        };

        const csvRows = parseCSV(text);
        if (csvRows.length < 2) {
          toast.error("File is empty or lacks data rows");
          return;
        }

        const rawHeaders = csvRows[0].map(h => h.trim());
        const dataRows = csvRows.slice(1);

        // Normalize string for fuzzy matching
        const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

        // Map columns to fields
        const fieldMap: Record<number, string> = {};
        rawHeaders.forEach((header, index) => {
          const nHeader = norm(header);
          
          let mappedField = "";
          if (nHeader === "fullname" || nHeader === "name" || nHeader === "residentname") mappedField = "fullName";
          else if (nHeader === "birthdate" || nHeader === "birthday" || nHeader === "dob") mappedField = "birthdate";
          else if (nHeader === "gender" || nHeader === "sex") mappedField = "gender";
          else if (nHeader === "civilstatus" || nHeader === "status" || nHeader === "civil") mappedField = "civilStatus";
          else if (nHeader === "contact" || nHeader === "contactnumber" || nHeader === "phone" || nHeader === "contactno") mappedField = "contact";
          else if (nHeader === "address" || nHeader === "location") mappedField = "address";
          else if (nHeader === "household" || nHeader === "householdid") mappedField = "household";
          else if (nHeader === "code" || nHeader === "householdcode" || nHeader === "housecode") mappedField = "code";
          else if (nHeader === "head" || nHeader === "householdhead" || nHeader === "headofhousehold") mappedField = "head";
          else if (nHeader === "members" || nHeader === "membercount" || nHeader === "occupants" || nHeader === "familycount") mappedField = "members";
          else if (nHeader === "purok" || nHeader === "sitio" || nHeader === "zone" || nHeader === "barangaypurok") mappedField = "purok";
          else if (nHeader === "occupation" || nHeader === "job" || nHeader === "work" || nHeader === "sector") mappedField = "occupation";
          else if (nHeader === "ispwd" || nHeader === "pwd" || nHeader === "pwdstatus") mappedField = "isPwd";
          
          if (!mappedField) {
            const foundField = config.fields.find(f => norm(f.label) === nHeader || norm(f.name) === nHeader);
            if (foundField) mappedField = foundField.name;
          }

          if (mappedField) {
            fieldMap[index] = mappedField;
          }
        });

        if (Object.keys(fieldMap).length === 0) {
          toast.error("Could not map any spreadsheet headers. Please ensure headers match template columns.");
          return;
        }

        const newRecords: T[] = [];
        dataRows.forEach((rowCells) => {
          if (rowCells.length === 0 || (rowCells.length === 1 && !rowCells[0].trim())) return;

          const record: any = { id: uid(), createdAt: new Date().toISOString() };
          
          rowCells.forEach((cell, idx) => {
            const fieldName = fieldMap[idx];
            if (fieldName) {
              const cleanedVal = cell.trim();
              const fieldDef = config.fields.find(f => f.name === fieldName);
              
              if (fieldDef?.type === "number") {
                record[fieldName] = Number(cleanedVal) || 0;
              } else if (fieldName === "isPwd") {
                const valNorm = cleanedVal.toLowerCase();
                record[fieldName] = (valNorm === "yes" || valNorm === "true" || valNorm === "y") ? "Yes" : "No";
              } else {
                record[fieldName] = cleanedVal;
              }
            }
          });

          // Fill default values
          config.fields.forEach(f => {
            if (record[f.name] === undefined) {
              record[f.name] = f.type === "number" ? 0 : f.type === "select" ? (f.options?.[0] || "") : "";
            }
          });

          newRecords.push(record);
        });

        if (newRecords.length === 0) {
          toast.error("No valid data rows found in file.");
          return;
        }

        void updateRowsAndSync([...newRecords, ...rows]);
        toast.success(`Successfully imported ${newRecords.length} records!`);
      } catch (err: any) {
        toast.error("Error reading spreadsheet: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div>
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        action={
          canCreate ? (
            <div className="flex gap-2.5">
              <label className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-card/60 backdrop-blur-sm px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition hover:border-primary hover:text-primary active:scale-[0.98] cursor-pointer">
                <Upload className="h-4 w-4 text-primary" /> Import Excel/CSV
                <input
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
              <Button onClick={openNew}><Plus className="h-4 w-4" /> Add New</Button>
            </div>
          ) : undefined
        }
      />
      <Card>
         <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border/20 pb-5">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-2xl border border-border/60 bg-background/40 py-2.5 pl-11 pr-4 text-xs font-semibold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background/80"
            />
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 border border-primary/20 px-4 py-2 rounded-full shadow-inner flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Showing {filtered.length} of {rows.length} records
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={Inbox} title={config.emptyTitle || "No records yet"} description={config.emptyDescription || "Start by adding the first record."} action={canCreate ? <Button onClick={openNew}><Plus className="h-4 w-4" /> Add New</Button> : undefined} />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
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

            {/* Mobile Card Grid View */}
            <div className="md:hidden space-y-4">
              {filtered.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border/50 bg-background/30 p-4.5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="font-extrabold text-sm text-foreground">
                      {config.columns[0]?.render ? config.columns[0].render(r) : String((r as any)[config.columns[0].key] ?? "—")}
                    </div>
                    <div className="inline-flex gap-1">
                      {canEdit && <button onClick={() => openEdit(r)} className="rounded-full p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition" title="Edit"><Pencil className="h-4 w-4" /></button>}
                      {canDelete && <button onClick={() => remove(r)} className="rounded-full p-1.5 text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition" title="Delete"><Trash2 className="h-4 w-4" /></button>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3.5 text-xs border-t border-border/20 pt-3">
                    {config.columns.slice(1).map((c) => (
                      <div key={String(c.key)} className="space-y-0.5">
                        <div className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">{c.label}</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {c.render ? c.render(r) : String((r as any)[c.key] ?? "—")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
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
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
