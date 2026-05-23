import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

async function canManage(actorId: string, actorRole: string, goalUserId: string) {
  if (actorRole === "HR_ADMIN") return true;
  if (actorId === goalUserId) return true;
  if (actorRole === "MANAGER") {
    const e = await db.user.findUnique({ where: { id: goalUserId } });
    return e?.managerId === actorId;
  }
  return false;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const goal = await db.goal.findUnique({ where: { id: params.id } });
  if (!goal) return new NextResponse("Not found", { status: 404 });
  if (!(await canManage(u.id, u.role, goal.userId))) return new NextResponse("Forbidden", { status: 403 });
  const b = await req.json();
  // Employees can edit description / status (not rate themselves); manager+HR can also rate.
  const data: any = {};
  if (b.description != null) data.description = b.description;
  if (b.target != null) data.target = b.target || null;
  if (b.status != null) data.status = b.status;
  if (b.evidence != null) data.evidence = b.evidence;
  if (b.rating != null) {
    if (u.role === "EMPLOYEE") return new NextResponse("Employees cannot rate their own goals", { status: 403 });
    data.rating = b.rating === "" ? null : Number(b.rating);
  }
  await db.goal.update({ where: { id: params.id }, data });
  await audit(u.id, "UPDATE_GOAL", "Goal", params.id, { fields: Object.keys(data) });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const goal = await db.goal.findUnique({ where: { id: params.id } });
  if (!goal) return new NextResponse("Not found", { status: 404 });
  if (!(await canManage(u.id, u.role, goal.userId))) return new NextResponse("Forbidden", { status: 403 });
  await db.goal.delete({ where: { id: params.id } });
  await audit(u.id, "DELETE_GOAL", "Goal", params.id);
  return NextResponse.json({ ok: true });
}
