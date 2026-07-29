import { redirect } from "next/navigation";
import { requireUser, getManagedEmployeeIds } from "@/lib/rbac";
import { db } from "@/lib/db";
import { TeamCompareView } from "@/components/TeamCompareView";
import { getScoreBreakdown } from "@/lib/scoring";

export default async function TeamComparePage({ searchParams }: { searchParams: { cycleId?: string } }) {
  const u = await requireUser();
  if (u.role === "EMPLOYEE") redirect("/dashboard");

  const cycles = await db.cycle.findMany({ orderBy: { periodStart: "desc" } });
  const cycleId = searchParams.cycleId ?? cycles[0]?.id;
  if (!cycleId) return <div className="card"><p className="text-gray-500">No cycles yet.</p></div>;

  // HR sees all; managers see primary + co-managed + RDB-department teammates
  let where: any = { cycleId };
  if (u.role !== "HR_ADMIN") {
    const managedIds = await getManagedEmployeeIds(u.id);
    where = {
      cycleId,
      OR: [
        { managerId: u.id },
        ...(managedIds.length > 0 ? [{ employeeId: { in: managedIds } }] : []),
      ],
    };
  }
  const assignments = await db.assignment.findMany({
    where,
    include: {
      employee: true,
      template: { include: { sections: { orderBy: { sortOrder: "asc" } } } },
    },
    orderBy: { employee: { firstName: "asc" } },
  });

  const breakdowns = await Promise.all(assignments.map((a) => getScoreBreakdown(a.id)));

  const rows = assignments.map((a, i) => {
    const bd = breakdowns[i];
    const sectionMap: Record<string, number | null> = {};
    for (const s of bd?.sections ?? []) sectionMap[s.title] = s.average;
    return {
      assignmentId: a.id,
      employeeId: a.employeeId,
      employeeName: `${a.employee.firstName} ${a.employee.lastName}`,
      position: a.employee.position,
      department: a.employee.department,
      company: a.employee.company,
      state: a.state,
      overallScore: a.overallScore ?? bd?.overallScore ?? null,
      recommendation: a.recommendation,
      sections: sectionMap,
    };
  });

  const allSectionTitles = Array.from(new Set(breakdowns.flatMap((b) => (b?.sections ?? []).map((s) => s.title))));

  return (
    <TeamCompareView
      cycles={cycles.map((c) => ({ id: c.id, name: c.name }))}
      activeCycleId={cycleId}
      rows={rows}
      sectionTitles={allSectionTitles}
    />
  );
}
