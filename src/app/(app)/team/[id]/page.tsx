import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser, isManagerOf } from "@/lib/rbac";
import { db } from "@/lib/db";
import { OneOnOnesSection } from "@/components/OneOnOnesSection";
import { GoalsSection } from "@/components/GoalsSection";
import { CareerPathSection } from "@/components/CareerPathSection";
import { PageHeader } from "@/components/PageHeader";
import { companyChipClass, companyLogoPath } from "@/lib/companies";
import { Icon } from "@/components/Icons";
import { ratingClass, stateColor } from "@/lib/ui";

export default async function TeamMemberPage({ params }: { params: { id: string } }) {
  const viewer = await requireUser();
  if (viewer.role === "EMPLOYEE") redirect("/dashboard");

  const ok = viewer.role === "HR_ADMIN" || await isManagerOf(viewer.id, params.id);
  if (!ok) redirect("/dashboard?error=assignment-not-found");

  const u = await db.user.findUnique({
    where: { id: params.id },
    include: {
      manager: true,
      assignmentsAsEmployee: {
        include: { cycle: true, template: { select: { id: true, name: true, type: true } }, manager: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!u) redirect("/dashboard?error=assignment-not-found");

  const cycles = await db.cycle.findMany({ orderBy: { periodStart: "desc" }, select: { id: true, name: true } });

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="text-primary-600 text-sm hover:underline">← Back to Dashboard</Link>

      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{u.firstName} {u.lastName}</h1>
            <p className="text-gray-600">{u.position ?? "—"} · {u.department ?? "—"}</p>
            <p className="text-sm text-gray-500 mt-1">
              Supervisor: {u.manager ? `${u.manager.firstName} ${u.manager.lastName}${u.manager.position ? ` (${u.manager.position})` : ""}` : "—"}
            </p>
            <div className="flex gap-2 mt-2 flex-wrap items-center">
              {u.company && companyLogoPath(u.company) && (
                <img src={companyLogoPath(u.company)!} alt="" style={{ height: 22, width: "auto", maxWidth: 90, objectFit: "contain" }} className="mr-1" />
              )}
              {u.company && <span className={`chip ${companyChipClass(u.company)}`}>{u.company}</span>}
              <span className="chip bg-gray-100 text-gray-700">{u.employmentType}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1:1 Notes — the main reason managers come here */}
      <OneOnOnesSection employeeId={u.id} currentUserCanEdit={true} />

      {/* Career path read/edit */}
      <CareerPathSection employeeId={u.id} canEdit={true} />

      {/* Goals */}
      <GoalsSection employeeId={u.id} cycles={cycles} canRate={true} canAdd={true} />

      {/* Past evaluations */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-gray-800 inline-flex items-center gap-2"><Icon.Clipboard size={18} /> Evaluations</h2>
        </div>
        {u.assignmentsAsEmployee.length === 0 ? (
          <div className="card text-center py-10 text-gray-400 text-sm">No evaluations yet.</div>
        ) : (
          <div className="space-y-2">
            {u.assignmentsAsEmployee.map((a: any) => (
              <div key={a.id} className="card flex items-center justify-between hover:shadow-md transition">
                <div>
                  <div className="font-semibold text-gray-800">{a.cycle.name}</div>
                  <div className="text-sm text-gray-500">{a.template.name} · Reviewed by {a.manager.firstName} {a.manager.lastName}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`chip ${stateColor(a.state)}`}>{a.state.replace("_", " ")}</span>
                  {a.overallScore != null && <span className={`rating-pill ${ratingClass(a.overallScore)}`}>{a.overallScore.toFixed(1)}</span>}
                  <Link href={`/assignments/${a.id}`} className="btn btn-secondary text-xs">Open PMF</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
