import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";
import { notify } from "@/lib/notifications";

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const { toUserId, message, category, isPublic } = await req.json();
  if (!toUserId || !message) return new NextResponse("Missing fields", { status: 400 });
  if (toUserId === u.id) return new NextResponse("You can't kudos yourself", { status: 400 });
  const target = await db.user.findUnique({ where: { id: toUserId }, select: { id: true, firstName: true } });
  if (!target) return new NextResponse("Recipient not found", { status: 404 });

  const k = await db.kudos.create({
    data: { fromUserId: u.id, toUserId, message: String(message).slice(0, 1000), category: category || null, isPublic: isPublic !== false },
  });
  await audit(u.id, "SEND_KUDOS", "Kudos", k.id, { toUserId });
  notify({
    userId: toUserId,
    type: "KUDOS_RECEIVED",
    title: `${u.name} sent you kudos! 🎉`,
    body: String(message).slice(0, 200),
    link: `/kudos`,
  }).catch(() => {});
  return NextResponse.json({ ok: true, id: k.id });
}

export async function GET(req: Request) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") ?? "public"; // public | mine-received | mine-sent
  const userId = url.searchParams.get("userId");

  const where: any = {};
  if (userId) {
    where.toUserId = userId;
  } else if (scope === "mine-received") {
    where.toUserId = u.id;
  } else if (scope === "mine-sent") {
    where.fromUserId = u.id;
  } else {
    where.isPublic = true;
  }

  const rows = await db.kudos.findMany({
    where,
    include: {
      fromUser: { select: { id: true, firstName: true, lastName: true, position: true, profilePicture: true } },
      toUser:   { select: { id: true, firstName: true, lastName: true, position: true, profilePicture: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ kudos: rows });
}
