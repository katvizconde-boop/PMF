"use client";
import { useEffect, useState } from "react";

type Meeting = {
  id: string; scheduledAt: string; agenda: string | null; notes: string | null;
  actionItems: string | null; completedAt: string | null;
  manager: { firstName: string; lastName: string };
};

export function OneOnOnesSection({ employeeId, currentUserCanEdit }: { employeeId: string; currentUserCanEdit: boolean }) {
  const [items, setItems] = useState<Meeting[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ scheduledAt: "", agenda: "", notes: "", actionItems: "" });

  async function load() {
    const res = await fetch(`/api/oneonones?employeeId=${employeeId}`);
    if (res.ok) { const d = await res.json(); setItems(d.items); }
  }
  useEffect(() => { load(); }, [employeeId]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/oneonones", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, ...form }),
    });
    if (res.ok) { setAdding(false); setForm({ scheduledAt: "", agenda: "", notes: "", actionItems: "" }); load(); }
    else alert(await res.text());
  }

  async function update(id: string, patch: any) {
    const res = await fetch(`/api/oneonones/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
    });
    if (res.ok) load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this 1:1?")) return;
    await fetch(`/api/oneonones/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-header mb-0">📔 1:1 Meeting Notes</h3>
        {currentUserCanEdit && !adding && <button className="btn btn-primary text-xs" onClick={() => setAdding(true)}>+ New 1:1</button>}
      </div>

      {adding && (
        <form onSubmit={create} className="mb-4 p-3 bg-gray-50 rounded-lg space-y-2">
          <div className="grid md:grid-cols-2 gap-2">
            <div>
              <label className="label">Date & Time</label>
              <input type="datetime-local" className="input text-sm" required value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Agenda</label>
            <textarea className="input text-sm" rows={2} placeholder="What will you talk about?" value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input text-sm" rows={3} placeholder="Discussion notes…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div>
            <label className="label">Action Items</label>
            <textarea className="input text-sm" rows={2} placeholder="• Item 1&#10;• Item 2" value={form.actionItems} onChange={(e) => setForm({ ...form, actionItems: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary text-xs" onClick={() => setAdding(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary text-xs">Save 1:1</button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">No 1:1 meetings logged yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <div key={m.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📅</span>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">
                      {new Date(m.scheduledAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      {" · "}
                      {new Date(m.scheduledAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </div>
                    <div className="text-xs text-gray-500">with {m.manager.firstName} {m.manager.lastName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.completedAt
                    ? <span className="chip bg-emerald-100 text-emerald-700">✓ Done</span>
                    : currentUserCanEdit && <button className="text-xs text-emerald-600 hover:underline" onClick={() => update(m.id, { completed: true })}>Mark done</button>}
                  {currentUserCanEdit && <button className="text-xs text-gray-400 hover:text-gray-700" onClick={() => setEditing(editing === m.id ? null : m.id)}>{editing === m.id ? "Close" : "Edit"}</button>}
                  {currentUserCanEdit && <button className="text-xs text-gray-400 hover:text-red-600" onClick={() => remove(m.id)}>✕</button>}
                </div>
              </div>
              {editing === m.id ? (
                <EditForm meeting={m} onSave={(patch) => { update(m.id, patch); setEditing(null); }} />
              ) : (
                <div className="space-y-2 text-sm">
                  {m.agenda && <div><span className="font-semibold text-gray-600">Agenda: </span><span className="text-gray-700 whitespace-pre-wrap">{m.agenda}</span></div>}
                  {m.notes && <div><span className="font-semibold text-gray-600">Notes: </span><span className="text-gray-700 whitespace-pre-wrap">{m.notes}</span></div>}
                  {m.actionItems && <div><span className="font-semibold text-gray-600">Action items: </span><span className="text-gray-700 whitespace-pre-wrap">{m.actionItems}</span></div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditForm({ meeting, onSave }: { meeting: Meeting; onSave: (patch: any) => void }) {
  const [agenda, setAgenda] = useState(meeting.agenda ?? "");
  const [notes, setNotes] = useState(meeting.notes ?? "");
  const [actionItems, setActionItems] = useState(meeting.actionItems ?? "");
  return (
    <div className="space-y-2">
      <textarea className="input text-sm" rows={2} placeholder="Agenda" value={agenda} onChange={(e) => setAgenda(e.target.value)} />
      <textarea className="input text-sm" rows={3} placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <textarea className="input text-sm" rows={2} placeholder="Action items" value={actionItems} onChange={(e) => setActionItems(e.target.value)} />
      <div className="flex justify-end">
        <button className="btn btn-primary text-xs" onClick={() => onSave({ agenda, notes, actionItems })}>Save</button>
      </div>
    </div>
  );
}
