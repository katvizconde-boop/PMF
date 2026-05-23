import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });
  const dept = await db.department.findUnique({ where: { id: params.id } });
  if (!dept) return new NextResponse("Not found", { status: 404 });
  // Check usage
  const usage = await db.user.count({ where: { company: dept.company, department: dept.name } });
  if (usage > 0) return new NextResponse(`Cannot delete: ${usage} employee(s) are still assigned to this department.`, { status: 409 });
  await db.department.delete({ where: { id: params.id } });
  await audit(u.id, "DELETE_DEPARTMENT", "Department", params.id, { company: dept.company, name: dept.name });
  return NextResponse.json({ ok: true });
}
