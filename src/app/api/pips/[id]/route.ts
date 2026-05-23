import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";
import { notify } from "@/lib/notifications";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const pip = await db.pIP.findUnique({ where: { id: params.id } });
  if (!pip) return new NextResponse("Not found", { status: 404 });
  if (u.role !== "HR_ADMIN" && pip.managerId !== u.id) return new NextResponse("Forbidden", { status: 403 });
  const b = await req.json();
  const data: any = {};
  if (b.status) data.status = b.status;
  if (b.outcome !== undefined) data.outcome = b.outcome || null;
  if (b.goals !== undefined) data.goals = b.goals;
  if (b.reason !== undefined) data.reason = b.reason;
  if (b.startDate) data.startDate = new Date(b.startDate);
  if (b.endDate)   data.endDate   = new Date(b.endDate);
  if (b.checkIns !== undefined) data.checkIns = b.checkIns;
  await db.pIP.update({ where: { id: params.id }, data });
  await audit(u.id, "UPDATE_PIP", "PIP", params.id, { fields: Object.keys(data) });
  if (b.status && b.status !== pip.status) {
    notify({
      userId: pip.userId, type: "PIP_UPDATED",
      title: `PIP status updated: ${b.status.replace("_", " ")}`,
      link: `/employees/${pip.userId}`,
    }).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });
  await db.pIP.delete({ where: { id: params.id } });
  await audit(u.id, "DELETE_PIP", "PIP", params.id);
  return NextResponse.json({ ok: true });
}
