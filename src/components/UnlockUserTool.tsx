"use client";
import { useState } from "react";
import { Icon } from "./Icons";

export function UnlockUserTool() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setErr(null);
    setResults(null);
    setFlash(null);
    try {
      const res = await fetch(`/api/admin/diag-user?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) throw new Error(await res.text());
      const d = await res.json();
      setResults(d.users ?? []);
    } catch (e: any) {
      setErr(e.message || "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  async function unlock(email: string, newPassword?: string) {
    const pretty = newPassword ? `reset password for ${email}` : `unlock ${email}`;
    if (!confirm(`Confirm: ${pretty}?`)) return;
    setActing(email);
    setErr(null);
    setFlash(null);
    try {
      const res = await fetch("/api/admin/unlock-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      if (!res.ok) throw new Error(await res.text());
      const d = await res.json();
      setFlash(d.passwordReset
        ? `Password reset for ${email}. Tell them the new password — they'll be forced to change it on first login.`
        : `${email} unlocked. They can try logging in again now.`);
      await search();
    } catch (e: any) {
      setErr(e.message || "Action failed");
    } finally {
      setActing(null);
    }
  }

  async function unlockOnly(email: string) {
    await unlock(email);
  }

  async function resetPassword(email: string) {
    const pw = prompt(`New password for ${email}\n(min 8 chars; they'll be forced to change on next login)`, "Welcome2026!");
    if (!pw) return;
    if (pw.length < 8) { alert("Password must be at least 8 characters."); return; }
    await unlock(email, pw);
  }

  return (
    <div className="card">
      <h3 className="section-header inline-flex items-center gap-1"><Icon.Lock size={16} /> Unlock User / Reset Password</h3>
      <p className="text-xs text-gray-500 mb-4">
        For users who can't log in. Use this when an account is locked (too many wrong passwords) or the user forgot their password.
        Resetting forces them to set a new password on their next login.
      </p>

      <form onSubmit={search} className="flex gap-2 mb-4 flex-wrap">
        <input
          className="input flex-1 min-w-[220px] text-sm"
          placeholder="Search by name or email (e.g. martin.devera)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn btn-primary text-sm" disabled={loading || !query.trim()}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {err && <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded p-2 mb-3">{err}</div>}
      {flash && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded p-2 mb-3">{flash}</div>}

      {results && results.length === 0 && (
        <p className="text-sm text-gray-400 italic text-center py-4">No users matched "{query}".</p>
      )}

      {results && results.length > 0 && (
        <div className="space-y-2">
          {results.map((u: any) => {
            const lockedAt = u.lockedUntil ? new Date(u.lockedUntil) : null;
            const stillLocked = lockedAt && lockedAt.getTime() > Date.now();
            const fails = Number(u.failedLoginCount ?? 0);
            return (
              <div key={u.id} className="border border-gray-200 rounded-lg p-3 hover:border-primary-200 transition">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-800">{u.name}</div>
                    <div className="text-xs text-gray-500 break-all">{u.email}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {u.role} · {u.company ?? "no-co"}{u.department ? ` · ${u.department}` : ""}
                    </div>
                    <div className="flex gap-3 mt-2 text-xs flex-wrap">
                      {stillLocked && (
                        <span className="chip bg-red-100 text-red-700">
                          LOCKED until {lockedAt!.toLocaleString()}
                        </span>
                      )}
                      {fails > 0 && (
                        <span className="chip bg-amber-100 text-amber-800">
                          {fails} failed attempt{fails === 1 ? "" : "s"}
                        </span>
                      )}
                      {u.mustChangePassword && (
                        <span className="chip bg-blue-100 text-blue-700">Must change password</span>
                      )}
                      {!u.hasPasswordHash && (
                        <span className="chip bg-gray-200 text-gray-700">No password set</span>
                      )}
                      {!stillLocked && fails === 0 && !u.mustChangePassword && u.hasPasswordHash && (
                        <span className="chip bg-emerald-100 text-emerald-700">Account healthy</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      type="button"
                      className="btn btn-secondary text-xs"
                      onClick={() => unlockOnly(u.email)}
                      disabled={acting === u.email}
                      title="Clear lockout and reset failed-login counter"
                    >
                      {acting === u.email ? "Working…" : "Unlock"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary text-xs"
                      onClick={() => resetPassword(u.email)}
                      disabled={acting === u.email}
                      title="Set a new password (forces change on next login)"
                    >
                      Reset password
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
