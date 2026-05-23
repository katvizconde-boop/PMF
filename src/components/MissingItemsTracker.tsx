"use client";
import { useState, useMemo, useEffect } from "react";

type Question = { id: string; prompt: string; inputType: string; required: boolean };
type Section = { id: string; title: string; kind: string; weight: number; questions: Question[] };
type FormState = Record<string, { rating: string; comment: string }>;

export function MissingItemsTracker({
  sections, form, signed, role,
}: {
  sections: Section[];
  form: FormState;
  signed: boolean;
  role: "EMPLOYEE" | "MANAGER" | "HR";
}) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [position, setPosition] = useState<"right" | "left">("right");

  // Remember user preferences per session
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("pmf.tracker.dismissed") === "1") setDismissed(true);
    const savedPos = sessionStorage.getItem("pmf.tracker.position");
    if (savedPos === "left" || savedPos === "right") setPosition(savedPos);
  }, []);

  function dismiss() {
    setDismissed(true);
    try { sessionStorage.setItem("pmf.tracker.dismissed", "1"); } catch {}
  }
  function togglePosition() {
    const next = position === "right" ? "left" : "right";
    setPosition(next);
    try { sessionStorage.setItem("pmf.tracker.position", next); } catch {}
  }

  const { missing, total, completed } = useMemo(() => {
    const missing: { qid: string; sectionTitle: string; questionPrompt: string; reason: string }[] = [];
    let total = 0;
    let completed = 0;
    for (const s of sections) {
      for (const q of s.questions) {
        if (q.inputType === "rating") {
          total++;
          const v = form[q.id];
          if (!v?.rating) {
            missing.push({ qid: q.id, sectionTitle: s.title, questionPrompt: q.prompt, reason: "Rating not selected" });
          } else if (!v.comment?.trim()) {
            missing.push({ qid: q.id, sectionTitle: s.title, questionPrompt: q.prompt, reason: "Justification empty" });
          } else {
            completed++;
          }
        } else if (q.required && (q.inputType === "select" || q.inputType === "text")) {
          total++;
          const v = form[q.id];
          if (!v?.comment?.trim()) {
            missing.push({ qid: q.id, sectionTitle: s.title, questionPrompt: q.prompt, reason: q.inputType === "select" ? "No selection" : "Empty" });
          } else {
            completed++;
          }
        }
      }
    }
    return { missing, total, completed };
  }, [sections, form]);

  function scrollTo(qid: string) {
    const el = document.getElementById(`q-${qid}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.transition = "background-color 0.4s";
      el.style.backgroundColor = "rgba(254, 226, 226, 0.6)";
      setTimeout(() => { el.style.backgroundColor = ""; }, 1400);
    }
  }

  const allDone = missing.length === 0 && signed;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Reopen pill if user dismissed
  if (dismissed) {
    return (
      <button
        onClick={() => { setDismissed(false); sessionStorage.removeItem("pmf.tracker.dismissed"); }}
        className={`fixed z-40 no-print rounded-full bg-primary-600 text-white shadow-cardLg hover:bg-primary-700 transition px-3 py-2 text-xs font-semibold flex items-center gap-1.5`}
        style={{ bottom: 110, [position === "right" ? "right" : "left"]: 16 } as React.CSSProperties}
        title="Show missing items tracker"
      >
        📋 {missing.length > 0 ? `${missing.length} missing` : "Progress"}
      </button>
    );
  }

  // Position above sticky submit bar (which is ~64px tall) — sit at bottom: 88px
  // so users can always reach the Submit button below.
  const posStyle: React.CSSProperties = {
    bottom: 96,
    [position === "right" ? "right" : "left"]: 16,
  };

  return (
    <div className="fixed z-40 max-w-sm w-[330px] no-print" style={posStyle}>
      {!expanded ? (
        <div
          className={`w-full rounded-xl border shadow-cardLg flex items-center gap-2 transition-all ${
            allDone
              ? "bg-emerald-50 border-emerald-200"
              : missing.length > 0
              ? "bg-amber-50 border-amber-200"
              : "bg-white border-gray-200"
          }`}
        >
          <button
            onClick={() => setExpanded(true)}
            className="flex-1 flex items-center gap-3 px-4 py-3 text-left hover:opacity-90 transition"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              allDone ? "bg-emerald-500 text-white" : missing.length > 0 ? "bg-amber-400 text-white" : "bg-primary-100 text-primary-700"
            }`}>
              {allDone ? "✓" : missing.length}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-800">
                {allDone ? "Ready to submit!" : missing.length > 0 ? `${missing.length} missing item${missing.length === 1 ? "" : "s"}` : "Almost there!"}
              </div>
              <div className="text-xs text-gray-500">
                {completed} of {total} · {signed ? "✓ signed" : "not signed"}
              </div>
              <div className="h-1 rounded-full bg-gray-200 mt-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${allDone ? "bg-emerald-500" : "bg-primary-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-400">▴</span>
          </button>
          {/* Move + Close controls */}
          <div className="flex flex-col gap-0.5 pr-2">
            <button onClick={togglePosition} title={`Move to ${position === "right" ? "left" : "right"}`} className="text-gray-400 hover:text-gray-700 text-xs p-1">
              {position === "right" ? "◄" : "►"}
            </button>
            <button onClick={dismiss} title="Hide tracker" className="text-gray-400 hover:text-red-600 text-xs p-1">
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ boxShadow: "0 14px 40px rgba(15,23,42,0.18)" }}>
          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${
            allDone ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"
          }`}>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-800 text-sm">
                {allDone ? "✓ Everything looks good!" : `${missing.length} item${missing.length === 1 ? "" : "s"} to finish`}
              </div>
              <div className="text-[11px] text-gray-600 mt-0.5">{completed}/{total} · {pct}% complete</div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={togglePosition} title="Move tracker" className="text-gray-400 hover:text-gray-700 p-1 text-sm" aria-label="Move position">
                {position === "right" ? "◄" : "►"}
              </button>
              <button onClick={() => setExpanded(false)} className="text-gray-400 hover:text-gray-700 p-1 text-base leading-none" aria-label="Minimize">▾</button>
              <button onClick={dismiss} className="text-gray-400 hover:text-red-600 p-1 text-sm" aria-label="Close">✕</button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-gray-100">
            <div
              className={`h-full transition-all ${allDone ? "bg-emerald-500" : "bg-amber-400"}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Missing list */}
          {missing.length > 0 ? (
            <div className="max-h-72 overflow-y-auto p-2">
              {missing.map((m, i) => (
                <button
                  key={m.qid + i}
                  onClick={() => scrollTo(m.qid)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-50 transition flex items-start gap-2.5 group"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] tracking-wide text-gray-500 uppercase">{m.sectionTitle}</div>
                    <div className="text-xs text-gray-800 font-medium truncate">{m.questionPrompt}</div>
                    <div className="text-[11px] text-amber-700 italic">{m.reason}</div>
                  </div>
                  <span className="text-gray-300 group-hover:text-amber-600 text-xs flex-shrink-0">→</span>
                </button>
              ))}
              {!signed && (
                <div className="px-3 py-2 mt-1 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-700">
                  <strong>⚠ Signature missing.</strong> Scroll to the bottom of the form to sign.
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 text-center">
              <div className="text-4xl mb-2">🎉</div>
              <div className="font-semibold text-gray-800 text-sm">All items complete!</div>
              <div className="text-xs text-gray-500 mt-1">
                {signed ? "Click Submit at the bottom when ready." : "Sign the form at the bottom to enable submit."}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
