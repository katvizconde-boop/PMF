import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { HeatMapView } from "@/components/HeatMapView";

export default async function HeatMapPage() {
  await requireRole("HR_ADMIN");

  const [assignments, cycles] = await Promise.all([
    db.assignment.findMany({
      where: { state: "FINALIZED", overallScore: { not: null } },
      include: { employee: { select: { department: true, company: true } }, cycle: { select: { id: true, name: true, periodStart: true } } },
    }),
    db.cycle.findMany({ orderBy: { periodStart: "asc" } }),
  ]);

  // Compute matrix: department -> cycle -> { avg, count }
  type Cell = { avg: number | null; count: number; sum: number };
  const matrix: Record<string, Record<string, Cell>> = {};
  const allDepts = new Set<string>();
  for (const a of assignments) {
    const dept = a.employee.department ?? "—";
    const cycleId = a.cycle.id;
    allDepts.add(dept);
    if (!matrix[dept]) matrix[dept] = {};
    const cell = matrix[dept][cycleId] ?? { avg: null, count: 0, sum: 0 };
    cell.sum += a.overallScore!;
    cell.count += 1;
    cell.avg = Number((cell.sum / cell.count).toFixed(2));
    matrix[dept][cycleId] = cell;
  }

  // Sort cycles chronologically
  const cycleList = cycles.map((c) => ({ id: c.id, name: c.name }));
  const deptList = Array.from(allDepts).sort();

  // Department scores aggregated for trend (last 4 cycles per dept)
  const deptTrends = deptList.map((d) => ({
    department: d,
    cells: cycleList.map((c) => matrix[d]?.[c.id] ?? { avg: null, count: 0, sum: 0 }),
    overall: (() => {
      const all = cycleList.map((c) => matrix[d]?.[c.id]).filter(Boolean) as Cell[];
      if (!all.length) return null;
      const total = all.reduce((s, x) => s + x.sum, 0);
      const cnt = all.reduce((s, x) => s + x.count, 0);
      return cnt > 0 ? Number((total / cnt).toFixed(2)) : null;
    })(),
  }));

  return <HeatMapView cycles={cycleList} rows={deptTrends} />;
}
