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

/** Check if user may access a specific assignment. */
export async function canAccessAssignment(userId: string, role: Role, assignmentId: string) {
  const a = await db.assignment.findUnique({ where: { id: assignmentId } });
  if (!a) return null;
  if (role === "HR_ADMIN") return a;
  if (role === "MANAGER" && a.managerId === userId) return a;
  if (role === "EMPLOYEE" && a.employeeId === userId) return a;
  return null;
}
