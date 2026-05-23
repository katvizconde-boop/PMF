"use client";
import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SignaturePad, SignatureView } from "./SignaturePad";
import { SubmitPreviewModal } from "./SubmitPreviewModal";
import { MissingItemsTracker } from "./MissingItemsTracker";
import { LinkedText } from "@/lib/linkify";

type Question = { id: string; prompt: string; description?: string | null; inputType: string; options: string | null; required: boolean };
const RATINGS: { v: number; l: string }[] = [
  { v: 1, l: "Unsatisfactory" }, { v: 1.5, l: "Unsatisfactory" },
  { v: 2, l: "Partially Meets" }, { v: 2.5, l: "Partially Meets" },
  { v: 3, l: "Meets Expectations" }, { v: 3.5, l: "Meets Expectations" },
  { v: 4, l: "Exceeds Expectations" }, { v: 4.5, l: "Exceeds Expectations" },
  { v: 5, l: "Significantly Exceeds" },
];
type Section = { id: string; title: string; kind: string; weight: number; questions: Question[] };

export function EvaluationForm({
  assignmentId, sections, responses, authorRole, canEdit, viewerRole, state, recommendation,
  signatures, signatureNames,
}: {
  assignmentId: string;
  sections: Section[];
  responses: Record<string, Record<string, { rating: number | null; comment: string | null }>>;
  authorRole: "EMPLOYEE" | "MANAGER" | "HR";
  canEdit: boolean;
  viewerRole: "HR_ADMIN" | "MANAGER" | "EMPLOYEE";
  state: string;
  recommendation: string | null;
  signatures: {
    employee: { data: string | null; at: string | null };
    manager:  { data: string | null; at: string | null };
    hr:       { data: string | null; at: string | null };
  };
  signatureNames: { employee: string; manager: string; hr: string };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [saving, setSaving] = useState<string>("");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [hasDraftRestore, setHasDraftRestore] = useState(false);
  const lsKey = `pmf.draft.${assignmentId}.${authorRole}`;

  const [form, setForm] = useState(() => {
    const init: Record<string, { rating: string; comment: string }> = {};
    for (const s of sections) for (const q of s.questions) {
      const r = responses[authorRole]?.[q.id];
      init[q.id] = { rating: r?.rating != null ? String(r.rating) : "", comment: r?.comment ?? "" };
    }
    return init;
  });
  const [rec, setRec] = useState(recommendation ?? "");
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // ── Auto-save: restore local draft on mount, save on every change ─────────
  useEffect(() => {
    if (typeof window === "undefined" || !canEdit) return;
    try {
      const raw = localStorage.getItem(lsKey);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (!draft.savedAt || !draft.form) return;
      // Only restore if local is newer than the server response timestamp on this assignment
      const localTime = Number(draft.savedAt) || 0;
      const hasContent = Object.values(draft.form).some((v: any) => v?.rating || v?.comment);
      if (hasContent && localTime > Date.now() - 7 * 24 * 3600 * 1000) {
        if (confirm("We found an unsaved draft from your last session. Restore it?\n\n(Click Cancel to discard the local draft and use the server version.)")) {
          setForm(draft.form);
          if (draft.rec) setRec(draft.rec);
          setHasDraftRestore(true);
        } else {
          localStorage.removeItem(lsKey);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to localStorage on every form/rec change (instant backup)
  useEffect(() => {
    if (typeof window === "undefined" || !canEdit) return;
    try {
      localStorage.setItem(lsKey, JSON.stringify({ form, rec, savedAt: Date.now() }));
    } catch {}
  }, [form, rec, canEdit, lsKey]);

  // Debounced server auto-save every 8 seconds when there are changes
  const dirtyRef = useRef(false);
  const lastServerSnap = useRef<string>("");
  useEffect(() => {
    if (!canEdit) return;
    const snap = JSON.stringify({ form, rec });
    if (lastServerSnap.current === "") lastServerSnap.current = snap; // initial
    else if (lastServerSnap.current !== snap) dirtyRef.current = true;

    const id = setInterval(async () => {
      if (!dirtyRef.current) return;
      const currSnap = JSON.stringify({ form, rec });
      if (currSnap === lastServerSnap.current) return;
      await save({ silent: true });
      lastServerSnap.current = currSnap;
      dirtyRef.current = false;
    }, 8000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, rec, canEdit]);

  // Live "saved Xs ago" ticker
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  function lastSavedLabel() {
    if (saving) return saving;
    if (!lastSavedAt) return "";
    const s = Math.floor((Date.now() - lastSavedAt) / 1000);
    if (s < 5) return "Saved ✓";
    if (s < 60) return `Saved ${s}s ago`;
    const m = Math.floor(s / 60);
    return m < 60 ? `Saved ${m}m ago` : `Saved ${Math.floor(m / 60)}h ago`;
  }

  async function aiDraft(kind: "summary" | "strengths" | "development" | "justification" | "next-steps", questionId?: string) {
    setAiBusy(kind + (questionId ?? ""));
    setAiError(null);
    // Save current state first so the AI sees the latest ratings
    await save();
    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, kind, questionId }),
      });
      const data = await res.json();
      if (!data.ok) {
        setAiError(data.error ?? "AI failed");
        setAiBusy(null);
        return null;
      }
      setAiBusy(null);
      return data.draft as string;
    } catch (e: any) {
      setAiError(e.message ?? "AI failed");
      setAiBusy(null);
      return null;
    }
  }

  async function aiDraftIntoQuestion(questionId: string, kind: "justification") {
    const draft = await aiDraft(kind, questionId);
    if (draft) setForm((f) => ({ ...f, [questionId]: { ...f[questionId], comment: draft } }));
  }

  async function aiDraftIntoText(questionId: string, kind: "strengths" | "development" | "next-steps" | "summary") {
    const draft = await aiDraft(kind);
    if (draft) setForm((f) => ({ ...f, [questionId]: { ...f[questionId], comment: draft } }));
  }

  async function save(opts?: { silent?: boolean }) {
    if (!opts?.silent) setSaving("Saving…");
    const payload = {
      responses: Object.entries(form).map(([questionId, v]) => ({
        questionId,
        rating: v.rating ? parseFloat(v.rating) : null,
        comment: v.comment || null,
      })),
      recommendation: rec || null,
    };
    const res = await fetch(`/api/assignments/${assignmentId}/responses`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    if (res.ok) {
      setLastSavedAt(Date.now());
      if (!opts?.silent) {
        setSaving("Saved ✓");
        setTimeout(() => setSaving(""), 1500);
      } else {
        setSaving("");
      }
    } else {
      setSaving("⚠ Error saving");
      setTimeout(() => setSaving(""), 3000);
    }
    return res.ok;
  }

  // Clear local draft when submission succeeds
  function clearLocalDraft() {
    try { localStorage.removeItem(lsKey); } catch {}
  }

  async function saveSignature(dataUrl: string | null) {
    if (!dataUrl) return;
    const res = await fetch(`/api/assignments/${assignmentId}/sign`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signature: dataUrl }),
    });
    if (!res.ok) alert("Signature save failed: " + (await res.text()));
    setEditingSig(null);
    router.refresh();
  }

  const [previewAction, setPreviewAction] = useState<null | "submit-self" | "submit-manager" | "hr-approve" | "finalize" | "reopen">(null);
  const [editingSig, setEditingSig] = useState<null | "employee" | "manager" | "hr">(null);
  const [submitSuccess, setSubmitSuccess] = useState<null | string>(null);

  async function doTransition(action: "submit-self" | "submit-manager" | "hr-approve" | "finalize" | "reopen") {
    await save();
    return new Promise<void>((resolve) => {
      start(async () => {
        const res = await fetch(`/api/assignments/${assignmentId}/transition`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
        });
        if (res.ok) {
          clearLocalDraft();
          setPreviewAction(null);
          const msg =
            action === "submit-self"     ? "Your self-assessment was submitted successfully. Your supervisor has been notified and will review your responses." :
            action === "submit-manager"  ? "Your evaluation was submitted to HR. They will review and finalize." :
            action === "finalize"        ? "The evaluation has been finalized. The employee and manager will be notified." :
            action === "hr-approve"      ? "Approved successfully." :
            action === "reopen"          ? "The evaluation has been reopened for edits." :
            "Submitted successfully.";
          setSubmitSuccess(msg);
          router.refresh();
        } else {
          alert("Transition failed: " + (await res.text()));
        }
        resolve();
      });
    });
  }

  function submit(action: "submit-self" | "submit-manager" | "hr-approve" | "finalize" | "reopen") {
    // For "reopen" we keep the simple native confirm (HR admin tool)
    if (action === "reopen") {
      if (!confirm("Reopen this finalized PMF for edits? Audit log will record this action.")) return;
      doTransition(action);
      return;
    }
    // For all submits, show the preview modal
    setPreviewAction(action);
  }

  const ownSignature =
    authorRole === "EMPLOYEE" ? signatures.employee.data :
    authorRole === "MANAGER"  ? signatures.manager.data :
    signatures.hr.data;

  const showColumns: Array<"EMPLOYEE" | "MANAGER"> = [];
  if (viewerRole === "HR_ADMIN" || state === "FINALIZED" || authorRole === "MANAGER") showColumns.push("EMPLOYEE", "MANAGER");
  else showColumns.push("EMPLOYEE");

  return (
    <div className="space-y-6">
      {canEdit && (
        <MissingItemsTracker sections={sections} form={form} signed={!!ownSignature} role={authorRole} />
      )}
      {authorRole === "MANAGER" && canEdit && (
        <div className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-3 text-sm text-gray-700">
          <span className="font-semibold">✨ AI assist enabled.</span> Click any <span className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-1.5 py-0.5 rounded">AI Draft</span> button to auto-generate justifications, strengths, or developmental goals from the ratings you've entered. You can edit anything the AI suggests.
        </div>
      )}
      {aiError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex justify-between">
          <span>⚠ {aiError}</span>
          <button onClick={() => setAiError(null)} className="text-red-500 hover:text-red-700">✕</button>
        </div>
      )}
      {sections.map((s) => (
        <div key={s.id} className="card">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-lg font-semibold">{s.title}</h2>
            {s.weight > 0 && <span className="text-xs text-slate-500">Weight: {s.weight}%</span>}
          </div>
          <div className="space-y-5">
            {s.questions.map((q) => {
              const myVal = form[q.id];
              const opts = q.options ? JSON.parse(q.options) as string[] : null;
              return (
                <div key={q.id} id={`q-${q.id}`} className="border-t pt-4 first:border-0 first:pt-0 scroll-mt-24">
                  <div className="font-medium text-sm">{q.prompt}{q.required && <span className="text-red-500">*</span>}</div>
                  {q.description && <div className="text-xs text-gray-500 italic mb-2">{q.description}</div>}

                  {/* Cross-role view (read-only side-by-side) */}
                  {showColumns.length > 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      {showColumns.map((ar) => {
                        if (ar === authorRole && canEdit) return null;
                        const r = responses[ar]?.[q.id];
                        return (
                          <div key={ar} className="rounded border border-slate-200 p-2 bg-slate-50">
                            <div className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">{ar}</div>
                            {q.inputType === "rating" ? (
                              <>
                                <div className="text-sm font-semibold">
                                  {r?.rating != null ? `${r.rating} / 5` : <em className="text-slate-400 font-normal">— no rating —</em>}
                                </div>
                                <div className="text-xs text-gray-600 italic mt-1 whitespace-pre-wrap">
                                  {r?.comment ? <LinkedText text={r.comment} /> : <span className="text-slate-400 not-italic">— no justification —</span>}
                                </div>
                              </>
                            ) : (
                              <div className="text-sm whitespace-pre-wrap">{r?.comment ? <LinkedText text={r.comment} /> : <em className="text-slate-400">—</em>}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Own editable input */}
                  {canEdit && (
                    <div className="space-y-2">
                      {q.inputType === "rating" && (
                        <>
                          <select
                            className="input max-w-md"
                            value={myVal.rating}
                            onChange={(e) => setForm((f) => ({ ...f, [q.id]: { ...f[q.id], rating: e.target.value } }))}
                          >
                            <option value="">Select rating…</option>
                            {RATINGS.map((r) => <option key={r.v} value={r.v}>{r.v} - {r.l}</option>)}
                          </select>
                          <div className="relative">
                            <textarea
                              className="input pr-32" rows={2}
                              placeholder="✍️ Justification / Evidence — required (e.g. specific example, project, behavior observed)"
                              value={myVal.comment}
                              onChange={(e) => setForm((f) => ({ ...f, [q.id]: { ...f[q.id], comment: e.target.value } }))}
                            />
                            {authorRole === "MANAGER" && myVal.rating && (
                              <button
                                type="button"
                                onClick={() => aiDraftIntoQuestion(q.id, "justification")}
                                disabled={aiBusy != null}
                                className="absolute right-2 top-2 text-xs px-2 py-1 rounded-md bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium hover:opacity-90 disabled:opacity-50"
                                title="Use AI to draft a justification based on the rating"
                              >
                                {aiBusy === "justification" + q.id ? "Drafting…" : "✨ AI Draft"}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                      {q.inputType === "text" && (
                        <div className="relative">
                          <textarea
                            className={`input ${authorRole === "MANAGER" ? "pr-32" : ""}`} rows={3}
                            value={myVal.comment}
                            onChange={(e) => setForm((f) => ({ ...f, [q.id]: { ...f[q.id], comment: e.target.value } }))}
                          />
                          {authorRole === "MANAGER" && (() => {
                            const lower = q.prompt.toLowerCase();
                            let kind: "strengths" | "development" | "next-steps" | "summary" | null = null;
                            let label = "";
                            if (/strength/i.test(q.prompt)) { kind = "strengths"; label = "✨ Draft Strengths"; }
                            else if (/develop|growth|improve/i.test(q.prompt)) { kind = "development"; label = "✨ Draft Goals"; }
                            else if (/next quarter|next steps|focus/i.test(q.prompt)) { kind = "next-steps"; label = "✨ Draft Goals"; }
                            else if (/significant|summary|overall|comments/i.test(q.prompt)) { kind = "summary"; label = "✨ Draft Summary"; }
                            if (!kind) return null;
                            return (
                              <button
                                type="button"
                                onClick={() => aiDraftIntoText(q.id, kind!)}
                                disabled={aiBusy != null}
                                className="absolute right-2 top-2 text-xs px-2 py-1 rounded-md bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium hover:opacity-90 disabled:opacity-50"
                                title="Use AI to draft this section based on the ratings you've given"
                              >
                                {aiBusy === kind ? "Drafting…" : label}
                              </button>
                            );
                          })()}
                        </div>
                      )}
                      {q.inputType === "select" && opts && (
                        <>
                          <select
                            className="input"
                            value={myVal.comment}
                            onChange={(e) => {
                              const v = e.target.value;
                              setForm((f) => ({ ...f, [q.id]: { ...f[q.id], comment: v } }));
                              if (s.kind === "RECOMMENDATION") setRec(v);
                            }}
                          >
                            <option value="">Select…</option>
                            {opts.map((o) => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
                          </select>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Signatures */}
      <div className="card">
        <h3 className="section-header">✍️ Signatures</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Employee */}
          <div>
            {authorRole === "EMPLOYEE" && canEdit && (!signatures.employee.data || editingSig === "employee") ? (
              <>
                <SignaturePad label="Employee Signature" existing={signatures.employee.data} onSave={saveSignature} />
                {editingSig === "employee" && (
                  <button type="button" onClick={() => setEditingSig(null)} className="mt-2 text-xs text-gray-500 hover:text-gray-800">← Cancel edit</button>
                )}
              </>
            ) : (
              <>
                <SignatureView dataUrl={signatures.employee.data} label="Employee Signature" signedAt={signatures.employee.at} name={signatureNames.employee} />
                {authorRole === "EMPLOYEE" && canEdit && signatures.employee.data && (
                  <button type="button" onClick={() => setEditingSig("employee")} className="mt-2 text-xs text-primary-700 hover:underline">✏️ Edit / re-sign / upload image</button>
                )}
              </>
            )}
          </div>
          {/* Manager */}
          <div>
            {authorRole === "MANAGER" && canEdit && (!signatures.manager.data || editingSig === "manager") ? (
              <>
                <SignaturePad label="Supervisor Signature" existing={signatures.manager.data} onSave={saveSignature} />
                {editingSig === "manager" && (
                  <button type="button" onClick={() => setEditingSig(null)} className="mt-2 text-xs text-gray-500 hover:text-gray-800">← Cancel edit</button>
                )}
              </>
            ) : (
              <>
                <SignatureView dataUrl={signatures.manager.data} label="Supervisor Signature" signedAt={signatures.manager.at} name={signatureNames.manager} />
                {authorRole === "MANAGER" && canEdit && signatures.manager.data && (
                  <button type="button" onClick={() => setEditingSig("manager")} className="mt-2 text-xs text-primary-700 hover:underline">✏️ Edit / re-sign / upload image</button>
                )}
              </>
            )}
          </div>
          {/* HR */}
          <div>
            {viewerRole === "HR_ADMIN" && state === "HR_REVIEW" && (!signatures.hr.data || editingSig === "hr") ? (
              <>
                <SignaturePad label="HR Signature" existing={signatures.hr.data} onSave={saveSignature} />
                {editingSig === "hr" && (
                  <button type="button" onClick={() => setEditingSig(null)} className="mt-2 text-xs text-gray-500 hover:text-gray-800">← Cancel edit</button>
                )}
              </>
            ) : (
              <>
                <SignatureView dataUrl={signatures.hr.data} label="HR Signature" signedAt={signatures.hr.at} name={signatureNames.hr} />
                {viewerRole === "HR_ADMIN" && state === "HR_REVIEW" && signatures.hr.data && (
                  <button type="button" onClick={() => setEditingSig("hr")} className="mt-2 text-xs text-primary-700 hover:underline">✏️ Edit / re-sign / upload image</button>
                )}
              </>
            )}
          </div>
        </div>
        {canEdit && (
          <p className="text-xs text-gray-500 mt-3 italic">
            ℹ Draw your signature above before submitting. The submit button will be blocked until signed.
          </p>
        )}
      </div>

      {canEdit && (
        <div className="sticky bottom-0 bg-white border-t p-4 flex items-center justify-between -mx-8 px-8">
          <span className="text-sm flex items-center gap-2 text-gray-500">
            <span className={`w-2 h-2 rounded-full ${lastSavedAt ? "bg-emerald-500" : "bg-gray-300"} ${saving === "Saving…" ? "animate-pulse" : ""}`} />
            {lastSavedLabel() || "Not saved yet"}
          </span>
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={() => save()} disabled={pending}>Save Draft</button>
            {authorRole === "EMPLOYEE" && <button className="btn btn-primary" onClick={() => submit("submit-self")} disabled={pending}>Submit Self-Assessment</button>}
            {authorRole === "MANAGER" && <button className="btn btn-primary" onClick={() => submit("submit-manager")} disabled={pending}>Submit to HR</button>}
          </div>
        </div>
      )}
      {viewerRole === "HR_ADMIN" && state === "HR_REVIEW" && (
        <div className="sticky bottom-0 bg-white border-t p-4 flex items-center justify-between -mx-8 px-8">
          <span className="text-sm text-gray-500">HR review — no edits required, just finalize when ready.</span>
          <button className="btn btn-success" onClick={() => submit("finalize")} disabled={pending}>✓ Approve & Finalize</button>
        </div>
      )}
      {viewerRole === "HR_ADMIN" && state === "FINALIZED" && (
        <button className="btn btn-secondary" onClick={() => submit("reopen")} disabled={pending}>Reopen for edits</button>
      )}

      {/* Success modal */}
      {submitSuccess && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSubmitSuccess(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-5 flex items-center gap-3">
              <div className="text-4xl">✅</div>
              <div>
                <h2 className="text-lg font-bold">Submitted successfully!</h2>
                <p className="text-xs text-emerald-50 mt-0.5">Your responses are locked.</p>
              </div>
            </div>
            <div className="p-5 text-sm text-gray-700">
              <p>{submitSuccess}</p>
            </div>
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end">
              <button onClick={() => setSubmitSuccess(null)} className="btn btn-primary text-sm">Got it</button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Preview Modal — shows everything for review before final submit */}
      <SubmitPreviewModal
        open={previewAction !== null}
        onClose={() => setPreviewAction(null)}
        onConfirm={async () => { if (previewAction) await doTransition(previewAction); }}
        sections={sections}
        form={form}
        recommendation={rec}
        signed={!!ownSignature}
        role={authorRole}
      />
    </div>
  );
}
