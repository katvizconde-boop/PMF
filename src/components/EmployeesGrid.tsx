"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ratingClass } from "@/lib/ui";
import { EmployeeModal, type EmployeeFormData } from "./EmployeeModal";
import { COMPANIES, companyChipClass, companyLogoPath } from "@/lib/companies";
import { PageHeader } from "./PageHeader";

export type EmpRow = {
  id: string; firstName: string; lastName: string; position: string | null;
  company: string | null; department: string | null; role: string; employmentType: string;
  managerName: string | null; managerPosition: string | null;
  evalCount: number; latestScore: number | null;
  profilePicture?: string | null;
};

export function EmployeesGrid({ initial, managers, departmentsByCompany }: {
  initial: EmpRow[];
  managers: { id: string; name: string; position: string | null }[];
  departmentsByCompany?: Record<string, string[]>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState<"ALL" | "REGULAR" | "PROBATIONARY" | "MANAGERS">("ALL");
  const [company, setCompany] = useState<string>("ALL");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const base = useMemo(() => initial.filter((e) =>
    `${e.firstName} ${e.lastName} ${e.position ?? ""} ${e.department ?? ""} ${e.company ?? ""}`.toLowerCase().includes(filter.toLowerCase())
  ).filter((e) => company === "ALL" || e.company === company), [initial, filter, company]);

  const filtered = useMemo(() => base.filter((e) => {
    if (tab === "ALL") return true;
    if (tab === "MANAGERS") return e.role === "MANAGER" || e.role === "HR_ADMIN";
    if (tab === "REGULAR") return e.role === "EMPLOYEE" && e.employmentType === "REGULAR";
    if (tab === "PROBATIONARY") return e.role === "EMPLOYEE" && (e.employmentType === "PROBATIONARY" || e.employmentType === "CONTRACTUAL");
    return true;
  }), [base, tab]);

  const counts = {
    ALL: base.length,
    REGULAR: base.filter((e) => e.role === "EMPLOYEE" && e.employmentType === "REGULAR").length,
    PROBATIONARY: base.filter((e) => e.role === "EMPLOYEE" && (e.employmentType === "PROBATIONARY" || e.employmentType === "CONTRACTUAL")).length,
    MANAGERS: base.filter((e) => e.role === "MANAGER" || e.role === "HR_ADMIN").length,
  };
  const tabs: Array<{ id: typeof tab; label: string }> = [
    { id: "ALL", label: "All" },
    { id: "REGULAR", label: "Regular" },
    { id: "PROBATIONARY", label: "Probationary" },
    { id: "MANAGERS", label: "Managers & Leaders" },
  ];

  function toggleSelect(id: string, ev: React.MouseEvent) {
    ev.preventDefault(); ev.stopPropagation();
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function selectAllVisible() {
    setSelected(new Set(filtered.map((e) => e.id)));
  }
  function clearSelection() { setSelected(new Set()); }

  async function handleSave(data: EmployeeFormData) {
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) { setOpen(false); router.refresh(); }
    else alert("Failed: " + (await res.text()));
  }

  async function handleDelete(e: React.MouseEvent, id: string, name: string) {
    e.preventDefault(); e.stopPropagation();
    if (!confirm(`Delete ${name}? This also removes all their evaluations. This cannot be undone.`)) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("Failed: " + (await res.text()));
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} employee(s)? This also removes all their evaluations. This cannot be undone.`)) return;
    const res = await fetch("/api/users/bulk-delete", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (res.ok) {
      const d = await res.json();
      alert(`✓ Deleted ${d.deleted}${d.errors?.length ? ` · Errors: ${d.errors.length}` : ""}`);
      clearSelection();
      router.refresh();
    } else alert("Failed: " + (await res.text()));
  }

  return (
    <div>
      <PageHeader title="Employees" subtitle="Manage your workforce — across all companies and departments" badge={`${initial.length} total`}>
        <input className="input w-64" placeholder="🔍 Search employees…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <button className="btn btn-primary" onClick={() => setOpen(true)}>+ Add Employee / Manager</button>
      </PageHeader>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bg-primary-600 text-white rounded-lg p-3 flex items-center justify-between mb-4 sticky top-2 z-30 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="font-medium">{selected.size} selected</span>
            <button onClick={clearSelection} className="text-xs underline opacity-80 hover:opacity-100">Clear</button>
          </div>
          <button onClick={handleBulkDelete} className="btn bg-red-600 hover:bg-red-700 text-white text-sm">🗑 Delete Selected</button>
        </div>
      )}

      {/* Company filter pills */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setCompany("ALL")}
          className={`chip cursor-pointer transition ${company === "ALL" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          🏢 All Companies <span className="ml-1 opacity-60">({initial.length})</span>
        </button>
        {COMPANIES.map((c) => (
          <button
            key={c}
            onClick={() => setCompany(c)}
            className={`chip cursor-pointer transition ${company === c ? "bg-primary-600 text-white" : `${companyChipClass(c)} hover:opacity-80`}`}
          >
            {c} <span className="ml-1 opacity-70">({initial.filter((e) => e.company === c).length})</span>
          </button>
        ))}
      </div>

      {/* Employment type tabs + Select all */}
      <div className="flex items-center justify-between gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition ${
                tab === t.id ? "border-primary-600 text-primary-700" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.label} <span className="ml-1 text-xs text-gray-400">({counts[t.id]})</span>
            </button>
          ))}
        </div>
        {filtered.length > 0 && (
          <button onClick={selectAllVisible} className="text-xs text-gray-500 hover:text-primary-600 mr-2">
            ☑ Select all visible
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 text-lg mb-2">No employees match.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((e) => {
            const isSel = selected.has(e.id);
            return (
              <div key={e.id} className={`card hover:shadow-md transition relative group ${isSel ? "ring-2 ring-primary-500" : ""}`}>
                <Link href={`/employees/${e.id}`} className="absolute inset-0 z-0" aria-label="Open employee" />
                {/* Select checkbox */}
                <button
                  onClick={(ev) => toggleSelect(e.id, ev)}
                  className={`absolute top-2 left-2 z-10 w-6 h-6 rounded border-2 flex items-center justify-center text-xs ${
                    isSel ? "bg-primary-600 border-primary-600 text-white"
                          : "bg-white border-gray-300 opacity-0 group-hover:opacity-100 hover:border-primary-500"
                  }`}
                  title="Select"
                >
                  {isSel && "✓"}
                </button>
                {/* Delete button */}
                <button
                  onClick={(ev) => handleDelete(ev, e.id, `${e.firstName} ${e.lastName}`)}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-red-50 text-red-600 text-sm opacity-0 group-hover:opacity-100 hover:bg-red-100 transition flex items-center justify-center"
                  title="Delete employee"
                >
                  ✕
                </button>
                <div className="relative z-0 pointer-events-none">
                  <div className="flex justify-between items-start pr-8 pl-8">
                    <div className="flex items-start gap-3">
                      {e.profilePicture ? (
                        <img src={e.profilePicture} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-lg flex-shrink-0">👤</div>
                      )}
                      <div>
                        <h3 className="font-bold text-gray-800 leading-tight">{e.firstName} {e.lastName}</h3>
                        <p className="text-xs text-gray-600 mt-0.5">{e.position ?? "—"}</p>
                      </div>
                    </div>
                    <span className={`rating-pill ${ratingClass(e.latestScore)}`}>
                      {e.latestScore != null ? e.latestScore.toFixed(1) : "N/A"}
                    </span>
                  </div>
                  {e.company && (
                    <div className="mt-2 pl-8 flex items-center gap-2">
                      {companyLogoPath(e.company) ? (
                        <img src={companyLogoPath(e.company)!} alt="" style={{ height: 22, width: "auto", maxWidth: 80, objectFit: "contain" }} />
                      ) : null}
                      <span className={`chip ${companyChipClass(e.company)}`}>{e.company}</span>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                    <span>📁 {e.department ?? "—"}</span>
                    <span>📋 {e.evalCount} {e.evalCount === 1 ? "eval" : "evals"}</span>
                    <span className="ml-auto flex gap-1">
                      {e.role === "HR_ADMIN" && <span className="chip bg-purple-100 text-purple-700">HR</span>}
                      {e.role === "MANAGER" && <span className="chip bg-blue-100 text-blue-700">Manager</span>}
                      <span className={`chip ${e.employmentType === "PROBATIONARY" ? "bg-amber-100 text-amber-700" : e.employmentType === "CONTRACTUAL" ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {e.employmentType}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <EmployeeModal
          title="Add Employee"
          managers={managers}
          onClose={() => setOpen(false)}
          onSave={handleSave}
          departmentsByCompany={departmentsByCompany}
        />
      )}
    </div>
  );
}
