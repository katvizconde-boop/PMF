"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icons";

export function RemoveTeamMemberButton({
  employeeId,
  employeeName,
}: {
  employeeId: string;
  employeeName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/team/remove-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, reason: reason.trim() || null }),
      });
      if (!res.ok) throw new Error(await res.text());
      setOpen(false);
      router.refresh();
    } catch (ex: any) {
      setErr(ex.message || "Failed to remove");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] text-gray-400 hover:text-red-600 inline-flex items-center gap-1"
        title="Not your team member?"
      >
        <Icon.Trash size={11} /> Not mine
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => !busy && setOpen(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-1 inline-flex items-center gap-2">
              <Icon.Alert size={18} className="text-amber-600" /> Remove {employeeName} from your team?
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              This flags an incorrect team assignment. HR is notified so they can reassign this person to the correct manager.
            </p>
            <ul className="text-xs text-gray-600 mb-4 space-y-1">
              <li className="inline-flex items-center gap-1"><Icon.Check size={12} className="text-emerald-600" /> They disappear from your dashboard right away.</li>
              <li className="inline-flex items-center gap-1"><Icon.Check size={12} className="text-emerald-600" /> HR is notified in-app to reassign them.</li>
              <li className="inline-flex items-center gap-1"><Icon.Check size={12} className="text-emerald-600" /> Their evaluations stay intact.</li>
              <li className="inline-flex items-center gap-1"><Icon.Info size={12} className="text-gray-500" /> Every removal is audit-logged.</li>
            </ul>
            <label className="label">Reason (optional, sent to HR)</label>
            <textarea
              className="input text-sm"
              rows={3}
              maxLength={500}
              placeholder="e.g. This person reports to a different team lead."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
            />
            {err && <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded p-2 mt-3">{err}</div>}
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" className="btn btn-secondary text-sm" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn btn-danger text-sm" disabled={busy}>
                {busy ? "Removing…" : "Remove & notify HR"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
