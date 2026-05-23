import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

// Full template replace (sections + questions). Simple approach: delete & recreate child rows.
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });
  const b = await req.json() as {
    name: string; type: string; isActive?: boolean;
    sections: { title: string; kind: string; weight: number; sortOrder: number;
      questions: { prompt: string; description?: string | null; inputType: string; options?: string | null; required: boolean; weight: number; sortOrder: number; }[];
    }[];
  };

  // Block if responses already exist (data integrity)
  const responseCount = await db.response.count({ where: { question: { section: { templateId: params.id } } } });
  if (responseCount > 0) {
    // soft-edit: only allow name/isActive change
    await db.template.update({ where: { id: params.id }, data: { name: b.name, isActive: b.isActive ?? true } });
    await audit(u.id, "UPDATE_TEMPLATE_META", "Template", params.id);
    return NextResponse.json({ ok: true, partial: true, message: "Template has responses; only name/active updated. Clone to make a new version for structural edits." });
  }

  await db.$transaction(async (tx) => {
    const sections = await tx.section.findMany({ where: { templateId: params.id }, select: { id: true } });
    await tx.question.deleteMany({ where: { sectionId: { in: sections.map((s) => s.id) } } });
    await tx.section.deleteMany({ where: { templateId: params.id } });
    await tx.template.update({ where: { id: params.id }, data: { name: b.name, type: b.type, isActive: b.isActive ?? true } });
    for (const s of b.sections) {
      await tx.section.create({
        data: {
          templateId: params.id, title: s.title, kind: s.kind, weight: s.weight, sortOrder: s.sortOrder,
          questions: { create: s.questions.map((q) => ({
            prompt: q.prompt, description: q.description || null, inputType: q.inputType,
            options: q.options || null, required: q.required, weight: q.weight, sortOrder: q.sortOrder,
          }))},
        },
      });
    }
  });
  await audit(u.id, "UPDATE_TEMPLATE", "Template", params.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });
  const used = await db.assignment.count({ where: { templateId: params.id } });
  if (used > 0) return new NextResponse(`Cannot delete: template is used by ${used} assignment(s). Deactivate instead.`, { status: 409 });
  await db.template.delete({ where: { id: params.id } });
  await audit(u.id, "DELETE_TEMPLATE", "Template", params.id);
  return NextResponse.json({ ok: true });
}
