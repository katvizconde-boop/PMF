import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const m = await db.oneOnOne.findUnique({ where: { id: params.id } });
  if (!m) return new NextResponse("Not found", { status: 404 });
  if (u.role !== "HR_ADMIN" && m.employeeId !== u.id && m.managerId !== u.id) return new NextResponse("Forbidden", { status: 403 });
  const b = await req.json();
  const data: any = {};
  for (const k of ["agenda", "notes", "actionItems"]) if (b[k] !== undefined) data[k] = b[k] || null;
  if (b.scheduledAt) data.scheduledAt = new Date(b.scheduledAt);
  if (b.completed === true) data.completedAt = new Date();
  if (b.completed === false) data.completedAt = null;
  await db.oneOnOne.update({ where: { id: params.id }, data });
  await audit(u.id, "UPDATE_ONEONONE", "OneOnOne", params.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const m = await db.oneOnOne.findUnique({ where: { id: params.id } });
  if (!m) return new NextResponse("Not found", { status: 404 });
  if (u.role !== "HR_ADMIN" && m.managerId !== u.id) return new NextResponse("Forbidden", { status: 403 });
  await db.oneOnOne.delete({ where: { id: params.id } });
  await audit(u.id, "DELETE_ONEONONE", "OneOnOne", params.id);
  return NextResponse.json({ ok: true });
}
