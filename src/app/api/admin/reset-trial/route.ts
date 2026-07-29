import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

/**
 * POST /api/admin/reset-trial
 * HR_ADMIN only. Wipes all EVALUATION DATA used during the trial period
 * so the app is clean for production rollout.
 *
 * WIPES:
 *   - Response (every PMF answer ever entered)
 *   - Assignment (every PMF instance assigned)
 *   - Kudos
 *   - Goal
 *   - PIP
 *   - OneOnOne notes
 *   - Document uploads
 *   - Notification (in-app pings about old PMFs)
 *
 * KEEPS:
 *   - User accounts (so people don't need to re-register)
 *   - Templates (so HR doesn't lose their question library)
 *   - Cycles (HR keeps the cycle definitions)
 *   - Departments
 *   - CareerPath / CareerProgress
 *   - AuditLog (regulatory — never wiped)
 *
 * Returns: counts of records deleted from each table.
 */

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") {
    return new NextResponse("Only HR can reset trial data.", { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { confirmation } = body;
    if (confirmation !== "RESET TRIAL DATA") {
      return new NextResponse(
        "Type the exact confirmation phrase to proceed.",
        { status: 400 }
      );
    }

    // Count what we're about to delete (for the response + audit log)
    const counts: Record<string, number> = {};

    const result = await db.$transaction(async (tx) => {
      // Order matters — delete child records first (foreign keys)

      // 1. Responses (children of Assignment)
      const responses = await tx.response.deleteMany({});
      counts.responses = responses.count;

      // 2. Notifications (may reference assignments)
      try {
        const notifs = await tx.notification.deleteMany({});
        counts.notifications = notifs.count;
      } catch { counts.notifications = 0; }

      // 3. Assignments (the PMF instances themselves)
      const assignments = await tx.assignment.deleteMany({});
      counts.assignments = assignments.count;

      // 4. Kudos
      try {
        const kudos = await tx.kudos.deleteMany({});
        counts.kudos = kudos.count;
      } catch { counts.kudos = 0; }

      // 5. Goals
      try {
        const goals = await tx.goal.deleteMany({});
        counts.goals = goals.count;
      } catch { counts.goals = 0; }

      // 6. PIPs
      try {
        const pips = await tx.pIP.deleteMany({});
        counts.pips = pips.count;
      } catch { counts.pips = 0; }

      // 7. One-on-One notes
      try {
        const oneOnOnes = await tx.oneOnOne.deleteMany({});
        counts.oneOnOnes = oneOnOnes.count;
      } catch { counts.oneOnOnes = 0; }

      // 8. Documents
      try {
        const docs = await tx.document.deleteMany({});
        counts.documents = docs.count;
      } catch { counts.documents = 0; }

      return counts;
    }, { timeout: 30_000 });

    // Audit-log this nuclear action
    await audit(u.id, "RESET_TRIAL_DATA", "System", "global", {
      countsDeleted: result,
      executedBy: u.email,
      executedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      deleted: result,
      message: "Trial data wiped. Users, templates, and cycles preserved.",
    });
  } catch (e: any) {
    console.error("Reset trial data failed:", e);
    return new NextResponse(
      `Reset failed: ${e.message ?? "unknown error"}`,
      { status: 500 }
    );
  }
}
