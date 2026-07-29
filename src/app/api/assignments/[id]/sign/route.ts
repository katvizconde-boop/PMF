import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, canAccessAssignment, isManagerOf } from "@/lib/rbac";
import { audit } from "@/lib/auth";
import { validateImageDataUrl } from "@/lib/fileValidation";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const a = await canAccessAssignment(u.id, u.role, params.id);
  if (!a) return new NextResponse("Forbidden", { status: 403 });

  const { signature, name } = await req.json();
  if (!signature || typeof signature !== "string") {
    return new NextResponse("Invalid signature", { status: 400 });
  }
  const typedName = typeof name === "string" ? name.trim() : "";
  if (typedName.length < 2 || typedName.length > 120) {
    return new NextResponse("Please type your full name before confirming the signature.", { status: 400 });
  }
  // Size sanity: 10 MB max (base64 adds ~33%, so allow ~14 MB encoded length)
  if (signature.length > 14_000_000) return new NextResponse("Signature too large (max 10 MB)", { status: 413 });

  // Verify it's actually a PNG or JPEG by reading magic bytes — blocks SVG/HTML/script injection
  try {
    validateImageDataUrl(signature);
  } catch (e: any) {
    return new NextResponse(`Invalid signature: ${e.message}`, { status: 400 });
  }

  const now = new Date();
  const data: any = {};
  // Anyone (including a MANAGER or HR_ADMIN) viewing their own PMF signs as the EMPLOYEE.
  if (a.employeeId === u.id) {
    data.employeeSignature = signature; data.employeeSignedAt = now; data.employeeSignatureName = typedName;
  } else if (u.role === "MANAGER" && (await isManagerOf(u.id, a.employeeId))) {
    data.managerSignature = signature; data.managerSignedAt = now; data.managerSignatureName = typedName;
  } else if (u.role === "HR_ADMIN") {
    data.hrSignature = signature; data.hrSignedAt = now; data.hrSignatureName = typedName;
  } else {
    return new NextResponse("Not allowed to sign", { status: 403 });
  }
  await db.assignment.update({ where: { id: a.id }, data });
  await audit(u.id, "SIGN_ASSIGNMENT", "Assignment", a.id, { role: u.role });
  return NextResponse.json({ ok: true });
}
