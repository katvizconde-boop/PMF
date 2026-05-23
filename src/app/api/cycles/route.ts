import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });
  const b = await req.json();
  if (!b.name || !b.periodStart || !b.periodEnd || !b.dueDate) return new NextResponse("Missing fields", { status: 400 });
  const c = await db.cycle.create({
    data: {
      name: b.name,
      periodStart: new Date(b.periodStart),
      periodEnd: new Date(b.periodEnd),
      dueDate: new Date(b.dueDate),
      autoAssignRegular: !!b.autoAssignRegular,
      autoAssignProbationary: !!b.autoAssignProbationary,
    },
  });
  await audit(u.id, "CREATE_CYCLE", "Cycle", c.id, { name: c.name });
  return NextResponse.json({ ok: true, id: c.id });
}
