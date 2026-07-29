import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { RecommendationsDashboard } from "@/components/RecommendationsDashboard";

export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams: { cycleId?: string; company?: string; rec?: string };
}) {
  await requireRole("HR_ADMIN");

  const cycles = await db.cycle.findMany({
    orderBy: { periodStart: "desc" },
    select: { id: true, name: true },
  });
  const activeCycleId = searchParams.cycleId ?? cycles[0]?.id ?? null;

  const where: any = { privateRecommendation: { not: null } };
  if (activeCycleId) where.cycleId = activeCycleId;
  if (searchParams.company) where.employee = { company: searchParams.company };
  if (searchParams.rec) where.privateRecommendation = searchParams.rec;

  const items = await db.assignment.findMany({
    where,
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, email: true, company: true, department: true, position: true, employmentType: true } },
      manager: { select: { id: true, firstName: true, lastName: true, email: true } },
      cycle: { select: { id: true, name: true } },
      template: { select: { name: true, type: true } },
    },
    orderBy: { managerSubmittedAt: "desc" },
  });

  // Counts across the active cycle (ignore other filters so the chips behave like a summary)
  const cycleRows = activeCycleId
    ? await db.assignment.findMany({
        where: { cycleId: activeCycleId, privateRecommendation: { not: null } },
        select: { privateRecommendation: true, employee: { select: { company: true } } },
      })
    : [];

  const countsByRec: Record<string, number> = {};
  const countsByCompany: Record<string, number> = {};
  for (const r of cycleRows) {
    const k = r.privateRecommendation!;
    countsByRec[k] = (countsByRec[k] ?? 0) + 1;
    const c = r.employee?.company ?? "—";
    countsByCompany[c] = (countsByCompany[c] ?? 0) + 1;
  }

  const companies = Array.from(new Set(items.map((i) => i.employee.company).filter(Boolean))) as string[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manager Recommendations"
        subtitle="Confidential recommendations submitted by managers during evaluation. Visible to HR only."
      />
      <RecommendationsDashboard
        items={JSON.parse(JSON.stringify(items))}
        cycles={cycles}
        companies={companies}
        countsByRec={countsByRec}
        countsByCompany={countsByCompany}
        activeCycleId={activeCycleId}
        activeCompany={searchParams.company ?? ""}
        activeRec={searchParams.rec ?? ""}
      />
    </div>
  );
}
