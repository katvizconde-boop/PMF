"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icons";

type Member = {
  id: string;
  firstName: string;
  lastName: string;
  position: string | null;
  department: string | null;
};

export function TeamMembersCard({ members }: { members: Member[] }) {
  const router = useRouter();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  function toggle(id: string) {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id); else next.add(id);
    setPicked(next);
  }
  function tickAll() { setPicked(new Set(members.map((m) => m.id))); }
  function clear() { setPicked(new Set()); }

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    if (picked.size === 0) return;
    setBusy(true);
    setErr(null);
    setFlash(null);

    let ok = 0;
    let failed = 0;
    for (const id of picked) {
      try {
        const res = await fetch("/api/team/remove-member", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId: id, reason: reason.trim() || null }),
        });
        if (!res.ok) throw new Error(await res.text());
        ok++;
      } catch {
        failed++;
      }
    }

    setBusy(false);
    if (failed === 0) {
      setFlash(`✓ Flagged ${ok} team member${ok === 1 ? "" : "s"}. HR has been notified.`);
      setPicked(new Set());
      setOpen(false);
      setReason("");
      setTimeout(() => router.refresh(), 900);
    } else {
      setErr(`${failed} of ${picked.size} could not be flagged. Please try again or contact HR.`);
    }
  }

  return (
    <>
      <div className="card-flush mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 inline-flex items-center gap-1">
              <Icon.Users size={16} /> Team Members
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Open a team member for 1:1 notes, career, goals. Or tick people not actually on your team and flag them to HR in bulk.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button type="button" className="btn btn-secondary text-xs" onClick={tickAll} disabled={members.length === 0}>Tick all</button>
            <button type="button" className="btn btn-secondary text-xs" onClick={clear} disabled={picked.size === 0}>Clear</button>
            <button
              type="button"
              className="btn btn-danger text-xs inline-flex items-center gap-1"
              onClick={() => setOpen(true)}
              disabled={picked.size === 0}
            >
              <Icon.Trash size={12} /> Not mine ({picked.size})
            </button>
          </div>
        </div>

        {flash && <div className="mx-5 mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded p-2">{flash}</div>}

        <ul className="divide-y divide-gray-100">
          {members.map((m) => {
            const isPicked = picked.has(m.id);
            return (
              <li key={m.id} className={`px-5 py-3 flex items-center gap-3 hover:bg-gray-50 ${isPicked ? "bg-red-50/40" : ""}`}>
                <input
                  type="checkbox"
                  checked={isPicked}
                  onChange={() => toggle(m.id)}
                  className="flex-shrink-0"
                  title="Flag as not on my team"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-800 truncate">{m.firstName} {m.lastName}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {m.position ?? "—"}{m.department ? ` · ${m.department}` : ""}
                  </div>
                </div>
                <a href={`/team/${m.id}`} className="btn btn-secondary text-xs inline-flex items-center gap-1 flex-shrink-0">
                  <Icon.Calendar size={12} /> 1:1 Notes
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => !busy && setOpen(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={apply}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-1 inline-flex items-center gap-2">
              <Icon.Alert size={18} className="text-amber-600" /> Flag {picked.size} team member{picked.size === 1 ? "" : "s"}?
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              You're telling HR these people are not actually on your team.
            </p>
            <ul className="text-xs text-gray-600 mb-4 space-y-1">
              <li className="inline-flex items-center gap-1"><Icon.Check size={12} className="text-emerald-600" /> They disappear from your dashboard immediately.</li>
              <li className="inline-flex items-center gap-1"><Icon.Check size={12} className="text-emerald-600" /> HR is notified in-app to reassign each of them.</li>
              <li className="inline-flex items-center gap-1"><Icon.Check size={12} className="text-emerald-600" /> Their PMFs and evaluations stay intact.</li>
              <li className="inline-flex items-center gap-1"><Icon.Info size={12} className="text-gray-500" /> Every flag is audit-logged.</li>
            </ul>
            <label className="label">Reason (optional, sent to HR)</label>
            <textarea
              className="input text-sm"
              rows={3}
              maxLength={500}
              placeholder="e.g. Wrong team assignment — they report to another lead."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
            />
            {err && <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded p-2 mt-3">{err}</div>}
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" className="btn btn-secondary text-sm" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn btn-danger text-sm" disabled={busy}>
                {busy ? "Flagging…" : `Flag ${picked.size} & notify HR`}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
