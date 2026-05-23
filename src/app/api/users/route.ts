import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });
  const b = await req.json();
  if (!b.email || !b.firstName || !b.lastName) return new NextResponse("Missing fields", { status: 400 });
  const exists = await db.user.findUnique({ where: { email: b.email } });
  if (exists) return new NextResponse("Email already exists", { status: 409 });
  const passwordHash = await bcrypt.hash(b.password || "password123", 10);
  const created = await db.user.create({
    data: {
      email: b.email, firstName: b.firstName, lastName: b.lastName,
      position: b.position || null, department: b.department || null,
      company: b.company || null,
      role: b.role || "EMPLOYEE", employmentType: b.employmentType || "REGULAR",
      managerId: b.managerId || null, passwordHash,
    },
  });
  await audit(u.id, "CREATE_USER", "User", created.id, { email: created.email });
  return NextResponse.json({ ok: true, id: created.id });
}
