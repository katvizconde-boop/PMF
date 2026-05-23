import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";
import { notifyTransition } from "@/lib/email";
import { notify } from "@/lib/notifications";

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });
  const { employeeId, templateId, cycleId } = await req.json();
  if (!employeeId || !templateId || !cycleId) return new NextResponse("Missing fields", { status: 400 });

  const employee = await db.user.findUnique({ where: { id: employeeId } });
  if (!employee) return new NextResponse("Employee not found", { status: 404 });
  if (!employee.managerId) return new NextResponse("Employee has no manager assigned", { status: 400 });

  const exists = await db.assignment.findUnique({ where: { cycleId_employeeId: { cycleId, employeeId } } });
  if (exists) return new NextResponse("This employee already has an evaluation for that cycle", { status: 409 });

  const a = await db.assignment.create({
    data: { employeeId, templateId, cycleId, managerId: employee.managerId, state: "SELF_ASSESS" },
  });
  await audit(u.id, "CREATE_ASSIGNMENT", "Assignment", a.id, { employeeId, templateId, cycleId });
  notifyTransition(a.id, "assigned").catch((e) => console.error("notify failed", e));
  notify({ userId: employeeId, type: "PMF_ASSIGNED", title: "New PMF assigned to you",
    body: "Open it to start your self-assessment.", link: `/assignments/${a.id}` }).catch(() => {});
  return NextResponse.json({ ok: true, id: a.id });
}
