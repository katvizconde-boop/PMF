"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { COMPANIES } from "@/lib/companies";

type Step = {
  id?: string;
  title: string; level: number;
  yearsTypical: string | null;
  skills: string;
  responsibilities: string | null;
  sortOrder: number;
};
type Path = {
  id: string; name: string; company: string | null; description: string | null;
  steps: Step[];
};

export function CareerPathsAdmin({ initial }: { initial: Path[] }) {
  const router = useRouter();
  const [paths, setPaths] = useState<Path[]>(initial);
  const [editing, setEditing] = useState<Path | null>(null);
  const [creating, setCreating] = useState(false);

  async function reload() { router.refresh(); }

  async function deletePath(id: string) {
    if (!confirm("Delete this career path?")) return;
    const res = await fetch(`/api/career-paths/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPaths((ps) => ps.filter((p) => p.id !== id));
      reload();
    } else alert(await res.text());
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="page-title">📚 Career Paths</h2>
          <p className="page-subtitle">Define ladders, skills, and progression for each role family.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>+ New Career Path</button>
      </div>

      {paths.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">📚</div>
          <p className="text-gray-500">No career paths yet. Define your first one to give employees a clear roadmap.</p>
          <button className="btn btn-primary mt-4" onClick={() => setCreating(true)}>+ Create Career Path</button>
        </div>
      ) : (
        <div className="space-y-4">
          {paths.map((p) => (
            <div key={p.id} className="card">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
                  {p.company && <span className="chip bg-blue-100 text-blue-700 mt-1">{p.company}</span>}
                  {p.description && <p className="text-sm text-gray-600 mt-2">{p.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-secondary text-xs" onClick={() => setEditing(p)}>Edit</button>
                  <button className="btn btn-danger text-xs" onClick={() => deletePath(p.id)}>Delete</button>
                </div>
              </div>

              {/* Ladder visualization */}
              <div className="overflow-x-auto pt-3 border-t border-gray-100">
                <div className="flex items-stretch gap-1 min-w-min">
                  {p.steps.map((s, i) => (
                    <div key={i} className="flex items-center flex-shrink-0">
                      <div className="w-56 p-3 bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-200 rounded-lg">
                        <div className="text-[10px] font-semibold text-primary-600 uppercase tracking-wide">Level {s.level}</div>
                        <div className="font-bold text-gray-900 text-sm mt-0.5">{s.title}</div>
                        {s.yearsTypical && <div className="text-xs text-gray-500 mt-1">{s.yearsTypical}</div>}
                        {s.skills && (
                          <div className="mt-2 pt-2 border-t border-primary-100">
                            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Skills</div>
                            <div className="text-xs text-gray-700 whitespace-pre-wrap leading-snug">{s.skills}</div>
                          </div>
                        )}
                      </div>
                      {i < p.steps.length - 1 && (
                        <div className="text-2xl text-primary-400 mx-1">→</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(editing || creating) && (
        <PathEditor
          path={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); reload(); }}
        />
      )}
    </div>
  );
}

function PathEditor({ path, onClose, onSaved }: { path: Path | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(path?.name ?? "");
  const [company, setCompany] = useState(path?.company ?? "");
  const [description, setDescription] = useState(path?.description ?? "");
  const [steps, setSteps] = useState<Step[]>(
    path?.steps?.length ? path.steps : [
      { title: "Junior", level: 1, yearsTypical: "0-2 years", skills: "", responsibilities: null, sortOrder: 0 },
      { title: "Mid-level", level: 2, yearsTypical: "2-4 years", skills: "", responsibilities: null, sortOrder: 1 },
      { title: "Senior", level: 3, yearsTypical: "4+ years", skills: "", responsibilities: null, sortOrder: 2 },
    ]
  );
  const [busy, setBusy] = useState(false);

  function updateStep(i: number, patch: Partial<Step>) {
    setSteps((arr) => arr.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  }
  function addStep() {
    setSteps((arr) => [...arr, { title: "New Step", level: arr.length + 1, yearsTypical: null, skills: "", responsibilities: null, sortOrder: arr.length }]);
  }
  function removeStep(i: number) {
    setSteps((arr) => arr.filter((_, idx) => idx !== i));
  }

  async function save() {
    setBusy(true);
    const url = path ? `/api/career-paths/${path.id}` : "/api/career-paths";
    const method = path ? "PUT" : "POST";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, company: company || null, description: description || null, steps }),
    });
    setBusy(false);
    if (res.ok) onSaved();
    else alert(await res.text());
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{path ? "Edit" : "New"} Career Path</h2>
          <button className="text-gray-400 hover:text-gray-700" onClick={onClose}>✕</button>
        </div>
        <div className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className="label">Name</label><input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Engineering" /></div>
            <div>
              <label className="label">Company (optional)</label>
              <select className="input" value={company} onChange={(e) => setCompany(e.target.value)}>
                <option value="">— Any —</option>
                {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional overview of the path." />
          </div>

          <div className="pt-3 border-t">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-900">Steps (Ladder)</h3>
              <button type="button" className="btn btn-secondary text-xs" onClick={addStep}>+ Add Step</button>
            </div>
            <div className="space-y-3">
              {steps.map((s, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500">Level {i + 1}</span>
                    <button type="button" className="text-xs text-red-500 hover:text-red-700" onClick={() => removeStep(i)}>✕ Remove</button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-2 mb-2">
                    <input className="input text-sm" placeholder="Title (e.g. Junior Engineer)" value={s.title} onChange={(e) => updateStep(i, { title: e.target.value })} />
                    <input className="input text-sm" placeholder="Typical years (e.g. 0-2 years)" value={s.yearsTypical ?? ""} onChange={(e) => updateStep(i, { yearsTypical: e.target.value })} />
                  </div>
                  <textarea className="input text-sm mb-2" rows={3} placeholder="Skills required (one per line)&#10;e.g. JavaScript fundamentals&#10;Git workflow" value={s.skills} onChange={(e) => updateStep(i, { skills: e.target.value })} />
                  <textarea className="input text-sm" rows={2} placeholder="Key responsibilities (optional)" value={s.responsibilities ?? ""} onChange={(e) => updateStep(i, { responsibilities: e.target.value })} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={busy || !name}>{busy ? "Saving…" : "Save Path"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
