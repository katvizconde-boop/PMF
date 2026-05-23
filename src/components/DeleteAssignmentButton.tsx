"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteAssignmentButton({
  assignmentId, employeeName, cycleName,
}: { assignmentId: string; employeeName: string; cycleName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function doDelete() {
    setBusy(true);
    setErr(null);
    const res = await fetch(`/api/assignments/${assignmentId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard?error=assignment-deleted");
    } else {
      setErr(await res.text());
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-danger text-xs">
        🗑 Delete evaluation
      </button>

      {open && (
        <div className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !busy && setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-rose-500 text-white p-5">
              <div className="flex items-center gap-3">
                <div className="text-3xl">⚠️</div>
                <div>
                  <h2 className="text-lg font-bold">Permanently delete this evaluation?</h2>
                  <p className="text-sm text-red-50">This action cannot be undone.</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-sm text-gray-700">
              <p>
                You're about to delete <strong>{employeeName}</strong>'s evaluation for <strong>{cycleName}</strong>.
              </p>
              <ul className="bg-red-50 border border-red-100 rounded-lg p-3 space-y-1 text-xs text-red-700">
                <li>• All ratings, comments, and justifications will be erased</li>
                <li>• Signatures and recommendations will be removed</li>
                <li>• The action is recorded in the audit log</li>
                <li>• <strong>This cannot be recovered.</strong></li>
              </ul>

              <div>
                <label className="label">Type <code className="bg-gray-100 px-1.5 py-0.5 rounded text-red-600 font-bold">DELETE</code> to confirm</label>
                <input
                  className="input"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  disabled={busy}
                />
              </div>

              {err && <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-2.5">⚠ {err}</div>}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
              <button onClick={() => setOpen(false)} disabled={busy} className="btn btn-secondary text-sm">Cancel</button>
              <button
                onClick={doDelete}
                disabled={confirmText !== "DELETE" || busy}
                className="btn btn-danger text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy ? "Deleting…" : "🗑 Permanently delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
