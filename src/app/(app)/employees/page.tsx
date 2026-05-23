import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { EmployeesGrid } from "@/components/EmployeesGrid";
import { mergeDepartments } from "@/lib/companies";

export default async function EmployeesPage() {
  await requireRole("HR_ADMIN");
  const [users, dbDepts] = await Promise.all([
    db.user.findMany({
      orderBy: { firstName: "asc" },
      include: {
        manager: true,
        assignmentsAsEmployee: { select: { id: true, overallScore: true, state: true, createdAt: true } },
      },
    }),
    db.department.findMany({ orderBy: [{ company: "asc" }, { sortOrder: "asc" }, { name: "asc" }] }),
  ]);
  const employees = users.map((u) => {
    const completed = u.assignmentsAsEmployee.filter((a) => a.state === "FINALIZED" && a.overallScore != null);
    const latest = completed.sort((a, b) => +b.createdAt - +a.createdAt)[0];
    return {
      id: u.id, firstName: u.firstName, lastName: u.lastName,
      position: u.position, company: u.company, department: u.department, role: u.role,
      employmentType: u.employmentType,
      managerName: u.manager ? `${u.manager.firstName} ${u.manager.lastName}` : null,
      managerPosition: u.manager?.position ?? null,
      evalCount: u.assignmentsAsEmployee.length,
      latestScore: latest?.overallScore ?? null,
      profilePicture: u.profilePicture ?? null,
    };
  });
  const managers = users.filter((u) => u.role !== "EMPLOYEE").map((u) => ({
    id: u.id, name: `${u.firstName} ${u.lastName}`, position: u.position,
  }));
  const departmentsByCompany = mergeDepartments(dbDepts.map((d) => ({ company: d.company, name: d.name })));
  return <EmployeesGrid initial={employees} managers={managers} departmentsByCompany={departmentsByCompany} />;
}
