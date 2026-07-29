import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

/**
 * Weekly DB snapshot — runs Sunday 22:00 Vercel time (cron schedule in vercel.json).
 *
 * Exports the most operationally-critical tables (User, Assignment, Response, Cycle,
 * Template, Section, Question, AuditLog) as JSON and emails them to HR as an attachment.
 *
 * NOTE: This is a recovery-friendly snapshot — not a full pg_dump. For full backups,
 * upgrade to Neon Launch ($19/mo) which has point-in-time-recovery (PITR) baked in.
 */
const HR_NOTIFY = process.env.HR_NOTIFY_EMAIL || "hr@sevengen.com";
const BACKUP_TOKEN = process.env.CRON_SECRET || "";

export async function GET(req: Request) {
  // Vercel sends authorization header for cron jobs
  const auth = req.headers.get("authorization");
  if (BACKUP_TOKEN && auth !== `Bearer ${BACKUP_TOKEN}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const [users, assignments, responses, cycles, templates, audit] = await Promise.all([
      db.user.findMany({ select: {
        id: true, email: true, firstName: true, lastName: true, role: true,
        company: true, department: true, position: true, hireDate: true,
        managerId: true, createdAt: true,
      } }),
      db.assignment.findMany(),
      db.response.findMany(),
      db.cycle.findMany(),
      db.template.findMany({ include: { sections: { include: { questions: true } } } }),
      db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 1000 }),
    ]);

    const snapshot = {
      _meta: {
        takenAt: new Date().toISOString(),
        appName: "PMF System",
        recordCounts: {
          users: users.length,
          assignments: assignments.length,
          responses: responses.length,
          cycles: cycles.length,
          templates: templates.length,
          auditLogEntriesIncluded: audit.length,
        },
        note: "Recovery-friendly JSON snapshot. For full DB restore, use Neon point-in-time-recovery.",
      },
      users,
      assignments,
      responses,
      cycles,
      templates,
      auditLog: audit,
    };

    const json = JSON.stringify(snapshot, null, 2);
    const sizeKB = Math.round(Buffer.byteLength(json, "utf8") / 1024);
    const filename = `pmf-snapshot-${new Date().toISOString().slice(0, 10)}.json`;

    // Email the snapshot — if it's small enough, attach inline; otherwise just notify
    const ATTACH_LIMIT_KB = 8000; // ~8 MB attachment limit for most providers
    if (sizeKB <= ATTACH_LIMIT_KB) {
      await sendEmail({
        to: HR_NOTIFY,
        subject: `PMF Weekly Backup — ${filename} (${sizeKB} KB)`,
        text: `Hi HR,

Weekly backup snapshot is attached.

Snapshot summary:
- Users: ${users.length}
- Assignments: ${assignments.length}
- Responses: ${responses.length}
- Templates: ${templates.length}
- Cycles: ${cycles.length}
- Audit entries (last 1000): ${audit.length}
- File size: ${sizeKB} KB

To restore: store this JSON file securely (e.g., OneDrive backups folder). For point-in-time recovery, use the Neon dashboard.

— PMF Automated Backup`,
        attachments: [{ filename, content: Buffer.from(json, "utf8") }],
      } as any).catch(() => {});
    } else {
      // Too big to attach — just send a summary
      await sendEmail({
        to: HR_NOTIFY,
        subject: `PMF Weekly Backup — snapshot too large (${sizeKB} KB)`,
        text: `Hi HR,

This week's snapshot is ${sizeKB} KB which exceeds the email attachment limit.

Snapshot summary:
- Users: ${users.length}
- Assignments: ${assignments.length}
- Responses: ${responses.length}
- Templates: ${templates.length}

Please download the snapshot manually via the Admin → Export tool, or upgrade Neon to enable point-in-time-recovery.

— PMF Automated Backup`,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, sizeKB, filename });
  } catch (e: any) {
    console.error("[CRON_ERROR]", e); return new NextResponse("Backup failed (see server logs).", { status: 500 });
  }
}
