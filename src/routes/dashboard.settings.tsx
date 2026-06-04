import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { type User, ROLE_LABELS, canRole } from "../lib/store";
import { Button, Card, Input, PageHeader } from "../components/ui-kit";
import { useAuth, useTheme } from "../lib/auth";
import { getBarangayInfo, saveBarangayInfo, updateUserProfile } from "../lib/api/auth.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/settings")({ component: Page });

function Page() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [info, setInfo] = useState<any>({ name:"", municipality:"", province:"", address:"", contact:"", email:"", captain:"" });
  const [profile, setProfile] = useState<any>(user || {});

  useEffect(() => {
    void getBarangayInfo().then((data) => {
      if (data) setInfo(data);
    });
  }, []);

  useEffect(() => {
    if (user) setProfile(user);
  }, [user?.id]);

  const canSaveInfo = canRole(user?.role, "barangayInfo");
  const saveInfo = async () => {
    if (!canSaveInfo) return toast.error("You are not authorized to update barangay information");
    await saveBarangayInfo({ data: info });
    toast.success("Barangay info saved");
  };
  const saveProfile = async () => {
    if (!user) return;
    const updated = await updateUserProfile({
      data: {
        id: user.id,
        fullName: profile.fullName || user.fullName,
        email: profile.email || user.email,
        contact: profile.contact,
        address: profile.address,
        birthdate: profile.birthdate,
        gender: profile.gender,
      },
    });
    if (updated) {
      updateUser(updated);
      setProfile(updated);
      toast.success("Profile updated");
    }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Theme, profile, and barangay information." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Appearance</h2>
          <p className="text-sm text-muted-foreground">Theme persists across sessions.</p>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setTheme("light")} className={`flex-1 rounded-lg border p-4 ${theme === "light" ? "border-primary bg-primary/5" : ""}`}>☀️ Light</button>
            <button onClick={() => setTheme("dark")} className={`flex-1 rounded-lg border p-4 ${theme === "dark" ? "border-primary bg-primary/5" : ""}`}>🌙 Dark</button>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold">Your Profile</h2>
          <div className="mt-4 space-y-3">
            <Input label="Full Name" value={profile.fullName || ""} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} />
            <Input label="Email" value={profile.email || ""} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            <Input label="Contact" value={profile.contact || ""} onChange={(e) => setProfile({ ...profile, contact: e.target.value })} />
            <div className="text-xs text-muted-foreground">Role: {user ? ROLE_LABELS[user.role] : ""}</div>
            <Button onClick={saveProfile}>Save Profile</Button>
          </div>
        </Card>

        <Card className="md:col-span-2">
          <h2 className="font-semibold">Barangay Information</h2>
          <p className="text-sm text-muted-foreground">Displayed on the landing page and printed documents.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input label="Barangay Name" value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} />
            <Input label="Punong Barangay" value={info.captain} onChange={(e) => setInfo({ ...info, captain: e.target.value })} />
            <Input label="Municipality" value={info.municipality} onChange={(e) => setInfo({ ...info, municipality: e.target.value })} />
            <Input label="Province" value={info.province} onChange={(e) => setInfo({ ...info, province: e.target.value })} />
            <Input label="Address" value={info.address} onChange={(e) => setInfo({ ...info, address: e.target.value })} />
            <Input label="Contact" value={info.contact} onChange={(e) => setInfo({ ...info, contact: e.target.value })} />
            <Input label="Email" value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} />
          </div>
          <div className="mt-4"><Button onClick={saveInfo} disabled={!canSaveInfo}>{canSaveInfo ? "Save Information" : "Save Information (restricted)"}</Button></div>
        </Card>
      </div>
    </div>
  );
}
