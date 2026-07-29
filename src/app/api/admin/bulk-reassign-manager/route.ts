import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

/**
 * POST /api/admin/bulk-reassign-manager
 * HR_ADMIN only. Reassign multiple employees to a single primary manager.
 * Body: { managerId: string, employeeIds: string[] }
 *
 * Also updates any open (non-finalized) PMF assignments so the manager view
 * matches. Finalized PMFs are left alone — historic assignments preserved.
 */
export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Not signed in — session expired. Please log out and log in again.", { status: 401 });
  if (u.role !== "HR_ADMIN") return new NextResponse(`Only HR can reassign managers (your role: ${u.role}).`, { status: 403 });

  const { managerId, employeeIds } = await req.json().catch(() => ({} as any));
  if (!managerId) return new NextResponse("Missing managerId", { status: 400 });
  if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
    return new NextResponse("Provide at least one employeeId", { status: 400 });
  }

  const mgr = await db.user.findUnique({ where: { id: managerId } });
  if (!mgr) return new NextResponse("Manager not found", { status: 404 });
  if (mgr.role !== "MANAGER" && mgr.role !== "HR_ADMIN") {
    return new NextResponse("Selected user is not a MANAGER or HR_ADMIN.", { status: 400 });
  }

  // Prevent self-manage
  const filteredIds = employeeIds.filter((id: string) => id !== managerId);
  if (filteredIds.length === 0) return new NextResponse("No employees to update.", { status: 400 });

  // Update User.managerId
  const result = await db.user.updateMany({
    where: { id: { in: filteredIds } },
    data: { managerId },
  });

  // Also rewire non-finalized PMF assignments so the manager view is consistent
  const openAssignments = await db.assignment.updateMany({
    where: { employeeId: { in: filteredIds }, state: { not: "FINALIZED" } },
    data: { managerId },
  });

  await audit(u.id, "BULK_REASSIGN_MANAGER", "User", "bulk", {
    managerId, managerEmail: mgr.email, employeeIds: filteredIds,
    usersUpdated: result.count, assignmentsUpdated: openAssignments.count,
  });

  return NextResponse.json({
    ok: true,
    usersUpdated: result.count,
    assignmentsUpdated: openAssignments.count,
    manager: `${mgr.firstName} ${mgr.lastName}`,
  });
}
