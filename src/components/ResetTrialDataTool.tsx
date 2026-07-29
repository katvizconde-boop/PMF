"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icons";

type DeletedCounts = Record<string, number>;

export function ResetTrialDataTool() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; deleted?: DeletedCounts; message?: string } | null>(null);

  const REQUIRED_PHRASE = "RESET TRIAL DATA";

  async function doReset() {
    if (confirmText !== REQUIRED_PHRASE) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/reset-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: REQUIRED_PHRASE }),
      });
      if (!res.ok) {
        setErr(await res.text());
      } else {
        const data = await res.json();
        setResult(data);
        setConfirmText("");
      }
    } catch (e: any) {
      setErr(e.message ?? "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  function close() {
    setOpen(false);
    setConfirmText("");
    setErr(null);
    if (result) {
      router.refresh();
      setResult(null);
    }
  }

  return (
    <>
      <div className="card border-red-200 bg-red-50/40">
        <h3 className="section-header text-red-700 inline-flex items-center gap-2">
          <Icon.Alert size={18} className="text-red-600" />
          Reset trial data (production rollout cleanup)
        </h3>
        <p className="text-sm text-gray-700 mb-4">
          Use this <strong>once</strong> before the production rollout to wipe all evaluation data created during the trial period. Users, templates, cycles, and departments are preserved — only the PMF instances and their answers are removed.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-sm">
          <div className="rounded-lg border border-red-200 bg-white p-3">
            <div className="font-bold text-red-700 mb-1 inline-flex items-center gap-1">
              <Icon.Trash size={14} /> Will be deleted
            </div>
            <ul className="text-xs text-gray-700 list-disc ml-4 space-y-0.5">
              <li>All PMF assignments</li>
              <li>All ratings, comments, justifications</li>
              <li>All signatures</li>
              <li>All notifications</li>
              <li>All kudos, goals, PIPs, 1:1 notes, documents</li>
            </ul>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-white p-3">
            <div className="font-bold text-emerald-700 mb-1 inline-flex items-center gap-1">
              <Icon.Check size={14} /> Will be preserved
            </div>
            <ul className="text-xs text-gray-700 list-disc ml-4 space-y-0.5">
              <li>All user accounts + passwords</li>
              <li>All evaluation templates</li>
              <li>All evaluation cycles</li>
              <li>All departments + companies</li>
              <li>Audit log (immutable)</li>
            </ul>
          </div>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="btn btn-danger inline-flex items-center gap-2 text-sm"
        >
          <Icon.Alert size={14} />
          Reset trial data...
        </button>
      </div>

      {/* Confirmation modal */}
      {open && (
        <div className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !busy && close()}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-rose-500 text-white p-5">
              <div className="flex items-center gap-3">
                <Icon.Alert size={32} />
                <div>
                  <h2 className="text-lg font-bold">Permanently wipe all trial evaluation data?</h2>
                  <p className="text-sm text-red-50">This is irreversible. Use only before production rollout.</p>
                </div>
              </div>
            </div>

            {/* Body */}
            {!result ? (
              <div className="p-5 space-y-4 text-sm text-gray-700">
                <p>
                  This will delete <strong>every PMF assignment, every response, every signature, and every notification</strong> from the database.
                </p>
                <ul className="bg-red-50 border border-red-100 rounded-lg p-3 space-y-1 text-xs text-red-700">
                  <li>• User accounts will remain — nobody needs to re-register</li>
                  <li>• Templates and cycles will remain — HR setup is preserved</li>
                  <li>• The audit log will record this action permanently</li>
                  <li>• <strong>This cannot be undone.</strong></li>
                </ul>

                <div>
                  <label className="label">
                    Type <code className="bg-gray-100 px-1.5 py-0.5 rounded text-red-600 font-bold">{REQUIRED_PHRASE}</code> exactly to confirm
                  </label>
                  <input
                    className="input"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={REQUIRED_PHRASE}
                    disabled={busy}
                    autoFocus
                  />
                </div>

                {err && (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-2.5 inline-flex items-center gap-1">
                    <Icon.Alert size={14} className="text-red-700" /> {err}
                  </div>
                )}
              </div>
            ) : (
              /* Success result */
              <div className="p-5 space-y-4 text-sm text-gray-700">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                  <div className="font-bold text-emerald-800 mb-2 inline-flex items-center gap-1">
                    <Icon.Check size={16} className="text-emerald-700" /> Trial data reset successfully
                  </div>
                  <p className="text-xs text-emerald-700 mb-3">{result.message}</p>
                  {result.deleted && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(result.deleted).map(([table, count]) => (
                        <div key={table} className="flex justify-between bg-white rounded px-2 py-1 border border-emerald-100">
                          <span className="text-gray-600 capitalize">{table}:</span>
                          <span className="font-mono font-bold text-emerald-700">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  The app is now clean and ready for production rollout. You can close this dialog.
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
              <button
                onClick={close}
                disabled={busy}
                className="btn btn-secondary text-sm"
              >
                {result ? "Close" : "Cancel"}
              </button>
              {!result && (
                <button
                  onClick={doReset}
                  disabled={confirmText !== REQUIRED_PHRASE || busy}
                  className="btn btn-danger text-sm disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  <Icon.Alert size={14} />
                  {busy ? "Wiping data..." : "Permanently delete"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
