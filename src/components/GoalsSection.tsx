"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icons";
import { PrintSectionButton } from "./PrintSectionButton";

type Goal = {
  id: string; description: string; target: string | null; status: string;
  rating: number | null; evidence: string | null;
  cycle: { id: string; name: string };
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  ACTIVE: "bg-blue-100 text-blue-700",
  ACHIEVED: "bg-emerald-100 text-emerald-700",
  PARTIALLY_ACHIEVED: "bg-amber-100 text-amber-700",
  MISSED: "bg-red-100 text-red-700",
  DEFERRED: "bg-purple-100 text-purple-700",
};
const STATUS_OPTIONS = ["DRAFT", "ACTIVE", "ACHIEVED", "PARTIALLY_ACHIEVED", "MISSED", "DEFERRED"];

export function GoalsSection({
  employeeId, cycles, canRate, canAdd,
}: {
  employeeId: string;
  cycles: { id: string; name: string }[];
  canRate: boolean;   // manager or HR
  canAdd: boolean;    // manager, HR, or self
}) {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({ cycleId: cycles[0]?.id ?? "", description: "", target: "" });

  async function load() {
    const res = await fetch(`/api/goals?userId=${employeeId}`);
    if (res.ok) { const d = await res.json(); setGoals(d.goals); }
  }
  useEffect(() => { load(); }, [employeeId]);

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/goals", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: employeeId, ...newGoal }),
    });
    setBusy(false);
    if (res.ok) { setAdding(false); setNewGoal({ cycleId: cycles[0]?.id ?? "", description: "", target: "" }); load(); }
    else alert(await res.text());
  }

  async function updateGoal(id: string, patch: Partial<Goal>) {
    const res = await fetch(`/api/goals/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
    });
    if (res.ok) load();
    else alert(await res.text());
  }

  async function remove(id: string) {
    if (!confirm("Delete this goal?")) return;
    const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  const byCycle: Record<string, Goal[]> = {};
  for (const g of goals) (byCycle[g.cycle.name] ??= []).push(g);

  return (
    <div className="card printable-goals">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-header mb-0 inline-flex items-center gap-1"><Icon.Target size={16} /> Goals</h3>
        <div className="inline-flex items-center gap-2">
          <PrintSectionButton sectionId="goals" label="goals" />
          {canAdd && !adding && <button className="btn btn-primary text-xs" onClick={() => setAdding(true)}>+ Add Goal</button>}
        </div>
      </div>

      {adding && (
        <form onSubmit={addGoal} className="mb-4 p-3 bg-gray-50 rounded-lg space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select className="input text-sm" value={newGoal.cycleId} onChange={(e) => setNewGoal({ ...newGoal, cycleId: e.target.value })}>
              {cycles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="input text-sm md:col-span-2" required placeholder="Goal description" value={newGoal.description} onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })} />
          </div>
          <input className="input text-sm" placeholder="Measurable target (optional, e.g. 'Reduce time-to-hire to 14 days')" value={newGoal.target} onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })} />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary text-xs" onClick={() => setAdding(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary text-xs" disabled={busy}>Save</button>
          </div>
        </form>
      )}

      {goals.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">No goals set yet.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(byCycle).map(([cycleName, gs]) => (
            <div key={cycleName}>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{cycleName}</div>
              <div className="space-y-2">
                {gs.map((g) => (
                  <div key={g.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-800">{g.description}</div>
                        {g.target && <div className="text-xs text-gray-500 mt-0.5 inline-flex items-center gap-1"><Icon.Target size={12} /> {g.target}</div>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <select value={g.status} onChange={(e) => updateGoal(g.id, { status: e.target.value })} className={`chip cursor-pointer border-0 outline-none ${STATUS_COLORS[g.status] ?? STATUS_COLORS.DRAFT}`}>
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                        </select>
                        {canRate && (
                          <select
                            value={g.rating ?? ""}
                            onChange={(e) => updateGoal(g.id, { rating: e.target.value as any })}
                            className="text-xs px-2 py-0.5 border border-gray-200 rounded bg-white"
                          >
                            <option value="">Rate…</option>
                            {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        )}
                        <button onClick={() => remove(g.id)} className="text-xs text-gray-400 hover:text-red-600 px-1"><Icon.X size={12} /></button>
                      </div>
                    </div>
                    {canRate && (
                      <input
                        className="input text-xs mt-2"
                        placeholder="Evidence / notes (optional)"
                        defaultValue={g.evidence ?? ""}
                        onBlur={(e) => { if (e.target.value !== (g.evidence ?? "")) updateGoal(g.id, { evidence: e.target.value } as any); }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
