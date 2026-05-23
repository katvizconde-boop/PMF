import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

async function canManageGoals(actorId: string, actorRole: string, employeeId: string): Promise<boolean> {
  if (actorRole === "HR_ADMIN") return true;
  if (actorId === employeeId) return true; // employee can propose own goals
  if (actorRole === "MANAGER") {
    const e = await db.user.findUnique({ where: { id: employeeId } });
    return e?.managerId === actorId;
  }
  return false;
}

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const { userId, cycleId, description, target, status } = await req.json();
  if (!userId || !cycleId || !description) return new NextResponse("Missing fields", { status: 400 });
  if (!(await canManageGoals(u.id, u.role, userId))) return new NextResponse("Forbidden", { status: 403 });
  const g = await db.goal.create({
    data: { userId, cycleId, description, target: target || null, status: status || "ACTIVE", createdById: u.id },
  });
  await audit(u.id, "CREATE_GOAL", "Goal", g.id, { userId, cycleId });
  return NextResponse.json({ ok: true, id: g.id });
}

export async function GET(req: Request) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const cycleId = url.searchParams.get("cycleId");
  if (!userId) return new NextResponse("Missing userId", { status: 400 });
  if (!(await canManageGoals(u.id, u.role, userId))) return new NextResponse("Forbidden", { status: 403 });
  const goals = await db.goal.findMany({
    where: { userId, ...(cycleId ? { cycleId } : {}) },
    include: { cycle: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ goals });
}
