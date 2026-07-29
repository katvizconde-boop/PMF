import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";

// HR-only diagnostic: GET /api/admin/diag-user?q=name-or-email
export async function GET(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q) return new NextResponse("Pass ?q=name-or-email", { status: 400 });

  const users = await db.user.findMany({
    where: {
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName:  { contains: q, mode: "insensitive" } },
        { email:     { contains: q, mode: "insensitive" } },
      ],
    },
    include: { manager: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });

  const out: any[] = [];
  for (const usr of users) {
    const reports = await db.user.findMany({
      where: { managerId: usr.id },
      select: { firstName: true, lastName: true, email: true, company: true, department: true },
    });
    const co = await db.coManager.findMany({
      where: { managerId: usr.id },
      include: { employee: { select: { firstName: true, lastName: true, email: true } } },
    });
    const asMgr = await db.assignment.findMany({
      where: { managerId: usr.id },
      include: { employee: { select: { firstName: true, lastName: true } }, cycle: { select: { name: true } } },
    });
    const asEmp = await db.assignment.findMany({
      where: { employeeId: usr.id },
      include: { manager: { select: { firstName: true, lastName: true } }, cycle: { select: { name: true } } },
    });
    out.push({
      id: usr.id,
      name: `${usr.firstName} ${usr.lastName}`,
      email: usr.email,
      role: usr.role,
      company: usr.company,
      department: usr.department,
      employmentType: usr.employmentType,
      manager: usr.manager ? `${usr.manager.firstName} ${usr.manager.lastName} <${usr.manager.email}>` : null,
      managerId: usr.managerId,
      // login-fail diagnostics
      mustChangePassword: (usr as any).mustChangePassword ?? null,
      failedLoginCount: (usr as any).failedLoginCount ?? null,
      lockedUntil: (usr as any).lockedUntil ?? null,
      hasPasswordHash: !!(usr as any).passwordHash,
      directReports: reports.map((r) => ({ name: `${r.firstName} ${r.lastName}`, email: r.email, company: r.company, department: r.department })),
      coManaged: co.map((c) => ({ name: `${c.employee.firstName} ${c.employee.lastName}`, email: c.employee.email })),
      assignmentsAsManager: asMgr.map((a) => ({ id: a.id, cycle: a.cycle.name, employee: `${a.employee.firstName} ${a.employee.lastName}`, state: a.state })),
      assignmentsAsEmployee: asEmp.map((a) => ({ id: a.id, cycle: a.cycle.name, manager: `${a.manager.firstName} ${a.manager.lastName}`, state: a.state })),
    });
  }

  return NextResponse.json({ found: out.length, users: out });
}
