"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement,
  Tooltip, Legend, Filler,
} from "chart.js";
import { AssignmentTable } from "./AssignmentTable";
import { ratingClass } from "@/lib/ui";
import { PendingBanner } from "./PendingBanner";
import { AnniversariesWidget, DueThisWeekWidget } from "./DashboardWidgets";
import { FlightRiskWidget, ProbationAlertsWidget } from "./InsightWidgets";
import { PageHeader, FilterField } from "./PageHeader";
import { COMPANIES, companyChipClass } from "@/lib/companies";
import { Icon } from "./Icons";
import { barHoverOptions, lineHoverOptions, doughnutHoverOptions } from "@/lib/chartOptions";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

export function HRDashboard({
  totalEmployees, totalEvaluations, completedEvaluations, teamAverage,
  distribution, trends, topPerformers, assignments, pending,
  anniversaries = [], dueSoon = [], flightRisks = [], probationAlerts = [],
}: {
  totalEmployees: number;
  totalEvaluations: number;
  completedEvaluations: number;
  teamAverage: number | null;
  distribution: Record<string, number>;
  trends: { period: string; overall: number }[];
  topPerformers: { id: string; name: string; position: string; score: number }[];
  assignments: any[];
  pending?: { id: string; label: string; due?: string; overdue?: boolean }[];
  anniversaries?: { id: string; name: string; position: string | null; date: Date | string; years: number }[];
  dueSoon?: { id: string; label: string; due: Date | string; days: number }[];
  flightRisks?: { userId: string; name: string; position: string | null; department: string | null;
    scores: { cycle: string; score: number }[]; drop: number; reasons: string[] }[];
  probationAlerts?: { userId: string; name: string; position: string | null;
    hireDate: string | Date; daysRemaining: number; hasFinalizedProbEval: boolean }[];
}) {
  const [tab, setTab] = useState<"overview" | "pending" | "completed" | "all">("overview");
  const router = useRouter();
  const sp = useSearchParams();
  const companyFilter = sp.get("company") || "ALL";

  function setCompanyFilter(v: string) {
    const next = new URLSearchParams(sp.toString());
    if (v === "ALL") next.delete("company");
    else next.set("company", v);
    router.push(`/dashboard?${next.toString()}`);
  }

  // Server-side already filters by company. Keep the local filter for safety.
  const filteredAssignments = companyFilter === "ALL"
    ? assignments
    : assignments.filter((a: any) => a.employee?.company === companyFilter);

  const tabAssignments = (() => {
    switch (tab) {
      case "pending":   return filteredAssignments.filter((a: any) => a.state !== "FINALIZED");
      case "completed": return filteredAssignments.filter((a: any) => a.state === "FINALIZED");
      case "all":       return filteredAssignments;
      default:          return filteredAssignments.slice(0, 8);
    }
  })();

  const completionPct = totalEvaluations ? Math.round((completedEvaluations / totalEvaluations) * 100) : 0;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Performance Management overview across all companies and cycles">
        <FilterField label="Company">
          <select className="input w-44" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
            <option value="ALL">All Companies</option>
            {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </FilterField>
      </PageHeader>

      {pending && <PendingBanner action="review & finalize these evaluations" items={pending} />}

      {/* Due This Week ⟷ Flight Risk side-by-side */}
      {(dueSoon.length > 0 || flightRisks.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {dueSoon.length > 0 && <DueThisWeekWidget items={dueSoon.map((d) => ({ ...d, due: new Date(d.due) }))} />}
          {flightRisks.length > 0 && <FlightRiskWidget risks={flightRisks} />}
        </div>
      )}

      {/* Anniversaries ⟷ Probation alerts */}
      {(anniversaries.length > 0 || probationAlerts.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {anniversaries.length > 0 && <AnniversariesWidget people={anniversaries.map((a) => ({ ...a, date: new Date(a.date) }))} />}
          {probationAlerts.length > 0 && <ProbationAlertsWidget alerts={probationAlerts} />}
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={<Icon.Users size={20} />} iconBg="bg-blue-50 text-blue-600" label="Total Users" value={totalEmployees} sub="across all companies" />
        <KpiCard icon={<Icon.Clipboard size={20} />} iconBg="bg-purple-50 text-purple-600" label="Evaluations" value={totalEvaluations} sub={`${completionPct}% complete`} />
        <KpiCard icon={<Icon.CheckCircle size={20} />} iconBg="bg-emerald-50 text-emerald-600" label="Finalized" value={completedEvaluations} sub="locked & visible" />
        <KpiCard
          icon={<Icon.Star size={20} />} iconBg="bg-amber-50 text-amber-600"
          label="Team Average"
          value={teamAverage != null ? teamAverage.toFixed(2) : "N/A"}
          sub="weighted score"
        />
      </div>

      {/* Tabs */}
      <div className="tabs-bar mb-6">
        <button onClick={() => setTab("overview")}    className={`tab ${tab === "overview" ? "active" : ""}`}>Overview</button>
        <button onClick={() => setTab("pending")}     className={`tab ${tab === "pending" ? "active" : ""}`}>Pending <span className="ml-1 text-xs text-gray-400">({filteredAssignments.filter((a: any) => a.state !== "FINALIZED").length})</span></button>
        <button onClick={() => setTab("completed")}   className={`tab ${tab === "completed" ? "active" : ""}`}>Completed <span className="ml-1 text-xs text-gray-400">({filteredAssignments.filter((a: any) => a.state === "FINALIZED").length})</span></button>
        <button onClick={() => setTab("all")}         className={`tab ${tab === "all" ? "active" : ""}`}>All Evaluations <span className="ml-1 text-xs text-gray-400">({filteredAssignments.length})</span></button>
      </div>

      {tab === "overview" ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            <div className="card lg:col-span-2">
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="section-header mb-0">Score Distribution</h3>
                <span className="text-xs text-gray-400">Across all finalized evaluations</span>
              </div>
              <div style={{ height: 240 }}>
                <Bar
                  data={{
                    labels: Object.keys(distribution),
                    datasets: [{
                      label: "Evaluations",
                      data: Object.values(distribution),
                      backgroundColor: "#3b82f6",
                      hoverBackgroundColor: "#1d4ed8",
                      borderRadius: 6,
                      barThickness: 32,
                    }],
                  }}
                  options={{
                    ...barHoverOptions,
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                      ...(barHoverOptions.plugins ?? {}),
                      legend: { display: false },
                      tooltip: {
                        ...(barHoverOptions.plugins?.tooltip ?? {}),
                        callbacks: {
                          title: (items: any) => `Score band: ${items[0].label}`,
                          label: (ctx: any) => `  ${ctx.parsed.y} evaluation${ctx.parsed.y === 1 ? "" : "s"}`,
                        },
                      },
                    },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                  } as any}
                />
              </div>
            </div>

            <div className="card">
              <h3 className="section-header">Completion Status</h3>
              <div style={{ height: 200 }}>
                <Doughnut
                  data={{
                    labels: ["Completed", "In Progress", "Not Started"],
                    datasets: [{
                      data: [
                        completedEvaluations,
                        filteredAssignments.filter((a: any) => ["MANAGER_REVIEW", "HR_REVIEW"].includes(a.state)).length,
                        filteredAssignments.filter((a: any) => a.state === "SELF_ASSESS").length,
                      ],
                      backgroundColor: ["#10b981", "#3b82f6", "#f59e0b"],
                      hoverBackgroundColor: ["#059669", "#1d4ed8", "#d97706"],
                      borderWidth: 0,
                    }],
                  }}
                  options={{
                    ...doughnutHoverOptions,
                    responsive: true, maintainAspectRatio: false, cutout: "65%",
                    plugins: {
                      ...(doughnutHoverOptions.plugins ?? {}),
                      legend: { position: "bottom", labels: { padding: 12, font: { size: 11 } } },
                      tooltip: {
                        ...(doughnutHoverOptions.plugins?.tooltip ?? {}),
                        callbacks: {
                          label: (ctx: any) => {
                            const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
                            const pct = total ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                            return `  ${ctx.label}: ${ctx.parsed} (${pct}%)`;
                          },
                        },
                      },
                    },
                  } as any}
                />
              </div>
              <div className="text-center mt-3">
                <div className="text-3xl font-bold text-gray-900">{completionPct}%</div>
                <div className="text-xs text-gray-500">overall completion</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            <div className="card">
              <h3 className="section-header">Performance Trends</h3>
              <div style={{ height: 240 }}>
                {trends.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Not enough data yet</p>
                ) : (
                  <Line
                    data={{
                      labels: trends.map((t) => t.period),
                      datasets: [{
                        label: "Overall",
                        data: trends.map((t) => t.overall),
                        borderColor: "#3b82f6",
                        backgroundColor: "rgba(59,130,246,0.1)",
                        borderWidth: 3, pointRadius: 5, pointBackgroundColor: "#3b82f6",
                        pointHoverRadius: 9, pointHoverBackgroundColor: "#fff", pointHoverBorderColor: "#1d4ed8", pointHoverBorderWidth: 3,
                        fill: true, tension: 0.35,
                      }],
                    }}
                    options={{
                      ...lineHoverOptions,
                      responsive: true, maintainAspectRatio: false,
                      plugins: {
                        ...(lineHoverOptions.plugins ?? {}),
                        legend: { display: false },
                        tooltip: {
                          ...(lineHoverOptions.plugins?.tooltip ?? {}),
                          callbacks: {
                            title: (items: any) => items[0].label,
                            label: (ctx: any) => `  Avg score: ${ctx.parsed.y.toFixed(2)} / 5`,
                          },
                        },
                      },
                      scales: { y: { min: 0, max: 5 } },
                    } as any}
                  />
                )}
              </div>
            </div>
            <div className="card">
              <h3 className="section-header">Top Performers</h3>
              {topPerformers.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No completed evaluations yet</p>
              ) : (
                <div className="space-y-1.5">
                  {topPerformers.map((e, i) => (
                    <div key={e.id + i} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                          i === 0 ? "bg-amber-100 text-amber-700"
                          : i === 1 ? "bg-gray-100 text-gray-700"
                          : i === 2 ? "bg-orange-100 text-orange-700"
                          : "bg-primary-50 text-primary-700"
                        }`}>{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{e.name}</p>
                          <p className="text-xs text-gray-500">{e.position}</p>
                        </div>
                      </div>
                      <span className={`rating-pill ${ratingClass(e.score)}`}>{e.score.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}

      <div className="card-flush">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{
            tab === "pending"   ? "Pending Evaluations" :
            tab === "completed" ? "Finalized Evaluations" :
            tab === "all"       ? "All Evaluations" : "Recent Evaluations"
          }</h3>
          <span className="text-xs text-gray-500">{tabAssignments.length} {tabAssignments.length === 1 ? "item" : "items"}</span>
        </div>
        <div className="px-5 py-4">
          <AssignmentTable assignments={tabAssignments} showEmployee showManager />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, iconBg, label, value, sub }: { icon: React.ReactNode; iconBg: string; label: string; value: any; sub?: string }) {
  return (
    <div className="kpi-card">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${iconBg}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5 leading-tight">{value}</p>
          {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}
