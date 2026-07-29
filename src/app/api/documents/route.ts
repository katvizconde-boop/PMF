import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";
import { validateDocumentFile } from "@/lib/fileValidation";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_DOC_MIMES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  // docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",        // xlsx
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",// pptx
  "application/zip", // raw zip too
];

async function canAccess(actor: { id: string; role: string }, employeeId: string) {
  if (actor.role === "HR_ADMIN") return true;
  if (actor.id === employeeId) return true;
  if (actor.role === "MANAGER") {
    const e = await db.user.findUnique({ where: { id: employeeId } });
    return e?.managerId === actor.id;
  }
  return false;
}

export async function GET(req: Request) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") ?? u.id;
  if (!(await canAccess(u, userId))) return new NextResponse("Forbidden", { status: 403 });
  const docs = await db.document.findMany({
    where: { userId },
    select: { id: true, type: true, name: true, mimeType: true, size: true, notes: true, createdAt: true, uploadedById: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ documents: docs });
}

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const form = await req.formData();
  const userId = form.get("userId") as string;
  const type = (form.get("type") as string) || "OTHER";
  const file = form.get("file") as File | null;
  const notes = (form.get("notes") as string) || "";
  if (!userId || !file) return new NextResponse("Missing userId or file", { status: 400 });
  // Only HR or Manager (of this employee) can upload. Employees can upload their own.
  if (!(await canAccess(u, userId))) return new NextResponse("Forbidden", { status: 403 });
  if (file.size > MAX_BYTES) return new NextResponse("File too large (max 5 MB)", { status: 413 });

  const buf = Buffer.from(await file.arrayBuffer());

  // Validate by magic bytes (don't trust client-supplied MIME type)
  let verifiedMime: string;
  try {
    const result = validateDocumentFile(buf, file.type, ALLOWED_DOC_MIMES.concat(["application/zip"]));
    verifiedMime = result.mime;
  } catch (e: any) {
    return new NextResponse(`File rejected: ${e.message}`, { status: 400 });
  }

  // Sanitize filename — strip path separators and control characters
  const safeName = (file.name || "file")
    .replace(/[\\/]/g, "_")
    .replace(/[\x00-\x1f]/g, "")
    .slice(0, 255);

  const dataUrl = `data:${verifiedMime};base64,${buf.toString("base64")}`;
  const doc = await db.document.create({
    data: {
      userId, type, name: safeName, mimeType: verifiedMime,
      size: file.size, fileData: dataUrl, notes: notes || null, uploadedById: u.id,
    },
  });
  await audit(u.id, "UPLOAD_DOCUMENT", "Document", doc.id, { userId, type, size: file.size, mime: verifiedMime });
  return NextResponse.json({ ok: true, id: doc.id });
}
