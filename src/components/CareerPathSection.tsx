"use client";
import { useEffect, useState } from "react";
import { Icon } from "./Icons";
import { PrintSectionButton } from "./PrintSectionButton";

type Step = { id: string; title: string; level: number; yearsTypical: string | null; skills: string; responsibilities: string | null; sortOrder: number };
type Path = { id: string; name: string; company: string | null; description: string | null; steps: Step[] };
type Progress = {
  currentPathId: string | null;
  currentStepId: string | null;
  targetStepId: string | null;
  notes: string | null;
  currentPath: Path | null;
  currentStep: Step | null;
  targetStep: Step | null;
};

export function CareerPathSection({ employeeId, canEdit }: { employeeId: string; canEdit: boolean }) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [paths, setPaths] = useState<Path[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ pathId: "", currentStepId: "", targetStepId: "", notes: "" });
  const [busy, setBusy] = useState(false);

  async function load() {
    const [pRes, allRes] = await Promise.all([
      fetch(`/api/career-progress?userId=${employeeId}`),
      fetch("/api/career-paths"),
    ]);
    if (pRes.ok) {
      const d = await pRes.json();
      setProgress(d.progress);
      if (d.progress) {
        setForm({
          pathId: d.progress.currentPathId ?? "",
          currentStepId: d.progress.currentStepId ?? "",
          targetStepId: d.progress.targetStepId ?? "",
          notes: d.progress.notes ?? "",
        });
      }
    }
    if (allRes.ok) {
      const d = await allRes.json();
      setPaths(d.paths);
    }
  }
  useEffect(() => { load(); }, [employeeId]);

  async function save() {
    setBusy(true);
    const res = await fetch("/api/career-progress", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: employeeId,
        currentPathId: form.pathId || null,
        currentStepId: form.currentStepId || null,
        targetStepId:  form.targetStepId  || null,
        notes: form.notes || null,
      }),
    });
    setBusy(false);
    if (res.ok) { setEditing(false); load(); }
    else alert(await res.text());
  }

  const selectedPath = paths.find((p) => p.id === form.pathId);

  return (
    <div className="card printable-careerpath">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-header mb-0 inline-flex items-center gap-1"><Icon.GraduationCap size={16} /> Career Path / Development Plan</h3>
        <div className="inline-flex items-center gap-2">
          <PrintSectionButton sectionId="careerpath" label="career path" />
          {canEdit && !editing && <button className="btn btn-secondary text-xs" onClick={() => setEditing(true)}>{progress?.currentPath ? "Edit" : "Set Path"}</button>}
        </div>
      </div>

      {!editing && progress?.currentPath ? (
        <div>
          <div className="text-sm text-gray-500 mb-1">{progress.currentPath.name}</div>
          {progress.currentPath.steps.length > 0 && (
            <div className="overflow-x-auto pb-2">
              <div className="flex items-stretch gap-1 min-w-min">
                {progress.currentPath.steps.map((s, i) => {
                  const isCurrent = s.id === progress.currentStepId;
                  const isTarget = s.id === progress.targetStepId;
                  const currentIdx = progress.currentPath!.steps.findIndex((x) => x.id === progress.currentStepId);
                  const targetIdx = progress.currentPath!.steps.findIndex((x) => x.id === progress.targetStepId);
                  const reached = currentIdx >= 0 && i <= currentIdx;
                  return (
                    <div key={s.id} className="flex items-center flex-shrink-0">
                      <div className={`w-48 p-3 rounded-lg border-2 ${
                        isCurrent ? "border-emerald-500 bg-emerald-50" :
                        isTarget ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200" :
                        reached ? "border-emerald-200 bg-emerald-50/50" :
                        "border-gray-200 bg-gray-50"
                      }`}>
                        {isCurrent && <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide mb-1 inline-flex items-center gap-1"><Icon.Target size={10} /> You're here</div>}
                        {isTarget && <div className="text-[10px] font-bold text-primary-700 uppercase tracking-wide mb-1 inline-flex items-center gap-1"><Icon.Target size={10} /> Target</div>}
                        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Level {s.level}</div>
                        <div className="font-bold text-gray-900 text-sm mt-0.5">{s.title}</div>
                        {s.yearsTypical && <div className="text-xs text-gray-500 mt-1">{s.yearsTypical}</div>}
                        {s.skills && (isCurrent || isTarget) && (
                          <div className="mt-2 pt-2 border-t border-gray-200 text-xs whitespace-pre-wrap text-gray-700 leading-snug">{s.skills}</div>
                        )}
                      </div>
                      {i < progress.currentPath!.steps.length - 1 && <div className={`text-2xl mx-1 ${reached ? "text-emerald-400" : "text-gray-300"}`}>→</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {progress.notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Development Notes</div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{progress.notes}</p>
            </div>
          )}
        </div>
      ) : !editing ? (
        <p className="text-gray-400 text-sm text-center py-6">No career path assigned yet.</p>
      ) : (
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
          <div>
            <label className="label">Career Path</label>
            <select className="input text-sm" value={form.pathId} onChange={(e) => setForm({ ...form, pathId: e.target.value, currentStepId: "", targetStepId: "" })}>
              <option value="">— Select a path —</option>
              {paths.map((p) => <option key={p.id} value={p.id}>{p.name}{p.company ? ` (${p.company})` : ""}</option>)}
            </select>
          </div>
          {selectedPath && (
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="label inline-flex items-center gap-1"><Icon.Target size={12} /> Current Level</label>
                <select className="input text-sm" value={form.currentStepId} onChange={(e) => setForm({ ...form, currentStepId: e.target.value })}>
                  <option value="">— Select —</option>
                  {selectedPath.steps.map((s) => <option key={s.id} value={s.id}>L{s.level} · {s.title}</option>)}
                </select>
              </div>
              <div>
                <label className="label inline-flex items-center gap-1"><Icon.Target size={12} /> Target Level (next move)</label>
                <select className="input text-sm" value={form.targetStepId} onChange={(e) => setForm({ ...form, targetStepId: e.target.value })}>
                  <option value="">— Select —</option>
                  {selectedPath.steps.map((s) => <option key={s.id} value={s.id}>L{s.level} · {s.title}</option>)}
                </select>
              </div>
            </div>
          )}
          <div>
            <label className="label">Development Notes (IDP)</label>
            <textarea className="input text-sm" rows={3} placeholder="Specific actions, training, mentorship to bridge to target." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn btn-secondary text-xs" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn btn-primary text-xs" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
