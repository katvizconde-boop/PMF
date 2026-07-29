"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "./Icons";
import { companyChipClass } from "@/lib/companies";

type Item = {
  id: string;
  privateRecommendation: string | null;
  privateRecommendationNotes: string | null;
  overallScore: number | null;
  state: string;
  managerSubmittedAt: string | null;
  finalizedAt: string | null;
  employee: { id: string; firstName: string; lastName: string; email: string; company: string | null; department: string | null; position: string | null; employmentType: string };
  manager: { id: string; firstName: string; lastName: string; email: string };
  cycle: { id: string; name: string };
  template: { name: string; type: string };
};

const REC_LABEL: Record<string, string> = {
  NO_ACTION: "No Action",
  SALARY_INCREASE: "Salary Increase",
  PROMOTION: "Promotion",
  LATERAL_MOVE: "Lateral Move",
  PIP: "Performance Improvement Plan",
  TERMINATION_REVIEW: "Termination Review",
  OTHER: "Other",
};

const REC_CHIP: Record<string, string> = {
  NO_ACTION: "bg-gray-100 text-gray-700",
  SALARY_INCREASE: "bg-emerald-100 text-emerald-700",
  PROMOTION: "bg-blue-100 text-blue-700",
  LATERAL_MOVE: "bg-purple-100 text-purple-700",
  PIP: "bg-amber-100 text-amber-800",
  TERMINATION_REVIEW: "bg-red-100 text-red-700",
  OTHER: "bg-slate-100 text-slate-700",
};

const REC_ORDER = ["PROMOTION", "SALARY_INCREASE", "LATERAL_MOVE", "NO_ACTION", "PIP", "TERMINATION_REVIEW", "OTHER"];

