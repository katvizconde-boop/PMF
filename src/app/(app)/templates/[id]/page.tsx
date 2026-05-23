import { redirect } from "next/navigation";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { TemplateEditor } from "@/components/TemplateEditor";

export default async function TemplateEditorPage({ params }: { params: { id: string } }) {
  await requireRole("HR_ADMIN");
  const t = await db.template.findUnique({
    where: { id: params.id },
    include: { sections: { orderBy: { sortOrder: "asc" }, include: { questions: { orderBy: { sortOrder: "asc" } } } } },
  });
  if (!t) redirect("/templates?error=not-found");
  const used = await db.assignment.count({ where: { templateId: t.id } });
  return <TemplateEditor template={JSON.parse(JSON.stringify(t))} usedByAssignments={used} />;
}
