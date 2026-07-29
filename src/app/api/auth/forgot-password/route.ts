import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { audit } from "@/lib/auth";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rateLimit";

/**
 * POST /api/auth/forgot-password
 * Body: { email: string }
 *
 * Doesn't reveal whether the email exists (to prevent enumeration).
 * Notifies HR with the user's identity so they can verify and issue a temp password.
 * Also writes an audit-log row so HR can see all open reset requests in the admin tools.
 */
const HR_NOTIFY = process.env.HR_NOTIFY_EMAIL || "hr@sevengen.com";

export async function POST(req: Request) {
  // ── Rate limit: per-IP (5/min) and per-email (3/hour) ──
  const ip = getClientIp(req);
  const ipLimit = rateLimit(`forgot:ip:${ip}`, { max: 5, windowMs: 60_000 });
  if (!ipLimit.allowed) return tooManyRequests(ipLimit, "Too many reset requests from your network. Try again shortly.");

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return new NextResponse("Email required", { status: 400 });
    }
    if (email.length > 254) {
      return new NextResponse("Email too long.", { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Per-email throttle: max 3 reset requests per hour for the same email
    const emailLimit = rateLimit(`forgot:email:${cleanEmail}`, { max: 3, windowMs: 3600_000 });
    if (!emailLimit.allowed) {
      // Don't reveal whether email exists — return 200 OK to prevent enumeration
      return NextResponse.json({ ok: true });
    }
    const user = await db.user.findUnique({ where: { email: cleanEmail } });

    // Always respond OK to prevent email enumeration — even if user not found
    if (!user) {
      // Still log the attempt for HR visibility
      await audit(null, "PASSWORD_RESET_REQUESTED_UNKNOWN", "User", cleanEmail, {
        email: cleanEmail, note: "Email not found in system",
      }).catch(() => {});
      return NextResponse.json({ ok: true });
    }

    // Audit-log this request so HR can see all pending resets in the audit panel
    await audit(user.id, "PASSWORD_RESET_REQUESTED", "User", user.id, {
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      company: user.company,
      requestedAt: new Date().toISOString(),
    });

    // Notify HR
    await sendEmail({
      to: HR_NOTIFY,
      subject: `Password reset requested — ${user.firstName} ${user.lastName}`,
      text: `Hi HR,

${user.firstName} ${user.lastName} (${user.email}) has requested a password reset for the PMF System.

User details:
- Name: ${user.firstName} ${user.lastName}
- Email: ${user.email}
- Company: ${user.company ?? "—"}
- Department: ${user.department ?? "—"}
- Role: ${user.role}

Next steps:
1. Verify the requester's identity through a separate channel (Viber/call/in-person).
2. Issue a temporary password via the Admin > Users page.
3. Share the temporary password securely and ask them to change it on first login.

This reset request was logged in the audit trail.

— PMF Automated Notification`,
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[API_ERROR]", e); return new NextResponse("Server error. Please try again or contact support.", { status: 500 });
  }
}
