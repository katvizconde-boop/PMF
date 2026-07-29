import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, isManagerOf } from "@/lib/rbac";
import { audit } from "@/lib/auth";
import { notifyMany } from "@/lib/notifications";

/**
 * POST /api/team/remove-member
 * A manager reports that an employee on their dashboard is NOT actually theirs.
 * Body: { employeeId: string, reason?: string }
 *
 * Behavior:
 *  - Verify the caller is the primary manager OR a co-manager of this employee.
 *  - If PRIMARY manager: clear employeeId's managerId (they land in HR "orphans" list),
 *    also clear open-PMF managerId to null so they disappear from the manager's dashboard.
 *  - If CO-MANAGER: delete the CoManager link only. Primary manager unchanged.
 *  - Audit-log the action and send an in-app notification to every HR admin.
 */
export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  if (u.role !== "MANAGER") {
    return new NextResponse("Only managers can flag misassignments.", { status: 403 });
  }

  const { employeeId, reason } = await req.json().catch(() => ({} as any));
  if (!employeeId) return new NextResponse("Missing employeeId", { status: 400 });

  const employee = await db.user.findUnique({ where: { id: employeeId } });
  if (!employee) return new NextResponse("Employee not found", { status: 404 });

  // Verify caller has any manager relationship with this employee
  if (!(await isManagerOf(u.id, employeeId))) {
    return new NextResponse("You are not a manager of this employee.", { status: 403 });
  }

  const cleanReason = typeof reason === "string" ? reason.trim().slice(0, 500) : null;

  // Figure out WHY this manager currently sees the employee:
  //  - PRIMARY: they're on User.managerId
  //  - CO_MANAGER: they have an HR-set CoManager row
  //  - DEPARTMENT: neither of the above — they see it via the same-department rule
  let linkType: "PRIMARY" | "CO_MANAGER" | "DEPARTMENT" = "DEPARTMENT";
  if (employee.managerId === u.id) {
    linkType = "PRIMARY";
  } else {
    const co = await db.coManager.findUnique({
      where: { employeeId_managerId: { employeeId, managerId: u.id } },
    });
    if (co) linkType = "CO_MANAGER";
  }

  try {
    if (linkType === "PRIMARY") {
      // Move employee to orphan state so HR can reassign
      await db.user.update({ where: { id: employeeId }, data: { managerId: null } });
    } else if (linkType === "CO_MANAGER") {
      await db.coManager.delete({
        where: { employeeId_managerId: { employeeId, managerId: u.id } },
      });
    }
    // For DEPARTMENT: nothing to delete. Log + notify HR only so HR can move the
    // employee to a different department, or wire an explicit co-manager elsewhere.
  } catch (e: any) {
    console.error("[REMOVE_MEMBER]", e);
    return new NextResponse(
      "Could not update this team assignment. Please ask HR to reassign in Admin → Bulk Reassign Manager.",
      { status: 500 }
    );
  }

  await audit(u.id, "MANAGER_FLAGGED_MISASSIGNMENT", "User", employeeId, {
    linkType,
    reason: cleanReason,
    managerEmail: u.email,
    employeeEmail: employee.email,
  });

  // Notify every HR admin so they can reassign
  const hrAdmins = await db.user.findMany({ where: { role: "HR_ADMIN" }, select: { id: true } });
  notifyMany(hrAdmins.map((h) => h.id), {
    type: "MISASSIGNED_MEMBER_REPORT",
    title: `${u.name} flagged an incorrect team assignment`,
    body: `${employee.firstName} ${employee.lastName} was ${
      linkType === "PRIMARY" ? "removed from" :
      linkType === "CO_MANAGER" ? "unlinked as co-manager from" :
      "flagged as not belonging to"
    } ${u.name}${
      linkType === "DEPARTMENT" ? " (visible only via department auto-grant — needs department/team fix)" : ""
    }${cleanReason ? ` — reason: ${cleanReason}` : ""}. Please reassign.`,
    link: `/teams`,
  }).catch(() => {});

  return NextResponse.json({ ok: true, linkType });
}
