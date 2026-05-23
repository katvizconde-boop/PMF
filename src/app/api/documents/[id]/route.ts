import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

async function canAccess(actor: { id: string; role: string }, employeeId: string) {
  if (actor.role === "HR_ADMIN") return true;
  if (actor.id === employeeId) return true;
  if (actor.role === "MANAGER") {
    const e = await db.user.findUnique({ where: { id: employeeId } });
    return e?.managerId === actor.id;
  }
  return false;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const doc = await db.document.findUnique({ where: { id: params.id } });
  if (!doc) return new NextResponse("Not found", { status: 404 });
  if (!(await canAccess(u, doc.userId))) return new NextResponse("Forbidden", { status: 403 });
  // Return a streamable response with the file data
  const match = doc.fileData.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) return new NextResponse("Invalid file data", { status: 500 });
  const buffer = Buffer.from(match[2], "base64");
  await audit(u.id, "DOWNLOAD_DOCUMENT", "Document", doc.id);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.name)}"`,
      "Cache-Control": "private, no-cache",
    },
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const doc = await db.document.findUnique({ where: { id: params.id } });
  if (!doc) return new NextResponse("Not found", { status: 404 });
  // Only HR or the uploader can delete
  if (u.role !== "HR_ADMIN" && doc.uploadedById !== u.id) return new NextResponse("Forbidden", { status: 403 });
  await db.document.delete({ where: { id: params.id } });
  await audit(u.id, "DELETE_DOCUMENT", "Document", doc.id);
  return NextResponse.json({ ok: true });
}
