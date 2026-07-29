import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { db } from "./db";
import { redirect } from "next/navigation";

export type Role = "HR_ADMIN" | "MANAGER" | "EMPLOYEE";

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return {
    id: (session.user as any).id as string,
    email: session.user.email!,
    name: session.user.name!,
    role: (session.user as any).role as Role,
  };
}

export async function requireUser() {
  const u = await getSessionUser();
  if (!u) redirect("/login");
  return u;
}

export async function requireRole(...roles: Role[]) {
  const u = await requireUser();
  if (!roles.includes(u.role)) redirect("/dashboard");
  return u;
}

/** Check if user may access a specific assignment.
 *  Access matrix:
 *    HR_ADMIN  → all assignments
 *    MANAGER   → primary manager OR HR-added co-manager of the employee
 *    EMPLOYEE  → their own assignment
 *
 *  Anyone (including HR/manager) can open their OWN self-assessment.
 *  Same-department peers do NOT auto-share access — HR must wire an
 *  explicit co-manager link when two leads should collaborate.
 */
export async function canAccessAssignment(userId: string, role: Role, assignmentId: string) {
  const a = await db.assignment.findUnique({ where: { id: assignmentId } });
  if (!a) return null;
  if (role === "HR_ADMIN") return a;
  // Anyone can open their own PMF regardless of role
  if (a.employeeId === userId) return a;
  if (role === "MANAGER") {
    // 1) Assignment.managerId — set when the PMF was created
    if (a.managerId === userId) return a;
    // 2) HR-added co-manager on the CoManager table
    const isCoManager = await db.coManager.findUnique({
      where: { employeeId_managerId: { employeeId: a.employeeId, managerId: userId } },
    });
    if (isCoManager) return a;
    // 3) CURRENT primary manager on the employee's User record.
    //    Handles the common case where HR reassigned the employee to a new
    //    manager AFTER the PMF was created — User.managerId is updated but
    //    Assignment.managerId stays stale for historic accuracy of who was
    //    listed at cycle start. Grant access to the CURRENT primary manager
    //    so they can actually evaluate their team.
    const emp = await db.user.findUnique({
      where: { id: a.employeeId }, select: { managerId: true },
    });
    if (emp?.managerId === userId) return a;
  }
  return null;
}

/** Employees this user can manage: primary reports + HR-added co-managed. */
export async function getManagedEmployeeIds(managerId: string): Promise<string[]> {
  const [reports, coManaged] = await Promise.all([
    db.user.findMany({ where: { managerId }, select: { id: true } }),
    db.coManager.findMany({ where: { managerId }, select: { employeeId: true } }),
  ]);
  const ids = new Set<string>([
    ...reports.map((r) => r.id),
    ...coManaged.map((c) => c.employeeId),
  ]);
  return Array.from(ids);
}

/** True if this user is the primary manager or an HR-added co-manager. */
export async function isManagerOf(managerId: string, employeeId: string): Promise<boolean> {
  const employee = await db.user.findUnique({
    where: { id: employeeId }, select: { managerId: true },
  });
  if (employee?.managerId === managerId) return true;
  const co = await db.coManager.findUnique({
    where: { employeeId_managerId: { employeeId, managerId } },
  });
  return !!co;
}
