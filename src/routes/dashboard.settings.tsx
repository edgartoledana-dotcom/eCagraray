import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { type User, ROLE_LABELS, canRole, withToken } from "../lib/store";
import { Button, Card, EmptyState, Input, PageHeader } from "../components/ui-kit";
import { useAuth, useTheme } from "../lib/auth";
import { getBarangayInfo, saveBarangayInfo, updateUserProfile } from "../lib/api/auth.functions";
import { toast } from "sonner";
import { Eye, EyeOff, Shield, Sun, Moon } from "lucide-react";

export const Route = createFileRoute("/dashboard/settings")({ component: Page });

function Page() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [info, setInfo] = useState<any>({ name: "", municipality: "", province: "", address: "", contact: "", email: "", captain: "" });
  const [profile, setProfile] = useState<any>(user || {});
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    void getBarangayInfo().then((data) => { if (data) setInfo(data); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) setProfile(user);
  }, [user?.id]);

  const canSaveInfo = canRole(user?.role, "barangayInfo");

  const saveInfo = async () => {
    if (!canSaveInfo) return toast.error("You are not authorized to update barangay information");
    try {
      await saveBarangayInfo({ data: withToken(info) });
      toast.success("Barangay info saved");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save barangay info");
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    try {
      const updated = await updateUserProfile({
        data: withToken({ id: user.id, fullName: profile.fullName || user.fullName, email: profile.email || user.email, contact: profile.contact, address: profile.address, birthdate: profile.birthdate, gender: profile.gender }),
      });
      if (updated) { updateUser(updated); setProfile(updated); toast.success("Profile updated"); }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile");
    }
  };

  const pwStrength = (p: string) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const strengthScore = pwStrength(newPw);
  const strengthLabel = ["Weak", "Fair", "Good", "Strong"][strengthScore];
  const strengthColor = ["bg-destructive", "bg-warning", "bg-info", "bg-success"][strengthScore];

  const changePassword = async () => {
    if (!user) return;
    if (!currentPw) return toast.error("Enter your current password");
    if (newPw.length < 8) return toast.error("New password must be at least 8 characters");
    if (newPw !== confirmPw) return toast.error("Passwords do not match");

    try {
      const { loginUser, updateUser: updateFullUser } = await import("../lib/api/auth.functions");
      const check = await loginUser({ data: { username: user.username, password: currentPw } });
      if (!check) return toast.error("Current password is incorrect");

      await updateFullUser({
        data: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          password: newPw,
        },
      });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      toast.success("Password changed successfully");
    } catch {
      toast.error("Failed to change password");
    }
  };

  if (!user) {
    return <Card><EmptyState title="Access Restricted" description="Please log in to access Settings." /></Card>;
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Theme, profile, and barangay information." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Appearance</h2>
          <p className="text-sm text-muted-foreground">Theme persists across sessions.</p>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setTheme("light")} className={`flex-1 rounded-lg border p-4 transition flex items-center justify-center gap-2 min-h-[44px] ${theme === "light" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:bg-muted"}`}><Sun className="h-4 w-4" /> Light</button>
            <button onClick={() => setTheme("dark")} className={`flex-1 rounded-lg border p-4 transition flex items-center justify-center gap-2 min-h-[44px] ${theme === "dark" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:bg-muted"}`}><Moon className="h-4 w-4" /> Dark</button>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold">Your Profile</h2>
          <div className="mt-4 space-y-3">
            <Input label="Full Name" value={profile.fullName || ""} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} />
            <Input label="Email" value={profile.email || ""} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            <Input label="Contact" value={profile.contact || ""} onChange={(e) => setProfile({ ...profile, contact: e.target.value })} />
            <Input label="Address" value={profile.address || ""} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
            <div className="text-xs text-muted-foreground">Role: {user ? ROLE_LABELS[user.role] : ""}</div>
            <Button onClick={saveProfile}>Save Profile</Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Change Password</h2>
          </div>
          <div className="mt-4 space-y-3">
            <div className="relative">
              <Input label="Current Password" type={showPw ? "text" : "password"} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
            </div>
            <div className="relative">
              <Input label="New Password" type={showPw ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPw && (
              <div className="px-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted border border-border/20">
                  <div className={`h-full ${strengthColor} rounded-full transition-all duration-300`} style={{ width: `${(strengthScore / 4) * 100}%` }} />
                </div>
                <div className="mt-1 text-[10px] font-bold text-muted-foreground">Strength: {strengthLabel}</div>
              </div>
            )}
            <Input label="Confirm New Password" type={showPw ? "text" : "password"} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
            <Button onClick={changePassword}>Change Password</Button>
          </div>
        </Card>

        <Card className="md:col-span-2">
          <h2 className="font-semibold">Barangay Information</h2>
          <p className="text-sm text-muted-foreground">Displayed on the landing page and printed documents.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input label="Barangay Name" value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} readOnly={!canSaveInfo} />
            <Input label="Punong Barangay" value={info.captain} onChange={(e) => setInfo({ ...info, captain: e.target.value })} readOnly={!canSaveInfo} />
            <Input label="Municipality" value={info.municipality} onChange={(e) => setInfo({ ...info, municipality: e.target.value })} readOnly={!canSaveInfo} />
            <Input label="Province" value={info.province} onChange={(e) => setInfo({ ...info, province: e.target.value })} readOnly={!canSaveInfo} />
            <Input label="Address" value={info.address} onChange={(e) => setInfo({ ...info, address: e.target.value })} readOnly={!canSaveInfo} />
            <Input label="Contact" value={info.contact} onChange={(e) => setInfo({ ...info, contact: e.target.value })} readOnly={!canSaveInfo} />
            <Input label="Email" value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} readOnly={!canSaveInfo} />
          </div>
          <div className="mt-4"><Button onClick={saveInfo} disabled={!canSaveInfo}>{canSaveInfo ? "Save Information" : "Save Information (restricted)"}</Button></div>
        </Card>
      </div>
    </div>
  );
}
