import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";
import { notify } from "@/lib/notifications";

async function canAccess(actor: { id: string; role: string }, employeeId: string) {
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
  const employeeId = url.searchParams.get("employeeId");
  if (!employeeId) return new NextResponse("Missing employeeId", { status: 400 });
  if (!(await canAccess(u, employeeId))) return new NextResponse("Forbidden", { status: 403 });
  const items = await db.oneOnOne.findMany({
    where: { employeeId },
    include: { manager: { select: { firstName: true, lastName: true } } },
    orderBy: { scheduledAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const b = await req.json();
  if (!b.employeeId || !b.scheduledAt) return new NextResponse("Missing fields", { status: 400 });
  if (!(await canAccess(u, b.employeeId))) return new NextResponse("Forbidden", { status: 403 });
  const employee = await db.user.findUnique({ where: { id: b.employeeId } });
  if (!employee) return new NextResponse("Employee not found", { status: 404 });
  const managerId = employee.managerId ?? u.id;
  const meeting = await db.oneOnOne.create({
    data: {
      employeeId: b.employeeId, managerId,
      scheduledAt: new Date(b.scheduledAt),
      agenda: b.agenda || null, notes: b.notes || null, actionItems: b.actionItems || null,
      createdById: u.id,
    },
  });
  await audit(u.id, "CREATE_ONEONONE", "OneOnOne", meeting.id, { employeeId: b.employeeId });
  notify({
    userId: b.employeeId, type: "ONEONONE_SCHEDULED",
    title: "1:1 meeting scheduled",
    body: `Scheduled for ${new Date(b.scheduledAt).toLocaleString()}`,
    link: `/employees/${b.employeeId}`,
  }).catch(() => {});
  return NextResponse.json({ ok: true, id: meeting.id });
}
