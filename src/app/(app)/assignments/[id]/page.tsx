import { redirect } from "next/navigation";
import { requireUser, canAccessAssignment } from "@/lib/rbac";
import { db } from "@/lib/db";
import { EvaluationForm } from "@/components/EvaluationForm";
import { ratingClass, stateColor } from "@/lib/ui";
import { getScoreBreakdown } from "@/lib/scoring";
import { StatusTimeline } from "@/components/StatusTimeline";
import { DeleteAssignmentButton } from "@/components/DeleteAssignmentButton";

export default async function AssignmentPage({ params }: { params: { id: string } }) {
  const u = await requireUser();
  const a = await canAccessAssignment(u.id, u.role, params.id);
  if (!a) redirect("/dashboard?error=assignment-not-found");

  const full = await db.assignment.findUnique({
    where: { id: a.id },
    include: {
      employee: true,
      manager: true,
      cycle: true,
      template: {
        include: {
          sections: {
            orderBy: { sortOrder: "asc" },
            include: { questions: { orderBy: { sortOrder: "asc" } } },
          },
        },
      },
      responses: true,
    },
  });
  if (!full) redirect("/dashboard?error=assignment-not-found");

  let authorRole: "EMPLOYEE" | "MANAGER" | "HR" = "EMPLOYEE";
  let canEdit = false;
  if (u.role === "HR_ADMIN") {
    authorRole = "HR";
    canEdit = false; // HR reviews only — no input fields, just Finalize action
  } else if (u.role === "MANAGER") {
    authorRole = "MANAGER";
    canEdit = full.state === "MANAGER_REVIEW";
  } else {
    authorRole = "EMPLOYEE";
    canEdit = full.state === "SELF_ASSESS";
  }

  const responsesByAuthorQ: Record<string, Record<string, any>> = {};
  for (const r of full.responses) {
    responsesByAuthorQ[r.authorRole] ??= {};
    responsesByAuthorQ[r.authorRole][r.questionId] = r;
  }

  // Summary breakdown — shown to Manager / HR / when finalized
  const showSummary = u.role !== "EMPLOYEE" || full.state === "FINALIZED";
  const breakdown = showSummary ? await getScoreBreakdown(full.id) : null;

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">{full.cycle.name} · {full.template.name}</div>
            <h1 className="text-2xl font-bold text-gray-800 mt-1">{full.employee.firstName} {full.employee.lastName}</h1>
            <div className="text-sm text-gray-600 mt-1">{full.employee.department ?? "—"} · Manager: {full.manager.firstName} {full.manager.lastName}</div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`chip ${stateColor(full.state)}`}>{full.state.replace("_", " ")}</span>
            <div className="text-xs text-gray-500">Due {new Date(full.cycle.dueDate).toLocaleDateString()}</div>
            {full.overallScore != null && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Overall</span>
                <span className={`rating-pill ${ratingClass(full.overallScore)}`}>{full.overallScore.toFixed(2)}</span>
              </div>
            )}
            <a href={`/assignments/${full.id}/print`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary text-xs">
              🖨 Print / Export PDF
            </a>
            {u.role === "HR_ADMIN" && (
              <DeleteAssignmentButton
                assignmentId={full.id}
                employeeName={`${full.employee.firstName} ${full.employee.lastName}`}
                cycleName={full.cycle.name}
              />
            )}
          </div>
        </div>
      </div>

      <StatusTimeline
        state={full.state}
        createdAt={full.createdAt}
        selfSubmittedAt={full.selfSubmittedAt}
        managerSubmittedAt={full.managerSubmittedAt}
        hrApprovedAt={full.hrApprovedAt}
        finalizedAt={full.finalizedAt}
        employeeName={`${full.employee.firstName} ${full.employee.lastName}`}
        managerName={`${full.manager.firstName} ${full.manager.lastName}`}
      />

      {breakdown && breakdown.sections.length > 0 && (
        <div className="card">
          <h3 className="section-header">Summary — Weighted Score Calculation</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 font-medium">Evaluation Criteria</th>
                  <th className="font-medium text-right">% Weight</th>
                  <th className="font-medium text-right">Personal</th>
                  <th className="font-medium text-right">Supervisor</th>
                  <th className="font-medium text-right">Average</th>
                  <th className="font-medium text-right">Weighted Score</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.sections.map((r) => (
                  <tr key={r.sectionId} className="border-b last:border-0">
                    <td className="py-2">{r.title}</td>
                    <td className="text-right">{r.weight.toFixed(1)}%</td>
                    <td className="text-right">{r.personalRating ?? "—"}</td>
                    <td className="text-right">{r.supervisorRating ?? "—"}</td>
                    <td className="text-right font-medium">{r.average ?? "—"}</td>
                    <td className="text-right">{r.weightedScore ?? "—"}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td colSpan={5} className="py-2 text-right font-bold">Overall Score</td>
                  <td className="text-right font-bold text-primary-600 text-base">{breakdown.overallScore ?? "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EvaluationForm
        assignmentId={full.id}
        sections={full.template.sections}
        responses={responsesByAuthorQ}
        authorRole={authorRole}
        canEdit={canEdit}
        viewerRole={u.role}
        state={full.state}
        recommendation={full.recommendation}
        signatures={{
          employee: { data: full.employeeSignature, at: full.employeeSignedAt?.toISOString() ?? null },
          manager:  { data: full.managerSignature,  at: full.managerSignedAt?.toISOString()  ?? null },
          hr:       { data: full.hrSignature,       at: full.hrSignedAt?.toISOString()       ?? null },
        }}
        signatureNames={{
          employee: `${full.employee.firstName} ${full.employee.lastName}`,
          manager:  `${full.manager.firstName} ${full.manager.lastName}`,
          hr:       "HR Admin",
        }}
      />
    </div>
  );
}
