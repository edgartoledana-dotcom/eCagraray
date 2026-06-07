import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { type User, type Role, ROLE_LABELS, getItem, setItem } from "../lib/store";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Select, Badge, Pagination, exportToCSV } from "../components/ui-kit";
import { UserCog, Plus, Pencil, Trash2, Check, UserCheck, ShieldAlert, ShieldCheck, Download, Wrench, RefreshCw, Eye, XCircle, Search } from "lucide-react";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { createUser, deleteUser, getUsers, updateUser } from "../lib/api/auth.functions";
import { withToken } from "../lib/store";
import { DeleteModal } from "../components/delete-modal";

export const Route = createFileRoute("/dashboard/users")({ component: Page });

const ROLES: Role[] = ["super_admin", "captain", "secretary", "sk_officer", "disaster", "resident"];

type EditableUser = User & {
  password?: string;
};

function Page() {
  const { user } = useAuth();
  const tyrannicalAdmin = user?.role === "super_admin";
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EditableUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "pending" | "approved">("all");
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [viewing, setViewing] = useState<User | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(() => getItem<boolean>("system_maintenance", false));
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const list = await getUsers({ data: withToken({}) });
      if (list) setUsers(list);
    } catch (error: any) {
      toast.error(error?.message || "Unable to load users");
    } finally {
      setLoading(false);
    }
  }

  const approveUserNode = async (u: User) => {
    const toastId = toast.loading(`Initiating account approval & dispatching credentials notification...`);
    try {
      const payload = {
        id: u.id,
        username: u.username,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        contact: u.contact,
        address: u.address,
        birthdate: u.birthdate,
        gender: u.gender,
        approved: true,
        occupation: u.occupation,
        isPwd: u.isPwd,
      };

      const saved = await updateUser({ data: withToken(payload) });
      setUsers(users.map((x) => x.id === u.id ? saved : x));
      
      toast.success(
        `Account node successfully activated! Confirmation email sent to ${u.email} (logged at ecagraraymanagementsystem@gmail.com)`,
        { id: toastId, duration: 6000 }
      );
    } catch (error: any) {
      toast.error(error?.message || "LGU Approval failed", { id: toastId });
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tyrannicalAdmin) return toast.error("Only Super Admin can manage users");
    if (!editing || !editing.username || !editing.fullName) return toast.error("Username and full name are required");

    const isNew = !editing.id;
    if (isNew && !editing.password) return toast.error("Password is required for a new account");

    const payload = {
      id: editing.id,
      username: editing.username,
      fullName: editing.fullName,
      email: editing.email,
      role: editing.role,
      contact: editing.contact,
      address: editing.address,
      birthdate: editing.birthdate,
      gender: editing.gender,
      password: editing.password,
      approved: editing.approved === undefined ? true : editing.approved,
      occupation: editing.occupation || "Other",
      isPwd: editing.isPwd || "No",
    } as any;

    try {
      const saved = isNew
        ? await createUser({ data: withToken(payload) })
        : await updateUser({ data: withToken(payload) });
      setUsers((prev) => {
        if (isNew) return [...prev, saved];
        return prev.map((u) => (u.id === saved.id ? saved : u));
      });
      setOpen(false);
      toast.success("User saved successfully");
    } catch (error: any) {
      toast.error(error?.message || "Unable to save user");
    }
  };

  const removeUser = async () => {
    if (!tyrannicalAdmin || !deleteTarget) return toast.error("Only Super Admin can manage users");
    try {
      await deleteUser({ data: withToken({ id: deleteTarget.id }) });
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      toast.success("User removed");
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error?.message || "Unable to remove user");
    }
  };

  const exportUsersCSV = () => {
    const headers = ["Full Name","Username","Email","Role","Status","Contact","Address","Occupation","Created At"];
    const rows = users.map(u => [
      u.fullName, u.username, u.email, ROLE_LABELS[u.role],
      u.approved === false ? "Pending" : "Active",
      u.contact || "", u.address || "", u.occupation || "",
      new Date(u.createdAt).toLocaleDateString()
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ecagraray-users-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Users exported to CSV");
  };

  const clearAllNotifications = () => {
    if (!confirm("Clear all system notifications? This cannot be undone.")) return;
    setItem("notifications", []);
    toast.success("All notifications cleared");
  };

  const toggleMaintenance = () => {
    const next = !maintenanceMode;
    setMaintenanceMode(next);
    setItem("system_maintenance", next);
    toast.success(next ? "System maintenance mode ENABLED - only admins can access the system" : "System maintenance mode DISABLED");
  };

  // Stats computations
  const totalCount = users.length;
  const pendingCount = users.filter(u => u.approved === false).length;
  const approvedCount = users.filter(u => u.approved !== false).length;
  const staffCount = users.filter(u => u.role !== "resident").length;

  const filteredUsers = useMemo(() => {
    const tabFiltered = users.filter(u => {
      if (filterTab === "pending") return u.approved === false;
      if (filterTab === "approved") return u.approved !== false;
      return true;
    });
    if (!search.trim()) return tabFiltered;
    const q = search.toLowerCase();
    return tabFiltered.filter(u =>
      (u.fullName || "").toLowerCase().includes(q) ||
      (u.username || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q),
    );
  }, [users, filterTab, search]);

  const pagedUsersTotalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pagedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      {!tyrannicalAdmin ? (
        <EmptyState title="Unauthorized" description="Only Super Admin accounts can manage user accounts." />
      ) : (
        <>
          <PageHeader
            title="User Management"
            subtitle="Admin dashboard for user accounts approval & profile configuration."
            action={
              <Button
                onClick={() => {
                  setEditing({
                    id: "",
                    username: "",
                    password: "",
                    fullName: "",
                    email: "",
                    role: "resident",
                    approved: true,
                    createdAt: "",
                  });
                  setOpen(true);
                }}
              >
                <Plus className="h-4 w-4" /> Add User
              </Button>
            }
          />

          {/* User Telemetry Stats Grid */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border/50 bg-card/45 backdrop-blur-md p-3.5 sm:p-5 dark:bg-slate-900/30 border-l-4 border-l-primary shadow-sm animate-slide-in" style={{ animationDelay: "0ms" }}>
              <div className="text-[8px] sm:text-[9.5px] font-black uppercase tracking-wider text-muted-foreground">Total Identities</div>
              <div className="text-xl sm:text-2xl font-black mt-1 text-slate-950 dark:text-white">{totalCount}</div>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card/45 backdrop-blur-md p-3.5 sm:p-5 dark:bg-slate-900/30 border-l-4 border-l-warning shadow-sm animate-slide-in" style={{ animationDelay: "60ms" }}>
              <div className="text-[8px] sm:text-[9.5px] font-black uppercase tracking-wider text-warning-foreground">Pending Verification</div>
              <div className="text-xl sm:text-2xl font-black mt-1 text-warning-foreground">{pendingCount}</div>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card/45 backdrop-blur-md p-3.5 sm:p-5 dark:bg-slate-900/30 border-l-4 border-l-success shadow-sm animate-slide-in" style={{ animationDelay: "120ms" }}>
              <div className="text-[8px] sm:text-[9.5px] font-black uppercase tracking-wider text-success">Approved Accounts</div>
              <div className="text-xl sm:text-2xl font-black mt-1 text-success">{approvedCount}</div>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card/45 backdrop-blur-md p-3.5 sm:p-5 dark:bg-slate-900/30 border-l-4 border-l-info shadow-sm animate-slide-in" style={{ animationDelay: "180ms" }}>
              <div className="text-[8px] sm:text-[9.5px] font-black uppercase tracking-wider text-primary">Barangay Officers</div>
              <div className="text-xl sm:text-2xl font-black mt-1 text-primary">{staffCount}</div>
            </div>
          </div>

          {/* List Tab Filters */}
          <div className="flex flex-wrap gap-2 border-b border-border/30 pb-3">
            {[
              { id: "all", label: "All Users" },
              { id: "pending", label: `Pending Approvals (${pendingCount})` },
              { id: "approved", label: "Active / Approved" }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setFilterTab(t.id as any)}
                className={`px-3.5 sm:px-4.5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-200 cursor-pointer min-h-[44px] ${
                  filterTab === t.id
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/10 border border-primary"
                    : "text-muted-foreground hover:bg-muted border border-transparent"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, username, email, or role..."
              className="w-full rounded-xl border border-border/60 bg-background/50 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
            />
          </div>

          <Card>
            {loading ? (
              <div className="py-10 text-center text-sm text-muted-foreground animate-pulse">Loading users…</div>
            ) : filteredUsers.length === 0 ? (
              <EmptyState icon={UserCog} title="No matching credentials found" description="Adjust your filters or add a new user." />
            ) : <><div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border/50 text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <tr>
                        <th className="pb-3 pr-3 font-semibold">Name</th>
                        <th className="pb-3 pr-3">Username</th>
                        <th className="pb-3 pr-3">Email Address</th>
                        <th className="pb-3 pr-3">Role Status</th>
                        <th className="pb-3 pr-3">Approval</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {pagedUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-primary/[0.02] transition">
                          <td className="py-4 pr-3 font-medium text-slate-900 dark:text-white">{u.fullName}</td>
                          <td className="py-4 pr-3 text-muted-foreground">{u.username}</td>
                          <td className="py-4 pr-3 text-muted-foreground">{u.email}</td>
                          <td className="py-4 pr-3">
                            <Badge tone={u.role === "super_admin" ? "danger" : u.role === "captain" ? "warning" : "info"}>
                              {ROLE_LABELS[u.role]}
                            </Badge>
                          </td>
                          <td className="py-4 pr-3">
                            {u.approved === false ? (
                              <Badge tone="warning">Pending Approval</Badge>
                            ) : (
                              <Badge tone="success">Active</Badge>
                            )}
                          </td>
                          <td className="py-4 text-right">
                            <div className="inline-flex gap-1">
                              <button
                                onClick={() => setViewing(u)}
                                className="rounded-full p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
                                title="View Details"
                              >
                                <Eye className="h-4.5 w-4.5" />
                              </button>
                              {u.approved === false && (
                                <button
                                  onClick={() => approveUserNode(u)}
                                  className="rounded-full p-2 text-success hover:bg-success/10 transition"
                                  title="Approve User Account"
                                >
                                  <Check className="h-4.5 w-4.5" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setEditing({ ...u, password: "" });
                                  setOpen(true);
                                }}
                                className="rounded-full p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
                              >
                                <Pencil className="h-4.5 w-4.5" />
                              </button>
                              <button
                                disabled={u.id === user?.id}
                                onClick={() => setDeleteTarget(u)}
                                className="rounded-full p-2 text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition disabled:opacity-30"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                  {pagedUsers.map((u) => (
                    <div key={u.id} className="rounded-2xl border border-border/50 bg-background/30 p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-extrabold text-sm text-foreground">{u.fullName}</div>
                          <div className="text-xs text-muted-foreground">@{u.username}</div>
                        </div>
                        <div className="inline-flex gap-1.5 shrink-0">
                          <button
                            onClick={() => setViewing(u)}
                            className="rounded-xl p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {u.approved === false && (
                            <button
                              onClick={() => approveUserNode(u)}
                              className="rounded-xl p-2.5 text-success hover:bg-success/10 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                              title="Approve User Account"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditing({ ...u, password: "" });
                              setOpen(true);
                            }}
                            className="rounded-xl p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            disabled={u.id === user?.id}
                            onClick={() => setDeleteTarget(u)}
                            className="rounded-xl p-2.5 text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition disabled:opacity-30 min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs border-t border-border/20 pt-3">
                        <div className="col-span-2">
                          <div className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Email Address</div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{u.email || "—"}</div>
                        </div>
                        <div>
                          <div className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Role Clearance</div>
                          <div className="mt-0.5">
                            <Badge tone={u.role === "super_admin" ? "danger" : u.role === "captain" ? "warning" : "info"}>
                              {ROLE_LABELS[u.role]}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Status</div>
                          <div className="mt-0.5">
                            {u.approved === false ? (
                              <Badge tone="warning">Pending Approval</Badge>
                            ) : (
                              <Badge tone="success">Active</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination currentPage={page} totalPages={pagedUsersTotalPages} onPageChange={setPage} />
              </>
            }
          </Card>

          {/* System Administration Panel */}
          <Card>
            <div className="border-b border-border/20 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm">System Administration</div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Platform Management Tools</div>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-border/40 bg-background/30 p-4 sm:p-5 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2.5">
                  <RefreshCw className={`h-5 w-5 ${maintenanceMode ? "text-warning" : "text-success"}`} />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">Maintenance Mode</div>
                    <div className="text-[9px] text-muted-foreground">{maintenanceMode ? "Enabled - Restricted Access" : "Disabled - Normal Operation"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" className={`relative inline-flex h-7 w-12 rounded-full cursor-pointer transition ${maintenanceMode ? "bg-warning" : "bg-muted"}`} onClick={toggleMaintenance} aria-label="Toggle maintenance mode">
                    <span className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${maintenanceMode ? "translate-x-5" : ""}`} />
                  </button>
                  <span className="text-xs font-semibold">{maintenanceMode ? "Turn Off" : "Turn On"}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-border/40 bg-background/30 p-4 sm:p-5 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2.5">
                  <Download className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">Export Data</div>
                    <div className="text-[9px] text-muted-foreground">Download user records as CSV</div>
                  </div>
                </div>
                <Button variant="outline" onClick={exportUsersCSV} className="w-full min-h-[44px]">
                  <Download className="h-4 w-4" /> Export Users CSV
                </Button>
              </div>
              <div className="rounded-2xl border border-border/40 bg-background/30 p-4 sm:p-5 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2.5">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">System Actions</div>
                    <div className="text-[9px] text-muted-foreground">Clear notifications & reset</div>
                  </div>
                </div>
                <Button variant="outline" onClick={clearAllNotifications} className="w-full min-h-[44px]">
                  <Trash2 className="h-4 w-4" /> Clear All Notifications
                </Button>
              </div>
            </div>
          </Card>

          <Modal open={open} onClose={() => setOpen(false)} title={editing?.id ? "Update User" : "New User"}>
            {editing && (
              <form onSubmit={save} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <Input
                  label="Full Name *"
                  value={editing.fullName || ""}
                  onChange={(e) => setEditing({ ...editing, fullName: e.target.value })}
                />
                <Input
                  label="Username *"
                  value={editing.username || ""}
                  onChange={(e) => setEditing({ ...editing, username: e.target.value })}
                />
                <Input
                  label="Email Address *"
                  type="email"
                  value={editing.email || ""}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                />
                <Input
                  label={editing.id ? "New Password (leave blank to keep)" : "Password *"}
                  type="password"
                  value={editing.password || ""}
                  onChange={(e) => setEditing({ ...editing, password: e.target.value })}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Civil Status"
                    value={editing.civilStatus || "Single"}
                    onChange={(e) => setEditing({ ...editing, civilStatus: e.target.value })}
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                  </Select>
                  <Select
                    label="Blood Type"
                    value={editing.bloodType || "O+"}
                    onChange={(e) => setEditing({ ...editing, bloodType: e.target.value })}
                  >
                    <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                    <option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Occupation / Sector"
                    value={editing.occupation || "Other"}
                    onChange={(e) => setEditing({ ...editing, occupation: e.target.value })}
                  >
                    <option value="Farmer">Farmer</option>
                    <option value="Fisherfolk">Fisherfolk</option>
                    <option value="Student">Student</option>
                    <option value="Other">Other / None</option>
                  </Select>
                  <Select
                    label="PWD Status"
                    value={editing.isPwd || "No"}
                    onChange={(e) => setEditing({ ...editing, isPwd: e.target.value })}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Religion"
                    value={editing.religion || "Roman Catholic"}
                    onChange={(e) => setEditing({ ...editing, religion: e.target.value })}
                  >
                    <option>Roman Catholic</option><option>Iglesia ni Cristo</option>
                    <option>Muslim</option><option>Protestant</option><option>Other</option>
                  </Select>
                  <Select
                    label="Education Level"
                    value={editing.educationLevel || "College Level"}
                    onChange={(e) => setEditing({ ...editing, educationLevel: e.target.value })}
                  >
                    <option>Elementary Level</option><option>Elementary Graduate</option>
                    <option>High School Level</option><option>High School Graduate</option>
                    <option>College Level</option><option>College Graduate</option>
                    <option>Vocational</option><option>Post Graduate</option>
                  </Select>
                </div>
                <Input label="Contact Number" value={editing.contact || ""} onChange={(e) => setEditing({ ...editing, contact: e.target.value })} placeholder="e.g. +63 900" />
                <Input label="Address" value={editing.address || ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} placeholder="Zone, Street, Sitio" />
                <Input label="Purok / Zone" value={editing.purok || ""} onChange={(e) => setEditing({ ...editing, purok: e.target.value })} placeholder="e.g. Purok 1" />
                <Input label="Emergency Contact" value={editing.emergencyContact || ""} onChange={(e) => setEditing({ ...editing, emergencyContact: e.target.value })} placeholder="Full name" />
                <Input label="Emergency Phone" value={editing.emergencyPhone || ""} onChange={(e) => setEditing({ ...editing, emergencyPhone: e.target.value })} placeholder="e.g. +63 912" />
                <Input label="PhilHealth No." value={editing.philhealthNo || ""} onChange={(e) => setEditing({ ...editing, philhealthNo: e.target.value })} />
                <Input label="TIN No." value={editing.tinNo || ""} onChange={(e) => setEditing({ ...editing, tinNo: e.target.value })} />
                <Input label="Voter's ID No." value={editing.voterIdNo || ""} onChange={(e) => setEditing({ ...editing, voterIdNo: e.target.value })} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Access Role"
                    value={editing.role}
                    onChange={(e) => setEditing({ ...editing, role: e.target.value as Role })}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </Select>
                  <Select
                    label="LGU Approval Status"
                    value={editing.approved === false ? "pending" : "approved"}
                    onChange={(e) => setEditing({ ...editing, approved: e.target.value === "approved" })}
                  >
                    <option value="approved">Approved & Active</option>
                    <option value="pending">Pending Verification</option>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit">Save User</Button>
                </div>
              </form>
            )}
          </Modal>

          {/* View User Details Modal */}
          <Modal open={!!viewing} onClose={() => setViewing(null)} title="User Details">
            {viewing && (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</div><div className="text-sm font-semibold mt-0.5">{viewing.fullName}</div></div>
                  <div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Username</div><div className="text-sm font-semibold mt-0.5">@{viewing.username}</div></div>
                  <div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email</div><div className="text-sm font-semibold mt-0.5">{viewing.email || "—"}</div></div>
                  <div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contact</div><div className="text-sm font-semibold mt-0.5">{viewing.contact || "—"}</div></div>
                  <div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Role</div><div className="mt-0.5"><Badge tone={viewing.role === "super_admin" ? "danger" : viewing.role === "captain" ? "warning" : "info"}>{ROLE_LABELS[viewing.role]}</Badge></div></div>
                  <div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</div><div className="mt-0.5">{viewing.approved === false ? <Badge tone="warning">Pending</Badge> : <Badge tone="success">Active</Badge>}</div></div>
                  <div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gender</div><div className="text-sm font-semibold mt-0.5">{viewing.gender || "—"}</div></div>
                  <div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Birthdate</div><div className="text-sm font-semibold mt-0.5">{viewing.birthdate || "—"}</div></div>
                  <div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Civil Status</div><div className="text-sm font-semibold mt-0.5">{viewing.civilStatus || "—"}</div></div>
                  <div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Blood Type</div><div className="text-sm font-semibold mt-0.5">{viewing.bloodType || "—"}</div></div>
                </div>
                <div className="border-t border-border/20 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Address</div><div className="text-sm font-semibold mt-0.5">{viewing.address || "—"}</div></div>
                  <div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Purok / Zone</div><div className="text-sm font-semibold mt-0.5">{viewing.purok || "—"}</div></div>
                  <div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Occupation</div><div className="text-sm font-semibold mt-0.5">{viewing.occupation || "—"}</div></div>
                  <div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">PWD Status</div><div className="text-sm font-semibold mt-0.5">{viewing.isPwd || "No"}</div></div>
                  <div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Religion</div><div className="text-sm font-semibold mt-0.5">{viewing.religion || "—"}</div></div>
                  <div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nationality</div><div className="text-sm font-semibold mt-0.5">{viewing.nationality || "—"}</div></div>
                  <div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Education</div><div className="text-sm font-semibold mt-0.5">{viewing.educationLevel || "—"}</div></div>
                  <div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Emergency Contact</div><div className="text-sm font-semibold mt-0.5">{viewing.emergencyContact || "—"}</div></div>
                </div>
                <div className="border-t border-border/20 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">PhilHealth No.</div><div className="text-sm font-semibold mt-0.5">{viewing.philhealthNo || "—"}</div></div>
                  <div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">TIN No.</div><div className="text-sm font-semibold mt-0.5">{viewing.tinNo || "—"}</div></div>
                  <div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Voter's ID No.</div><div className="text-sm font-semibold mt-0.5">{viewing.voterIdNo || "—"}</div></div>
                  <div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Created At</div><div className="text-sm font-semibold mt-0.5">{new Date(viewing.createdAt).toLocaleDateString("en-PH", { dateStyle: "long" })}</div></div>
                </div>
              </div>
            )}
          </Modal>

          <DeleteModal
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={removeUser}
            itemName={deleteTarget?.fullName}
            message="Delete this user account? All associated data will be permanently removed."
          />
        </>
      )}
    </div>
  );
}
