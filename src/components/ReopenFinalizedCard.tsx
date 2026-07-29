"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icons";

type Target = "MANAGER_REVIEW" | "SELF_ASSESS";

export function ReopenFinalizedCard({
  assignmentId,
  employeeName,
  cycleName,
  state,
  allowedTargets = ["MANAGER_REVIEW", "SELF_ASSESS"],
}: {
  assignmentId: string;
  employeeName: string;
  cycleName: string;
  state?: string;
  allowedTargets?: Target[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Target | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function reopen(target: Target) {
    const targetLabel = target === "SELF_ASSESS" ? "back to the EMPLOYEE" : "back to the MANAGER";
    const ok = confirm(
      `Reopen ${employeeName}'s ${cycleName} PMF ${targetLabel}?\n\n` +
      (target === "SELF_ASSESS"
        ? `• State moves to Self-Assessment\n• Employee can edit their responses\n• Manager will need to re-submit after\n• Manager-side signature and submission are cleared\n• Notified in-app · audit-logged`
        : `• State moves to Manager Review\n• Manager can update ratings, comments, signature, and recommendation\n• Notified in-app · audit-logged`)
    );
    if (!ok) return;
    setBusy(target);
    setErr(null);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reopen", target }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.refresh();
    } catch (e: any) {
      setErr(e.message || "Failed to reopen");
      setBusy(null);
    }
  }

  const stateLabel = state === "FINALIZED" ? "finalized" : state === "HR_REVIEW" ? "awaiting HR approval" : state === "MANAGER_REVIEW" ? "in Manager Review" : "locked";

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 mb-4">
      <div className="flex items-start gap-3 flex-wrap">
        <Icon.Lock size={20} className="text-amber-700 mt-0.5 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-amber-900">This PMF is {stateLabel} (HR only)</h3>
          <p className="text-sm text-amber-800 mt-0.5">
            Need corrections? Reopen for edits. All actions are audit-logged and the affected party is notified in-app.
          </p>
          {err && <p className="text-xs text-red-700 mt-2">{err}</p>}
          <div className="mt-3 flex gap-2 flex-wrap">
            {allowedTargets.includes("MANAGER_REVIEW") && (
              <button
                onClick={() => reopen("MANAGER_REVIEW")}
                disabled={busy !== null}
                className="btn btn-secondary text-sm inline-flex items-center gap-1"
                title="Send back to Manager Review"
              >
                {busy === "MANAGER_REVIEW" ? "Reopening…" : <><Icon.Users size={14} /> Reopen for Manager</>}
              </button>
            )}
            {allowedTargets.includes("SELF_ASSESS") && (
              <button
                onClick={() => reopen("SELF_ASSESS")}
                disabled={busy !== null}
                className="btn btn-secondary text-sm inline-flex items-center gap-1"
                title="Send back to Self-Assessment (Employee)"
              >
                {busy === "SELF_ASSESS" ? "Reopening…" : <><Icon.User size={14} /> Reopen for Employee</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
