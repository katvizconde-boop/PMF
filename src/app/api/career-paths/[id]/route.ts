import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });
  const b = await req.json();
  await db.$transaction(async (tx) => {
    await tx.careerPath.update({
      where: { id: params.id },
      data: { name: b.name, company: b.company || null, description: b.description || null },
    });
    // Replace steps
    if (Array.isArray(b.steps)) {
      // Delete existing steps that are not used by progress (we'll just disconnect via cascade)
      await tx.careerPathStep.deleteMany({ where: { careerPathId: params.id } });
      for (let i = 0; i < b.steps.length; i++) {
        const s = b.steps[i];
        await tx.careerPathStep.create({
          data: {
            careerPathId: params.id,
            title: s.title, level: s.level ?? i + 1,
            yearsTypical: s.yearsTypical || null, skills: s.skills ?? "",
            responsibilities: s.responsibilities || null, sortOrder: i,
          },
        });
      }
    }
  });
  await audit(u.id, "UPDATE_CAREER_PATH", "CareerPath", params.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });
  await db.careerPath.delete({ where: { id: params.id } });
  await audit(u.id, "DELETE_CAREER_PATH", "CareerPath", params.id);
  return NextResponse.json({ ok: true });
}
