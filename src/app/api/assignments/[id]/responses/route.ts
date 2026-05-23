import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, canAccessAssignment } from "@/lib/rbac";
import { audit } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const a = await canAccessAssignment(u.id, u.role, params.id);
  if (!a) return new NextResponse("Forbidden", { status: 403 });

  const authorRole =
    u.role === "HR_ADMIN" ? "HR" : u.role === "MANAGER" ? "MANAGER" : "EMPLOYEE";

  if (authorRole === "HR") return new NextResponse("HR does not save responses", { status: 400 });
  const expectedState = authorRole === "EMPLOYEE" ? "SELF_ASSESS" : "MANAGER_REVIEW";
  if (a.state !== expectedState) return new NextResponse(`Form is not editable in state ${a.state}`, { status: 409 });

  const body = await req.json();
  const items = (body.responses ?? []) as Array<{ questionId: string; rating: number | null; comment: string | null }>;

  await db.$transaction([
    ...items.map((r) =>
      db.response.upsert({
        where: { assignmentId_questionId_authorRole: { assignmentId: a.id, questionId: r.questionId, authorRole } },
        create: { assignmentId: a.id, questionId: r.questionId, authorRole, rating: r.rating, comment: r.comment },
        update: { rating: r.rating, comment: r.comment },
      })
    ),
    ...(body.recommendation ? [db.assignment.update({ where: { id: a.id }, data: { recommendation: body.recommendation } })] : []),
  ]);

  await audit(u.id, "SAVE_RESPONSES", "Assignment", a.id, { count: items.length, authorRole });
  return NextResponse.json({ ok: true });
}
