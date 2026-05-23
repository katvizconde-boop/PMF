import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, canAccessAssignment } from "@/lib/rbac";
import { audit } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const a = await canAccessAssignment(u.id, u.role, params.id);
  if (!a) return new NextResponse("Forbidden", { status: 403 });

  const { signature } = await req.json();
  if (!signature || !signature.startsWith("data:image/")) {
    return new NextResponse("Invalid signature", { status: 400 });
  }
  // Size sanity: 10 MB max (base64 adds ~33%, so allow ~14 MB encoded length)
  if (signature.length > 14_000_000) return new NextResponse("Signature too large (max 10 MB)", { status: 413 });

  const now = new Date();
  const data: any = {};
  if (u.role === "EMPLOYEE" && a.employeeId === u.id) {
    data.employeeSignature = signature; data.employeeSignedAt = now;
  } else if (u.role === "MANAGER" && a.managerId === u.id) {
    data.managerSignature = signature; data.managerSignedAt = now;
  } else if (u.role === "HR_ADMIN") {
    data.hrSignature = signature; data.hrSignedAt = now;
  } else {
    return new NextResponse("Not allowed to sign", { status: 403 });
  }
  await db.assignment.update({ where: { id: a.id }, data });
  await audit(u.id, "SIGN_ASSIGNMENT", "Assignment", a.id, { role: u.role });
  return NextResponse.json({ ok: true });
}
