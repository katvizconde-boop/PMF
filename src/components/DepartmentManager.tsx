"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { companyChipClass } from "@/lib/companies";

export function DepartmentManager({
  companies, defaultDepts, dbDepts,
}: {
  companies: string[];
  defaultDepts: Record<string, string[]>;
  dbDepts: { id: string; company: string; name: string }[];
}) {
  const router = useRouter();
  const [activeCompany, setActiveCompany] = useState(companies[0]);
  const [newDept, setNewDept] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const dbList = dbDepts.filter((d) => d.company === activeCompany);
  const defaultList = (defaultDepts[activeCompany] ?? []).filter(
    (n) => !dbList.some((d) => d.name === n)
  );

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!newDept.trim()) return;
    setBusy(true); setErr("");
    const res = await fetch("/api/departments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company: activeCompany, name: newDept.trim() }),
    });
    setBusy(false);
    if (res.ok) { setNewDept(""); router.refresh(); }
    else setErr(await res.text());
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete department "${name}"?`)) return;
    const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert(await res.text());
  }

  return (
    <div className="card">
      <h3 className="section-header">🏢 Departments / Teams</h3>
      <p className="text-xs text-gray-500 mb-3">Add or remove departments per company. Default departments are built-in and protected.</p>

      {/* Company tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {companies.map((c) => (
          <button key={c}
            onClick={() => setActiveCompany(c)}
            className={`chip cursor-pointer transition ${activeCompany === c ? "bg-primary-600 text-white" : `${companyChipClass(c)} hover:opacity-80`}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Add form */}
      <form onSubmit={add} className="flex gap-2 mb-4">
        <input className="input flex-1" placeholder={`New department for ${activeCompany}…`} value={newDept} onChange={(e) => setNewDept(e.target.value)} />
        <button className="btn btn-primary" disabled={busy}>{busy ? "Adding…" : "+ Add Department"}</button>
      </form>
      {err && <div className="text-sm text-red-600 mb-3">{err}</div>}

      {/* Existing list */}
      <div className="space-y-2">
        {defaultList.map((name) => (
          <div key={`default-${name}`} className="flex items-center justify-between p-2.5 border border-gray-100 rounded-lg bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-sm">{name}</span>
              <span className="chip bg-gray-200 text-gray-600 text-xs">default</span>
            </div>
            <span className="text-xs text-gray-400">built-in</span>
          </div>
        ))}
        {dbList.map((d) => (
          <div key={d.id} className="flex items-center justify-between p-2.5 border border-gray-200 rounded-lg hover:shadow-sm transition">
            <div className="flex items-center gap-2">
              <span className="text-sm">{d.name}</span>
              <span className="chip bg-emerald-100 text-emerald-700 text-xs">custom</span>
            </div>
            <button onClick={() => remove(d.id, d.name)} className="text-xs text-red-600 hover:underline">Remove</button>
          </div>
        ))}
        {defaultList.length === 0 && dbList.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No departments yet for this company.</p>
        )}
      </div>
    </div>
  );
}
