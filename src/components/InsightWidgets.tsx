import Link from "next/link";

type FlightRisk = {
  userId: string; name: string; position: string | null; department: string | null;
  scores: { cycle: string; score: number }[];
  drop: number;
  reasons: string[];
};

type ProbationAlert = {
  userId: string; name: string; position: string | null;
  hireDate: string | Date; daysRemaining: number; hasFinalizedProbEval: boolean;
};

export function FlightRiskWidget({ risks }: { risks: FlightRisk[] }) {
  if (risks.length === 0) return null;
  return (
    <div className="card mb-6">
      <h3 className="section-header flex items-center gap-2">
        <span>🪂 Flight Risk Indicator</span>
        <span className="chip bg-red-100 text-red-700 ml-auto text-[10px]">{risks.length}</span>
      </h3>
      <p className="text-xs text-gray-500 mb-3">Employees with declining scores — consider a retention conversation.</p>
      <div className="space-y-2">
        {risks.slice(0, 5).map((r) => (
          <Link key={r.userId} href={`/employees/${r.userId}`}
            className="flex items-center gap-3 p-3 rounded-lg border border-red-100 bg-red-50/50 hover:bg-red-50 transition">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">⚠️</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-800">{r.name}</div>
              <div className="text-xs text-gray-500">{r.position ?? "—"} · {r.department ?? "—"}</div>
              <div className="text-xs text-red-700 italic mt-0.5">{r.reasons[0]}</div>
            </div>
            <div className="flex items-center gap-1">
              {r.scores.map((s, i) => (
                <div key={i} className="text-center">
                  <div className={`px-2 py-1 rounded text-xs font-bold ${
                    s.score >= 4 ? "bg-emerald-100 text-emerald-700" :
                    s.score >= 3 ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  }`}>{s.score.toFixed(1)}</div>
                  <div className="text-[9px] text-gray-400 mt-0.5">{s.cycle.split(" ")[0]}</div>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ProbationAlertsWidget({ alerts }: { alerts: ProbationAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="card mb-6">
      <h3 className="section-header flex items-center gap-2">
        <span>⚠️ Probationary Period Alerts</span>
        <span className="chip bg-amber-100 text-amber-700 ml-auto text-[10px]">{alerts.length}</span>
      </h3>
      <p className="text-xs text-gray-500 mb-3">Probations ending soon — schedule regularization or extension.</p>
      <div className="space-y-2">
        {alerts.slice(0, 5).map((a) => {
          const days = a.daysRemaining;
          const overdue = days < 0;
          const urgent = days >= 0 && days <= 7;
          return (
            <Link key={a.userId} href={`/employees/${a.userId}`}
              className={`flex items-center gap-3 p-3 rounded-lg border transition ${
                overdue ? "border-red-200 bg-red-50" :
                urgent ? "border-amber-200 bg-amber-50" :
                "border-gray-100 hover:bg-gray-50"
              }`}>
              <div className="w-12 text-center flex-shrink-0">
                <div className={`text-xl font-bold ${overdue ? "text-red-600" : urgent ? "text-amber-600" : "text-gray-700"}`}>
                  {Math.abs(days)}
                </div>
                <div className={`text-[9px] uppercase tracking-wide ${overdue ? "text-red-500" : urgent ? "text-amber-500" : "text-gray-400"}`}>
                  {overdue ? "DAYS OVERDUE" : days === 0 ? "TODAY" : "DAYS LEFT"}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800">{a.name}</div>
                <div className="text-xs text-gray-500">{a.position ?? "—"}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Hired {new Date(a.hireDate).toLocaleDateString()}
                  {!a.hasFinalizedProbEval && <span className="ml-2 text-red-600 font-semibold">⚠ No probationary PMF on record</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
