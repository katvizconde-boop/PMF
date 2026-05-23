import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { sendEmail } from "@/lib/email";
import { audit } from "@/lib/auth";

const REMINDER_INTERVAL_HOURS = 48; // don't re-send within this window

// Auth: either logged-in HR_ADMIN OR a valid CRON_SECRET header (for external cron services).
async function authorize(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const header = req.headers.get("authorization");
    if (header === `Bearer ${cronSecret}`) return { kind: "cron" as const };
  }
  const u = await getSessionUser();
  if (u?.role === "HR_ADMIN") return { kind: "user" as const, user: u };
  return null;
}

export async function GET(req: Request) { return handler(req); }
export async function POST(req: Request) { return handler(req); }

async function handler(req: Request) {
  const auth = await authorize(req);
  if (!auth) return new NextResponse("Unauthorized", { status: 401 });

  const url = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const cutoff = new Date(Date.now() - REMINDER_INTERVAL_HOURS * 3600 * 1000);
  const now = new Date();

  // Find pending assignments due within 14 days OR overdue
  const horizon = new Date(now.getTime() + 14 * 24 * 3600 * 1000);
  const pending = await db.assignment.findMany({
    where: {
      state: { in: ["SELF_ASSESS", "MANAGER_REVIEW", "HR_REVIEW"] },
      cycle: { dueDate: { lte: horizon } },
      OR: [{ lastReminderAt: null }, { lastReminderAt: { lt: cutoff } }],
    },
    include: { employee: true, manager: true, cycle: true, template: true },
  });

  let sent = 0;
  for (const a of pending) {
    let target = a.employee;
    let action = "complete your self-assessment";
    if (a.state === "MANAGER_REVIEW") { target = a.manager; action = `evaluate ${a.employee.firstName} ${a.employee.lastName}`; }
    if (a.state === "HR_REVIEW") {
      // notify all HR admins
      const hrs = await db.user.findMany({ where: { role: "HR_ADMIN" } });
      for (const hr of hrs) {
        await sendEmail({
          to: hr.email,
          subject: `[PMF Reminder] HR review pending — ${a.employee.firstName} ${a.employee.lastName}`,
          text: `The evaluation for ${a.employee.firstName} ${a.employee.lastName} (${a.cycle.name}, ${a.template.name}) is awaiting HR review.\nDue ${a.cycle.dueDate.toDateString()}.\n${url}/assignments/${a.id}`,
        });
      }
    } else {
      const overdue = a.cycle.dueDate < now;
      await sendEmail({
        to: target.email,
        subject: `[PMF Reminder${overdue ? " — OVERDUE" : ""}] Please ${action} (${a.cycle.name})`,
        text: `Hi ${target.firstName},\n\nThis is a reminder to ${action} for the ${a.cycle.name} cycle.\nTemplate: ${a.template.name}\nDue: ${a.cycle.dueDate.toDateString()}${overdue ? "  ⚠ OVERDUE" : ""}\n\n${url}/assignments/${a.id}\n`,
      });
    }
    await db.assignment.update({ where: { id: a.id }, data: { lastReminderAt: now } });
    sent++;
  }

  await audit(auth.kind === "user" ? auth.user.id : null, "SEND_REMINDERS", "System", undefined, { sent, scanned: pending.length });
  return NextResponse.json({ ok: true, sent, scanned: pending.length });
}
