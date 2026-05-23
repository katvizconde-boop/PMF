import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });
  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) return new NextResponse("No ids supplied", { status: 400 });

  // Don't let HR delete themselves
  const targets = ids.filter((id: string) => id !== u.id);
  if (targets.length === 0) return new NextResponse("No deletable users (cannot delete yourself)", { status: 400 });

  let deleted = 0;
  const errors: { id: string; reason: string }[] = [];

  for (const id of targets) {
    try {
      const user = await db.user.findUnique({ where: { id } });
      if (!user) { errors.push({ id, reason: "Not found" }); continue; }
      await db.$transaction(async (tx) => {
        await tx.user.updateMany({
          where: { managerId: id },
          data: { managerId: user.managerId ?? null },
        });
        const aIds = (await tx.assignment.findMany({
          where: { OR: [{ employeeId: id }, { managerId: id }] },
          select: { id: true },
        })).map((a) => a.id);
        if (aIds.length) {
          await tx.response.deleteMany({ where: { assignmentId: { in: aIds } } });
          await tx.assignment.deleteMany({ where: { id: { in: aIds } } });
        }
        await tx.goal.deleteMany({ where: { userId: id } });
        await tx.auditLog.updateMany({ where: { actorId: id }, data: { actorId: null } });
        await tx.user.delete({ where: { id } });
      });
      deleted++;
    } catch (e: any) {
      errors.push({ id, reason: e.message ?? "unknown" });
    }
  }

  await audit(u.id, "BULK_DELETE_USERS", "User", undefined, { deleted, errorCount: errors.length, requested: ids.length });
  return NextResponse.json({ ok: true, deleted, errors });
}
