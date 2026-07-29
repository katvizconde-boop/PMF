import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

/**
 * POST /api/admin/bulk-reset-password
 * HR_ADMIN only. Set a SINGLE password for many users at once and force them
 * to change it on first login. Useful for rollout waves so HR can announce
 * one password to everyone instead of managing per-user temp passwords.
 *
 * Body:
 *   {
 *     password: string,                     // ≥ 8 chars
 *     company?: string,                     // set for all users in this company
 *     userIds?: string[],                   // OR set for these specific users
 *     roles?: ("EMPLOYEE"|"MANAGER"|"HR_ADMIN")[],  // optional role filter
 *     dryRun?: boolean,
 *   }
 */
export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { password, company, userIds, roles, dryRun } = body as {
    password?: string; company?: string; userIds?: string[]; roles?: string[]; dryRun?: boolean;
  };

  if (!password || String(password).length < 8) {
    return new NextResponse("Password must be at least 8 characters.", { status: 400 });
  }
  if (!company && (!userIds || userIds.length === 0)) {
    return new NextResponse("Provide either 'company' or 'userIds[]'.", { status: 400 });
  }

  const where: any = {};
  if (company) where.company = company;
  if (userIds && userIds.length > 0) where.id = { in: userIds };
  if (roles && roles.length > 0) where.role = { in: roles };

  const users = await db.user.findMany({
    where,
    select: { id: true, email: true, firstName: true, lastName: true, company: true, role: true },
  });

  if (users.length === 0) {
    return NextResponse.json({ ok: true, count: 0, note: "No matching users." });
  }

  if (dryRun) {
    return NextResponse.json({
      ok: true, dryRun: true, count: users.length,
      sample: users.slice(0, 25).map((x) => ({ email: x.email, name: `${x.firstName} ${x.lastName}`, role: x.role, company: x.company })),
    });
  }

  const hashed = await bcrypt.hash(String(password), 12);
  const result = await db.user.updateMany({
    where: { id: { in: users.map((x) => x.id) } },
    data: { passwordHash: hashed, mustChangePassword: true, failedLoginCount: 0, lockedUntil: null },
  });

  await audit(u.id, "BULK_RESET_PASSWORD", "User", "bulk", {
    company: company ?? null, userIdCount: userIds?.length ?? null, roles: roles ?? null, updated: result.count,
  });

  return NextResponse.json({ ok: true, count: result.count });
}
