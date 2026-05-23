import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

export async function GET() {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const paths = await db.careerPath.findMany({
    include: { steps: { orderBy: { sortOrder: "asc" } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ paths });
}

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });
  const b = await req.json();
  if (!b.name) return new NextResponse("Missing name", { status: 400 });
  const p = await db.careerPath.create({
    data: {
      name: b.name,
      company: b.company || null,
      description: b.description || null,
      steps: { create: (b.steps ?? []).map((s: any, i: number) => ({
        title: s.title, level: s.level ?? i + 1,
        yearsTypical: s.yearsTypical || null,
        skills: s.skills ?? "",
        responsibilities: s.responsibilities || null,
        sortOrder: i,
      }))},
    },
  });
  await audit(u.id, "CREATE_CAREER_PATH", "CareerPath", p.id);
  return NextResponse.json({ ok: true, id: p.id });
}
