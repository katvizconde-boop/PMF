import Link from "next/link";
import { ratingClass, stateColor } from "@/lib/ui";

export function AssignmentTable({
  assignments, showEmployee, showManager,
}: { assignments: any[]; showEmployee?: boolean; showManager?: boolean }) {
  if (!assignments.length) {
    return <p className="text-gray-400 text-sm text-center py-8">No PMFs yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2 font-medium">Cycle</th>
            <th className="font-medium">Template</th>
            {showEmployee && <th className="font-medium">Employee</th>}
            {showManager && <th className="font-medium">Manager</th>}
            <th className="font-medium text-center">Status</th>
            <th className="font-medium text-center">Score</th>
            <th className="font-medium text-right">Due</th>
            <th className="text-right">&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((a: any) => (
            <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
              <td className="py-3">{a.cycle.name}</td>
              <td>{a.template.name}</td>
              {showEmployee && <td>{a.employee.firstName} {a.employee.lastName}</td>}
              {showManager && <td>{a.manager.firstName} {a.manager.lastName}</td>}
              <td className="text-center"><span className={`chip ${stateColor(a.state)}`}>{a.state.replace("_", " ")}</span></td>
              <td className="text-center">
                {a.overallScore != null
                  ? <span className={`rating-pill ${ratingClass(a.overallScore)}`}>{a.overallScore.toFixed(1)}</span>
                  : <span className="text-gray-400 text-xs">—</span>}
              </td>
              <td className="text-gray-500 text-xs text-right whitespace-nowrap">{new Date(a.cycle.dueDate).toLocaleDateString()}</td>
              <td className="text-right"><Link href={`/assignments/${a.id}`} className="btn btn-secondary text-xs">Open</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
