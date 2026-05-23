"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Q = { prompt: string; description?: string | null; inputType: string; options?: string | null; required: boolean; weight: number; sortOrder: number };
type S = { title: string; kind: string; weight: number; sortOrder: number; questions: Q[] };

export function TemplateEditor({ template, usedByAssignments }: { template: any; usedByAssignments: number }) {
  const router = useRouter();
  const [name, setName] = useState(template.name);
  const [type, setType] = useState(template.type);
  const [isActive, setIsActive] = useState(template.isActive);
  const [sections, setSections] = useState<S[]>(template.sections.map((s: any) => ({
    title: s.title, kind: s.kind, weight: s.weight, sortOrder: s.sortOrder,
    questions: s.questions.map((q: any) => ({
      prompt: q.prompt, description: q.description, inputType: q.inputType, options: q.options,
      required: q.required, weight: q.weight, sortOrder: q.sortOrder,
    })),
  })));
  const [saving, setSaving] = useState("");

  const locked = usedByAssignments > 0;

  function updateSection(i: number, patch: Partial<S>) {
    setSections((arr) => arr.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  }
  function updateQuestion(si: number, qi: number, patch: Partial<Q>) {
    setSections((arr) => arr.map((s, idx) => idx !== si ? s : { ...s, questions: s.questions.map((q, j) => j === qi ? { ...q, ...patch } : q) }));
  }
  function addSection() {
    setSections((arr) => [...arr, { title: "New Section", kind: "KPI", weight: 0, sortOrder: arr.length, questions: [] }]);
  }
  function removeSection(i: number) {
    if (!confirm("Delete this section?")) return;
    setSections((arr) => arr.filter((_, idx) => idx !== i));
  }
  function addQuestion(si: number) {
    setSections((arr) => arr.map((s, idx) => idx !== si ? s : { ...s, questions: [...s.questions, { prompt: "New question", inputType: "rating", required: true, weight: 1, sortOrder: s.questions.length }] }));
  }
  function removeQuestion(si: number, qi: number) {
    setSections((arr) => arr.map((s, idx) => idx !== si ? s : { ...s, questions: s.questions.filter((_, j) => j !== qi) }));
  }

  async function save() {
    setSaving("Saving…");
    const res = await fetch(`/api/templates/${template.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, isActive, sections }),
    });
    if (res.ok) {
      const data = await res.json();
      setSaving(data.partial ? "⚠ " + data.message : "Saved ✓");
      router.refresh();
    } else setSaving("Error: " + (await res.text()));
    setTimeout(() => setSaving(""), 4000);
  }

  async function deleteTemplate() {
    if (!confirm("Delete this template?")) return;
    const res = await fetch(`/api/templates/${template.id}`, { method: "DELETE" });
    if (res.ok) router.push("/templates");
    else alert(await res.text());
  }

  return (
    <div className="space-y-6">
      <Link href="/templates" className="text-primary-600 text-sm hover:underline">← Back to Templates</Link>

      <div className="card">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Template Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)} disabled={locked}>
              <option value="REGULAR">REGULAR</option>
              <option value="PROBATIONARY">PROBATIONARY</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 mt-3 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active (available to assign)
        </label>
        {locked && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
            ⚠ This template is used by <b>{usedByAssignments} assignment(s)</b>. To preserve historical data, only the name and active status can be changed.
            For structural changes, create a new template.
          </div>
        )}
      </div>

      {sections.map((s, si) => (
        <div key={si} className="card">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 grid md:grid-cols-3 gap-2">
              <input className="input" disabled={locked} value={s.title} onChange={(e) => updateSection(si, { title: e.target.value })} placeholder="Section title" />
              <select className="input" disabled={locked} value={s.kind} onChange={(e) => updateSection(si, { kind: e.target.value })}>
                <option value="KPI">KPI</option>
                <option value="COMPETENCY">COMPETENCY</option>
                <option value="COMMENT">COMMENT</option>
                <option value="RECOMMENDATION">RECOMMENDATION</option>
              </select>
              <input className="input" disabled={locked} type="number" value={s.weight} onChange={(e) => updateSection(si, { weight: parseFloat(e.target.value) || 0 })} placeholder="Weight %" />
            </div>
            {!locked && <button className="btn btn-danger ml-3 text-xs" onClick={() => removeSection(si)}>✕</button>}
          </div>
          <div className="space-y-2 ml-2">
            {s.questions.map((q, qi) => (
              <div key={qi} className="border-l-2 border-gray-200 pl-3 py-2">
                <div className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1">
                    <input className="input text-sm" disabled={locked} value={q.prompt} onChange={(e) => updateQuestion(si, qi, { prompt: e.target.value })} placeholder="Question prompt" />
                    <input className="input text-xs" disabled={locked} value={q.description ?? ""} onChange={(e) => updateQuestion(si, qi, { description: e.target.value })} placeholder="Description / guidance (optional)" />
                  </div>
                  <select className="input text-sm w-32" disabled={locked} value={q.inputType} onChange={(e) => updateQuestion(si, qi, { inputType: e.target.value })}>
                    <option value="rating">Rating</option>
                    <option value="text">Text</option>
                    <option value="select">Select</option>
                  </select>
                  {!locked && <button className="btn btn-danger text-xs" onClick={() => removeQuestion(si, qi)}>✕</button>}
                </div>
              </div>
            ))}
            {!locked && <button className="btn btn-secondary text-xs" onClick={() => addQuestion(si)}>+ Add Question</button>}
          </div>
        </div>
      ))}

      {!locked && (
        <button className="btn btn-secondary w-full" onClick={addSection}>+ Add Section</button>
      )}

      <div className="sticky bottom-0 bg-white border-t p-4 flex items-center justify-between -mx-8 px-8">
        <span className="text-sm text-gray-600">{saving}</span>
        <div className="flex gap-2">
          <button className="btn btn-danger" onClick={deleteTemplate}>Delete</button>
          <button className="btn btn-primary" onClick={save}>Save Template</button>
        </div>
      </div>
    </div>
  );
}
