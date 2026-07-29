import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

/**
 * POST /api/admin/bulk-add-co-manager
 * HR_ADMIN only. Add ONE manager as co-manager to MANY employees at once.
 * Body: { managerId: string, employeeIds: string[], notes?: string }
 * Skips employees where:
 *  - the manager is already their primary manager (already has access)
 *  - the co-manager link already exists
 * Returns { ok, added, skipped, reasons: [{email, reason}] }
 */
export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Only HR can add co-managers.", { status: 403 });

  const { managerId, employeeIds, notes } = await req.json().catch(() => ({} as any));
  if (!managerId) return new NextResponse("Missing managerId", { status: 400 });
  if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
    return new NextResponse("Provide at least one employeeId", { status: 400 });
  }

  const [mgr, employees] = await Promise.all([
    db.user.findUnique({ where: { id: managerId } }),
    db.user.findMany({ where: { id: { in: employeeIds } } }),
  ]);
  if (!mgr) return new NextResponse("Manager not found", { status: 404 });
  if (mgr.role !== "MANAGER" && mgr.role !== "HR_ADMIN") {
    return new NextResponse("Selected user is not a MANAGER or HR_ADMIN.", { status: 400 });
  }

  const existing = await db.coManager.findMany({
    where: { managerId, employeeId: { in: employeeIds } },
    select: { employeeId: true },
  });
  const alreadyLinked = new Set(existing.map((e) => e.employeeId));
  const cleanNotes = typeof notes === "string" ? notes.slice(0, 1000) : null;

  let added = 0;
  let skipped = 0;
  const reasons: { email: string; reason: string }[] = [];

  for (const emp of employees) {
    if (emp.id === managerId) {
      skipped++;
      reasons.push({ email: emp.email, reason: "Cannot co-manage self" });
      continue;
    }
    if (emp.managerId === managerId) {
      skipped++;
      reasons.push({ email: emp.email, reason: "Already primary manager" });
      continue;
    }
    if (alreadyLinked.has(emp.id)) {
      skipped++;
      reasons.push({ email: emp.email, reason: "Already co-manager" });
      continue;
    }
    try {
      await db.coManager.create({
        data: { employeeId: emp.id, managerId, notes: cleanNotes },
      });
      added++;
    } catch (e: any) {
      skipped++;
      reasons.push({ email: emp.email, reason: e?.code === "P2002" ? "Duplicate link" : "Insert failed" });
    }
  }

  await audit(u.id, "BULK_ADD_CO_MANAGER", "User", "bulk", {
    managerId, managerEmail: mgr.email, employeeIds, added, skipped,
  });

  return NextResponse.json({ ok: true, added, skipped, reasons });
}
