import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });
  const b = await req.json();
  const updated = await db.user.update({
    where: { id: params.id },
    data: {
      firstName: b.firstName, lastName: b.lastName, email: b.email,
      position: b.position || null, department: b.department || null,
      company: b.company || null,
      role: b.role, employmentType: b.employmentType,
      managerId: b.managerId || null,
    },
  });
  await audit(u.id, "UPDATE_USER", "User", updated.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });
  if (params.id === u.id) return new NextResponse("You cannot delete yourself.", { status: 400 });

  const target = await db.user.findUnique({ where: { id: params.id } });
  if (!target) return new NextResponse("User not found", { status: 404 });

  try {
    await db.$transaction(async (tx) => {
      // 1. Reassign any direct reports to the deleted user's manager (or null)
      await tx.user.updateMany({
        where: { managerId: params.id },
        data: { managerId: target.managerId ?? null },
      });

      // 2. Delete all assignments where this user is employee OR manager
      const assignments = await tx.assignment.findMany({
        where: { OR: [{ employeeId: params.id }, { managerId: params.id }] },
        select: { id: true },
      });
      const aIds = assignments.map((a) => a.id);
      if (aIds.length) {
        await tx.response.deleteMany({ where: { assignmentId: { in: aIds } } });
        await tx.assignment.deleteMany({ where: { id: { in: aIds } } });
      }

      // 3. Delete goals (onDelete: Cascade handles it but be explicit in case of constraint issues)
      await tx.goal.deleteMany({ where: { userId: params.id } });

      // 4. Nullify audit log references to preserve history but allow delete
      await tx.auditLog.updateMany({
        where: { actorId: params.id },
        data: { actorId: null },
      });

      // 5. Delete the user
      await tx.user.delete({ where: { id: params.id } });
    });
  } catch (e: any) {
    console.error("DELETE user failed:", e);
    return new NextResponse("Delete failed: " + (e.message ?? "unknown"), { status: 500 });
  }

  await audit(u.id, "DELETE_USER", "User", params.id, { email: target.email });
  return NextResponse.json({ ok: true });
}
