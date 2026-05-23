import { requireUser } from "@/lib/rbac";
import { db } from "@/lib/db";
import { HRDashboard } from "@/components/HRDashboard";
import { AssignmentTable } from "@/components/AssignmentTable";
import { PendingBanner } from "@/components/PendingBanner";
import { PageHeader } from "@/components/PageHeader";
import { AnniversariesWidget, DueThisWeekWidget } from "@/components/DashboardWidgets";
import { getFlightRisks, getProbationAlerts } from "@/lib/insights";

function fmt(d: Date) { return d.toLocaleDateString(); }
function bannerItem(a: any, label: string) {
  const due = new Date(a.cycle.dueDate);
  return { id: a.id, label, due: fmt(due), overdue: due < new Date() };
}

/** Find users whose hireDate anniversary falls within the next 7 days. */
async function getAnniversaries() {
  const users = await db.user.findMany({
    where: { hireDate: { not: null }, role: { in: ["EMPLOYEE", "MANAGER"] } },
    select: { id: true, firstName: true, lastName: true, position: true, hireDate: true },
  });
  const now = new Date();
  const horizon = new Date(now.getTime() + 7 * 86400000);
  const upcoming: { id: string; name: string; position: string | null; date: Date; years: number }[] = [];
  for (const u of users) {
    if (!u.hireDate) continue;
    const yearsSoFar = now.getFullYear() - u.hireDate.getFullYear();
    if (yearsSoFar < 1) continue;
    const thisYear = new Date(u.hireDate);
    thisYear.setFullYear(now.getFullYear());
    const next = thisYear < new Date(now.getTime() - 86400000)
      ? new Date(thisYear.setFullYear(now.getFullYear() + 1))
      : thisYear;
    if (next >= now && next <= horizon) {
      upcoming.push({
        id: u.id, name: `${u.firstName} ${u.lastName}`, position: u.position,
        date: next, years: next.getFullYear() - u.hireDate.getFullYear(),
      });
    }
  }
  return upcoming.sort((a, b) => +a.date - +b.date).slice(0, 6);
}

function dueItems(assignments: any[]) {
  const now = new Date();
  const horizon = new Date(now.getTime() + 7 * 86400000);
  return assignments
    .filter((a) => a.state !== "FINALIZED")
    .map((a) => {
      const due = new Date(a.cycle.dueDate);
      const days = Math.round((due.getTime() - now.getTime()) / 86400000);
      return { id: a.id, label: `${a.employee.firstName} ${a.employee.lastName} · ${a.cycle.name}`, due, days };
    })
    .filter((x) => x.due <= horizon)
    .sort((a, b) => a.days - b.days)
    .slice(0, 6);
}

