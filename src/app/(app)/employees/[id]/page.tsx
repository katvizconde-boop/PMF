import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole, getSessionUser } from "@/lib/rbac";
import { db } from "@/lib/db";
import { EmployeeDetail } from "@/components/EmployeeDetail";

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  await requireRole("HR_ADMIN");
  const u = await db.user.findUnique({
    where: { id: params.id },
    include: {
      manager: true,
      assignmentsAsEmployee: { include: { cycle: true, template: { select: { id: true, name: true, type: true } }, manager: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!u) redirect("/employees?error=not-found");

  const allUsers = await db.user.findMany({ where: { role: { in: ["MANAGER", "HR_ADMIN"] } }, orderBy: { firstName: "asc" } });
  const templates = await db.template.findMany({ where: { isActive: true } });
  const cycles = await db.cycle.findMany({ orderBy: { periodStart: "desc" } });

  return (
    <EmployeeDetail
      user={JSON.parse(JSON.stringify(u))}
      managers={allUsers.map((m) => ({ id: m.id, name: `${m.firstName} ${m.lastName}`, position: m.position }))}
      templates={templates.map((t) => ({ id: t.id, name: t.name, type: t.type }))}
      cycles={cycles.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
