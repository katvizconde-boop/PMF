"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ratingClass, stateColor } from "@/lib/ui";
import { Icon } from "./Icons";

function bgForRating(r: number | null) {
  if (r == null) return "#f3f4f6";
  if (r >= 4.5) return "#bbf7d0";
  if (r >= 4)   return "#d1fae5";
  if (r >= 3.5) return "#fef3c7";
  if (r >= 3)   return "#fde68a";
  if (r >= 2)   return "#fecaca";
  return "#fca5a5";
}

export function TeamCompareView({
  cycles, activeCycleId, rows, sectionTitles,
}: {
  cycles: { id: string; name: string }[];
  activeCycleId: string;
  rows: {
    assignmentId: string; employeeId: string; employeeName: string;
    position: string | null; department: string | null; company: string | null;
    state: string; overallScore: number | null; recommendation: string | null;
    sections: Record<string, number | null>;
  }[];
  sectionTitles: string[];
}) {
  const router = useRouter();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 inline-flex items-center gap-2"><Icon.LineChart size={24} /> Team Profile</h2>
        <select
          className="input max-w-xs"
          value={activeCycleId}
          onChange={(e) => router.push(`/team-compare?cycleId=${e.target.value}`)}
        >
          {cycles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {rows.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">No evaluations in this cycle for your team.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b-2 border-gray-200">
                <th className="py-3 px-3 font-semibold text-gray-700 sticky left-0 bg-white min-w-[180px]">Employee</th>
                <th className="py-3 px-3 font-semibold text-gray-700">Status</th>
                <th className="py-3 px-3 font-semibold text-gray-700 text-center">Overall</th>
                {sectionTitles.map((t) => (
                  <th key={t} className="py-3 px-3 font-semibold text-gray-700 text-center min-w-[140px] text-xs">{t}</th>
                ))}
                <th className="py-3 px-3 font-semibold text-gray-700">Recommendation</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.assignmentId} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-3 sticky left-0 bg-white">
                    <Link href={`/employees/${r.employeeId}`} className="font-medium text-gray-800 hover:text-primary-600">{r.employeeName}</Link>
                    <div className="text-xs text-gray-500">{r.position ?? "—"} · {r.department ?? "—"}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`chip ${stateColor(r.state)}`}>{r.state.replace("_", " ")}</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {r.overallScore != null
                      ? <span className={`rating-pill ${ratingClass(r.overallScore)}`}>{r.overallScore.toFixed(2)}</span>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  {sectionTitles.map((t) => {
                    const v = r.sections[t];
                    return (
                      <td key={t} className="py-2 px-1 text-center">
                        <div
                          className="mx-auto rounded text-xs font-semibold py-1.5 px-1"
                          style={{ background: bgForRating(v), color: v != null ? "#1e3a5a" : "#9ca3af" }}
                        >
                          {v != null ? v.toFixed(2) : "—"}
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-3 px-3 text-xs text-gray-600">{r.recommendation ?? "—"}</td>
                  <td><Link href={`/assignments/${r.assignmentId}`} className="btn btn-secondary text-xs">Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex gap-3 items-center text-xs text-gray-500">
        <span>Legend:</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded" style={{ background: bgForRating(4.5) }} /> ≥ 4.5</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded" style={{ background: bgForRating(4) }} /> ≥ 4</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded" style={{ background: bgForRating(3.5) }} /> ≥ 3.5</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded" style={{ background: bgForRating(3) }} /> ≥ 3</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded" style={{ background: bgForRating(2) }} /> ≥ 2</span>
      </div>
    </div>
  );
}
