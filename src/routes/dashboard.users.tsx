import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { type User, type Role, ROLE_LABELS } from "../lib/store";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Select, Badge } from "../components/ui-kit";
import { UserCog, Plus, Pencil, Trash2, Check, UserCheck, ShieldAlert, ShieldCheck } from "lucide-react";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { createUser, deleteUser, getUsers, updateUser } from "../lib/api/auth.functions";

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

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const list = await getUsers();
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

      const saved = await updateUser({ data: payload });
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
        ? await createUser({ data: payload })
        : await updateUser({ data: payload });
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

  const removeUser = async (id: string) => {
    if (!tyrannicalAdmin) return toast.error("Only Super Admin can manage users");
    if (!confirm("Delete user?")) return;
    try {
      await deleteUser({ data: { id } });
      setUsers((prev) => prev.filter((user) => user.id !== id));
      toast.success("User removed");
    } catch (error: any) {
      toast.error(error?.message || "Unable to remove user");
    }
  };

  // Stats computations
  const totalCount = users.length;
  const pendingCount = users.filter(u => u.approved === false).length;
  const approvedCount = users.filter(u => u.approved !== false).length;
  const staffCount = users.filter(u => u.role !== "resident").length;

  const filteredUsers = users.filter(u => {
    if (filterTab === "pending") return u.approved === false;
    if (filterTab === "approved") return u.approved !== false;
    return true;
  });

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border/50 bg-card/45 backdrop-blur-md p-5 dark:bg-slate-900/30 border-l-4 border-l-primary shadow-sm animate-slide-in" style={{ animationDelay: "0ms" }}>
              <div className="text-[9.5px] font-black uppercase tracking-wider text-muted-foreground">Total Identities</div>
              <div className="text-2xl font-black mt-1 text-slate-950 dark:text-white">{totalCount}</div>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card/45 backdrop-blur-md p-5 dark:bg-slate-900/30 border-l-4 border-l-warning shadow-sm animate-slide-in" style={{ animationDelay: "60ms" }}>
              <div className="text-[9.5px] font-black uppercase tracking-wider text-warning-foreground">Pending Verification</div>
              <div className="text-2xl font-black mt-1 text-warning-foreground">{pendingCount}</div>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card/45 backdrop-blur-md p-5 dark:bg-slate-900/30 border-l-4 border-l-success shadow-sm animate-slide-in" style={{ animationDelay: "120ms" }}>
              <div className="text-[9.5px] font-black uppercase tracking-wider text-success">Approved Accounts</div>
              <div className="text-2xl font-black mt-1 text-success">{approvedCount}</div>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card/45 backdrop-blur-md p-5 dark:bg-slate-900/30 border-l-4 border-l-info shadow-sm animate-slide-in" style={{ animationDelay: "180ms" }}>
              <div className="text-[9.5px] font-black uppercase tracking-wider text-primary">Barangay Officers</div>
              <div className="text-2xl font-black mt-1 text-primary">{staffCount}</div>
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
                className={`px-4.5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-200 cursor-pointer ${
                  filterTab === t.id
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/10 border border-primary"
                    : "text-muted-foreground hover:bg-muted border border-transparent"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Card>
            {loading ? (
              <div className="py-10 text-center text-sm text-muted-foreground animate-pulse">Loading users…</div>
            ) : filteredUsers.length === 0 ? (
              <EmptyState icon={UserCog} title="No matching credentials found" description="Adjust your filters or add a new user." />
            ) : (
              <>
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
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
                      {filteredUsers.map((u) => (
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
                                onClick={() => removeUser(u.id)}
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
                  {filteredUsers.map((u) => (
                    <div key={u.id} className="rounded-2xl border border-border/50 bg-background/30 p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-extrabold text-sm text-foreground">{u.fullName}</div>
                          <div className="text-xs text-muted-foreground">@{u.username}</div>
                        </div>
                        <div className="inline-flex gap-1 shrink-0">
                          {u.approved === false && (
                            <button
                              onClick={() => approveUserNode(u)}
                              className="rounded-full p-1.5 text-success hover:bg-success/10 transition"
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
                            className="rounded-full p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            disabled={u.id === user?.id}
                            onClick={() => removeUser(u.id)}
                            className="rounded-full p-1.5 text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition disabled:opacity-30"
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
              </>
            )}
          </Card>

          <Modal open={open} onClose={() => setOpen(false)} title={editing?.id ? "Update User" : "New User"}>
            {editing && (
              <form onSubmit={save} className="space-y-4">
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
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Access Role"
                    value={editing.role}
                    onChange={(e) => setEditing({ ...editing, role: e.target.value as Role })}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
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
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save User</Button>
                </div>
              </form>
            )}
          </Modal>
        </>
      )}
    </div>
  );
}
