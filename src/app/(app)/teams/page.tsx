import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { TeamsOverview } from "@/components/TeamsOverview";

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: { company?: string; q?: string };
}) {
  await requireRole("HR_ADMIN");

  const [users, coManagers] = await Promise.all([
    db.user.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true, firstName: true, lastName: true, email: true, role: true,
        company: true, department: true, position: true, employmentType: true,
        managerId: true,
      },
    }),
    db.coManager.findMany({
      include: {
        manager:  { select: { id: true, firstName: true, lastName: true } },
        employee: { select: { id: true, firstName: true, lastName: true, position: true, company: true, department: true } },
      },
    }),
  ]);

  const companies = Array.from(new Set(users.map((u) => u.company).filter(Boolean))) as string[];

  const managers = users.filter((u) => u.role === "MANAGER" || u.role === "HR_ADMIN");

  const teams = managers.map((m) => {
    const directReports = users.filter((u) => u.managerId === m.id);
    const coManaged = coManagers
      .filter((c) => c.manager.id === m.id)
      .map((c) => ({
        id: c.employee.id,
        firstName: c.employee.firstName,
        lastName: c.employee.lastName,
        position: c.employee.position,
        company: c.employee.company,
        department: c.employee.department,
      }));
    return {
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email,
      role: m.role,
      company: m.company,
      department: m.department,
      position: m.position,
      directReports: directReports.map((r) => ({
        id: r.id, firstName: r.firstName, lastName: r.lastName,
        position: r.position, employmentType: r.employmentType,
        company: r.company, department: r.department, role: r.role,
      })),
      coManaged,
    };
  });

  // Employees with no primary manager (data hygiene)
  const orphans = users.filter((u) => !u.managerId && u.role !== "HR_ADMIN");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams & Reporting Structure"
        subtitle="See every manager and who reports to them. Includes co-managed employees and flags anyone without a primary manager."
      />
      <TeamsOverview
        teams={JSON.parse(JSON.stringify(teams))}
        orphans={JSON.parse(JSON.stringify(orphans))}
        companies={companies}
        activeCompany={searchParams.company ?? ""}
        activeQuery={searchParams.q ?? ""}
      />
    </div>
  );
}
