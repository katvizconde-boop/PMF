import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";

export async function GET() {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const items = await db.notification.findMany({
    where: { userId: u.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const unread = items.filter((n) => !n.readAt).length;
  return NextResponse.json({ items, unread });
}

export async function PATCH(req: Request) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const { ids, all } = await req.json().catch(() => ({}));
  if (all) {
    await db.notification.updateMany({
      where: { userId: u.id, readAt: null },
      data: { readAt: new Date() },
    });
  } else if (Array.isArray(ids) && ids.length > 0) {
    await db.notification.updateMany({
      where: { userId: u.id, id: { in: ids } },
      data: { readAt: new Date() },
    });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (id) {
    await db.notification.deleteMany({ where: { id, userId: u.id } });
  } else {
    await db.notification.deleteMany({ where: { userId: u.id } });
  }
  return NextResponse.json({ ok: true });
}
