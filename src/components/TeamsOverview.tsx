"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "./Icons";
import { companyChipClass } from "@/lib/companies";

type Team = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  company: string | null;
  department: string | null;
  position: string | null;
  directReports: {
    id: string; firstName: string; lastName: string; position: string | null;
    employmentType: string; company: string | null; department: string | null; role: string;
  }[];
  coManaged: {
    id: string; firstName: string; lastName: string; position: string | null;
    company: string | null; department: string | null;
  }[];
};

type Orphan = {
  id: string; firstName: string; lastName: string; company: string | null;
  department: string | null; position: string | null; role: string;
};

export function TeamsOverview({
  teams, orphans, companies, activeCompany, activeQuery,
}: {
  teams: Team[];
  orphans: Orphan[];
  companies: string[];
  activeCompany: string;
  activeQuery: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(activeQuery);
  const [hideEmpty, setHideEmpty] = useState(false);

  function update(k: string, v: string) {
    const next = new URLSearchParams(sp.toString());
    if (v) next.set(k, v); else next.delete(k);
    router.push(`/teams?${next.toString()}`);
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return teams
      .filter((t) => !activeCompany || t.company === activeCompany)
      .filter((t) => {
        if (hideEmpty) return t.directReports.length > 0 || t.coManaged.length > 0;
        return true;
      })
      .filter((t) => {
        if (!term) return true;
        const hay = [
          `${t.firstName} ${t.lastName}`, t.email, t.position ?? "", t.department ?? "",
          ...t.directReports.map((r) => `${r.firstName} ${r.lastName} ${r.position ?? ""}`),
          ...t.coManaged.map((c) => `${c.firstName} ${c.lastName} ${c.position ?? ""}`),
        ].join(" ").toLowerCase();
        return hay.includes(term);
      });
  }, [teams, activeCompany, q, hideEmpty]);

  const filteredOrphans = useMemo(() => {
    return orphans
      .filter((o) => !activeCompany || o.company === activeCompany)
      .filter((o) => {
        if (!q.trim()) return true;
        return `${o.firstName} ${o.lastName}`.toLowerCase().includes(q.trim().toLowerCase());
      });
  }, [orphans, activeCompany, q]);

  const totalReports = filtered.reduce((s, t) => s + t.directReports.length, 0);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="label">Company</label>
            <select className="input text-sm" value={activeCompany} onChange={(e) => update("company", e.target.value)}>
              <option value="">All companies</option>
              {companies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Search</label>
            <div className="flex gap-2">
              <input
                className="input text-sm flex-1"
                placeholder="Manager, employee, position, department…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") update("q", q); }}
              />
              <button className="btn btn-secondary text-sm whitespace-nowrap" onClick={() => update("q", q)}>Search</button>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
          <label className="text-xs inline-flex items-center gap-1">
            <input type="checkbox" checked={hideEmpty} onChange={(e) => setHideEmpty(e.target.checked)} />
            Hide managers with no team members
          </label>
          <div className="text-xs text-gray-500">
            {filtered.length} manager{filtered.length === 1 ? "" : "s"} · {totalReports} direct report{totalReports === 1 ? "" : "s"}
            {filteredOrphans.length > 0 && <span className="text-red-700 font-semibold"> · {filteredOrphans.length} without a manager</span>}
          </div>
        </div>
      </div>

      {/* Orphans warning */}
      {filteredOrphans.length > 0 && (
        <div className="card border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <Icon.Alert size={20} className="text-red-700 mt-0.5" />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-red-900">
                {filteredOrphans.length} employee{filteredOrphans.length === 1 ? "" : "s"} without a primary manager
              </h3>
              <p className="text-xs text-red-700 mt-0.5">
                These employees won't appear on any manager's dashboard. Fix in Employees → Edit, or use the Bulk Reassign Manager tool in Admin Settings.
              </p>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredOrphans.map((o) => (
                  <Link key={o.id} href={`/employees/${o.id}`} className="text-xs bg-white border border-red-200 hover:border-red-400 rounded px-2 py-1.5 flex items-center justify-between transition">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-800 truncate">{o.firstName} {o.lastName}</div>
                      <div className="text-[11px] text-gray-500 truncate">
                        {o.position ?? "—"}
                        {o.company && <> · {o.company}</>}
                        {o.department && <> · {o.department}</>}
                      </div>
                    </div>
                    <Icon.Edit size={12} className="text-gray-400 flex-shrink-0 ml-2" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team cards */}
      {filtered.length === 0 ? (
        <div className="card text-center text-gray-400 text-sm py-10">No managers match this filter.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((t) => {
            const totalTeam = t.directReports.length + t.coManaged.length;
            return (
              <div key={t.id} className="card-flush">
                {/* Manager header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 truncate">{t.firstName} {t.lastName}</h3>
                      <span className="chip text-[10px] bg-gray-100 text-gray-700">{t.role.replace("_", " ")}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {t.position ?? "—"}
                      {t.department && <> · {t.department}</>}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {t.company && <span className={`chip text-[10px] ${companyChipClass(t.company)}`}>{t.company}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-primary-700">{totalTeam}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">
                      {totalTeam === 1 ? "team member" : "team members"}
                    </div>
                  </div>
                </div>

                {/* Direct reports */}
                {t.directReports.length === 0 && t.coManaged.length === 0 ? (
                  <div className="px-5 py-6 text-xs text-gray-400 italic text-center">No team members assigned.</div>
                ) : (
                  <div className="px-5 py-3">
                    {t.directReports.length > 0 && (
                      <>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
                          Direct reports ({t.directReports.length})
                        </div>
                        <ul className="space-y-1 mb-3">
                          {t.directReports.map((r) => (
                            <li key={r.id} className="flex items-center justify-between gap-2 text-sm hover:bg-gray-50 rounded px-2 py-1 -mx-2">
                              <Link href={`/employees/${r.id}`} className="min-w-0 flex-1 hover:text-primary-700">
                                <span className="font-medium text-gray-800">{r.firstName} {r.lastName}</span>
                                <span className="text-xs text-gray-500"> · {r.position ?? "—"}{r.department ? ` · ${r.department}` : ""}</span>
                              </Link>
                              <span className="chip text-[10px] bg-gray-100 text-gray-600 flex-shrink-0">{r.employmentType}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    {t.coManaged.length > 0 && (
                      <>
                        <div className="text-[10px] text-purple-700 uppercase tracking-wide mb-1">
                          Co-managed ({t.coManaged.length})
                        </div>
                        <ul className="space-y-1">
                          {t.coManaged.map((c) => (
                            <li key={c.id} className="flex items-center gap-2 text-sm hover:bg-purple-50 rounded px-2 py-1 -mx-2">
                              <Link href={`/employees/${c.id}`} className="min-w-0 flex-1 hover:text-primary-700">
                                <span className="font-medium text-gray-800">{c.firstName} {c.lastName}</span>
                                <span className="text-xs text-gray-500"> · {c.position ?? "—"}{c.department ? ` · ${c.department}` : ""}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
