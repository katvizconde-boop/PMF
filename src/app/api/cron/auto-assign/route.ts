import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";
import { notifyTransition } from "@/lib/email";

/**
 * Daily auto-assignment cron.
 *
 * For each ACTIVE cycle (periodEnd not yet passed) with autoAssign flags set,
 * creates assignments for any eligible employees who don't already have one
 * in that cycle. Also handles milestone-based assessments for new
 * probationary hires (3-month mark).
 *
 * Auth: Bearer CRON_SECRET (for external schedulers) or HR_ADMIN session.
 */

async function authorize(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const header = req.headers.get("authorization");
    if (header === `Bearer ${cronSecret}`) return { kind: "cron" as const };
  }
  const u = await getSessionUser();
  if (u?.role === "HR_ADMIN") return { kind: "user" as const, user: u };
  return null;
}

export async function GET(req: Request) { return handler(req); }
export async function POST(req: Request) { return handler(req); }

async function handler(req: Request) {
  const auth = await authorize(req);
  if (!auth) return new NextResponse("Unauthorized", { status: 401 });

  const now = new Date();
  const MS_PER_DAY = 86400000;
  let created = 0;
  const details: any[] = [];

  // Active cycles with auto-assign enabled
  const cycles = await db.cycle.findMany({
    where: { periodEnd: { gte: now }, OR: [{ autoAssignRegular: true }, { autoAssignProbationary: true }] },
  });

  for (const c of cycles) {
    // Pick the matching template if configured on the cycle; else most recent active per type
    const pickTemplate = async (type: string) => {
      if (type === "REGULAR" && c.regularTemplateId) return db.template.findUnique({ where: { id: c.regularTemplateId } });
      if (type === "PROBATIONARY" && c.probationaryTemplateId) return db.template.findUnique({ where: { id: c.probationaryTemplateId } });
      return db.template.findFirst({ where: { type, isActive: true }, orderBy: { createdAt: "desc" } });
    };

    const types: Array<"REGULAR" | "PROBATIONARY"> = [];
    if (c.autoAssignRegular) types.push("REGULAR");
    if (c.autoAssignProbationary) types.push("PROBATIONARY");

    for (const type of types) {
      const tmpl = await pickTemplate(type);
      if (!tmpl) continue;

      // For probationary, only employees hired within the cycle window (new hires approaching 3-month mark)
      // For regular, all regulars who don't yet have an assignment in this cycle
      const eligibility: any = { role: "EMPLOYEE", employmentType: type, managerId: { not: null } };
      if (type === "PROBATIONARY") {
        // Hired at least 80 days ago and up to period end
        const threshold = new Date(now.getTime() - 80 * MS_PER_DAY);
        eligibility.hireDate = { lte: threshold };
      }

      const candidates = await db.user.findMany({ where: eligibility });
      for (const e of candidates) {
        const exists = await db.assignment.findUnique({
          where: { cycleId_employeeId: { cycleId: c.id, employeeId: e.id } },
        });
        if (exists) continue;
        const a = await db.assignment.create({
          data: { cycleId: c.id, templateId: tmpl.id, employeeId: e.id, managerId: e.managerId!, state: "SELF_ASSESS" },
        });
        notifyTransition(a.id, "assigned").catch(() => {});
        created++;
        details.push({ cycle: c.name, employee: e.email, type });
      }
    }
  }

  // Milestone assessments: probationary employees hired 85-95 days ago who have NEVER been assigned
  // a probationary PMF — create one using their manager and the default active cycle.
  const lowerBound = new Date(now.getTime() - 95 * MS_PER_DAY);
  const upperBound = new Date(now.getTime() - 85 * MS_PER_DAY);
  const newProbs = await db.user.findMany({
    where: {
      role: "EMPLOYEE", employmentType: "PROBATIONARY",
      managerId: { not: null },
      hireDate: { gte: lowerBound, lte: upperBound },
    },
  });
  if (newProbs.length > 0) {
    const probTmpl = await db.template.findFirst({ where: { type: "PROBATIONARY", isActive: true }, orderBy: { createdAt: "desc" } });
    const activeCycle = await db.cycle.findFirst({ where: { periodEnd: { gte: now } }, orderBy: { periodStart: "desc" } });
    if (probTmpl && activeCycle) {
      for (const e of newProbs) {
        const anyProbEval = await db.assignment.findFirst({ where: { employeeId: e.id, template: { type: "PROBATIONARY" } } });
        if (anyProbEval) continue;
        const a = await db.assignment.create({
          data: { cycleId: activeCycle.id, templateId: probTmpl.id, employeeId: e.id, managerId: e.managerId!, state: "SELF_ASSESS" },
        });
        notifyTransition(a.id, "assigned").catch(() => {});
        created++;
        details.push({ cycle: activeCycle.name, employee: e.email, type: "PROBATIONARY_3MONTH" });
      }
    }
  }

  await audit(auth.kind === "user" ? auth.user.id : null, "AUTO_ASSIGN", "System", undefined, { created, details });
  return NextResponse.json({ ok: true, created, details });
}
