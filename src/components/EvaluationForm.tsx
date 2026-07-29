"use client";
import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SignaturePad, SignatureView } from "./SignaturePad";
import { SubmitPreviewModal } from "./SubmitPreviewModal";
import { MissingItemsTracker } from "./MissingItemsTracker";
import { LinkedText } from "@/lib/linkify";
import { Icon } from "./Icons";

type Question = { id: string; prompt: string; description?: string | null; inputType: string; options: string | null; required: boolean };
const RATINGS: { v: number; l: string }[] = [
  { v: 1, l: "Unsatisfactory" }, { v: 1.5, l: "Unsatisfactory" },
  { v: 2, l: "Partially Meets" }, { v: 2.5, l: "Partially Meets" },
  { v: 3, l: "Meets Expectations" }, { v: 3.5, l: "Meets Expectations" },
  { v: 4, l: "Exceeds Expectations" }, { v: 4.5, l: "Exceeds Expectations" },
  { v: 5, l: "Significantly Exceeds" },
];
type Section = { id: string; title: string; kind: string; weight: number; questions: Question[] };

type ProjectRow = { keyResponsibility: string; activitiesProjects: string; remarks: string };

export function EvaluationForm({
  assignmentId, sections, responses, authorRole, canEdit, viewerRole, state, recommendation,
  privateRecommendation, privateRecommendationNotes, keyProjectActivities,
  canPreFillKeyResp = false,
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
  /** Manager's confidential recommendation — server already strips when viewer = EMPLOYEE. */
  privateRecommendation?: string | null;
  privateRecommendationNotes?: string | null;
  /** JSON-encoded array of {keyResponsibility, activitiesProjects, remarks}. */
  keyProjectActivities?: string | null;
  /** Manager may pre-fill the Key Responsibilities column even outside of MANAGER_REVIEW. */
  canPreFillKeyResp?: boolean;
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
  const [privateRec, setPrivateRec] = useState(privateRecommendation ?? "");
  const [privateRecNotes, setPrivateRecNotes] = useState(privateRecommendationNotes ?? "");

  // ── Key Projects & Activities (Part I table) ──
  // Editable by employee during SELF_ASSESS; read-only for manager + HR after.
  const initialProjectRows: ProjectRow[] = (() => {
    try {
      const parsed = keyProjectActivities ? JSON.parse(keyProjectActivities) : null;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
    // Default: 3 empty rows for first-time fill
    return [
      { keyResponsibility: "", activitiesProjects: "", remarks: "" },
      { keyResponsibility: "", activitiesProjects: "", remarks: "" },
      { keyResponsibility: "", activitiesProjects: "", remarks: "" },
    ];
  })();
  const [projectRows, setProjectRows] = useState<ProjectRow[]>(initialProjectRows);
  // EMPLOYEE fills the whole row during SELF_ASSESS.
  // MANAGER may optionally pre-fill the Key Responsibility column during MANAGER_REVIEW.
  const canEditProjects       = authorRole === "EMPLOYEE" && canEdit;
  // Manager can edit Key Responsibilities in SELF_ASSESS (pre-fill) AND MANAGER_REVIEW
  const canEditKeyRespOnly    = authorRole === "MANAGER"  && (canEdit || canPreFillKeyResp);
  const canEditAnyProjectCell = canEditProjects || canEditKeyRespOnly;

  function updateProjectRow(idx: number, field: keyof ProjectRow, value: string) {
    setProjectRows((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }
  function addProjectRow() {
    setProjectRows((rows) => [...rows, { keyResponsibility: "", activitiesProjects: "", remarks: "" }]);
  }
  function removeProjectRow(idx: number) {
    setProjectRows((rows) => rows.filter((_, i) => i !== idx));
  }
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Whether to show the private recommendation card. Server already strips
  // privateRecommendation from the payload when viewer is EMPLOYEE — this is
  // an additional client-side safeguard.
  const canSeePrivateRec = viewerRole !== "EMPLOYEE";
  const canEditPrivateRec = authorRole === "MANAGER" && canEdit;

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
    if (s < 5) return "Saved";
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

  // Pre-fill save: manager saves ONLY the Key Responsibilities column (during SELF_ASSESS,
  // before the employee has submitted). Server merges into existing rows without touching
  // Activities / Remarks / responses.
  async function saveKeyRespOnly() {
    setSaving("Saving Key Responsibilities…");
    const payload = {
      responses: [],
      keyProjectActivities: JSON.stringify(
        projectRows.filter((r) => r.keyResponsibility || r.activitiesProjects || r.remarks)
      ),
    };
    const res = await fetch(`/api/assignments/${assignmentId}/responses`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    if (res.ok) {
      setLastSavedAt(Date.now());
      setSaving("Saved");
      setTimeout(() => setSaving(""), 1500);
      router.refresh();
    } else {
      setSaving("Error saving");
      alert("Could not save: " + (await res.text()));
      setTimeout(() => setSaving(""), 3000);
    }
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
      // Server only persists these for MANAGER role — sending from any other role is a no-op
      privateRecommendation: canEditPrivateRec ? (privateRec || null) : undefined,
      privateRecommendationNotes: canEditPrivateRec ? (privateRecNotes || null) : undefined,
      // Key Projects table — EMPLOYEE saves all columns; MANAGER's save is merged server-side
      keyProjectActivities: canEditAnyProjectCell
        ? JSON.stringify(projectRows.filter((r) => r.keyResponsibility || r.activitiesProjects || r.remarks))
        : undefined,
    };
    const res = await fetch(`/api/assignments/${assignmentId}/responses`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    if (res.ok) {
      setLastSavedAt(Date.now());
      if (!opts?.silent) {
        setSaving("Saved");
        setTimeout(() => setSaving(""), 1500);
      } else {
        setSaving("");
      }
    } else {
      setSaving("Error saving");
      setTimeout(() => setSaving(""), 3000);
    }
    return res.ok;
  }

  // Clear local draft when submission succeeds
  function clearLocalDraft() {
    try { localStorage.removeItem(lsKey); } catch {}
  }

  async function saveSignature(payload: { dataUrl: string | null; name: string | null }) {
    if (!payload.dataUrl) return;
    const res = await fetch(`/api/assignments/${assignmentId}/sign`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signature: payload.dataUrl, name: payload.name }),
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
  // Show BOTH columns whenever the manager side is visible to the viewer:
  //  - HR always sees both
  //  - Employees see the manager's side once the PMF reaches HR_REVIEW or FINALIZED
  //    (before that, the manager is still writing — hide to avoid mid-edit peeks)
  //  - Managers always see both (their editable column becomes an input)
  if (viewerRole === "HR_ADMIN" || state === "FINALIZED" || state === "HR_REVIEW" || authorRole === "MANAGER") {
    showColumns.push("EMPLOYEE", "MANAGER");
  } else {
    showColumns.push("EMPLOYEE");
  }

  return (
    <div className="space-y-6">
      {canEdit && (
        <MissingItemsTracker sections={sections} form={form} signed={!!ownSignature} role={authorRole} />
      )}
      {authorRole === "MANAGER" && canEdit && (
        <div className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-3 text-sm text-gray-700">
          <span className="font-semibold inline-flex items-center gap-1"><Icon.Sparkle size={14} /> AI assist enabled.</span> Click any <span className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-1.5 py-0.5 rounded">AI Draft</span> button to auto-generate justifications, strengths, or developmental goals from the ratings you've entered. You can edit anything the AI suggests.
        </div>
      )}
      {aiError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex justify-between">
          <span className="inline-flex items-center gap-1"><Icon.Alert size={14} className="text-amber-600" /> {aiError}</span>
          <button onClick={() => setAiError(null)} className="text-red-500 hover:text-red-700"><Icon.X size={14} /></button>
        </div>
      )}
      {/* ── PART I — KEY PROJECTS & ACTIVITIES ── */}
      {/* Styled to match the look of regular template sections (PART I: Contributions, etc.) */}
      <div className="card">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-semibold">Part I: Key Projects & Activities</h2>
          {canEditProjects && (
            <span className="text-xs text-slate-500 italic">Fill in what you worked on this cycle</span>
          )}
          {canEditKeyRespOnly && (
            <span className="text-xs text-slate-500 italic">Optional: pre-fill Key Responsibilities for your team member</span>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">
            Key Responsibilities, Activities / Projects, and Remarks
          </div>
          <div className="text-xs text-gray-500 italic mb-3">
            {canEditKeyRespOnly
              ? "Optional — you may set the Key Responsibilities so your team member only needs to fill in the Activities/Projects and Remarks. If you leave it blank, the employee fills the whole row themselves."
              : "Use this table to summarize your accountabilities, the work you delivered, and any context your reviewer should know. Add as many rows as you need."}
          </div>

          <div className="table-scroll">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-700 w-1/4">
                    Key Responsibilities
                  </th>
                  <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-700 w-2/5">
                    Activities / Projects
                  </th>
                  <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                    Remarks
                  </th>
                  {canEditAnyProjectCell && (
                    <th className="border border-gray-300 bg-gray-50 px-2 py-2 text-center text-xs font-semibold text-gray-700 w-10"></th>
                  )}
                </tr>
              </thead>
              <tbody>
                {projectRows.map((row, idx) => (
                  <tr key={idx} className="align-top">
                    {/* Key Responsibility — editable by BOTH employee (during SELF_ASSESS) and manager (during MANAGER_REVIEW) */}
                    <td className="border border-gray-300 p-0">
                      {(canEditProjects || canEditKeyRespOnly) ? (
                        <textarea
                          className="w-full p-2 text-sm border-0 outline-none focus:bg-primary-50/30 resize-y"
                          rows={3}
                          placeholder={canEditKeyRespOnly ? "Optional: e.g., Manage client accounts" : "e.g., Manage client accounts"}
                          value={row.keyResponsibility}
                          onChange={(e) => updateProjectRow(idx, "keyResponsibility", e.target.value)}
                        />
                      ) : (
                        <div className="p-2 text-sm whitespace-pre-wrap min-h-[3rem]">
                          {row.keyResponsibility || <em className="text-gray-300">—</em>}
                        </div>
                      )}
                    </td>
                    {/* Activities / Projects — EMPLOYEE only */}
                    <td className="border border-gray-300 p-0">
                      {canEditProjects ? (
                        <textarea
                          className="w-full p-2 text-sm border-0 outline-none focus:bg-primary-50/30 resize-y"
                          rows={3}
                          placeholder="e.g., Led Q1 brand refresh — delivered Mar 20"
                          value={row.activitiesProjects}
                          onChange={(e) => updateProjectRow(idx, "activitiesProjects", e.target.value)}
                        />
                      ) : (
                        <div className="p-2 text-sm whitespace-pre-wrap min-h-[3rem]">
                          {row.activitiesProjects || <em className="text-gray-300">—</em>}
                        </div>
                      )}
                    </td>
                    {/* Remarks — EMPLOYEE only */}
                    <td className="border border-gray-300 p-0">
                      {canEditProjects ? (
                        <textarea
                          className="w-full p-2 text-sm border-0 outline-none focus:bg-primary-50/30 resize-y"
                          rows={3}
                          placeholder="Notes, blockers, outcomes…"
                          value={row.remarks}
                          onChange={(e) => updateProjectRow(idx, "remarks", e.target.value)}
                        />
                      ) : (
                        <div className="p-2 text-sm whitespace-pre-wrap min-h-[3rem]">
                          {row.remarks || <em className="text-gray-300">—</em>}
                        </div>
                      )}
                    </td>
                    {canEditAnyProjectCell && (
                      <td className="border border-gray-300 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => removeProjectRow(idx)}
                          disabled={projectRows.length <= 1}
                          className="text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed p-1 transition"
                          title="Remove this row"
                        >
                          <Icon.Trash size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {canEditAnyProjectCell && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={addProjectRow}
                className="btn btn-secondary text-sm inline-flex items-center gap-1"
              >
                <Icon.Plus size={14} /> Add another row
              </button>
              {/* Manager pre-fill mode: employee hasn't submitted yet, autosave is off,
                  so provide an explicit save button for the Key Responsibilities column. */}
              {canEditKeyRespOnly && !canEdit && (
                <button
                  type="button"
                  onClick={saveKeyRespOnly}
                  className="btn btn-primary text-sm inline-flex items-center gap-1"
                >
                  <Icon.Check size={14} /> Save Key Responsibilities
                </button>
              )}
            </div>
          )}

          {!canEditProjects && projectRows.every((r) => !r.keyResponsibility && !r.activitiesProjects && !r.remarks) && (
            <p className="text-sm text-gray-400 italic text-center py-4">
              The employee did not fill in this section.
            </p>
          )}
        </div>
      </div>

      {sections
        // ── Hide the public RECOMMENDATION section entirely ──
        // Replaced by the Private Manager Recommendation feature (visible to manager + HR only).
        // The section data is preserved in templates but is no longer rendered anywhere.
        .filter((s) => s.kind !== "RECOMMENDATION")
        .map((s) => (
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

                  {/* Cross-role view (read-only side-by-side).
                      Also renders when only ONE column is shown but the user
                      can no longer edit — otherwise employees who've already
                      submitted their self-assessment would see blank fields. */}
                  {(showColumns.length > 1 || !canEdit) && (
                    <div className={`grid grid-cols-1 ${showColumns.length > 1 ? "md:grid-cols-2" : ""} gap-3 mb-3`}>
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
                              placeholder="Justification / Evidence — required (e.g. specific example, project, behavior observed)"
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
                                {aiBusy === "justification" + q.id ? "Drafting…" : <span className="inline-flex items-center gap-1"><Icon.Sparkle size={12} /> AI Draft</span>}
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
                            if (/strength/i.test(q.prompt)) { kind = "strengths"; label = "Draft Strengths"; }
                            else if (/develop|growth|improve/i.test(q.prompt)) { kind = "development"; label = "Draft Goals"; }
                            else if (/next quarter|next steps|focus/i.test(q.prompt)) { kind = "next-steps"; label = "Draft Goals"; }
                            else if (/significant|summary|overall|comments/i.test(q.prompt)) { kind = "summary"; label = "Draft Summary"; }
                            if (!kind) return null;
                            return (
                              <button
                                type="button"
                                onClick={() => aiDraftIntoText(q.id, kind!)}
                                disabled={aiBusy != null}
                                className="absolute right-2 top-2 text-xs px-2 py-1 rounded-md bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium hover:opacity-90 disabled:opacity-50"
                                title="Use AI to draft this section based on the ratings you've given"
                              >
                                {aiBusy === kind ? "Drafting…" : <span className="inline-flex items-center gap-1"><Icon.Sparkle size={12} /> {label}</span>}
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

      {/* ── PRIVATE MANAGER RECOMMENDATION (confidential — NEVER shown to employee) ── */}
      {canSeePrivateRec && (
        <div className="card border-l-4 border-l-amber-400 bg-amber-50/30">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="section-header mb-0 inline-flex items-center gap-2">
              <Icon.Lock size={16} className="text-amber-600" />
              Private Manager Recommendation
            </h3>
            <span className="chip bg-amber-100 text-amber-800 inline-flex items-center gap-1">
              <Icon.EyeOff size={11} /> Confidential
            </span>
          </div>
          <p className="text-xs text-gray-700 mb-3 leading-relaxed">
            <strong>This section is strictly confidential.</strong> Visible only to the manager who wrote it and HR Admin.
            The employee will <strong>never</strong> see this — even after the PMF is finalized, printed, or exported.
            Use this for sensitive recommendations (e.g., salary increase that may not be approved, PIP under review) to protect team dynamics and avoid bias.
          </p>

          {canEditPrivateRec ? (
            <>
              <div className="mb-3">
                <label className="label">Recommendation type</label>
                <select
                  className="input max-w-md"
                  value={privateRec}
                  onChange={(e) => setPrivateRec(e.target.value)}
                >
                  <option value="">— Select recommendation —</option>
                  <option value="NO_ACTION">No action / continue as-is</option>
                  <option value="SALARY_INCREASE">Recommend salary increase</option>
                  <option value="PROMOTION">Recommend promotion</option>
                  <option value="LATERAL_MOVE">Recommend lateral move / role change</option>
                  <option value="PIP">Recommend Performance Improvement Plan</option>
                  <option value="TERMINATION_REVIEW">Recommend termination review</option>
                  <option value="OTHER">Other (explain in notes)</option>
                </select>
              </div>
              <div>
                <label className="label">Justification & notes for HR</label>
                <textarea
                  className="input"
                  rows={4}
                  maxLength={5000}
                  placeholder="Explain your reasoning. Be specific — these notes go to HR for review. The employee will not see this."
                  value={privateRecNotes}
                  onChange={(e) => setPrivateRecNotes(e.target.value)}
                />
                <div className="text-[11px] text-gray-500 mt-1 text-right">
                  {privateRecNotes.length} / 5000 characters
                </div>
              </div>
            </>
          ) : (
            // Read-only view (HR + Manager after submit)
            <div className="space-y-3">
              <div>
                <div className="label">Recommendation type</div>
                {privateRec ? (
                  <div className="inline-flex items-center gap-2">
                    <span className={`chip text-sm font-bold ${
                      privateRec === "NO_ACTION"          ? "bg-gray-100 text-gray-700" :
                      privateRec === "SALARY_INCREASE"    ? "bg-emerald-100 text-emerald-800" :
                      privateRec === "PROMOTION"          ? "bg-blue-100 text-blue-800" :
                      privateRec === "LATERAL_MOVE"       ? "bg-purple-100 text-purple-800" :
                      privateRec === "PIP"                ? "bg-amber-100 text-amber-800" :
                      privateRec === "TERMINATION_REVIEW" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {privateRec.replace(/_/g, " ")}
                    </span>
                  </div>
                ) : (
                  <em className="text-sm text-gray-400">— No private recommendation entered —</em>
                )}
              </div>
              {privateRecNotes && (
                <div>
                  <div className="label">Justification & notes for HR</div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap bg-white border border-gray-200 rounded p-3">
                    {privateRecNotes}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Signatures */}
      <div className="card">
        <h3 className="section-header inline-flex items-center gap-1"><Icon.Pen size={16} /> Signatures</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Employee */}
          <div>
            {authorRole === "EMPLOYEE" && canEdit && (!signatures.employee.data || editingSig === "employee") ? (
              <>
                <SignaturePad label="Employee Signature" existing={signatures.employee.data} existingName={signatureNames.employee} onSave={saveSignature} />
                {editingSig === "employee" && (
                  <button type="button" onClick={() => setEditingSig(null)} className="mt-2 text-xs text-gray-500 hover:text-gray-800">← Cancel edit</button>
                )}
              </>
            ) : (
              <>
                <SignatureView dataUrl={signatures.employee.data} label="Employee Signature" signedAt={signatures.employee.at} name={signatureNames.employee} />
                {authorRole === "EMPLOYEE" && canEdit && signatures.employee.data && (
                  <button type="button" onClick={() => setEditingSig("employee")} className="mt-2 text-xs text-primary-700 hover:underline inline-flex items-center gap-1"><Icon.Edit size={12} /> Edit / re-sign / upload image</button>
                )}
              </>
            )}
          </div>
          {/* Manager */}
          <div>
            {authorRole === "MANAGER" && canEdit && (!signatures.manager.data || editingSig === "manager") ? (
              <>
                <SignaturePad label="Supervisor Signature" existing={signatures.manager.data} existingName={signatureNames.manager} onSave={saveSignature} />
                {editingSig === "manager" && (
                  <button type="button" onClick={() => setEditingSig(null)} className="mt-2 text-xs text-gray-500 hover:text-gray-800">← Cancel edit</button>
                )}
              </>
            ) : (
              <>
                <SignatureView dataUrl={signatures.manager.data} label="Supervisor Signature" signedAt={signatures.manager.at} name={signatureNames.manager} />
                {authorRole === "MANAGER" && canEdit && signatures.manager.data && (
                  <button type="button" onClick={() => setEditingSig("manager")} className="mt-2 text-xs text-primary-700 hover:underline inline-flex items-center gap-1"><Icon.Edit size={12} /> Edit / re-sign / upload image</button>
                )}
              </>
            )}
          </div>
          {/* HR */}
          <div>
            {viewerRole === "HR_ADMIN" && state === "HR_REVIEW" && (!signatures.hr.data || editingSig === "hr") ? (
              <>
                <SignaturePad label="HR Signature" existing={signatures.hr.data} existingName={signatureNames.hr} onSave={saveSignature} />
                {editingSig === "hr" && (
                  <button type="button" onClick={() => setEditingSig(null)} className="mt-2 text-xs text-gray-500 hover:text-gray-800">← Cancel edit</button>
                )}
              </>
            ) : (
              <>
                <SignatureView dataUrl={signatures.hr.data} label="HR Signature" signedAt={signatures.hr.at} name={signatureNames.hr} />
                {viewerRole === "HR_ADMIN" && state === "HR_REVIEW" && signatures.hr.data && (
                  <button type="button" onClick={() => setEditingSig("hr")} className="mt-2 text-xs text-primary-700 hover:underline inline-flex items-center gap-1"><Icon.Edit size={12} /> Edit / re-sign / upload image</button>
                )}
              </>
            )}
          </div>
        </div>
        {canEdit && (
          <p className="text-xs text-gray-500 mt-3 italic inline-flex items-center gap-1">
            <Icon.Info size={12} /> Draw your signature above before submitting. The submit button will be blocked until signed.
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
          <button className="btn btn-success" onClick={() => submit("finalize")} disabled={pending}><span className="inline-flex items-center gap-1"><Icon.Check size={14} /> Approve & Finalize</span></button>
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
              <Icon.CheckCircle size={40} />
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
