import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { sendEmail } from "@/lib/email";
import { audit } from "@/lib/auth";

/**
 * POST /api/admin/bulk-welcome
 * HR_ADMIN only. For a given company or list of user IDs:
 *  - Generate a fresh temp password per user (Welcome-XXXX)
 *  - Hash + save the new password
 *  - Email the user with login URL + temp password + first-step guide
 *
 * Body:
 *   { company?: string, userIds?: string[], dryRun?: boolean }
 * Returns:
 *   { ok, count, sample: [{ email, tempPassword, status }] }
 */
const APP_URL = process.env.NEXTAUTH_URL || "https://sevengen.vercel.app";

function genTempPassword() {
  // 4-digit random suffix, formatted as Welcome-XXXX
  const n = Math.floor(1000 + Math.random() * 9000);
  return `Welcome-${n}`;
}

function welcomeEmailBody(firstName: string, email: string, tempPw: string) {
  return `Hi ${firstName},

Welcome to the PMF (Performance Management Form) System — SevenGen's new online tool for performance evaluations.

— YOUR LOGIN —
Website:        ${APP_URL}
Email:          ${email}
Temp password:  ${tempPw}

Please change your password on first login: My Profile → Change Password.

— FIVE-STEP QUICKSTART —
1. Open ${APP_URL} in any browser
2. Sign in with your email and the temp password above
3. Change your password right away
4. Look for your PMF on the Dashboard and click it
5. Fill in your self-assessment — the system auto-saves every keystroke

Two ways to sign:
  • Draw with your finger or mouse on the signature pad, then click "Confirm signature"
  • OR upload a photo (JPEG/PNG) of your handwritten signature

Need help? Click "Help & Support" inside the app, or email hr@sevengen.com.

Welcome aboard!
— SevenGen HR
`;
}

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") {
    return new NextResponse("Only HR can run bulk welcome.", { status: 403 });
  }

  try {
    const body = await req.json();
    const { company, userIds, dryRun, revealPasswords } = body as {
      company?: string;
      userIds?: string[];
      dryRun?: boolean;
      revealPasswords?: boolean;  // explicit opt-in to see plaintext temp passwords
    };

    if (!company && (!userIds || userIds.length === 0)) {
      return new NextResponse("Provide either 'company' or 'userIds[]'.", { status: 400 });
    }

    const where: any = { isActive: true };
    if (company) where.company = company;
    if (userIds && userIds.length > 0) where.id = { in: userIds };

    const users = await db.user.findMany({
      where,
      select: { id: true, firstName: true, lastName: true, email: true, company: true, role: true },
    });

    if (users.length === 0) {
      return NextResponse.json({ ok: true, count: 0, sample: [], note: "No matching users." });
    }

    const sample: Array<{ email: string; tempPassword: string; status: string }> = [];
    let success = 0;
    let failed = 0;

    for (const user of users) {
      const tempPw = genTempPassword();
      try {
        if (!dryRun) {
          const hashed = await bcrypt.hash(tempPw, 12);
          await db.user.update({ where: { id: user.id }, data: { passwordHash: hashed, mustChangePassword: true } });
          await sendEmail({
            to: user.email,
            subject: `Welcome to the PMF System — your login is ready`,
            text: welcomeEmailBody(user.firstName, user.email, tempPw),
          });
        }
        // Only include the plaintext password in the response if it's a dry-run
        // OR the HR admin explicitly opted in via revealPasswords flag.
        const shouldReveal = dryRun || revealPasswords === true;
        sample.push({
          email: user.email,
          tempPassword: shouldReveal ? tempPw : "[sent via email]",
          status: dryRun ? "DRY-RUN" : "SENT",
        });
        success++;
      } catch (e: any) {
        console.error("[BULK_WELCOME_USER_ERROR]", { email: user.email, error: e?.message });
        sample.push({ email: user.email, tempPassword: "[failed]", status: "FAILED" });
        failed++;
      }
    }

    if (!dryRun) {
      await audit(u.id, "BULK_WELCOME_SENT", "User", "bulk", {
        company: company ?? null,
        userIdCount: userIds?.length ?? null,
        usersProcessed: users.length,
        success,
        failed,
      });
    }

    return NextResponse.json({
      ok: true,
      count: users.length,
      success,
      failed,
      dryRun: !!dryRun,
      sample, // returned to admin UI so HR can verify / save passwords if needed
    });
  } catch (e: any) {
    console.error("[API_ERROR]", e); return new NextResponse("Server error. Please try again or contact support.", { status: 500 });
  }
}
