import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/rbac";
import { sendEmail } from "@/lib/email";
import { db } from "@/lib/db";
import { audit } from "@/lib/auth";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";

const ALLOWED_CATEGORIES = new Set([
  "Login / password issue",
  "Cannot submit / form bug",
  "Signature not working",
  "Missing or wrong PMF",
  "Notification didn't arrive",
  "Profile / personal info change",
  "Suggestion / feature request",
  "Other",
]);

const HELP_NOTIFY = process.env.HR_NOTIFY_EMAIL || "hr@sevengen.com";

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });

  // ── Rate limit: max 5 tickets per 10 minutes per user ──
  const rl = rateLimit(`help:${u.id}`, { max: 5, windowMs: 10 * 60_000 });
  if (!rl.allowed) {
    return tooManyRequests(rl, "You've sent too many helpdesk messages. Please wait a few minutes before sending another.");
  }

  try {
    const raw = await req.json();
    const { category, url } = raw;
    let { subject, body } = raw;
    if (!subject || !body) return new NextResponse("Subject and details required", { status: 400 });

    // Validate + sanitize
    if (!ALLOWED_CATEGORIES.has(category)) {
      return new NextResponse("Invalid category", { status: 400 });
    }
    if (typeof subject !== "string" || typeof body !== "string") {
      return new NextResponse("Subject and body must be strings", { status: 400 });
    }
    // Strip CR/LF from subject to prevent email header injection; cap lengths
    subject = subject.replace(/[\r\n]+/g, " ").trim().slice(0, 200);
    body = body.trim().slice(0, 5000);
    if (subject.length === 0 || body.length === 0) {
      return new NextResponse("Subject and details required", { status: 400 });
    }

    const fullUser = await db.user.findUnique({
      where: { id: u.id },
      select: { firstName: true, lastName: true, email: true, role: true, company: true, department: true },
    });

    await audit(u.id, "HELPDESK_REQUEST", "Helpdesk", u.id, { category, subject, url });

    await sendEmail({
      to: HELP_NOTIFY,
      subject: `[PMF Helpdesk] ${category} — ${subject}`,
      text: `New helpdesk request from PMF.

From: ${fullUser?.firstName} ${fullUser?.lastName} (${u.email})
Role: ${u.role}
Company: ${fullUser?.company ?? "—"}
Department: ${fullUser?.department ?? "—"}

Category: ${category}
Subject: ${subject}

Details:
${body}

Page URL: ${url ?? "—"}
Reported at: ${new Date().toISOString()}

— PMF Helpdesk`,
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[API_ERROR]", e); return new NextResponse("Server error. Please try again or contact support.", { status: 500 });
  }
}
