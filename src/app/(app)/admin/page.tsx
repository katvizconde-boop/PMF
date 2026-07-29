import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { AdminTools } from "@/components/AdminTools";
import { BulkWelcomeTool } from "@/components/BulkWelcomeTool";
import { ResetTrialDataTool } from "@/components/ResetTrialDataTool";
import { UnlockUserTool } from "@/components/UnlockUserTool";
import { BulkResetPasswordTool } from "@/components/BulkResetPasswordTool";
import { BulkReassignManagerTool } from "@/components/BulkReassignManagerTool";
import { BulkAddCoManagerTool } from "@/components/BulkAddCoManagerTool";
import { DepartmentManager } from "@/components/DepartmentManager";
import { COMPANIES, DEPARTMENTS_BY_COMPANY, mergeDepartments } from "@/lib/companies";
import { PageHeader } from "@/components/PageHeader";

export default async function AdminPage() {
  await requireRole("HR_ADMIN");
  const [users, cycles, audits, templates, dbDepts] = await Promise.all([
    db.user.findMany({ orderBy: { createdAt: "asc" } }),
    db.cycle.findMany({ include: { _count: { select: { assignments: true } } }, orderBy: { periodStart: "desc" } }),
    db.auditLog.findMany({ take: 25, orderBy: { createdAt: "desc" }, include: { actor: true } }),
    db.template.findMany({ where: { isActive: true } }),
    db.department.findMany({ orderBy: [{ company: "asc" }, { sortOrder: "asc" }, { name: "asc" }] }),
  ]);
  const departments = Array.from(new Set(users.map((u) => u.department).filter(Boolean))) as string[];

  // Data for the bulk-reassign tool
  const managerRows = users.filter((x) => x.role === "MANAGER" || x.role === "HR_ADMIN");
  const managerMap = new Map(users.map((x) => [x.id, `${x.firstName} ${x.lastName}`]));
  const reassignEmployees = users
    .map((x) => ({
      id: x.id,
      firstName: x.firstName,
      lastName: x.lastName,
      email: x.email,
      role: x.role,
      company: x.company,
      department: x.department,
      position: x.position,
      managerId: x.managerId,
      managerName: x.managerId ? managerMap.get(x.managerId) ?? null : null,
    }));
  const reassignManagers = managerRows.map((m) => ({
    id: m.id,
    name: `${m.firstName} ${m.lastName}`,
    company: m.company,
    department: m.department,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Settings" subtitle="Manage cycles, departments, bulk operations, and view audit history" />

      <AdminTools
        templates={templates.map((t) => ({ id: t.id, name: t.name, type: t.type }))}
        cycles={cycles.map((c) => ({ id: c.id, name: c.name }))}
        departments={departments}
      />

      <UnlockUserTool />

      <BulkResetPasswordTool companies={[...COMPANIES]} />

      <BulkReassignManagerTool
        managers={reassignManagers}
        employees={reassignEmployees}
        companies={[...COMPANIES]}
      />

      <BulkAddCoManagerTool
        managers={reassignManagers}
        employees={reassignEmployees}
        companies={[...COMPANIES]}
      />

      <BulkWelcomeTool />

      <ResetTrialDataTool />

      <DepartmentManager
        companies={[...COMPANIES]}
        defaultDepts={DEPARTMENTS_BY_COMPANY}
        dbDepts={dbDepts.map((d) => ({ id: d.id, company: d.company, name: d.name }))}
      />

      <div className="card">
        <h3 className="section-header">Users</h3>
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b">
              <th className="py-2 font-medium">Name</th><th className="font-medium">Email</th><th className="font-medium">Role</th><th className="font-medium">Type</th><th className="font-medium">Dept</th>
            </tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2">{u.firstName} {u.lastName}</td>
                  <td>{u.email}</td><td>{u.role}</td><td>{u.employmentType}</td><td>{u.department}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 className="section-header">Evaluation Cycles</h3>
        {cycles.map((c) => (
          <div key={c.id} className="flex justify-between text-sm py-1.5">
            <span>{c.name} ({new Date(c.periodStart).toLocaleDateString()} — {new Date(c.periodEnd).toLocaleDateString()})</span>
            <span className="text-gray-500">{c._count.assignments} assignments · due {new Date(c.dueDate).toLocaleDateString()}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="section-header">Recent Audit Log</h3>
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b">
              <th className="py-2 font-medium">When</th><th className="font-medium">Actor</th><th className="font-medium">Action</th><th className="font-medium">Resource</th>
            </tr></thead>
            <tbody>
              {audits.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2">{new Date(a.createdAt).toLocaleString()}</td>
                  <td>{a.actor ? `${a.actor.firstName} ${a.actor.lastName}` : "—"}</td>
                  <td><code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{a.action}</code></td>
                  <td className="text-xs text-gray-500">{a.resourceType}:{a.resourceId?.slice(0, 8)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
