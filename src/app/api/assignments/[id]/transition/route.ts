import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, canAccessAssignment, isManagerOf } from "@/lib/rbac";
import { audit } from "@/lib/auth";
import { notifyTransition } from "@/lib/email";
import { notify, notifyMany } from "@/lib/notifications";

/**
 * Compute overall score exactly as defined in Krystle's and Janella's PDFs:
 *   For each scoring section (KPI or COMPETENCY with weight > 0):
 *     - PersonalAvg  = mean of EMPLOYEE ratings in that section
 *     - SupervisorAvg = mean of MANAGER ratings in that section
 *     - Average = (PersonalAvg + SupervisorAvg) / 2   (fallback: whichever is present)
 *   OverallScore = Σ(SectionAverage × SectionWeight) / Σ(SectionWeight)
 */
async function computeScore(assignmentId: string) {
  const a = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      template: { include: { sections: { include: { questions: true } } } },
      responses: true,
    },
  });
  if (!a) return null;
  let wsum = 0, w = 0;
  for (const s of a.template.sections) {
    if (!(s.kind === "KPI" || s.kind === "COMPETENCY") || s.weight <= 0) continue;
    const qIds = new Set(s.questions.filter((q) => q.inputType === "rating").map((q) => q.id));
    const emp = a.responses.filter((r) => qIds.has(r.questionId) && r.authorRole === "EMPLOYEE" && r.rating != null).map((r) => r.rating!);
    const mgr = a.responses.filter((r) => qIds.has(r.questionId) && r.authorRole === "MANAGER" && r.rating != null).map((r) => r.rating!);
    if (!mgr.length && !emp.length) continue;
    const empAvg = emp.length ? emp.reduce((x, y) => x + y, 0) / emp.length : null;
    const mgrAvg = mgr.length ? mgr.reduce((x, y) => x + y, 0) / mgr.length : null;
    let sectionAvg: number;
    if (empAvg != null && mgrAvg != null) sectionAvg = (empAvg + mgrAvg) / 2;
    else sectionAvg = (mgrAvg ?? empAvg)!;
    wsum += sectionAvg * s.weight;
    w += s.weight;
  }
  return w > 0 ? Number((wsum / w).toFixed(2)) : null;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const a = await canAccessAssignment(u.id, u.role, params.id);
  if (!a) return new NextResponse("Forbidden", { status: 403 });

  const body = await req.json();
  const { action, target } = body;
  const now = new Date();

  const fail = (msg: string) => new NextResponse(msg, { status: 409 });

  switch (action) {
    case "submit-self": {
      // The employee on the assignment submits their self-assessment.
      // A MANAGER or HR_ADMIN evaluating themselves can also submit-self on their own PMF.
      if (a.employeeId !== u.id) return fail("Not allowed");
      if (a.state !== "SELF_ASSESS") return fail("Wrong state");
      if (!a.employeeSignature) return fail("Please sign before submitting.");
      await db.assignment.update({ where: { id: a.id }, data: { state: "MANAGER_REVIEW", selfSubmittedAt: now } });
      break;
    }
    case "submit-manager": {
      // Allow primary manager OR co-manager to submit
      if (u.role !== "MANAGER" || !(await isManagerOf(u.id, a.employeeId))) return fail("Not allowed");
      if (a.state !== "MANAGER_REVIEW") return fail("Wrong state");
      if (!a.managerSignature) return fail("Please sign before submitting.");
      const score = await computeScore(a.id);
      await db.assignment.update({ where: { id: a.id }, data: { state: "HR_REVIEW", managerSubmittedAt: now, overallScore: score } });
      break;
    }
    case "finalize": {
      if (u.role !== "HR_ADMIN") return fail("Not allowed");
      if (a.state !== "HR_REVIEW") return fail("Wrong state");
      if (!a.hrSignature) return fail("Please sign before finalizing.");
      await db.assignment.update({ where: { id: a.id }, data: { state: "FINALIZED", hrApprovedAt: now, finalizedAt: now } });
      break;
    }
    case "reopen": {
      if (u.role !== "HR_ADMIN") return fail("Not allowed");
      // Default: reopen back to MANAGER_REVIEW. Pass { target: "SELF_ASSESS" }
      // to send it all the way back to the employee for self-assessment edits.
      const to = target === "SELF_ASSESS" ? "SELF_ASSESS" : "MANAGER_REVIEW";
      const data: any = { state: to, finalizedAt: null, hrApprovedAt: null };
      if (to === "SELF_ASSESS") {
        data.managerSubmittedAt = null;
        data.selfSubmittedAt = null;
      }
      await db.assignment.update({ where: { id: a.id }, data });
      break;
    }
    default:
      return fail("Unknown action");
  }

  await audit(u.id, action.toUpperCase(), "Assignment", a.id);
  notifyTransition(a.id, action).catch((e) => console.error("notify failed:", e));

  // In-app notifications
  const link = `/assignments/${a.id}`;
  if (action === "submit-self") {
    notify({ userId: a.managerId, type: "PMF_SELF_SUBMITTED", title: "Self-assessment submitted",
      body: "Time to review and rate.", link }).catch(() => {});
  } else if (action === "submit-manager") {
    const hrAdmins = await db.user.findMany({ where: { role: "HR_ADMIN" }, select: { id: true } });
    notifyMany(hrAdmins.map((h) => h.id), { type: "PMF_MANAGER_SUBMITTED", title: "PMF ready for HR review",
      body: "Manager has submitted their evaluation.", link }).catch(() => {});
  } else if (action === "finalize") {
    notify({ userId: a.employeeId, type: "PMF_FINALIZED", title: "Your evaluation is finalized 🎉",
      body: "View your finalized PMF and final feedback.", link }).catch(() => {});
    notify({ userId: a.managerId, type: "PMF_FINALIZED", title: "Evaluation finalized",
      body: "HR has approved this PMF.", link }).catch(() => {});
  } else if (action === "reopen") {
    notify({ userId: a.managerId, type: "PMF_REOPENED", title: "PMF reopened for edits",
      body: "HR has reopened this evaluation.", link }).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
