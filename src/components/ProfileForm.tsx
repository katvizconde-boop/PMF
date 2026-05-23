"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { companyChipClass } from "@/lib/companies";
import { OnboardingTour } from "./OnboardingTour";

export function ProfileForm({ user }: { user: any }) {
  const router = useRouter();
  const [tab, setTab] = useState<"profile" | "password">("profile");
  const [showTour, setShowTour] = useState(false);

  async function restartTour() {
    await fetch("/api/profile/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed: false }) });
    setShowTour(true);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {showTour && <OnboardingTour role={user.role} alreadyCompleted={false} forceOpen onClose={() => setShowTour(false)} />}
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your personal info and password.</p>
        </div>
        <button onClick={restartTour} className="btn btn-secondary text-sm">🎓 Restart Tour</button>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        <button onClick={() => setTab("profile")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === "profile" ? "border-primary-600 text-primary-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
          👤 Personal Information
        </button>
        <button onClick={() => setTab("password")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === "password" ? "border-primary-600 text-primary-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
          🔒 Change Password
        </button>
      </div>

      {tab === "profile" ? <ProfileTab user={user} onSaved={() => router.refresh()} /> : <PasswordTab />}
    </div>
  );
}

function ProfileTab({ user, onSaved }: { user: any; onSaved: () => void }) {
  const initial = {
    firstName: user.firstName ?? "",
    middleName: user.middleName ?? "",
    lastName: user.lastName ?? "",
    phone: user.phone ?? "",
    address: user.address ?? "",
    emergencyContact: user.emergencyContact ?? "",
  };
  const [form, setForm] = useState(initial);
  const [picture, setPicture] = useState<string | null>(user.profilePicture);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof form) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function cancelEdit() {
    setForm(initial);
    setPicture(user.profilePicture);
    setEditing(false);
    setMsg("");
  }

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please select an image."); return; }
    if (file.size > 1.5 * 1024 * 1024) { alert("Picture too large — please use under 1.5MB."); return; }
    // Resize client-side to max 256x256, store as JPEG base64
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const max = 256;
        const ratio = Math.min(max / img.width, max / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPicture(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = ev.target!.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg("");
    const res = await fetch("/api/profile", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, profilePicture: picture }),
    });
    setSaving(false);
    if (res.ok) { setMsg("✓ Saved"); setEditing(false); onSaved(); }
    else setMsg("Error: " + (await res.text()));
    setTimeout(() => setMsg(""), 4000);
  }

  return (
    <form onSubmit={save} className="space-y-6">
      {/* Picture + readonly info */}
      <div className="card flex items-start gap-6 flex-wrap">
        <div className="flex flex-col items-center gap-3">
          <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
            {picture ? (
              <img src={picture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl text-gray-400">👤</span>
            )}
          </div>
          {editing && <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-secondary text-xs">📷 Change Photo</button>}
          {editing && picture && <button type="button" onClick={() => setPicture(null)} className="text-xs text-red-600 hover:underline">Remove</button>}
          <input type="file" accept="image/*" className="hidden" ref={fileRef} onChange={pickFile} />
        </div>

        <div className="flex-1 min-w-[280px] grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Account</div>
            <div className="text-base font-semibold text-gray-800">{user.email}</div>
            <div className="text-xs text-gray-500 mt-1">Email cannot be changed by employees — contact HR.</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Position</div>
            <div className="text-sm font-medium text-gray-800">{user.position ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Role</div>
            <div className="text-sm font-medium text-gray-800">{user.role.replace("_", " ")}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Company</div>
            {user.company ? <span className={`chip ${companyChipClass(user.company)}`}>🏢 {user.company}</span> : "—"}
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Department</div>
            <div className="text-sm font-medium text-gray-800">{user.department ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Hire Date</div>
            <div className="text-sm font-medium text-gray-800">{user.hireDate ? new Date(user.hireDate).toLocaleDateString() : "—"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Manager</div>
            <div className="text-sm font-medium text-gray-800">{user.manager ? `${user.manager.firstName} ${user.manager.lastName}` : "—"}</div>
          </div>
        </div>
      </div>

      {/* Editable info */}
      <div className="card space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="section-header mb-0">📝 Personal Information</h3>
          {!editing && (
            <button type="button" onClick={() => setEditing(true)} className="btn btn-primary text-xs">✏️ Edit</button>
          )}
        </div>
        {editing ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className="label">First Name</label><input className="input" required value={form.firstName} onChange={set("firstName")} /></div>
              <div><label className="label">Middle Name</label><input className="input" value={form.middleName} onChange={set("middleName")} /></div>
              <div><label className="label">Last Name</label><input className="input" required value={form.lastName} onChange={set("lastName")} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className="label">Phone</label><input className="input" type="tel" value={form.phone} onChange={set("phone")} placeholder="+63 9XX XXX XXXX" /></div>
              <div><label className="label">Emergency Contact</label><input className="input" value={form.emergencyContact} onChange={set("emergencyContact")} placeholder="Name · Relationship · Phone" /></div>
            </div>
            <div>
              <label className="label">Address</label>
              <textarea className="input" rows={2} value={form.address} onChange={set("address")} />
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div><div className="text-xs text-gray-500 uppercase tracking-wide">First Name</div><div className="font-medium text-gray-800">{form.firstName || "—"}</div></div>
            <div><div className="text-xs text-gray-500 uppercase tracking-wide">Middle Name</div><div className="font-medium text-gray-800">{form.middleName || "—"}</div></div>
            <div><div className="text-xs text-gray-500 uppercase tracking-wide">Last Name</div><div className="font-medium text-gray-800">{form.lastName || "—"}</div></div>
            <div><div className="text-xs text-gray-500 uppercase tracking-wide">Phone</div><div className="font-medium text-gray-800">{form.phone || "—"}</div></div>
            <div className="md:col-span-2"><div className="text-xs text-gray-500 uppercase tracking-wide">Emergency Contact</div><div className="font-medium text-gray-800">{form.emergencyContact || "—"}</div></div>
            <div className="md:col-span-3"><div className="text-xs text-gray-500 uppercase tracking-wide">Address</div><div className="font-medium text-gray-800 whitespace-pre-wrap">{form.address || "—"}</div></div>
          </div>
        )}
      </div>

      {editing && (
        <div className="sticky bottom-0 bg-white border-t p-4 flex items-center justify-between -mx-4 px-4 lg:-mx-8 lg:px-8">
          <span className="text-sm text-gray-600">{msg}</span>
          <div className="flex gap-2">
            <button type="button" onClick={cancelEdit} className="btn btn-secondary" disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save Profile"}</button>
          </div>
        </div>
      )}
      {!editing && msg && <div className="text-sm text-emerald-700 bg-emerald-50 p-2 rounded">{msg}</div>}
    </form>
  );
}

function PasswordTab() {
  const [cur, setCur] = useState("");
  const [neu, setNeu] = useState("");
  const [conf, setConf] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(""); setErr("");
    if (neu.length < 8) { setErr("New password must be at least 8 characters."); return; }
    if (neu !== conf) { setErr("New passwords don't match."); return; }
    setBusy(true);
    const res = await fetch("/api/profile/password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: cur, newPassword: neu }),
    });
    setBusy(false);
    if (res.ok) {
      setMsg("✓ Password changed successfully.");
      setCur(""); setNeu(""); setConf("");
    } else {
      setErr(await res.text());
    }
  }

  return (
    <form onSubmit={submit} className="card max-w-md space-y-3">
      <h3 className="section-header">🔒 Change Password</h3>
      <div><label className="label">Current Password</label><input className="input" type="password" required value={cur} onChange={(e) => setCur(e.target.value)} /></div>
      <div><label className="label">New Password</label><input className="input" type="password" required value={neu} onChange={(e) => setNeu(e.target.value)} placeholder="At least 8 characters" /></div>
      <div><label className="label">Confirm New Password</label><input className="input" type="password" required value={conf} onChange={(e) => setConf(e.target.value)} /></div>
      {err && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{err}</div>}
      {msg && <div className="text-sm text-emerald-700 bg-emerald-50 p-2 rounded">{msg}</div>}
      <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Updating…" : "Update Password"}</button>
    </form>
  );
}