export function RecommendationsDashboard({
  items, cycles, companies, countsByRec, countsByCompany,
  activeCycleId, activeCompany, activeRec,
}: {
  items: Item[];
  cycles: { id: string; name: string }[];
  companies: string[];
  countsByRec: Record<string, number>;
  countsByCompany: Record<string, number>;
  activeCycleId: string | null;
  activeCompany: string;
  activeRec: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [query, setQuery] = useState("");

  function update(k: string, v: string) {
    const next = new URLSearchParams(sp.toString());
    if (v) next.set(k, v); else next.delete(k);
    router.push(`/recommendations?${next.toString()}`);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => {
      const hay = [
        i.employee.firstName, i.employee.lastName, i.employee.email,
        i.employee.position ?? "", i.employee.department ?? "",
        i.manager.firstName, i.manager.lastName,
        i.privateRecommendationNotes ?? "",
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  const total = items.length;

  function exportCsv() {
    const header = [
      "Cycle", "Employee", "Email", "Company", "Department", "Position", "Employment Type",
      "Manager", "Recommendation", "Notes", "Overall Score", "State", "Manager Submitted At", "Finalized At",
    ];
    const lines = [header.join(",")];
    for (const i of filtered) {
      const row = [
        i.cycle.name,
        `${i.employee.firstName} ${i.employee.lastName}`,
        i.employee.email,
        i.employee.company ?? "",
        i.employee.department ?? "",
        i.employee.position ?? "",
        i.employee.employmentType,
        `${i.manager.firstName} ${i.manager.lastName}`,
        REC_LABEL[i.privateRecommendation ?? ""] ?? i.privateRecommendation ?? "",
        (i.privateRecommendationNotes ?? "").replace(/"/g, '""'),
        i.overallScore != null ? i.overallScore.toFixed(2) : "",
        i.state,
        i.managerSubmittedAt ? new Date(i.managerSubmittedAt).toISOString() : "",
        i.finalizedAt ? new Date(i.finalizedAt).toISOString() : "",
      ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",");
      lines.push(row);
    }
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `manager-recommendations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* HR confidentiality banner */}
      <div className="card border-amber-300 bg-amber-50">
        <div className="flex items-start gap-3">
          <Icon.Lock size={18} className="text-amber-700 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">Confidential — HR only</p>
            <p className="text-xs mt-0.5">
              These are private recommendations from managers. Employees do not see this page. Treat the notes as confidential workforce-planning data.
            </p>
          </div>
        </div>
      </div>

      {/* Summary chips */}
      <div className="card">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="section-header mb-0 inline-flex items-center gap-1">
            <Icon.PieChart size={16} /> Cycle summary
          </h3>
          <div className="text-xs text-gray-500">
            {total} recommendation{total === 1 ? "" : "s"} in current view
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {REC_ORDER.filter((k) => countsByRec[k]).map((k) => (
            <button
              key={k}
              onClick={() => update("rec", activeRec === k ? "" : k)}
              className={`chip text-xs ${REC_CHIP[k]} ${activeRec === k ? "ring-2 ring-offset-1 ring-primary-400" : ""}`}
              title="Click to filter"
            >
              {REC_LABEL[k]} · <strong className="ml-1">{countsByRec[k]}</strong>
            </button>
          ))}
          {Object.keys(countsByRec).length === 0 && (
            <p className="text-xs text-gray-400 italic">No recommendations submitted in this cycle yet.</p>
          )}
        </div>
        {Object.keys(countsByCompany).length > 1 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">By company:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(countsByCompany).map(([co, n]) => (
                <span key={co} className={`chip text-xs ${companyChipClass(co)}`}>
                  {co} · <strong className="ml-1">{n}</strong>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="label">Cycle</label>
            <select className="input text-sm" value={activeCycleId ?? ""} onChange={(e) => update("cycleId", e.target.value)}>
              {cycles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Company</label>
            <select className="input text-sm" value={activeCompany} onChange={(e) => update("company", e.target.value)}>
              <option value="">All companies</option>
              {companies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Recommendation</label>
            <select className="input text-sm" value={activeRec} onChange={(e) => update("rec", e.target.value)}>
              <option value="">All types</option>
              {REC_ORDER.map((k) => <option key={k} value={k}>{REC_LABEL[k]}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Search</label>
            <input
              className="input text-sm"
              placeholder="Name, email, notes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={exportCsv} className="btn btn-secondary text-sm inline-flex items-center gap-1" disabled={filtered.length === 0}>
            <Icon.Download size={14} /> Export CSV ({filtered.length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card-flush">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 inline-flex items-center gap-1">
            <Icon.Clipboard size={16} /> Recommendations
          </h3>
          <span className="text-xs text-gray-500">{filtered.length} record{filtered.length === 1 ? "" : "s"}</span>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No recommendations match these filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-2.5">Employee</th>
                  <th className="px-4 py-2.5">Manager</th>
                  <th className="px-4 py-2.5">Recommendation</th>
                  <th className="px-4 py-2.5">Notes</th>
                  <th className="px-4 py-2.5">Score</th>
                  <th className="px-4 py-2.5">State</th>
                  <th className="px-4 py-2.5">Submitted</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => (
                  <tr key={i.id} className="border-t border-gray-100 hover:bg-gray-50 align-top">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{i.employee.firstName} {i.employee.lastName}</div>
                      <div className="text-xs text-gray-500">{i.employee.position ?? "—"}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {i.employee.company && <span className={`chip text-[10px] ${companyChipClass(i.employee.company)}`}>{i.employee.company}</span>}
                        {i.employee.department && <span className="chip text-[10px] bg-gray-100 text-gray-600">{i.employee.department}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {i.manager.firstName} {i.manager.lastName}
                      <div className="text-xs text-gray-400">{i.manager.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`chip text-xs ${REC_CHIP[i.privateRecommendation ?? "OTHER"] ?? "bg-gray-100"}`}>
                        {REC_LABEL[i.privateRecommendation ?? ""] ?? i.privateRecommendation}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-md">
                      {i.privateRecommendationNotes ? (
                        <div className="line-clamp-4 whitespace-pre-wrap">{i.privateRecommendationNotes}</div>
                      ) : (
                        <span className="text-gray-300 italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {i.overallScore != null ? (
                        <span className="font-bold text-gray-800">{i.overallScore.toFixed(2)}</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="chip text-[10px] bg-gray-100 text-gray-700">{i.state.replace("_", " ")}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {i.managerSubmittedAt ? new Date(i.managerSubmittedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/assignments/${i.id}`} className="btn btn-secondary text-xs">Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
