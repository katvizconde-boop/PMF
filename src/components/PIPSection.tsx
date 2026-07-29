"use client";
import { useEffect, useState } from "react";
import { Icon } from "./Icons";
import { PrintSectionButton } from "./PrintSectionButton";

type PIP = {
  id: string; startDate: string; endDate: string; status: string;
  reason: string; goals: string; outcome: string | null;
  manager: { firstName: string; lastName: string };
};

const STATUS = {
  ACTIVE:        { label: "ACTIVE",        color: "bg-amber-100 text-amber-700",    Icon: Icon.Alert },
  SUCCESSFUL:    { label: "SUCCESSFUL",    color: "bg-emerald-100 text-emerald-700", Icon: Icon.CheckCircle },
  UNSUCCESSFUL:  { label: "UNSUCCESSFUL",  color: "bg-red-100 text-red-700",         Icon: Icon.X },
  EXTENDED:      { label: "EXTENDED",      color: "bg-purple-100 text-purple-700",   Icon: Icon.Calendar },
  CANCELLED:     { label: "CANCELLED",     color: "bg-gray-100 text-gray-600",       Icon: Icon.X },
};

export function PIPSection({ employeeId, currentUserCanEdit }: { employeeId: string; currentUserCanEdit: boolean }) {
  const [items, setItems] = useState<PIP[]>([]);
  const [adding, setAdding] = useState(false);

  async function load() {
    const res = await fetch(`/api/pips?userId=${employeeId}`);
    if (res.ok) { const d = await res.json(); setItems(d.items); }
  }
  useEffect(() => { load(); }, [employeeId]);

  async function update(id: string, patch: any) {
    const res = await fetch(`/api/pips/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    if (res.ok) load(); else alert(await res.text());
  }

  return (
    <div className="card printable-pip">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-header mb-0 inline-flex items-center gap-1"><Icon.Alert size={16} className="text-amber-600" /> Performance Improvement Plans</h3>
        <div className="inline-flex items-center gap-2">
          <PrintSectionButton sectionId="pip" label="PIPs" />
          {currentUserCanEdit && !adding && <button className="btn btn-danger text-xs" onClick={() => setAdding(true)}>+ Start PIP</button>}
        </div>
      </div>

      {adding && <NewPIPForm employeeId={employeeId} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />}

      {items.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6 inline-flex items-center justify-center gap-1">No PIPs on record. (That's a good thing <Icon.Sprout size={14} className="text-emerald-500" />)</p>
      ) : (
        <div className="space-y-3">
          {items.map((p) => {
            const s = STATUS[p.status as keyof typeof STATUS] ?? STATUS.ACTIVE;
            const today = new Date();
            const endDate = new Date(p.endDate);
            const daysLeft = Math.round((endDate.getTime() - today.getTime()) / 86400000);
            return (
              <div key={p.id} className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`chip ${s.color} inline-flex items-center gap-1`}><s.Icon size={12} /> {s.label}</span>
                      {p.status === "ACTIVE" && (
                        <span className="text-xs text-gray-500">{daysLeft >= 0 ? `${daysLeft} days remaining` : `${-daysLeft} days overdue`}</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(p.startDate).toLocaleDateString()} → {new Date(p.endDate).toLocaleDateString()}
                      {" · "}
                      <span className="text-gray-500">Manager: {p.manager.firstName} {p.manager.lastName}</span>
                    </div>
                  </div>
                  {currentUserCanEdit && p.status === "ACTIVE" && (
                    <div className="flex gap-1">
                      <button className="btn btn-success text-xs" onClick={() => update(p.id, { status: "SUCCESSFUL" })}>Mark Success</button>
                      <button className="btn btn-danger text-xs" onClick={() => update(p.id, { status: "UNSUCCESSFUL" })}>Mark Unsuccessful</button>
                    </div>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-1">Reason</div>
                    <div className="text-gray-700 whitespace-pre-wrap">{p.reason}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-1">Improvement Goals</div>
                    <div className="text-gray-700 whitespace-pre-wrap">{p.goals}</div>
                  </div>
                  {p.outcome && (
                    <div>
                      <div className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-1">Outcome</div>
                      <div className="text-gray-700 whitespace-pre-wrap">{p.outcome}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewPIPForm({ employeeId, onClose, onSaved }: { employeeId: string; onClose: () => void; onSaved: () => void }) {
  const today = new Date().toISOString().split("T")[0];
  const inOneMonth = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
  const [form, setForm] = useState({ startDate: today, endDate: inOneMonth, reason: "", goals: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/pips", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: employeeId, ...form }),
    });
    setBusy(false);
    if (res.ok) onSaved();
    else alert(await res.text());
  }

  return (
    <form onSubmit={submit} className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
      <div className="text-xs text-red-700 font-semibold mb-2 inline-flex items-center gap-1"><Icon.Alert size={12} className="text-amber-600" /> Starting a PIP is a formal action that will be auditable.</div>
      <div className="grid md:grid-cols-2 gap-2">
        <div>
          <label className="label">Start Date</label>
          <input type="date" className="input text-sm" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </div>
        <div>
          <label className="label">End Date</label>
          <input type="date" className="input text-sm" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label">Reason for PIP</label>
        <textarea className="input text-sm" rows={2} required placeholder="e.g. Performance below expectations in Q1 2026 — specifically X, Y, Z." value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
      </div>
      <div>
        <label className="label">Improvement Goals & Milestones</label>
        <textarea className="input text-sm" rows={4} required placeholder="• Week 1: …&#10;• Week 2: …&#10;• Week 4: …" value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-secondary text-xs" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-danger text-xs" disabled={busy}>{busy ? "Starting…" : "Start PIP"}</button>
      </div>
    </form>
  );
}
