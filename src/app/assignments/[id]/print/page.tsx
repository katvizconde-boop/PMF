import { notFound } from "next/navigation";
import { requireUser, canAccessAssignment } from "@/lib/rbac";
import { db } from "@/lib/db";
import { PrintButton } from "@/components/PrintButton";
import { companyLogoPath } from "@/lib/companies";

export const dynamic = "force-dynamic";

export default async function PrintView({ params }: { params: { id: string } }) {
  const u = await requireUser();
  const a = await canAccessAssignment(u.id, u.role, params.id);
  if (!a) notFound();

  const full = await db.assignment.findUnique({
    where: { id: a.id },
    include: {
      employee: true, manager: true, cycle: true,
      template: { include: { sections: { orderBy: { sortOrder: "asc" }, include: { questions: { orderBy: { sortOrder: "asc" } } } } } },
      responses: true,
    },
  });
  if (!full) notFound();

  const byAQ: Record<string, Record<string, { rating: number | null; comment: string | null }>> = {};
  for (const r of full.responses) {
    byAQ[r.authorRole] ??= {};
    byAQ[r.authorRole][r.questionId] = { rating: r.rating, comment: r.comment };
  }

  return (
    <html lang="en">
      <head>
        <title>PMF — {full.employee.firstName} {full.employee.lastName} — {full.cycle.name}</title>
        <style>{`
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; margin: 0; padding: 24px; font-size: 12px; line-height: 1.4; }
          h1 { font-size: 22px; margin: 0 0 4px; }
          h2 { font-size: 15px; margin: 18px 0 8px; border-bottom: 2px solid #111; padding-bottom: 4px; }
          .meta { color: #555; font-size: 11px; margin-bottom: 20px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin: 12px 0 24px; padding: 12px; border: 1px solid #ccc; border-radius: 6px; background: #fafafa; }
          .meta-grid div { font-size: 11px; }
          .meta-grid b { display: block; font-size: 10px; color: #666; text-transform: uppercase; margin-bottom: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          th, td { border: 1px solid #bbb; padding: 6px 8px; text-align: left; vertical-align: top; font-size: 11px; }
          th { background: #f0f0f0; font-weight: 600; }
          .q { width: 28%; }
          .r { width: 50px; text-align: center; }
          .comment-cell { width: 27%; }
          .c { width: 100%; }
          .comment-cell { white-space: pre-wrap; }
          .chip { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; background: #e5e7eb; }
          .sig { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; }
          .sig div { border-top: 1px solid #000; padding-top: 4px; font-size: 10px; }
          .no-print { margin-bottom: 16px; }
          @media print {
            .no-print { display: none; }
            body { padding: 12px; }
            h2 { page-break-after: avoid; }
            table { page-break-inside: avoid; }
          }
        `}</style>
      </head>
      <body>
        <div className="no-print">
          <PrintButton />
        </div>

        <div style={{ textAlign: "center", marginBottom: 16, paddingBottom: 14, borderBottom: "2px solid #1e3a5a" }}>
          <img src="/logos/7gen.jpg" alt="7GEN" style={{ height: 56, width: "auto", margin: "0 auto", display: "block" }} />
          <div style={{ marginTop: 8, fontSize: 14, fontWeight: 800, color: "#1e3a5a", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            PMF System
          </div>
        </div>
        <h1 style={{ textAlign: "center", marginTop: 6, marginBottom: 4 }}>Performance Management Form</h1>
        <div className="meta" style={{ textAlign: "center", marginBottom: 22 }}>{full.template.name} · {full.cycle.name}</div>

        {full.employee.company && companyLogoPath(full.employee.company) && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, marginBottom: 16 }}>
            <img src={companyLogoPath(full.employee.company)!} alt={full.employee.company} style={{ height: 36, width: "auto", maxWidth: 140, objectFit: "contain" }} />
            <div>
              <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>Company</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1e3a5a" }}>{full.employee.company}</div>
            </div>
          </div>
        )}

        <div className="meta-grid">
          <div><b>Employee</b>{full.employee.firstName} {full.employee.lastName}</div>
          <div><b>Department</b>{full.employee.department ?? "—"}</div>
          <div><b>Employment Type</b>{full.employee.employmentType}</div>
          <div><b>Manager</b>{full.manager.firstName} {full.manager.lastName}</div>
          <div><b>Hire Date</b>{full.employee.hireDate ? new Date(full.employee.hireDate).toLocaleDateString() : "—"}</div>
          <div><b>Period</b>{new Date(full.cycle.periodStart).toLocaleDateString()} — {new Date(full.cycle.periodEnd).toLocaleDateString()}</div>
          <div><b>Status</b><span className="chip">{full.state.replace("_", " ")}</span></div>
          <div><b>Overall Score</b>{full.overallScore != null ? full.overallScore.toFixed(2) : "—"}</div>
          {/* Public Recommendation removed — Private Manager Recommendation replaces it */}
        </div>

        {/* Private manager recommendation — ONLY shown to MANAGER/HR, never EMPLOYEE.
            Server-side gate: even if someone bypasses the UI, this is conditional. */}
        {u.role !== "EMPLOYEE" && (full.privateRecommendation || full.privateRecommendationNotes) && (
          <div style={{ marginTop: "12px", padding: "12px", border: "2px solid #B45309", borderLeftWidth: "8px", background: "#FEF3C7" }}>
            <h3 style={{ color: "#B45309", margin: "0 0 8px 0", fontSize: "13px", letterSpacing: "2px" }}>
              🔒 CONFIDENTIAL — PRIVATE MANAGER RECOMMENDATION (NOT VISIBLE TO EMPLOYEE)
            </h3>
            {full.privateRecommendation && (
              <div><b>Recommendation Type</b>{full.privateRecommendation.replace(/_/g, " ")}</div>
            )}
            {full.privateRecommendationNotes && (
              <div style={{ marginTop: "8px" }}>
                <b>Justification</b>
                <div style={{ whiteSpace: "pre-wrap" }}>{full.privateRecommendationNotes}</div>
              </div>
            )}
          </div>
        )}

        {/* Part I — Key Projects & Activities */}
        {(() => {
          let projectRows: { keyResponsibility: string; activitiesProjects: string; remarks: string }[] = [];
          try {
            const parsed = full.keyProjectActivities ? JSON.parse(full.keyProjectActivities) : null;
            if (Array.isArray(parsed)) projectRows = parsed;
          } catch {}
          const hasContent = projectRows.some((r) => r.keyResponsibility || r.activitiesProjects || r.remarks);
          if (!hasContent) return null;
          return (
            <div>
              <h2>Part I — Key Projects & Activities</h2>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "25%" }}>Key Responsibilities</th>
                    <th style={{ width: "40%" }}>Activities / Projects</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {projectRows.map((r, i) => (
                    <tr key={i}>
                      <td style={{ whiteSpace: "pre-wrap" }}>{r.keyResponsibility || "—"}</td>
                      <td style={{ whiteSpace: "pre-wrap" }}>{r.activitiesProjects || "—"}</td>
                      <td style={{ whiteSpace: "pre-wrap" }}>{r.remarks || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}

        {full.template.sections
          // Public RECOMMENDATION section is no longer shown anywhere — use Private Recommendation instead
          .filter((s) => s.kind !== "RECOMMENDATION")
          .map((s) => (
          <div key={s.id}>
            <h2>{s.title}{s.weight > 0 ? ` (${s.weight}%)` : ""}</h2>
            {s.kind === "COMMENT" || s.kind === "RECOMMENDATION" ? (
              <table>
                <thead>
                  <tr><th className="q">Question</th><th>Employee</th><th>Manager</th></tr>
                </thead>
                <tbody>
                  {s.questions.map((q) => (
                    <tr key={q.id}>
                      <td>{q.prompt}</td>
                      <td className="comment-cell">{byAQ.EMPLOYEE?.[q.id]?.comment ?? "—"}</td>
                      <td className="comment-cell">{byAQ.MANAGER?.[q.id]?.comment ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th className="q">Criterion</th>
                    <th className="r">Self</th>
                    <th>Self Justification</th>
                    <th className="r">Mgr</th>
                    <th>Manager Justification</th>
                  </tr>
                </thead>
                <tbody>
                  {s.questions.map((q) => (
                    <tr key={q.id}>
                      <td>{q.prompt}</td>
                      <td className="r">{byAQ.EMPLOYEE?.[q.id]?.rating ?? "—"}</td>
                      <td className="comment-cell">{byAQ.EMPLOYEE?.[q.id]?.comment ?? "—"}</td>
                      <td className="r">{byAQ.MANAGER?.[q.id]?.rating ?? "—"}</td>
                      <td className="comment-cell">{byAQ.MANAGER?.[q.id]?.comment ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}

        <div style={{ marginTop: 40 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div>
              {full.employeeSignature ? (
                <img src={full.employeeSignature} alt="Employee signature" style={{ maxHeight: 60, objectFit: "contain" }} />
              ) : <div style={{ height: 60 }} />}
              <div style={{ borderTop: "1px solid #000", paddingTop: 4, fontSize: 10 }}>
                <b>{full.employeeSignatureName ?? `${full.employee.firstName} ${full.employee.lastName}`}</b><br />
                Employee Signature · {full.employeeSignedAt ? new Date(full.employeeSignedAt).toLocaleDateString() : "—"}
              </div>
            </div>
            <div>
              {full.managerSignature ? (
                <img src={full.managerSignature} alt="Manager signature" style={{ maxHeight: 60, objectFit: "contain" }} />
              ) : <div style={{ height: 60 }} />}
              <div style={{ borderTop: "1px solid #000", paddingTop: 4, fontSize: 10 }}>
                <b>{full.managerSignatureName ?? `${full.manager.firstName} ${full.manager.lastName}`}</b><br />
                Supervisor Signature · {full.managerSignedAt ? new Date(full.managerSignedAt).toLocaleDateString() : "—"}
              </div>
            </div>
            <div>
              {full.hrSignature ? (
                <img src={full.hrSignature} alt="HR signature" style={{ maxHeight: 60, objectFit: "contain" }} />
              ) : <div style={{ height: 60 }} />}
              <div style={{ borderTop: "1px solid #000", paddingTop: 4, fontSize: 10 }}>
                <b>{full.hrSignatureName ?? "HR Admin"}</b><br />
                HR Signature · {full.hrSignedAt ? new Date(full.hrSignedAt).toLocaleDateString() : "—"}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
