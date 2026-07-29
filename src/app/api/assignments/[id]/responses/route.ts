import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, canAccessAssignment } from "@/lib/rbac";
import { audit } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const a = await canAccessAssignment(u.id, u.role, params.id);
  if (!a) return new NextResponse("Forbidden", { status: 403 });

  // A user filling in their OWN assignment is always the EMPLOYEE side
  // (a manager evaluating themselves writes self-assessment responses).
  const isOwnAssignment = a.employeeId === u.id;
  const authorRole = isOwnAssignment
    ? "EMPLOYEE"
    : u.role === "HR_ADMIN" ? "HR" : u.role === "MANAGER" ? "MANAGER" : "EMPLOYEE";

  if (authorRole === "HR") return new NextResponse("HR does not save responses", { status: 400 });

  const body = await req.json();
  const items = (body.responses ?? []) as Array<{ questionId: string; rating: number | null; comment: string | null }>;

  // A MANAGER may pre-fill the Key Responsibilities column at ANY pre-final state
  // (SELF_ASSESS or MANAGER_REVIEW). Everything else requires the normal state gate.
  const isManagerKeyRespOnlySave =
    authorRole === "MANAGER" &&
    (a.state === "SELF_ASSESS" || a.state === "MANAGER_REVIEW") &&
    items.length === 0 &&
    body.privateRecommendation === undefined &&
    body.privateRecommendationNotes === undefined &&
    body.recommendation === undefined &&
    body.keyProjectActivities !== undefined;

  if (!isManagerKeyRespOnlySave) {
    const expectedState = authorRole === "EMPLOYEE" ? "SELF_ASSESS" : "MANAGER_REVIEW";
    if (a.state !== expectedState) return new NextResponse(`Form is not editable in state ${a.state}`, { status: 409 });
  }

  // ── Private recommendation (MANAGER-only, never persisted from EMPLOYEE) ──
  const ALLOWED_PRIVATE_RECS = new Set([
    "NO_ACTION", "SALARY_INCREASE", "PROMOTION", "LATERAL_MOVE", "PIP", "TERMINATION_REVIEW", "OTHER",
  ]);
  const updates: any = {};
  if (body.recommendation) updates.recommendation = body.recommendation;

  // ── Key Projects & Activities (Part I table) ──
  //   EMPLOYEE  can save the whole row (Key Responsibility + Activities + Remarks) during SELF_ASSESS
  //   MANAGER   can save the KEY RESPONSIBILITY column only during MANAGER_REVIEW,
  //             merging into existing rows without wiping the employee's Activities / Remarks
  if (body.keyProjectActivities !== undefined) {
    try {
      const parsed = body.keyProjectActivities ? JSON.parse(body.keyProjectActivities) : null;
      const PER_CELL_MAX = 50_000;

      if (authorRole === "EMPLOYEE") {
        if (parsed === null) {
          updates.keyProjectActivities = null;
        } else if (Array.isArray(parsed)) {
          const safe = parsed.slice(0, 50).map((r: any) => ({
            keyResponsibility: typeof r?.keyResponsibility === "string" ? r.keyResponsibility.slice(0, PER_CELL_MAX) : "",
            activitiesProjects: typeof r?.activitiesProjects === "string" ? r.activitiesProjects.slice(0, PER_CELL_MAX) : "",
            remarks: typeof r?.remarks === "string" ? r.remarks.slice(0, PER_CELL_MAX) : "",
          }));
          updates.keyProjectActivities = JSON.stringify(safe);
        }
      } else if (authorRole === "MANAGER" && Array.isArray(parsed)) {
        // Manager writes ONLY the Key Responsibility column. Merge with existing
        // rows so we don't overwrite the employee's Activities / Remarks.
        let existing: any[] = [];
        try {
          existing = a.keyProjectActivities ? JSON.parse(a.keyProjectActivities) : [];
          if (!Array.isArray(existing)) existing = [];
        } catch {}
        const merged: any[] = [];
        const total = Math.max(parsed.length, existing.length);
        for (let i = 0; i < Math.min(total, 50); i++) {
          const mgrRow = parsed[i] ?? {};
          const oldRow = existing[i] ?? { keyResponsibility: "", activitiesProjects: "", remarks: "" };
          merged.push({
            keyResponsibility: typeof mgrRow?.keyResponsibility === "string"
              ? mgrRow.keyResponsibility.slice(0, PER_CELL_MAX)
              : (oldRow.keyResponsibility ?? ""),
            activitiesProjects: oldRow.activitiesProjects ?? "",
            remarks: oldRow.remarks ?? "",
          });
        }
        updates.keyProjectActivities = JSON.stringify(merged);
      }
    } catch {
      // Bad JSON — silently ignore
    }
  }

  // Only managers can save private recommendation. Silently ignored from any other role.
  if (authorRole === "MANAGER") {
    if (body.privateRecommendation !== undefined) {
      if (body.privateRecommendation === null || body.privateRecommendation === "") {
        updates.privateRecommendation = null;
      } else if (typeof body.privateRecommendation === "string" && ALLOWED_PRIVATE_RECS.has(body.privateRecommendation)) {
        updates.privateRecommendation = body.privateRecommendation;
      }
    }
    if (body.privateRecommendationNotes !== undefined) {
      const notes = typeof body.privateRecommendationNotes === "string"
        ? body.privateRecommendationNotes.trim().slice(0, 5000)
        : null;
      updates.privateRecommendationNotes = notes || null;
    }
  }

  await db.$transaction([
    ...items.map((r) =>
      db.response.upsert({
        where: { assignmentId_questionId_authorRole: { assignmentId: a.id, questionId: r.questionId, authorRole } },
        create: { assignmentId: a.id, questionId: r.questionId, authorRole, rating: r.rating, comment: r.comment },
        update: { rating: r.rating, comment: r.comment },
      })
    ),
    ...(Object.keys(updates).length > 0 ? [db.assignment.update({ where: { id: a.id }, data: updates })] : []),
  ]);

  await audit(u.id, "SAVE_RESPONSES", "Assignment", a.id, {
    count: items.length,
    authorRole,
    privateRecChanged: updates.privateRecommendation !== undefined || updates.privateRecommendationNotes !== undefined,
  });
  return NextResponse.json({ ok: true });
}
