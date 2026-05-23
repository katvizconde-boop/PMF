import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

/** Delete an evaluation. HR_ADMIN only. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  if (u.role !== "HR_ADMIN") return new NextResponse("Only HR can delete evaluations.", { status: 403 });

  const a = await db.assignment.findUnique({
    where: { id: params.id },
    include: { employee: true, cycle: true, template: true },
  });
  if (!a) return new NextResponse("Not found", { status: 404 });

  try {
    await db.$transaction(async (tx) => {
      // Wipe responses then the assignment
      await tx.response.deleteMany({ where: { assignmentId: a.id } });
      await tx.assignment.delete({ where: { id: a.id } });
    });
    await audit(u.id, "DELETE_ASSIGNMENT", "Assignment", a.id, {
      employee: `${a.employee.firstName} ${a.employee.lastName}`,
      cycle: a.cycle.name,
      template: a.template.name,
      state: a.state,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return new NextResponse(`Delete failed: ${e.message ?? "unknown"}`, { status: 500 });
  }
}
