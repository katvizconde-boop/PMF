import nodemailer, { Transporter } from "nodemailer";
import { db } from "./db";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) return null; // fallback: console log
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const from = process.env.SMTP_FROM ?? "pmf-noreply@company.local";
  const t = getTransporter();
  if (!t) {
    console.log("\n📧 [EMAIL — console fallback; set SMTP_* in .env to actually send]");
    console.log(`   To:      ${opts.to}`);
    console.log(`   From:    ${from}`);
    console.log(`   Subject: ${opts.subject}`);
    console.log(`   ${opts.text.replace(/\n/g, "\n   ")}\n`);
    return { ok: true, logged: true };
  }
  try {
    const info = await t.sendMail({ from, to: opts.to, subject: opts.subject, text: opts.text, html: opts.html });
    return { ok: true, id: info.messageId };
  } catch (e: any) {
    console.error("Email send failed:", e.message);
    return { ok: false, error: e.message };
  }
}

/** Notify relevant people on state transitions. */
export async function notifyTransition(assignmentId: string, action: string) {
  const a = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: { employee: true, manager: true, cycle: true, template: true },
  });
  if (!a) return;

  const url = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/assignments/${a.id}`;
  const who = `${a.employee.firstName} ${a.employee.lastName}`;
  const tpl = a.template.name;
  const cycle = a.cycle.name;

  const targets: Array<{ to: string; subject: string; text: string }> = [];

  if (action === "assigned") {
    targets.push({
      to: a.employee.email,
      subject: `[PMF] New evaluation assigned — ${cycle}`,
      text: `Hi ${a.employee.firstName},\n\nA new Performance Management Form has been assigned to you:\n• Template: ${tpl}\n• Cycle: ${cycle}\n• Due: ${a.cycle.dueDate.toDateString()}\n\nPlease complete your self-assessment:\n${url}\n`,
    });
  }
  if (action === "submit-self") {
    targets.push({
      to: a.manager.email,
      subject: `[PMF] Self-assessment submitted — ${who}`,
      text: `Hi ${a.manager.firstName},\n\n${who} has submitted their self-assessment for ${cycle} (${tpl}).\n\nPlease review and complete your manager evaluation:\n${url}\n`,
    });
  }
  if (action === "submit-manager") {
    const hrs = await db.user.findMany({ where: { role: "HR_ADMIN" } });
    for (const hr of hrs) {
      targets.push({
        to: hr.email,
        subject: `[PMF] Manager evaluation ready for HR review — ${who}`,
        text: `Hi ${hr.firstName},\n\nManager ${a.manager.firstName} ${a.manager.lastName} has submitted the evaluation for ${who} (${cycle}, ${tpl}).\n\nPlease review and finalize:\n${url}\n`,
      });
    }
  }
  if (action === "finalize") {
    targets.push({
      to: a.employee.email,
      subject: `[PMF] Your evaluation is finalized — ${cycle}`,
      text: `Hi ${a.employee.firstName},\n\nYour ${cycle} performance evaluation (${tpl}) has been finalized and is now available for review.\n\nView your feedback:\n${url}\n`,
    });
    targets.push({
      to: a.manager.email,
      subject: `[PMF] Evaluation finalized — ${who}`,
      text: `Hi ${a.manager.firstName},\n\nHR has finalized the ${cycle} evaluation for ${who}.\n\n${url}\n`,
    });
  }

  await Promise.all(targets.map(sendEmail));
}
