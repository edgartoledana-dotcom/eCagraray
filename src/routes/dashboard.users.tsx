import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { type User, type Role, ROLE_LABELS } from "../lib/store";
import { Button, Card, EmptyState, Input, Modal, PageHeader, Select, Badge } from "../components/ui-kit";
import { UserCog, Plus, Pencil, Trash2 } from "lucide-react";
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
  const canManageUsers = user?.role === "super_admin";
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EditableUser | null>(null);
  const [loading, setLoading] = useState(false);

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

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers) return toast.error("Only Super Admin can manage users");
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
    if (!canManageUsers) return toast.error("Only Super Admin can manage users");
    if (!confirm("Delete user?")) return;
    try {
      await deleteUser({ data: { id } });
      setUsers((prev) => prev.filter((user) => user.id !== id));
      toast.success("User removed");
    } catch (error: any) {
      toast.error(error?.message || "Unable to remove user");
    }
  };

  return (
    <div>
      {!canManageUsers ? (
        <EmptyState title="Unauthorized" description="Only Super Admin can manage user accounts." />
      ) : (
        <>
          <PageHeader
            title="User Management"
            subtitle="Create accounts and assign roles."
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
                    createdAt: "",
                  });
                  setOpen(true);
                }}
              >
                <Plus className="h-4 w-4" /> New User
              </Button>
            }
          />

          <Card>
            {loading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">Loading users…</div>
            ) : users.length === 0 ? (
              <EmptyState icon={UserCog} title="No users yet" />
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2">Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{u.fullName}</td>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>
                        <Badge tone={u.role === "super_admin" ? "danger" : "info"}>
                          {ROLE_LABELS[u.role]}
                        </Badge>
                      </td>
                      <td className="text-right">
                              <button
                          onClick={() => {
                            setEditing({ ...u, password: "" });
                            setOpen(true);
                          }}
                          className="rounded p-1.5 hover:bg-muted"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          disabled={u.id === user?.id}
                          onClick={() => removeUser(u.id)}
                          className="rounded p-1.5 text-destructive hover:bg-destructive/10 disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Modal open={open} onClose={() => setOpen(false)} title={editing?.id ? "Edit User" : "New User"}>
            {editing && (
              <form onSubmit={save} className="space-y-3">
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
                  label="Email"
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
                <Select
                  label="Role"
                  value={editing.role}
                  onChange={(e) => setEditing({ ...editing, role: e.target.value as Role })}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </Select>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            )}
          </Modal>
        </>
      )}
    </div>
  );
}
