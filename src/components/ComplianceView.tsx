"use client";
import { useState } from "react";
import Link from "next/link";

type Row = {
  id: string; name: string; email: string; position: string | null; role: string;
  employmentType: string; company: string | null; department: string | null;
  hireDate: string | null; tenureDays: number | null; yearsService: number | null;
  regEvalsFinalized: number; probEvalsFinalized: number;
  probationStatus: string | null; activePIP: boolean;
  contracts: number; certs: number;
};

export function ComplianceView({ rows }: { rows: Row[] }) {
  const [tab, setTab] = useState<"summary" | "tenure" | "probation" | "training" | "pips">("summary");
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const companies = Array.from(new Set(rows.map((r) => r.company).filter(Boolean))) as string[];

  const filtered = companyFilter === "ALL" ? rows : rows.filter((r) => r.company === companyFilter);

  function exportCsv() {
    const headers = ["Name", "Email", "Position", "Role", "Employment Type", "Company", "Department", "Hire Date", "Tenure (days)", "Years of Service", "Regular Evals", "Probationary Evals", "Probation Status", "Active PIP", "Contracts on File", "Certificates on File"];
    const csv = [
      headers.join(","),
      ...filtered.map((r) => [
        r.name, r.email, r.position ?? "", r.role, r.employmentType, r.company ?? "", r.department ?? "",
        r.hireDate ?? "", r.tenureDays ?? "", r.yearsService ?? "", r.regEvalsFinalized, r.probEvalsFinalized,
        r.probationStatus ?? "", r.activePIP ? "YES" : "NO", r.contracts, r.certs,
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `compliance-${tab}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  // Stats
  const total = filtered.length;
  const probationary = filtered.filter((r) => r.employmentType === "PROBATIONARY").length;
  const regular = filtered.filter((r) => r.employmentType === "REGULAR").length;
  const activePIPs = filtered.filter((r) => r.activePIP).length;
  const veterans = filtered.filter((r) => (r.yearsService ?? 0) >= 5).length;
  const newHires = filtered.filter((r) => (r.tenureDays ?? 0) < 90).length;

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="page-title">📜 Compliance Reports</h2>
          <p className="page-subtitle">DOLE-friendly reports — tenure, probation tracking, training, PIPs.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input text-sm w-auto" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
            <option value="ALL">All companies ({rows.length})</option>
            {companies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn btn-primary" onClick={exportCsv}>⬇ Export CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <Stat label="Total Headcount"  value={total}        icon="👥" color="bg-blue-50 text-blue-700" />
        <Stat label="Regular"          value={regular}      icon="✅" color="bg-emerald-50 text-emerald-700" />
        <Stat label="Probationary"     value={probationary} icon="⏳" color="bg-amber-50 text-amber-700" />
        <Stat label="Active PIPs"      value={activePIPs}   icon="🚨" color="bg-red-50 text-red-700" />
        <Stat label="5+ Year Veterans" value={veterans}     icon="🎖️" color="bg-purple-50 text-purple-700" />
        <Stat label="New Hires (90d)"  value={newHires}     icon="🌱" color="bg-indigo-50 text-indigo-700" />
      </div>

      <div className="tabs-bar mb-4">
        <button className={`tab ${tab === "summary" ? "active" : ""}`} onClick={() => setTab("summary")}>📋 Summary</button>
        <button className={`tab ${tab === "tenure" ? "active" : ""}`} onClick={() => setTab("tenure")}>📆 Tenure</button>
        <button className={`tab ${tab === "probation" ? "active" : ""}`} onClick={() => setTab("probation")}>⏳ Probationary</button>
        <button className={`tab ${tab === "pips" ? "active" : ""}`} onClick={() => setTab("pips")}>🚨 PIPs</button>
        <button className={`tab ${tab === "training" ? "active" : ""}`} onClick={() => setTab("training")}>🎓 Training</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2 px-2 font-semibold">Employee</th>
              <th className="py-2 px-2 font-semibold">Company / Dept</th>
              {(tab === "summary" || tab === "tenure") && (<>
                <th className="py-2 px-2 font-semibold">Hire Date</th>
                <th className="py-2 px-2 font-semibold text-right">Tenure</th>
              </>)}
              {(tab === "summary" || tab === "probation") && (<>
                <th className="py-2 px-2 font-semibold">Type</th>
                <th className="py-2 px-2 font-semibold">Probation Status</th>
                <th className="py-2 px-2 font-semibold text-center">Prob PMF</th>
              </>)}
              {(tab === "pips") && (<>
                <th className="py-2 px-2 font-semibold text-center">Active PIP</th>
              </>)}
              {(tab === "training") && (<>
                <th className="py-2 px-2 font-semibold text-center">Certificates</th>
                <th className="py-2 px-2 font-semibold text-center">Contracts</th>
              </>)}
              {(tab === "summary") && (<>
                <th className="py-2 px-2 font-semibold text-center">Regular PMFs</th>
              </>)}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered
              .filter((r) => {
                if (tab === "probation") return r.employmentType === "PROBATIONARY";
                if (tab === "pips") return r.activePIP;
                return true;
              })
              .map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2 px-2">
                    <div className="font-medium text-gray-800">{r.name}</div>
                    <div className="text-xs text-gray-500">{r.position ?? "—"}</div>
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      {r.company && (() => {
                        const logo = require("@/lib/companies").companyLogoPath(r.company);
                        return logo ? <img src={logo} alt="" style={{ height: 18, width: "auto", maxWidth: 50, objectFit: "contain" }} /> : null;
                      })()}
                      <div>
                        <div className="text-gray-700">{r.company ?? "—"}</div>
                        <div className="text-xs text-gray-500">{r.department ?? "—"}</div>
                      </div>
                    </div>
                  </td>
                  {(tab === "summary" || tab === "tenure") && (<>
                    <td className="py-2 px-2 text-gray-600">{r.hireDate ? new Date(r.hireDate).toLocaleDateString() : "—"}</td>
                    <td className="py-2 px-2 text-right">
                      <span className="font-semibold">{r.yearsService != null ? `${r.yearsService}y` : "—"}</span>
                      <span className="text-xs text-gray-500 ml-1">({r.tenureDays ?? 0}d)</span>
                    </td>
                  </>)}
                  {(tab === "summary" || tab === "probation") && (<>
                    <td className="py-2 px-2">
                      <span className={`chip ${r.employmentType === "REGULAR" ? "bg-emerald-100 text-emerald-700" : r.employmentType === "PROBATIONARY" ? "bg-amber-100 text-amber-700" : "bg-orange-100 text-orange-700"}`}>
                        {r.employmentType}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-xs">
                      {r.probationStatus ? (
                        <span className={r.probationStatus.startsWith("Overdue") ? "text-red-600 font-semibold" : "text-amber-700"}>{r.probationStatus}</span>
                      ) : "—"}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {r.employmentType === "PROBATIONARY"
                        ? (r.probEvalsFinalized > 0 ? <span className="text-emerald-600">✓</span> : <span className="text-red-600">✗</span>)
                        : <span className="text-gray-300">—</span>}
                    </td>
                  </>)}
                  {(tab === "pips") && (
                    <td className="py-2 px-2 text-center">{r.activePIP ? <span className="chip bg-red-100 text-red-700">Active</span> : "—"}</td>
                  )}
                  {(tab === "training") && (<>
                    <td className="py-2 px-2 text-center">{r.certs}</td>
                    <td className="py-2 px-2 text-center">{r.contracts}</td>
                  </>)}
                  {(tab === "summary") && (
                    <td className="py-2 px-2 text-center">{r.regEvalsFinalized}</td>
                  )}
                  <td className="py-2 px-2 text-right">
                    <Link href={`/employees/${r.id}`} className="btn btn-secondary text-xs">View</Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-500 mt-3">
        💡 Tip: Click <b>Export CSV</b> to download the current view for filing or DOLE submission.
      </div>
    </div>
  );
}

function Stat({ label, value, icon, color }: { label: string; value: any; icon: string; color: string }) {
  return (
    <div className="kpi-card">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${color}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5 leading-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}
