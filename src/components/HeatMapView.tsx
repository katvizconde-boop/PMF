"use client";
type Cell = { avg: number | null; count: number; sum: number };
type Row = { department: string; cells: Cell[]; overall: number | null };

function bgColor(score: number | null) {
  if (score == null) return "#f3f4f6";
  if (score >= 4.5) return "#10b981"; // emerald-500
  if (score >= 4)   return "#34d399"; // emerald-400
  if (score >= 3.5) return "#fbbf24"; // amber-400
  if (score >= 3)   return "#f59e0b"; // amber-500
  if (score >= 2)   return "#f87171"; // red-400
  return "#ef4444";                    // red-500
}

function textColor(score: number | null) {
  if (score == null) return "#9ca3af";
  if (score >= 3 && score < 4) return "#1e3a5a";  // dark on amber
  return "#ffffff";
}

export function HeatMapView({ cycles, rows }: {
  cycles: { id: string; name: string }[];
  rows: Row[];
}) {
  if (rows.length === 0) {
    return (
      <div>
        <h2 className="page-title">🗺️ Department Heat Map</h2>
        <p className="page-subtitle mb-6">Visual performance comparison across departments and cycles.</p>
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">🗺️</div>
          <p className="text-gray-500">Once you finalize evaluations, this map lights up with department performance.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
        <div>
          <h2 className="page-title">🗺️ Department Heat Map</h2>
          <p className="page-subtitle">Average finalized score per department × cycle. Hover any cell for details.</p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left py-3 px-3 font-semibold text-gray-700 sticky left-0 bg-white z-10 min-w-[220px]">Department</th>
              {cycles.map((c) => (
                <th key={c.id} className="px-2 py-3 font-semibold text-gray-700 text-center min-w-[110px]">{c.name}</th>
              ))}
              <th className="px-3 py-3 font-bold text-gray-700 text-center bg-gray-50 min-w-[100px]">Overall</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.department} className="border-t border-gray-100">
                <td className="py-2 px-3 font-medium text-gray-800 sticky left-0 bg-white z-10">{r.department}</td>
                {r.cells.map((cell, i) => (
                  <td key={i} className="px-1 py-1">
                    {cell.count > 0 ? (
                      <div
                        title={`${cell.count} ${cell.count === 1 ? "evaluation" : "evaluations"} · avg ${cell.avg}`}
                        className="rounded-lg py-3 text-center font-bold transition hover:scale-105"
                        style={{ background: bgColor(cell.avg), color: textColor(cell.avg) }}
                      >
                        <div className="text-base">{cell.avg?.toFixed(2)}</div>
                        <div className="text-[10px] opacity-80 font-normal">{cell.count} {cell.count === 1 ? "eval" : "evals"}</div>
                      </div>
                    ) : (
                      <div className="rounded-lg py-3 text-center text-gray-300" style={{ background: "#f9fafb" }}>—</div>
                    )}
                  </td>
                ))}
                <td className="px-3 py-1 bg-gray-50">
                  <div
                    className="rounded-lg py-3 text-center font-bold"
                    style={{ background: bgColor(r.overall), color: textColor(r.overall) }}
                  >
                    {r.overall != null ? r.overall.toFixed(2) : "—"}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card mt-4">
        <h3 className="section-header">Legend</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          {[
            { range: "≥ 4.5", label: "Significantly Exceeds", v: 4.5 },
            { range: "4.0 – 4.4", label: "Exceeds Expectations", v: 4 },
            { range: "3.5 – 3.9", label: "Meets+", v: 3.5 },
            { range: "3.0 – 3.4", label: "Meets Expectations", v: 3 },
            { range: "2.0 – 2.9", label: "Partially Meets", v: 2 },
            { range: "< 2.0", label: "Unsatisfactory", v: 1 },
          ].map((l) => (
            <div key={l.range} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded" style={{ background: bgColor(l.v) }} />
              <div>
                <div className="font-semibold text-gray-700">{l.range}</div>
                <div className="text-[10px] text-gray-500">{l.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
