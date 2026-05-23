import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Update own profile (any logged-in user). HR can edit anyone via /api/users/[id]. */
export async function PATCH(req: Request) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const b = await req.json();

  // Reject base64 picture larger than ~600 KB to keep DB rows small
  if (b.profilePicture && typeof b.profilePicture === "string") {
    if (!b.profilePicture.startsWith("data:image/")) return new NextResponse("Invalid picture format", { status: 400 });
    if (b.profilePicture.length > 800_000) return new NextResponse("Profile picture too large (max ~600KB)", { status: 413 });
  }

  const data: any = {};
  for (const f of ["firstName", "middleName", "lastName", "phone", "address", "emergencyContact", "profilePicture"]) {
    if (b[f] !== undefined) data[f] = b[f] || null;
  }
  await db.user.update({ where: { id: u.id }, data });
  await audit(u.id, "UPDATE_PROFILE", "User", u.id, { fields: Object.keys(data) });
  return NextResponse.json({ ok: true });
}
