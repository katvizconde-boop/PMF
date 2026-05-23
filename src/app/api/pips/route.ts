import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";
import { notify } from "@/lib/notifications";

async function canManage(actor: { id: string; role: string }, employeeId: string) {
  if (actor.role === "HR_ADMIN") return true;
  if (actor.role === "MANAGER") {
    const e = await db.user.findUnique({ where: { id: employeeId } });
    return e?.managerId === actor.id;
  }
  return false;
}

export async function GET(req: Request) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) return new NextResponse("Missing userId", { status: 400 });
  // Employee can view their own; manager/HR can view their reports
  if (u.role === "EMPLOYEE" && u.id !== userId) return new NextResponse("Forbidden", { status: 403 });
  if (u.role === "MANAGER" && !(await canManage(u, userId)) && u.id !== userId) return new NextResponse("Forbidden", { status: 403 });
  const items = await db.pIP.findMany({
    where: { userId },
    include: { manager: { select: { firstName: true, lastName: true } } },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const b = await req.json();
  if (!b.userId || !b.startDate || !b.endDate || !b.reason || !b.goals) return new NextResponse("Missing fields", { status: 400 });
  if (!(await canManage(u, b.userId))) return new NextResponse("Forbidden", { status: 403 });
  const target = await db.user.findUnique({ where: { id: b.userId } });
  if (!target?.managerId) return new NextResponse("Employee has no manager", { status: 400 });
  const pip = await db.pIP.create({
    data: {
      userId: b.userId, managerId: target.managerId,
      startDate: new Date(b.startDate), endDate: new Date(b.endDate),
      reason: b.reason, goals: b.goals,
      createdById: u.id,
    },
  });
  await audit(u.id, "CREATE_PIP", "PIP", pip.id, { userId: b.userId });
  notify({
    userId: b.userId, type: "PIP_STARTED",
    title: "Performance Improvement Plan started",
    body: `Active from ${new Date(b.startDate).toLocaleDateString()} to ${new Date(b.endDate).toLocaleDateString()}.`,
    link: `/employees/${b.userId}`,
  }).catch(() => {});
  return NextResponse.json({ ok: true, id: pip.id });
}