export default async function Dashboard({ searchParams }: { searchParams: { error?: string } }) {
  const u = await requireUser();
  const errorMsg =
    searchParams.error === "assignment-deleted"
      ? "✓ The evaluation was deleted successfully."
      : searchParams.error === "assignment-not-found"
      ? "⚠ We couldn't open that PMF. A few common reasons: (1) it may have been deleted by HR, (2) it may be assigned to someone else and you don't have access, (3) the link may be from a previous cycle that was archived, or (4) sample data may have been reset. If you believe this is a mistake, please contact HR."
      : null;

  if (u.role === "HR_ADMIN") {
    const [assignments, allUsers] = await Promise.all([
      db.assignment.findMany({
        include: { employee: true, manager: true, cycle: true, template: true },
        orderBy: { createdAt: "desc" },
      }),
      db.user.count(),
    ]);
    const completed = assignments.filter((a) => a.state === "FINALIZED");
    const scores = completed.map((a) => a.overallScore).filter((s): s is number => s != null);
    const teamAvg = scores.length ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)) : null;

    // Distribution buckets
    const dist: Record<string, number> = { "1.0-2.0": 0, "2.0-3.0": 0, "3.0-3.5": 0, "3.5-4.0": 0, "4.0-4.5": 0, "4.5-5.0": 0 };
    for (const s of scores) {
      if (s < 2) dist["1.0-2.0"]++;
      else if (s < 3) dist["2.0-3.0"]++;
      else if (s < 3.5) dist["3.0-3.5"]++;
      else if (s < 4) dist["3.5-4.0"]++;
      else if (s < 4.5) dist["4.0-4.5"]++;
      else dist["4.5-5.0"]++;
    }

    // Trend by cycle
    const byCycle: Record<string, number[]> = {};
    for (const a of completed) {
      if (a.overallScore == null) continue;
      (byCycle[a.cycle.name] ??= []).push(a.overallScore);
    }
    const trends = Object.entries(byCycle).sort().map(([period, arr]) => ({
      period,
      overall: Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)),
    }));

    // Top performers
    const topPerformers = [...completed]
      .filter((a) => a.overallScore != null)
      .sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0))
      .slice(0, 5)
      .map((a) => ({
        id: a.employeeId,
        name: `${a.employee.firstName} ${a.employee.lastName}`,
        position: a.employee.department ?? "—",
        score: a.overallScore!,
      }));

    const hrPending = assignments
      .filter((a) => a.state === "HR_REVIEW")
      .map((a) => bannerItem(a, `${a.employee.firstName} ${a.employee.lastName} · ${a.cycle.name} · awaiting your approval`));

    const anniversaries = await getAnniversaries();
    const dueSoon = dueItems(assignments);
    const flightRisks = await getFlightRisks();
    const probationAlerts = await getProbationAlerts();

    return (
      <>
        {errorMsg && <div className="card mb-4 border-amber-300 bg-amber-50 text-amber-800 text-sm">{errorMsg}</div>}
      <HRDashboard
        totalEmployees={allUsers}
        totalEvaluations={assignments.length}
        completedEvaluations={completed.length}
        teamAverage={teamAvg}
        distribution={dist}
        trends={trends}
        topPerformers={topPerformers}
        assignments={JSON.parse(JSON.stringify(assignments))}
        pending={hrPending}
        anniversaries={anniversaries}
        dueSoon={dueSoon}
        flightRisks={JSON.parse(JSON.stringify(flightRisks))}
        probationAlerts={JSON.parse(JSON.stringify(probationAlerts))}
      />
      </>
    );
  }

  if (u.role === "MANAGER") {
    const [teamAssignments, ownAssignments] = await Promise.all([
      db.assignment.findMany({
        where: { managerId: u.id },
        include: { employee: true, cycle: true, template: true, manager: true },
        orderBy: { createdAt: "desc" },
      }),
      db.assignment.findMany({
        where: { employeeId: u.id },
        include: { employee: true, cycle: true, template: true, manager: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    const pending = teamAssignments.filter((a) => a.state === "MANAGER_REVIEW").length;
    const done = teamAssignments.filter((a) => a.state === "FINALIZED").length;
    const ownPending = ownAssignments.filter((a) => a.state === "SELF_ASSESS").length;

    return (
      <div>
        {errorMsg && <div className="card mb-4 border-amber-300 bg-amber-50 text-amber-800 text-sm">{errorMsg}</div>}
        <PageHeader title="Manager Dashboard" subtitle="Your team's evaluations and your own performance reviews" />
        <PendingBanner
          action="evaluate these team members now"
          items={teamAssignments
            .filter((a) => a.state === "MANAGER_REVIEW")
            .map((a) => bannerItem(a, `${a.employee.firstName} ${a.employee.lastName} · ${a.cycle.name} (${a.template.name})`))}
        />
        {ownPending > 0 && (
          <PendingBanner
            action="complete your own self-assessment"
            items={ownAssignments
              .filter((a) => a.state === "SELF_ASSESS")
              .map((a) => bannerItem(a, `${a.cycle.name} · ${a.template.name}`))}
          />
        )}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiTile icon="👥" iconBg="bg-blue-50 text-blue-600"     label="Team Size"        value={new Set(teamAssignments.map((a) => a.employeeId)).size} />
          <KpiTile icon="📋" iconBg="bg-purple-50 text-purple-600" label="Team Evaluations" value={teamAssignments.length} sub={`${done} finalized`} />
          <KpiTile icon="⏳" iconBg="bg-amber-50 text-amber-600"    label="Pending My Review" value={pending} sub="awaiting your input" />
          <KpiTile icon="🪞" iconBg="bg-emerald-50 text-emerald-600" label="My Own PMFs"      value={ownAssignments.length} sub="for me to fill out" />
        </div>
        {ownAssignments.length > 0 && (
          <div className="card-flush mb-6">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">🪞 My Own Evaluations</h3>
              <p className="text-xs text-gray-500 mt-0.5">Evaluations assigned to you by your supervisor.</p>
            </div>
            <div className="px-5 py-4">
              <AssignmentTable assignments={JSON.parse(JSON.stringify(ownAssignments))} showManager />
            </div>
          </div>
        )}
        <div className="card-flush">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">👥 Team Evaluations</h3>
            <p className="text-xs text-gray-500 mt-0.5">Direct reports waiting for your review or already complete.</p>
          </div>
          <div className="px-5 py-4">
            <AssignmentTable assignments={JSON.parse(JSON.stringify(teamAssignments))} showEmployee />
          </div>
        </div>
      </div>
    );
  }

  // Employee
  const assignments = await db.assignment.findMany({
    where: { employeeId: u.id },
    include: { manager: true, cycle: true, template: true, employee: true },
    orderBy: { createdAt: "desc" },
  });
  const latest = assignments.find((a) => a.overallScore != null);
  return (
    <div>
      {errorMsg && <div className="card mb-4 border-amber-300 bg-amber-50 text-amber-800 text-sm">{errorMsg}</div>}
      <PageHeader title="My Dashboard" subtitle="Your performance evaluations and feedback history" />
      <PendingBanner
        action="complete your self-assessment"
        items={assignments
          .filter((a) => a.state === "SELF_ASSESS")
          .map((a) => bannerItem(a, `${a.cycle.name} · ${a.template.name}`))}
      />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiTile icon="📋" iconBg="bg-blue-50 text-blue-600"       label="Total PMFs"   value={assignments.length} sub="lifetime" />
        <KpiTile icon="⏳" iconBg="bg-amber-50 text-amber-600"     label="In Progress"  value={assignments.filter((a) => a.state !== "FINALIZED").length} sub="awaiting steps" />
        <KpiTile icon="⭐" iconBg="bg-emerald-50 text-emerald-600" label="Latest Score" value={latest?.overallScore?.toFixed(1) ?? "N/A"} sub="weighted overall" />
      </div>
      <div className="card-flush">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">My Evaluations</h3>
          <p className="text-xs text-gray-500 mt-0.5">All your past and current PMFs.</p>
        </div>
        <div className="px-5 py-4">
          <AssignmentTable assignments={JSON.parse(JSON.stringify(assignments))} showManager />
        </div>
      </div>
    </div>
  );
}

function KpiTile({ icon, iconBg, label, value, sub }: { icon: string; iconBg: string; label: string; value: any; sub?: string }) {
  return (
    <div className="kpi-card">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${iconBg}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5 leading-tight">{value}</p>
          {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}
