import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

export async function GET() {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  const all = await db.department.findMany({ orderBy: [{ company: "asc" }, { sortOrder: "asc" }, { name: "asc" }] });
  return NextResponse.json({ departments: all });
}

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });
  const { company, name } = await req.json();
  if (!company || !name) return new NextResponse("Missing fields", { status: 400 });
  try {
    const d = await db.department.create({ data: { company, name } });
    await audit(u.id, "CREATE_DEPARTMENT", "Department", d.id, { company, name });
    return NextResponse.json({ ok: true, id: d.id });
  } catch (e: any) {
    if (e.code === "P2002") return new NextResponse("That department already exists for this company", { status: 409 });
    throw e;
  }
}
