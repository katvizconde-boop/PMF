"use client";
import { useEffect, useState } from "react";
import { Icon } from "./Icons";

type CoManager = {
  id: string;
  notes: string | null;
  createdAt: string;
  manager: { id: string; firstName: string; lastName: string; email: string; position: string | null };
};

type ManagerOption = { id: string; firstName: string; lastName: string; position: string | null; email: string };

export function CoManagersSection({
  employeeId,
  employeeName,
  primaryManagerId,
  viewerRole,
  managerOptions,
}: {
  employeeId: string;
  employeeName: string;
  primaryManagerId: string | null;
  viewerRole: "HR_ADMIN" | "MANAGER" | "EMPLOYEE";
  managerOptions: ManagerOption[];
}) {
  const [items, setItems] = useState<CoManager[]>([]);
  const [adding, setAdding] = useState(false);
  const [pickId, setPickId] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canEdit = viewerRole === "HR_ADMIN";

  async function load() {
    const res = await fetch(`/api/users/${employeeId}/co-managers`);
    if (res.ok) {
      const d = await res.json();
      setItems(d.coManagers ?? []);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [employeeId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!pickId) return;
    setBusy(true);
    setErr(null);
    const res = await fetch(`/api/users/${employeeId}/co-managers`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ managerId: pickId, notes: notes || null }),
    });
    if (res.ok) {
      setPickId("");
      setNotes("");
      setAdding(false);
      load();
    } else {
      setErr(await res.text());
    }
    setBusy(false);
  }

  async function remove(coManagerId: string, name: string) {
    if (!confirm(`Remove ${name} as a co-manager of ${employeeName}? They'll lose access to this employee's PMF.`)) return;
    const res = await fetch(`/api/users/${employeeId}/co-managers?coManagerId=${coManagerId}`, { method: "DELETE" });
    if (res.ok) load();
    else alert("Failed: " + (await res.text()));
  }

  // Filter manager options — exclude primary manager and already-assigned co-managers
  const existingIds = new Set([primaryManagerId, ...items.map((i) => i.manager.id)].filter(Boolean));
  const available = managerOptions.filter((m) => !existingIds.has(m.id) && m.id !== employeeId);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="section-header mb-0 inline-flex items-center gap-1">
          <Icon.Users size={16} /> Co-Managers
          {items.length > 0 && <span className="text-xs text-gray-500 font-normal">({items.length})</span>}
        </h3>
        {canEdit && !adding && (
          <button className="btn btn-primary text-xs inline-flex items-center gap-1" onClick={() => setAdding(true)}>
            <Icon.Plus size={14} /> Add Co-Manager
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Co-managers can view and evaluate {employeeName}'s PMF collaboratively with the primary manager.
        Useful for teams with multiple leads (e.g., RythmosDB squads). All co-managers see the same form and can edit it — auto-save handles concurrent edits.
      </p>

      {adding && (
        <form onSubmit={add} className="mb-4 p-3 bg-primary-50/40 border border-primary-100 rounded-lg space-y-3">
          <div>
            <label className="label">Add as co-manager</label>
            <select className="input text-sm" value={pickId} onChange={(e) => setPickId(e.target.value)} required>
              <option value="">— Choose a manager —</option>
              {available.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName}{m.position ? `  ·  ${m.position}` : ""}
                </option>
              ))}
            </select>
            {available.length === 0 && (
              <p className="text-xs text-amber-700 mt-1 italic">
                All other managers are already assigned. (The primary manager has automatic access.)
              </p>
            )}
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <input
              className="input text-sm"
              maxLength={1000}
              placeholder="e.g., Shared with Account Lead during Q3 — joint review"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {err && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded p-2 inline-flex items-center gap-1">
              <Icon.Alert size={12} className="text-red-600" /> {err}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary text-xs" onClick={() => { setAdding(false); setErr(null); setPickId(""); setNotes(""); }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary text-xs" disabled={busy || !pickId}>
              {busy ? "Adding…" : "Add Co-Manager"}
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-gray-400 italic text-center py-4">
          No co-managers assigned. The primary manager is the only one with access.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-3 p-3 border border-gray-200 rounded-lg hover:border-primary-200 transition">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
                  {c.manager.firstName[0]}{c.manager.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 truncate">{c.manager.firstName} {c.manager.lastName}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {c.manager.position ? `${c.manager.position}  ·  ` : ""}{c.manager.email}
                  </div>
                  {c.notes && (
                    <div className="text-xs text-gray-700 italic mt-1 bg-gray-50 px-2 py-1 rounded inline-block">
                      {c.notes}
                    </div>
                  )}
                  <div className="text-[10px] text-gray-400 mt-1">
                    Assigned {new Date(c.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => remove(c.id, `${c.manager.firstName} ${c.manager.lastName}`)}
                  className="text-xs text-gray-400 hover:text-red-600 flex-shrink-0 p-1"
                  title="Remove co-manager"
                >
                  <Icon.Trash size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
