import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });
  const b = await req.json();
  const t = await db.template.create({
    data: {
      name: b.name || "New Template",
      type: b.type || "REGULAR",
      sections: { create: [{ title: "New Section", kind: "KPI", weight: 100, sortOrder: 0, questions: { create: [{ prompt: "New question", inputType: "rating", sortOrder: 0 }] }}] },
    },
  });
  await audit(u.id, "CREATE_TEMPLATE", "Template", t.id);
  return NextResponse.json({ ok: true, id: t.id });
}
