import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { NewTemplateButton } from "@/components/NewTemplateButton";
import { ImportPdfButton } from "@/components/ImportPdfButton";
import { PageHeader } from "@/components/PageHeader";

export default async function TemplatesPage() {
  await requireRole("HR_ADMIN");
  const templates = await db.template.findMany({
    include: { sections: { include: { questions: true } }, _count: { select: { assignments: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <PageHeader title="PMF Templates" subtitle="Define evaluation forms — sections, questions, weights, and rating scales" badge={`${templates.length} active`}>
        <ImportPdfButton />
        <NewTemplateButton />
      </PageHeader>
      <div className="grid md:grid-cols-2 gap-4">
        {templates.map((t) => (
          <Link key={t.id} href={`/templates/${t.id}`} className="card hover:shadow-md transition cursor-pointer">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-gray-800">{t.name}</h3>
                <span className="chip bg-primary-100 text-primary-700 mt-1">{t.type}</span>
                {!t.isActive && <span className="chip bg-gray-100 text-gray-500 ml-1">inactive</span>}
              </div>
              <div className="text-xs text-gray-500 text-right">
                <div>{t._count.assignments} assignments</div>
                <div>{t.sections.length} sections · {t.sections.reduce((s, sec) => s + sec.questions.length, 0)} questions</div>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {t.sections.sort((a, b) => a.sortOrder - b.sortOrder).map((s) => (
                <div key={s.id} className="text-sm">
                  <span className="font-medium text-gray-700">{s.title}</span>
                  <span className="text-xs text-gray-400 ml-2">({s.questions.length} Qs{s.weight > 0 ? ` · ${s.weight}%` : ""})</span>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
