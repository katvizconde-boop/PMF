"use client";
import { useState } from "react";
import { LinkedText } from "@/lib/linkify";
import { Icon } from "./Icons";

type Question = { id: string; prompt: string; description?: string | null; inputType: string; options: string | null; required: boolean };
type Section = { id: string; title: string; kind: string; weight: number; questions: Question[] };
type FormState = Record<string, { rating: string; comment: string }>;

const RATING_LABELS: Record<string, string> = {
  "1": "Unsatisfactory", "1.5": "Unsatisfactory",
  "2": "Partially Meets", "2.5": "Partially Meets",
  "3": "Meets Expectations", "3.5": "Meets Expectations",
  "4": "Exceeds Expectations", "4.5": "Exceeds Expectations",
  "5": "Significantly Exceeds",
};

export function SubmitPreviewModal({
  open, onClose, onConfirm, sections, form, recommendation, signed, role,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  sections: Section[];
  form: FormState;
  recommendation: string | null;
  signed: boolean;
  role: "EMPLOYEE" | "MANAGER" | "HR";
}) {
  const [confirmCheck, setConfirmCheck] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  // Validate completion
  const missing: string[] = [];
  let totalRated = 0, totalRatings = 0;
  for (const s of sections) {
    // ── Recommendation section is now optional ──
    // The Private Manager Recommendation field has replaced this as the primary
    // mechanism for capturing managerial outcomes. The public Recommendation
    // stays in the template (visible to manager + HR) but no longer blocks submission.
    const isRecommendationSection = s.kind === "RECOMMENDATION";

    for (const q of s.questions) {
      if (q.inputType === "rating") {
        totalRatings++;
        if (form[q.id]?.rating) totalRated++;
        else if (q.required) missing.push(`${s.title} → ${q.prompt}`);
        if (form[q.id]?.rating && !form[q.id]?.comment?.trim()) {
          missing.push(`${s.title} → ${q.prompt} (justification missing)`);
        }
      } else if (q.required && !form[q.id]?.comment?.trim() && q.inputType === "select" && !isRecommendationSection) {
        missing.push(`${s.title} → ${q.prompt}`);
      }
    }
  }

  const submitAction = role === "EMPLOYEE" ? "Submit Self-Assessment" :
                       role === "MANAGER"  ? "Submit to HR" : "Approve & Finalize";

  async function doSubmit() {
    setSubmitting(true);
    await onConfirm();
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-5 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold inline-flex items-center gap-2"><Icon.Alert size={20} /> Review before submitting</h2>
            <p className="text-sm text-amber-50 mt-1">
              <strong>Important:</strong> Once you submit, your responses are LOCKED. You cannot edit them.
            </p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><Icon.X size={20} /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
              <div className="text-2xl font-bold text-gray-800">{totalRated}/{totalRatings}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Items Rated</div>
            </div>
            <div className={`rounded-lg p-3 text-center border ${signed ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
              <div className={`text-2xl font-bold flex justify-center ${signed ? "text-emerald-700" : "text-red-700"}`}>{signed ? <Icon.Check size={24} /> : <Icon.X size={24} />}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Signed</div>
            </div>
            <div className={`rounded-lg p-3 text-center border ${missing.length === 0 ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
              <div className={`text-2xl font-bold flex justify-center ${missing.length === 0 ? "text-emerald-700" : "text-amber-700"}`}>{missing.length === 0 ? <Icon.Check size={24} /> : missing.length}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">{missing.length === 0 ? "Complete" : "Missing"}</div>
            </div>
          </div>

          {/* Missing warnings */}
          {missing.length > 0 && (
            <div className="border border-amber-300 bg-amber-50 rounded-lg p-3">
              <div className="font-semibold text-amber-800 text-sm mb-1 inline-flex items-center gap-1"><Icon.Alert size={14} className="text-amber-600" /> Missing items:</div>
              <ul className="text-xs text-amber-700 list-disc ml-5 space-y-0.5 max-h-32 overflow-y-auto">
                {missing.slice(0, 8).map((m, i) => <li key={i}>{m}</li>)}
                {missing.length > 8 && <li>+ {missing.length - 8} more...</li>}
              </ul>
            </div>
          )}

          {/* Section-by-section preview */}
          <div className="space-y-3">
            {sections
              .filter((s) => s.kind !== "RECOMMENDATION")
              .map((s) => {
              const ratingsInSection = s.questions.filter((q) => q.inputType === "rating" && form[q.id]?.rating);
              const avgRating = ratingsInSection.length
                ? (ratingsInSection.reduce((sum, q) => sum + parseFloat(form[q.id].rating), 0) / ratingsInSection.length).toFixed(2)
                : null;

              return (
                <div key={s.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-sm text-gray-800">{s.title}</div>
                      {s.weight > 0 && <div className="text-xs text-gray-500">Weight: {s.weight}%</div>}
                    </div>
                    {avgRating && (
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary-700">{avgRating}</div>
                        <div className="text-[10px] text-gray-500 uppercase">Section Avg</div>
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    {s.questions.map((q) => {
                      const v = form[q.id];
                      const hasAnswer = v?.rating || v?.comment;
                      if (!hasAnswer) return null;
                      return (
                        <div key={q.id} className="text-sm">
                          <div className="flex justify-between gap-2 items-start">
                            <div className="font-medium text-gray-800 flex-1">{q.prompt}</div>
                            {q.inputType === "rating" && v.rating && (
                              <div className="flex-shrink-0">
                                <span className="chip bg-primary-100 text-primary-700 font-bold">{v.rating} / 5</span>
                                <span className="text-[10px] text-gray-500 ml-1">{RATING_LABELS[v.rating]}</span>
                              </div>
                            )}
                          </div>
                          {v.comment && (
                            <div className="text-xs text-gray-600 mt-1 pl-3 border-l-2 border-gray-200 italic whitespace-pre-wrap">
                              {q.inputType === "select" ? <strong>{v.comment}</strong> : <LinkedText text={v.comment} />}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {s.questions.every((q) => !form[q.id]?.rating && !form[q.id]?.comment) && (
                      <div className="text-xs text-gray-400 italic">No answers in this section.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Public Recommendation no longer shown — Private Manager Recommendation replaces it */}
          {false && recommendation && role !== "EMPLOYEE" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-xs text-blue-700 uppercase tracking-wide font-semibold">Recommendation</div>
              <div className="text-base font-bold text-blue-900 mt-1">{recommendation}</div>
            </div>
          )}

          {/* Big warning callout */}
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0"><Icon.Lock size={32} /></div>
              <div>
                <div className="font-bold text-red-800 text-base">Are you sure? Everything is final.</div>
                <p className="text-sm text-red-700 mt-1">
                  Once you click <strong>{submitAction}</strong>, your responses will be <strong>permanently locked</strong>.
                  You won't be able to edit anything — not the ratings, not the justifications, not the signature.
                  The next person in the workflow will be notified immediately.
                </p>
                <label className="flex items-start gap-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmCheck}
                    onChange={(e) => setConfirmCheck(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span className="text-sm font-semibold text-red-800">
                    I understand my submission is final and I've reviewed all my answers.
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
          <button onClick={onClose} className="btn btn-secondary text-sm">← Go back & edit</button>
          <button
            onClick={doSubmit}
            disabled={!confirmCheck || !signed || submitting || (missing.length > 0 && role !== "HR")}
            className="btn btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              !signed ? "Please sign before submitting" :
              missing.length > 0 ? "Complete all required items first" :
              !confirmCheck ? "Tick the confirmation checkbox" : ""
            }
          >
            {submitting ? "Submitting…" : <span className="inline-flex items-center gap-1"><Icon.Lock size={14} /> Confirm & {submitAction}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
