import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) return new NextResponse("Missing fields", { status: 400 });
  if (newPassword.length < 8) return new NextResponse("Password must be at least 8 characters", { status: 400 });

  const fresh = await db.user.findUnique({ where: { id: u.id } });
  if (!fresh) return new NextResponse("User not found", { status: 404 });

  const ok = await bcrypt.compare(currentPassword, fresh.passwordHash);
  if (!ok) return new NextResponse("Current password is incorrect", { status: 401 });

  const hash = await bcrypt.hash(newPassword, 10);
  await db.user.update({ where: { id: u.id }, data: { passwordHash: hash } });
  await audit(u.id, "CHANGE_PASSWORD", "User", u.id);
  return NextResponse.json({ ok: true });
}
