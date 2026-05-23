import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { sendEmail } from "@/lib/email";
import { notify } from "@/lib/notifications";
import { audit } from "@/lib/auth";

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

const ALERT_THRESHOLDS = [30, 14, 3, 0]; // days before probation ends

export async function GET(req: Request) { return handler(req); }
export async function POST(req: Request) { return handler(req); }

async function handler(req: Request) {
  const auth = await authorize(req);
  if (!auth) return new NextResponse("Unauthorized", { status: 401 });

  const probationaries = await db.user.findMany({
    where: { employmentType: "PROBATIONARY", role: { in: ["EMPLOYEE", "MANAGER"] }, hireDate: { not: null } },
    include: { manager: true },
  });
  const hrs = await db.user.findMany({ where: { role: "HR_ADMIN" } });
  const url = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const now = new Date();
  let sent = 0;
  const alerts: any[] = [];

  for (const e of probationaries) {
    if (!e.hireDate) continue;
    const probEnd = new Date(e.hireDate);
    probEnd.setMonth(probEnd.getMonth() + 6);
    const daysRemaining = Math.round((probEnd.getTime() - now.getTime()) / 86400000);
    // Fire if matches any threshold (within ±0.5 day window)
    if (!ALERT_THRESHOLDS.includes(daysRemaining)) continue;

    alerts.push({ employee: e.email, daysRemaining });

    // Notify HR
    for (const hr of hrs) {
      await sendEmail({
        to: hr.email,
        subject: `[PMF] Probation ending in ${daysRemaining} days — ${e.firstName} ${e.lastName}`,
        text: `Hi ${hr.firstName},\n\n${e.firstName} ${e.lastName}'s probationary period ends on ${probEnd.toDateString()} (${daysRemaining} days from now).\n\nPlease ensure a probationary PMF is finalized and a regularization decision is made.\n\nView profile: ${url}/employees/${e.id}\n`,
      });
      notify({
        userId: hr.id,
        type: "INFO",
        title: `Probation ends in ${daysRemaining} days: ${e.firstName} ${e.lastName}`,
        body: `Probationary period ends ${probEnd.toLocaleDateString()}. Please action.`,
        link: `/employees/${e.id}`,
      }).catch(() => {});
      sent++;
    }
    // Notify the manager
    if (e.manager) {
      await sendEmail({
        to: e.manager.email,
        subject: `[PMF] Probation ending in ${daysRemaining} days — ${e.firstName} ${e.lastName}`,
        text: `Hi ${e.manager.firstName},\n\n${e.firstName} ${e.lastName}'s probationary period ends on ${probEnd.toDateString()}.\n\nIf they're ready for regularization, finalize their probationary PMF and HR will move them to regular status.\n\n${url}/employees/${e.id}\n`,
      });
      sent++;
    }
  }

  await audit(auth.kind === "user" ? auth.user.id : null, "PROBATION_ALERTS", "System", undefined, { sent, alerts });
  return NextResponse.json({ ok: true, sent, alerts });
}
