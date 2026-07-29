import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";
import { hashPassword, generateStrongTempPassword } from "@/lib/password";

const ALLOWED_ROLES = new Set(["EMPLOYEE", "MANAGER", "HR_ADMIN"]);
const ALLOWED_EMPLOYMENT = new Set(["REGULAR", "PROBATIONARY", "CONTRACTUAL"]);

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });
  const b = await req.json();
  if (!b.email || !b.firstName || !b.lastName) return new NextResponse("Missing fields", { status: 400 });

  // Validate role + employment type against allowlist (defense vs CSV-injected privilege escalation)
  if (b.role && !ALLOWED_ROLES.has(b.role)) return new NextResponse("Invalid role", { status: 400 });
  if (b.employmentType && !ALLOWED_EMPLOYMENT.has(b.employmentType)) return new NextResponse("Invalid employment type", { status: 400 });

  const exists = await db.user.findUnique({ where: { email: b.email } });
  if (exists) return new NextResponse("Email already exists", { status: 409 });

  // Generate a strong random temp password if HR didn't supply one.
  // mustChangePassword is set so the user is forced to change it on first login.
  const tempPassword = b.password || generateStrongTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const created = await db.user.create({
    data: {
      email: b.email, firstName: b.firstName, lastName: b.lastName,
      position: b.position || null, department: b.department || null,
      company: b.company || null,
      role: b.role || "EMPLOYEE", employmentType: b.employmentType || "REGULAR",
      managerId: b.managerId || null, passwordHash,
      mustChangePassword: true,
    },
  });
  await audit(u.id, "CREATE_USER", "User", created.id, { email: created.email });

  // Return the temp password so HR can share it securely with the user
  // (Don't log this — it's a one-time output to the admin UI)
  return NextResponse.json({
    ok: true,
    id: created.id,
    tempPassword: b.password ? undefined : tempPassword,
  });
}
