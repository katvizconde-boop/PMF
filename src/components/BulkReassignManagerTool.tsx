"use client";
import { useMemo, useState } from "react";
import { Icon } from "./Icons";

type Person = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  company: string | null;
  department: string | null;
  position: string | null;
  managerId: string | null;
  managerName: string | null;
};

export function BulkReassignManagerTool({
  managers,
  employees,
  companies,
}: {
  managers: { id: string; name: string; company: string | null; department: string | null }[];
  employees: Person[];
  companies: string[];
}) {
  const [company, setCompany] = useState<string>(companies[0] ?? "");
  const [targetManagerId, setTargetManagerId] = useState<string>("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showMismatchOnly, setShowMismatchOnly] = useState(false);

  const targetManager = managers.find((m) => m.id === targetManagerId) ?? null;

  const filteredEmployees = useMemo(() => {
    const term = q.trim().toLowerCase();
    return employees
      .filter((e) => !company || e.company === company)
      .filter((e) => {
        if (!showMismatchOnly || !targetManager) return true;
        // "Mismatched" = current manager isn't the target
        return e.managerId !== targetManagerId;
      })
      .filter((e) => {
        if (!term) return true;
        return [e.firstName, e.lastName, e.email, e.position ?? "", e.department ?? "", e.managerName ?? ""]
          .join(" ").toLowerCase().includes(term);
      })
      .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
  }, [employees, company, q, showMismatchOnly, targetManagerId, targetManager]);

  const availableManagers = useMemo(
    () => managers.filter((m) => !company || m.company === company).sort((a, b) => a.name.localeCompare(b.name)),
    [managers, company]
  );

  function togglePick(id: string) {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id); else next.add(id);
    setPicked(next);
  }
  function pickAllVisible() {
    const next = new Set(picked);
    filteredEmployees.forEach((e) => next.add(e.id));
    setPicked(next);
  }
  function clearPicks() { setPicked(new Set()); }

  async function apply() {
    if (!targetManagerId) { setErr("Choose the target manager first."); return; }
    if (picked.size === 0) { setErr("Tick at least one employee to reassign."); return; }
    const mgr = managers.find((m) => m.id === targetManagerId)!;
    if (!confirm(
      `Reassign ${picked.size} employee${picked.size === 1 ? "" : "s"} to ${mgr.name}?\n\n` +
      `• Their primary manager becomes ${mgr.name}\n` +
      `• Non-finalized PMFs will move to ${mgr.name}'s dashboard\n` +
      `• Finalized PMFs stay as-is (historical accuracy)`
    )) return;

    setBusy(true); setErr(null); setFlash(null);
    try {
      const res = await fetch("/api/admin/bulk-reassign-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId: targetManagerId, employeeIds: Array.from(picked) }),
      });
      if (!res.ok) throw new Error(await res.text());
      const d = await res.json();
      setFlash(`✓ Reassigned ${d.usersUpdated} employee${d.usersUpdated === 1 ? "" : "s"} to ${d.manager}. ${d.assignmentsUpdated} open PMF${d.assignmentsUpdated === 1 ? "" : "s"} rewired.`);
      setPicked(new Set());
      // Reload the page data
      setTimeout(() => location.reload(), 1500);
    } catch (e: any) {
      setErr(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h3 className="section-header inline-flex items-center gap-1"><Icon.Users size={16} /> Bulk Reassign Manager</h3>
      <p className="text-xs text-gray-500 mb-4">
        Fix wrong team assignments in bulk. Pick the target manager, tick the employees who should report to them, click Apply.
        Non-finalized PMFs move too; finalized PMFs stay for history.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="label">Company</label>
          <select className="input text-sm" value={company} onChange={(e) => { setCompany(e.target.value); setPicked(new Set()); setTargetManagerId(""); }}>
            {companies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label">Target Manager</label>
          <select className="input text-sm" value={targetManagerId} onChange={(e) => setTargetManagerId(e.target.value)}>
            <option value="">— Choose the manager —</option>
            {availableManagers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}{m.department ? `  ·  ${m.department}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <input
          className="input text-sm flex-1 min-w-[220px]"
          placeholder="Search name, email, position, current manager…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <label className="text-xs inline-flex items-center gap-1 whitespace-nowrap">
          <input type="checkbox" checked={showMismatchOnly} onChange={(e) => setShowMismatchOnly(e.target.checked)} disabled={!targetManagerId} />
          Show only employees NOT already under this manager
        </label>
      </div>

      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="text-xs text-gray-500">
          {filteredEmployees.length} employee{filteredEmployees.length === 1 ? "" : "s"} shown · <strong>{picked.size} ticked</strong>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-secondary text-xs" onClick={pickAllVisible} disabled={filteredEmployees.length === 0}>Tick all visible</button>
          <button type="button" className="btn btn-secondary text-xs" onClick={clearPicks} disabled={picked.size === 0}>Clear</button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
        {filteredEmployees.length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-8">No employees match this filter.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="px-3 py-2 w-8"></th>
                <th className="px-3 py-2">Employee</th>
                <th className="px-3 py-2">Department</th>
                <th className="px-3 py-2">Current manager</th>
                <th className="px-3 py-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((e) => {
                const alreadyUnder = targetManagerId && e.managerId === targetManagerId;
                return (
                  <tr key={e.id} className={`border-t border-gray-100 hover:bg-gray-50 ${alreadyUnder ? "bg-emerald-50/40" : ""}`}>
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={picked.has(e.id)} onChange={() => togglePick(e.id)} />
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-semibold text-gray-800">{e.lastName}, {e.firstName}</div>
                      <div className="text-xs text-gray-500">{e.position ?? "—"}</div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">{e.department ?? "—"}</td>
                    <td className="px-3 py-2 text-xs">
                      {e.managerName
                        ? <span className={alreadyUnder ? "text-emerald-700 font-semibold" : "text-gray-700"}>{e.managerName}{alreadyUnder && " ✓"}</span>
                        : <span className="text-red-600 italic">— none —</span>}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">{e.role}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {err && <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded p-2 mt-3">{err}</div>}
      {flash && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded p-2 mt-3">{flash}</div>}

      <div className="flex justify-end mt-4">
        <button className="btn btn-primary text-sm inline-flex items-center gap-1" onClick={apply} disabled={busy || !targetManagerId || picked.size === 0}>
          {busy ? "Applying…" : <>Apply — reassign {picked.size} employee{picked.size === 1 ? "" : "s"}</>}
        </button>
      </div>
    </div>
  );
}
