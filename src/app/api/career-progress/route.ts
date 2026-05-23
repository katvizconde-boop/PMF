import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

async function canSet(actor: { id: string; role: string }, employeeId: string) {
  if (actor.role === "HR_ADMIN") return true;
  if (actor.id === employeeId) return true;
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
  const userId = url.searchParams.get("userId") ?? u.id;
  if (!(await canSet(u, userId))) return new NextResponse("Forbidden", { status: 403 });
  const cp = await db.userCareerProgress.findUnique({
    where: { userId },
    include: {
      currentPath: { include: { steps: { orderBy: { sortOrder: "asc" } } } },
      currentStep: true,
      targetStep: true,
    },
  });
  return NextResponse.json({ progress: cp });
}

export async function PUT(req: Request) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const b = await req.json();
  const userId = b.userId ?? u.id;
  if (!(await canSet(u, userId))) return new NextResponse("Forbidden", { status: 403 });
  const data = {
    currentPathId: b.currentPathId || null,
    currentStepId: b.currentStepId || null,
    targetStepId:  b.targetStepId  || null,
    notes:         b.notes         || null,
  };
  const cp = await db.userCareerProgress.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
  await audit(u.id, "UPDATE_CAREER_PROGRESS", "UserCareerProgress", cp.id, { userId });
  return NextResponse.json({ ok: true });
}
