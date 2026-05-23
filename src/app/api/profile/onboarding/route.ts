import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const body = await req.json().catch(() => ({}));
  const completed = body.completed !== false;
  await db.user.update({ where: { id: u.id }, data: { onboardingCompleted: completed } });
  return NextResponse.json({ ok: true, completed });
}
