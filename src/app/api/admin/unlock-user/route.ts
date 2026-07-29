import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";
import bcrypt from "bcryptjs";

/**
 * HR-only: POST /api/admin/unlock-user
 * Body: { email: string, newPassword?: string }
 *   - Clears failedLoginCount + lockedUntil
 *   - If newPassword provided, sets a fresh hash and forces mustChangePassword=true on next login
 */
export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });

  const { email, newPassword } = await req.json().catch(() => ({}));
  if (!email) return new NextResponse("Missing email", { status: 400 });

  const target = await db.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });
  if (!target) return new NextResponse("User not found", { status: 404 });

  const data: any = { failedLoginCount: 0, lockedUntil: null };
  if (newPassword) {
    if (String(newPassword).length < 8) return new NextResponse("Password must be at least 8 characters", { status: 400 });
    data.passwordHash = await bcrypt.hash(String(newPassword), 12);
    data.mustChangePassword = true;
  }
  await db.user.update({ where: { id: target.id }, data });
  await audit(u.id, "UNLOCK_USER", "User", target.id, { reset: !!newPassword });

  return NextResponse.json({ ok: true, email: target.email, passwordReset: !!newPassword });
}
