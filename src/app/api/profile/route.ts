import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";
import { validateImageDataUrl } from "@/lib/fileValidation";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Update own profile (any logged-in user). HR can edit anyone via /api/users/[id]. */
export async function PATCH(req: Request) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const b = await req.json();

  // Reject base64 picture larger than ~600 KB to keep DB rows small
  if (b.profilePicture && typeof b.profilePicture === "string") {
    if (b.profilePicture.length > 800_000) return new NextResponse("Profile picture too large (max ~600KB)", { status: 413 });
    // Verify it's actually a PNG/JPEG by reading magic bytes (blocks SVG XSS)
    try { validateImageDataUrl(b.profilePicture); }
    catch (e: any) { return new NextResponse(`Profile picture rejected: ${e.message}`, { status: 400 }); }
  }

  const data: any = {};
  for (const f of ["firstName", "middleName", "lastName", "phone", "address", "emergencyContact", "profilePicture"]) {
    if (b[f] !== undefined) data[f] = b[f] || null;
  }
  await db.user.update({ where: { id: u.id }, data });
  await audit(u.id, "UPDATE_PROFILE", "User", u.id, { fields: Object.keys(data) });
  return NextResponse.json({ ok: true });
}
