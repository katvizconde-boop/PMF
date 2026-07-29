import { redirect } from "next/navigation";
import { requireUser, canAccessAssignment } from "@/lib/rbac";
import { db } from "@/lib/db";
import { EvaluationForm } from "@/components/EvaluationForm";
import { ratingClass, stateColor } from "@/lib/ui";
import { getScoreBreakdown } from "@/lib/scoring";
import { StatusTimeline } from "@/components/StatusTimeline";
import { DeleteAssignmentButton } from "@/components/DeleteAssignmentButton";
import { ReopenFinalizedCard } from "@/components/ReopenFinalizedCard";
import { Icon } from "@/components/Icons";

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
  // When a user views their OWN assignment, they are always the EMPLOYEE
  // (a manager evaluating themselves fills in the self-assessment side).
  const isOwnAssignment = full.employeeId === u.id;
  if (u.role === "HR_ADMIN" && !isOwnAssignment) {
    authorRole = "HR";
    canEdit = false; // HR reviews only — no input fields, just Finalize action
  } else if (u.role === "MANAGER" && !isOwnAssignment) {
    authorRole = "MANAGER";
    canEdit = full.state === "MANAGER_REVIEW";
  } else {
    // EMPLOYEE viewing own, OR MANAGER/HR_ADMIN viewing their own self-assessment
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
              <span className="inline-flex items-center gap-1"><Icon.Print size={14} /> Print / Export PDF</span>
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

      {u.role === "HR_ADMIN" && (full.state === "FINALIZED" || full.state === "HR_REVIEW" || full.state === "MANAGER_REVIEW") && (
        <ReopenFinalizedCard
          assignmentId={full.id}
          employeeName={`${full.employee.firstName} ${full.employee.lastName}`}
          cycleName={full.cycle.name}
          state={full.state}
          allowedTargets={
            full.state === "MANAGER_REVIEW"
              ? ["SELF_ASSESS"]                        // already with manager; only option is to send back to employee
              : ["MANAGER_REVIEW", "SELF_ASSESS"]      // FINALIZED or HR_REVIEW — either direction OK
          }
        />
      )}

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
        recommendation={u.role !== "EMPLOYEE" && !isOwnAssignment ? full.recommendation : null}
        // ── Privacy gate ──
        // Private recommendation is NEVER visible to the person being evaluated —
        // not even if that person is also a manager or HR admin. The subject of a PMF
        // is always the "employee" on it, regardless of their org-wide role.
        //
        // Visible ONLY when the viewer is a MANAGER or HR AND it's NOT their own PMF.
        privateRecommendation={
          u.role !== "EMPLOYEE" && !isOwnAssignment ? full.privateRecommendation : null
        }
        privateRecommendationNotes={
          u.role !== "EMPLOYEE" && !isOwnAssignment ? full.privateRecommendationNotes : null
        }
        keyProjectActivities={full.keyProjectActivities}
        canPreFillKeyResp={
          // Manager may pre-fill Key Responsibilities before OR during their review
          u.role === "MANAGER" && !isOwnAssignment && (full.state === "SELF_ASSESS" || full.state === "MANAGER_REVIEW")
        }
        signatures={{
          employee: { data: full.employeeSignature, at: full.employeeSignedAt?.toISOString() ?? null },
          manager:  { data: full.managerSignature,  at: full.managerSignedAt?.toISOString()  ?? null },
          hr:       { data: full.hrSignature,       at: full.hrSignedAt?.toISOString()       ?? null },
        }}
        signatureNames={{
          // Prefer the name the signer typed at sign time.
          // Fall back to auto-derived name for historic signatures written before this feature shipped.
          employee: full.employeeSignatureName ?? `${full.employee.firstName} ${full.employee.lastName}`,
          manager:  full.managerSignatureName  ?? `${full.manager.firstName} ${full.manager.lastName}`,
          hr:       full.hrSignatureName       ?? "HR Admin",
        }}
      />
    </div>
  );
}
