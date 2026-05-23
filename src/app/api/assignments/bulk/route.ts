import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";
import { notifyTransition } from "@/lib/email";
import { notify } from "@/lib/notifications";

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });

  const { cycleId, templateId, department, employmentType, role } = await req.json();
  if (!cycleId || !templateId) return new NextResponse("Missing cycleId or templateId", { status: 400 });

  const where: any = {};
  if (department) where.department = department;
  if (employmentType) where.employmentType = employmentType;
  if (role) where.role = role;
  else where.role = { in: ["EMPLOYEE", "MANAGER"] }; // default: skip HR

  const candidates = await db.user.findMany({ where });
  const skipped: string[] = [];
  let created = 0;

  for (const e of candidates) {
    if (!e.managerId) { skipped.push(`${e.firstName} ${e.lastName} (no manager)`); continue; }
    const exists = await db.assignment.findUnique({ where: { cycleId_employeeId: { cycleId, employeeId: e.id } } });
    if (exists) { skipped.push(`${e.firstName} ${e.lastName} (already assigned)`); continue; }
    const a = await db.assignment.create({
      data: { cycleId, templateId, employeeId: e.id, managerId: e.managerId, state: "SELF_ASSESS" },
    });
    notifyTransition(a.id, "assigned").catch(() => {});
    notify({ userId: e.id, type: "PMF_ASSIGNED", title: "New PMF assigned to you",
      body: "Open it to start your self-assessment.", link: `/assignments/${a.id}` }).catch(() => {});
    created++;
  }
  await audit(u.id, "BULK_ASSIGN", "Cycle", cycleId, { created, filter: { department, employmentType, role } });
  return NextResponse.json({ ok: true, created, skipped });
}
