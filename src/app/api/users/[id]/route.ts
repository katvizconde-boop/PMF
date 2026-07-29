import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

const ALLOWED_ROLES = new Set(["EMPLOYEE", "MANAGER", "HR_ADMIN"]);
const ALLOWED_EMPLOYMENT = new Set(["REGULAR", "PROBATIONARY", "CONTRACTUAL"]);

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });

  let b: any;
  try {
    b = await req.json();
  } catch {
    return new NextResponse("Invalid request body", { status: 400 });
  }

  // Validate required fields
  if (!b.firstName || !b.lastName || !b.email) {
    return new NextResponse("First name, last name, and email are required.", { status: 400 });
  }

  // Validate role / employmentType if supplied
  if (b.role && !ALLOWED_ROLES.has(b.role)) {
    return new NextResponse(`Invalid role: "${b.role}". Allowed: EMPLOYEE, MANAGER, HR_ADMIN.`, { status: 400 });
  }
  if (b.employmentType && !ALLOWED_EMPLOYMENT.has(b.employmentType)) {
    return new NextResponse(`Invalid employment type: "${b.employmentType}". Allowed: REGULAR, PROBATIONARY, CONTRACTUAL.`, { status: 400 });
  }

  // Prevent setting yourself as your own manager
  if (b.managerId && b.managerId === params.id) {
    return new NextResponse("A user cannot be their own manager.", { status: 400 });
  }

  // Confirm the user exists before trying to update
  const existing = await db.user.findUnique({ where: { id: params.id } });
  if (!existing) return new NextResponse("Employee not found.", { status: 404 });

  // If email is changing, check it's not already taken
  const cleanEmail = b.email.trim().toLowerCase();
  if (cleanEmail !== existing.email.toLowerCase()) {
    const dup = await db.user.findUnique({ where: { email: cleanEmail } });
    if (dup) return new NextResponse("That email is already in use by another employee.", { status: 409 });
  }

  try {
    const updated = await db.user.update({
      where: { id: params.id },
      data: {
        firstName: b.firstName.trim(),
        lastName: b.lastName.trim(),
        email: cleanEmail,
        position: b.position?.trim() || null,
        department: b.department?.trim() || null,
        company: b.company || null,
        role: b.role || existing.role,
        employmentType: b.employmentType || existing.employmentType,
        managerId: b.managerId || null,
      },
    });
    await audit(u.id, "UPDATE_USER", "User", updated.id, {
      email: updated.email,
      // Note which fields changed for the audit log
      changedFields: Object.keys(b).filter((k) => k !== "id"),
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[API_ERROR] UPDATE_USER failed", { userId: params.id, error: e?.message, code: e?.code });
    // Surface unique-constraint and validation errors with a friendly message
    if (e?.code === "P2002") {
      return new NextResponse("A user with that email or unique value already exists.", { status: 409 });
    }
    if (e?.code === "P2025") {
      return new NextResponse("Employee not found.", { status: 404 });
    }
    return new NextResponse("Could not save changes. Please try again or contact IT.", { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });
  if (params.id === u.id) return new NextResponse("You cannot delete yourself.", { status: 400 });

  const target = await db.user.findUnique({ where: { id: params.id } });
  if (!target) return new NextResponse("User not found", { status: 404 });

  try {
    await db.$transaction(async (tx) => {
      // 1. Reassign any direct reports to the deleted user's manager (or null)
      await tx.user.updateMany({
        where: { managerId: params.id },
        data: { managerId: target.managerId ?? null },
      });

      // 2. Delete all assignments where this user is employee OR manager
      const assignments = await tx.assignment.findMany({
        where: { OR: [{ employeeId: params.id }, { managerId: params.id }] },
        select: { id: true },
      });
      const aIds = assignments.map((a) => a.id);
      if (aIds.length) {
        await tx.response.deleteMany({ where: { assignmentId: { in: aIds } } });
        await tx.assignment.deleteMany({ where: { id: { in: aIds } } });
      }

      // 3. Delete goals (onDelete: Cascade handles it but be explicit in case of constraint issues)
      await tx.goal.deleteMany({ where: { userId: params.id } });

      // 4. Nullify audit log references to preserve history but allow delete
      await tx.auditLog.updateMany({
        where: { actorId: params.id },
        data: { actorId: null },
      });

      // 5. Delete the user
      await tx.user.delete({ where: { id: params.id } });
    });
  } catch (e: any) {
    console.error("DELETE user failed:", e);
    console.error("[API_ERROR]", e); return new NextResponse("Delete failed. The record may have related data that prevents deletion.", { status: 500 });
  }

  await audit(u.id, "DELETE_USER", "User", params.id, { email: target.email });
  return NextResponse.json({ ok: true });
}
