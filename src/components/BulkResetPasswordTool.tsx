"use client";
import { useState } from "react";
import { Icon } from "./Icons";

export function BulkResetPasswordTool({ companies }: { companies: string[] }) {
  const [company, setCompany] = useState<string>(companies[0] ?? "");
  const [password, setPassword] = useState("Welcome2026!");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<any | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run(dryRun: boolean) {
    if (password.length < 8) { setErr("Password must be at least 8 characters."); return; }
    setBusy(true); setErr(null); setFlash(null);
    try {
      const res = await fetch("/api/admin/bulk-reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, password, dryRun }),
      });
      if (!res.ok) throw new Error(await res.text());
      const d = await res.json();
      if (dryRun) {
        setPreview(d);
      } else {
        setFlash(`✓ Password set for ${d.count} user${d.count === 1 ? "" : "s"} at ${company}. Announce the password to them — they'll be forced to change it on first login.`);
        setPreview(null);
      }
    } catch (e: any) {
      setErr(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmApply() {
    if (!preview) return;
    if (!confirm(`Set password "${password}" for ${preview.count} user${preview.count === 1 ? "" : "s"} at ${company}?\n\nAll of them will be forced to change it on first login. Their existing sessions will still work until they log out.`)) return;
    await run(false);
  }

  return (
    <div className="card">
      <h3 className="section-header inline-flex items-center gap-1"><Icon.Lock size={16} /> Bulk Set Password (Rollout Wave)</h3>
      <p className="text-xs text-gray-500 mb-4">
        Set ONE password for every active user in a company. Everyone is forced to change it on their first login.
        Use this at wave launch so you can announce a single password to all users instead of tracking per-user temp passwords.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="label">Company</label>
          <select className="input text-sm" value={company} onChange={(e) => { setCompany(e.target.value); setPreview(null); }}>
            {companies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label">Password (they'll change it after login)</label>
          <input className="input text-sm" value={password} onChange={(e) => { setPassword(e.target.value); setPreview(null); }} />
          <p className="text-[11px] text-gray-500 mt-1">Tip: choose something memorable and easy to type, e.g. <code>Welcome2026!</code></p>
        </div>
      </div>

      {err && <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded p-2 mt-3">{err}</div>}
      {flash && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded p-2 mt-3">{flash}</div>}

      {preview && (
        <div className="mt-4 border border-amber-300 bg-amber-50 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>Preview:</strong> {preview.count} user{preview.count === 1 ? "" : "s"} will have their password set to <code className="bg-white px-1 rounded">{password}</code>.
          </p>
          {preview.sample?.length > 0 && (
            <ul className="text-xs text-amber-900 mt-2 max-h-40 overflow-y-auto space-y-0.5">
              {preview.sample.map((u: any) => (
                <li key={u.email}>· {u.name} <span className="text-amber-700">&lt;{u.email}&gt;</span> — {u.role}</li>
              ))}
              {preview.count > preview.sample.length && (
                <li className="italic">…and {preview.count - preview.sample.length} more</li>
              )}
            </ul>
          )}
          <div className="mt-3 flex justify-end gap-2">
            <button className="btn btn-secondary text-xs" onClick={() => setPreview(null)}>Cancel</button>
            <button className="btn btn-primary text-xs" onClick={confirmApply} disabled={busy}>
              {busy ? "Applying…" : `Yes, set password for ${preview.count} user${preview.count === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
      )}

      {!preview && (
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-secondary text-sm" onClick={() => run(true)} disabled={busy || !company}>
            {busy ? "Checking…" : "Preview affected users"}
          </button>
        </div>
      )}
    </div>
  );
}
