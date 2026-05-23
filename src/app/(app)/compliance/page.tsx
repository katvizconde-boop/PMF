import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { ComplianceView } from "@/components/ComplianceView";

export default async function CompliancePage() {
  await requireRole("HR_ADMIN");

  const users = await db.user.findMany({
    where: { role: { in: ["EMPLOYEE", "MANAGER", "HR_ADMIN"] } },
    select: {
      id: true, firstName: true, lastName: true, email: true, position: true,
      role: true, employmentType: true, company: true, department: true,
      hireDate: true, createdAt: true,
      assignmentsAsEmployee: { select: { state: true, finalizedAt: true, template: { select: { type: true } } } },
      pipsAsEmployee: { select: { id: true, status: true, startDate: true, endDate: true } },
      documents: { select: { id: true, type: true } },
    },
    orderBy: [{ company: "asc" }, { firstName: "asc" }],
  });

  const now = new Date();
  const rows = users.map((u) => {
    const tenureDays = u.hireDate ? Math.floor((now.getTime() - u.hireDate.getTime()) / 86400000) : null;
    const yearsService = tenureDays != null ? Number((tenureDays / 365.25).toFixed(2)) : null;
    const probEvalsFinalized = u.assignmentsAsEmployee.filter((a) => a.state === "FINALIZED" && a.template.type === "PROBATIONARY").length;
    const regEvalsFinalized = u.assignmentsAsEmployee.filter((a) => a.state === "FINALIZED" && a.template.type === "REGULAR").length;
    const activePIP = u.pipsAsEmployee.find((p) => p.status === "ACTIVE");
    const certs = u.documents.filter((d) => d.type === "CERTIFICATE").length;
    const contracts = u.documents.filter((d) => d.type === "CONTRACT").length;

    let probationStatus: string | null = null;
    if (u.employmentType === "PROBATIONARY" && u.hireDate) {
      const end = new Date(u.hireDate);
      end.setMonth(end.getMonth() + 6);
      const days = Math.round((end.getTime() - now.getTime()) / 86400000);
      probationStatus = days < 0 ? `Overdue ${-days}d` : `${days}d remaining`;
    }

    return {
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      position: u.position,
      role: u.role,
      employmentType: u.employmentType,
      company: u.company,
      department: u.department,
      hireDate: u.hireDate?.toISOString() ?? null,
      tenureDays,
      yearsService,
      regEvalsFinalized,
      probEvalsFinalized,
      probationStatus,
      activePIP: !!activePIP,
      contracts,
      certs,
    };
  });

  return <ComplianceView rows={rows} />;
}
