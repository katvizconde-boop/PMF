import { db } from "./db";

export type FlightRisk = {
  userId: string;
  name: string;
  position: string | null;
  department: string | null;
  scores: { cycle: string; score: number }[];
  drop: number;
  reasons: string[];
};

export type ProbationAlert = {
  userId: string;
  name: string;
  email: string;
  position: string | null;
  department: string | null;
  hireDate: Date;
  daysRemaining: number;
  hasFinalizedProbEval: boolean;
};

/**
 * Find employees with declining performance:
 * - At least 2 finalized evaluations
 * - Latest score is at least 0.4 lower than previous AND lower than 3.5
 */
export async function getFlightRisks(): Promise<FlightRisk[]> {
  const finalized = await db.assignment.findMany({
    where: { state: "FINALIZED", overallScore: { not: null } },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, position: true, department: true } },
      cycle: { select: { id: true, name: true, periodStart: true } },
    },
    orderBy: { cycle: { periodStart: "asc" } },
  });
  const byUser: Record<string, typeof finalized> = {};
  for (const a of finalized) (byUser[a.employeeId] ??= []).push(a);

  const risks: FlightRisk[] = [];
  for (const userId of Object.keys(byUser)) {
    const list = byUser[userId];
    if (list.length < 2) continue;
    const last = list[list.length - 1];
    const prev = list[list.length - 2];
    const drop = (prev.overallScore ?? 0) - (last.overallScore ?? 0);
    const reasons: string[] = [];
    if (drop >= 0.4) reasons.push(`Score dropped by ${drop.toFixed(2)} since last cycle`);
    if ((last.overallScore ?? 5) < 3.5) reasons.push(`Latest score ${last.overallScore?.toFixed(2)} is below "Meets Expectations"`);
    if (reasons.length === 0) continue;
    risks.push({
      userId,
      name: `${last.employee.firstName} ${last.employee.lastName}`,
      position: last.employee.position,
      department: last.employee.department,
      scores: list.slice(-4).map((a) => ({ cycle: a.cycle.name, score: a.overallScore! })),
      drop,
      reasons,
    });
  }
  return risks.sort((a, b) => b.drop - a.drop).slice(0, 10);
}

/**
 * Find probationary employees whose probation ends in the next 30 days.
 * Default probation = 6 months from hireDate.
 */
export async function getProbationAlerts(): Promise<ProbationAlert[]> {
  const probEmployees = await db.user.findMany({
    where: { employmentType: "PROBATIONARY", role: { in: ["EMPLOYEE", "MANAGER"] }, hireDate: { not: null } },
    select: { id: true, firstName: true, lastName: true, email: true, position: true, department: true, hireDate: true,
      assignmentsAsEmployee: { select: { state: true, template: { select: { type: true } } } },
    },
  });
  const now = new Date();
  const alerts: ProbationAlert[] = [];
  for (const e of probEmployees) {
    if (!e.hireDate) continue;
    const probEnd = new Date(e.hireDate);
    probEnd.setMonth(probEnd.getMonth() + 6);
    const daysRemaining = Math.round((probEnd.getTime() - now.getTime()) / 86400000);
    if (daysRemaining < -30 || daysRemaining > 30) continue; // window: 30 before to 30 after
    const hasFinalizedProbEval = e.assignmentsAsEmployee.some((a) => a.state === "FINALIZED" && a.template.type === "PROBATIONARY");
    alerts.push({
      userId: e.id,
      name: `${e.firstName} ${e.lastName}`,
      email: e.email,
      position: e.position,
      department: e.department,
      hireDate: e.hireDate,
      daysRemaining,
      hasFinalizedProbEval,
    });
  }
  return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
}
