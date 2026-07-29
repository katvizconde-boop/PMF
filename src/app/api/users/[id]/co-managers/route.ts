import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

/**
 * GET  /api/users/[id]/co-managers
 *   List all co-managers for this employee. HR + the employee + the primary manager can read.
 *
 * POST /api/users/[id]/co-managers
 *   Add a co-manager. HR_ADMIN only. Body: { managerId, notes? }
 *
 * DELETE /api/users/[id]/co-managers?coManagerId=xxx
 *   Remove a co-manager. HR_ADMIN only.
 */

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const employeeId = params.id;

  // Anyone with access to the employee can read the co-manager list:
  // - HR_ADMIN sees all
  // - Primary manager sees their report's co-managers
  // - Employee sees their own co-managers
  // - Existing co-managers see the team
  const employee = await db.user.findUnique({ where: { id: employeeId } });
  if (!employee) return new NextResponse("Employee not found", { status: 404 });

  if (u.role !== "HR_ADMIN" && u.id !== employeeId && u.id !== employee.managerId) {
    // Check if requester is a co-manager
    const co = await db.coManager.findUnique({
      where: { employeeId_managerId: { employeeId, managerId: u.id } },
    });
    if (!co) return new NextResponse("Forbidden", { status: 403 });
  }

  const coManagers = await db.coManager.findMany({
    where: { employeeId },
    include: {
      manager: { select: { id: true, firstName: true, lastName: true, email: true, position: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ coManagers });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") {
    return new NextResponse("Only HR can assign co-managers.", { status: 403 });
  }
  const employeeId = params.id;
  const body = await req.json().catch(() => ({}));
  const { managerId, notes } = body;

  if (!managerId) return new NextResponse("Missing managerId", { status: 400 });
  if (managerId === employeeId) return new NextResponse("An employee cannot be their own co-manager.", { status: 400 });

  const [employee, mgr] = await Promise.all([
    db.user.findUnique({ where: { id: employeeId } }),
    db.user.findUnique({ where: { id: managerId } }),
  ]);
  if (!employee) return new NextResponse("Employee not found", { status: 404 });
  if (!mgr) return new NextResponse("Co-manager user not found", { status: 404 });

  // Block adding the primary manager as a co-manager (they already have access)
  if (employee.managerId === managerId) {
    return new NextResponse("This user is already the primary manager.", { status: 409 });
  }

  // Recommend that the co-manager is at least a MANAGER role, but don't block — HR's call
  try {
    const created = await db.coManager.create({
      data: {
        employeeId,
        managerId,
        notes: notes?.toString().slice(0, 1000) ?? null,
      },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, email: true, position: true } },
      },
    });
    await audit(u.id, "ADD_CO_MANAGER", "User", employeeId, {
      coManagerId: managerId,
      coManagerEmail: mgr.email,
      employeeEmail: employee.email,
    });
    return NextResponse.json({ ok: true, coManager: created });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return new NextResponse("This user is already a co-manager.", { status: 409 });
    }
    console.error("[API_ERROR]", e);
    return new NextResponse("Could not add co-manager.", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") {
    return new NextResponse("Only HR can remove co-managers.", { status: 403 });
  }
  const employeeId = params.id;
  const url = new URL(req.url);
  const coManagerId = url.searchParams.get("coManagerId");
  if (!coManagerId) return new NextResponse("Missing coManagerId", { status: 400 });

  try {
    const removed = await db.coManager.delete({
      where: { id: coManagerId },
    });
    if (removed.employeeId !== employeeId) {
      return new NextResponse("Mismatch", { status: 400 });
    }
    await audit(u.id, "REMOVE_CO_MANAGER", "User", employeeId, {
      removedManagerId: removed.managerId,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") {
      return new NextResponse("Co-manager assignment not found.", { status: 404 });
    }
    console.error("[API_ERROR]", e);
    return new NextResponse("Could not remove co-manager.", { status: 500 });
  }
}
