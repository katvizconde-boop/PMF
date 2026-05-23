import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";
import { getScoreBreakdown } from "@/lib/scoring";

function csvEscape(v: any): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });

  const cycle = await db.cycle.findUnique({ where: { id: params.id } });
  if (!cycle) return new NextResponse("Not found", { status: 404 });

  const assignments = await db.assignment.findMany({
    where: { cycleId: params.id },
    include: { employee: true, manager: true, template: true },
    orderBy: [{ employee: { company: "asc" } }, { employee: { department: "asc" } }, { employee: { firstName: "asc" } }],
  });

  const rows: string[] = [];
  rows.push([
    "Company", "Department", "Employee", "Position", "Employment Type",
    "Manager", "Template", "Status", "Overall Score",
    "Section", "Section Weight %", "Personal Rating", "Supervisor Rating", "Section Average", "Weighted Score",
    "Recommendation", "Self Submitted", "Manager Submitted", "Finalized",
  ].map(csvEscape).join(","));

  for (const a of assignments) {
    const bd = await getScoreBreakdown(a.id);
    const baseRow = [
      a.employee.company ?? "",
      a.employee.department ?? "",
      `${a.employee.firstName} ${a.employee.lastName}`,
      a.employee.position ?? "",
      a.employee.employmentType,
      `${a.manager.firstName} ${a.manager.lastName}`,
      a.template.name,
      a.state,
      a.overallScore ?? "",
    ];
    const tail = [
      a.recommendation ?? "",
      a.selfSubmittedAt?.toISOString() ?? "",
      a.managerSubmittedAt?.toISOString() ?? "",
      a.finalizedAt?.toISOString() ?? "",
    ];

    if (!bd || bd.sections.length === 0) {
      rows.push([...baseRow, "", "", "", "", "", "", ...tail].map(csvEscape).join(","));
    } else {
      for (const s of bd.sections) {
        rows.push([...baseRow, s.title, s.weight, s.personalRating ?? "", s.supervisorRating ?? "", s.average ?? "", s.weightedScore ?? "", ...tail].map(csvEscape).join(","));
      }
    }
  }

  await audit(u.id, "EXPORT_CYCLE", "Cycle", params.id, { format: "csv", rows: rows.length - 1 });
  const filename = `PMF_${cycle.name.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(rows.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
