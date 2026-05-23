import { db } from "./db";

export type ScoreBreakdown = {
  sections: {
    sectionId: string;
    title: string;
    kind: string;
    weight: number;
    personalRating: number | null;
    supervisorRating: number | null;
    average: number | null;
    weightedScore: number | null;
  }[];
  overallScore: number | null;
};

export async function getScoreBreakdown(assignmentId: string): Promise<ScoreBreakdown | null> {
  const a = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      template: { include: { sections: { orderBy: { sortOrder: "asc" }, include: { questions: true } } } },
      responses: true,
    },
  });
  if (!a) return null;

  let wsum = 0, w = 0;
  const rows: ScoreBreakdown["sections"] = [];

  for (const s of a.template.sections) {
    if (!(s.kind === "KPI" || s.kind === "COMPETENCY") || s.weight <= 0) continue;
    const qIds = new Set(s.questions.filter((q) => q.inputType === "rating").map((q) => q.id));
    const emp = a.responses.filter((r) => qIds.has(r.questionId) && r.authorRole === "EMPLOYEE" && r.rating != null).map((r) => r.rating!);
    const mgr = a.responses.filter((r) => qIds.has(r.questionId) && r.authorRole === "MANAGER" && r.rating != null).map((r) => r.rating!);
    const empAvg = emp.length ? Number((emp.reduce((x, y) => x + y, 0) / emp.length).toFixed(2)) : null;
    const mgrAvg = mgr.length ? Number((mgr.reduce((x, y) => x + y, 0) / mgr.length).toFixed(2)) : null;
    let avg: number | null = null;
    if (empAvg != null && mgrAvg != null) avg = Number(((empAvg + mgrAvg) / 2).toFixed(2));
    else avg = mgrAvg ?? empAvg;
    const weighted = avg != null ? Number(((avg * s.weight) / 100).toFixed(2)) : null;
    if (avg != null) { wsum += avg * s.weight; w += s.weight; }
    rows.push({
      sectionId: s.id, title: s.title, kind: s.kind, weight: s.weight,
      personalRating: empAvg, supervisorRating: mgrAvg, average: avg, weightedScore: weighted,
    });
  }

  const overallScore = w > 0 ? Number((wsum / w).toFixed(2)) : null;
  return { sections: rows, overallScore };
}
