import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";

const isProd = process.env.NODE_ENV === "production";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  // Force secure cookies in production (HTTPS-only, __Secure- prefix)
  useSecureCookies: isProd,
  cookies: {
    sessionToken: {
      name: isProd ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
    callbackUrl: {
      name: isProd ? `__Secure-next-auth.callback-url` : `next-auth.callback-url`,
      options: { sameSite: "lax", path: "/", secure: isProd, httpOnly: true },
    },
    csrfToken: {
      name: isProd ? `__Host-next-auth.csrf-token` : `next-auth.csrf-token`,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: isProd },
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const email = creds.email.toLowerCase().trim();

        // Constant-time-ish lookup: always run bcrypt.compare against a
        // dummy hash if user doesn't exist, to avoid timing-attack enumeration.
        const user = await db.user.findUnique({ where: { email } });
        if (!user) {
          // Eat ~100ms with a real bcrypt compare so attackers can't time-detect missing emails
          await bcrypt.compare(creds.password, "$2a$12$0000000000000000000000000000000000000000000000000000");
          return null;
        }

        // ── Lockout check ──
        // 5 failed attempts → lock for 15 minutes.
        const now = new Date();
        if (user.lockedUntil && user.lockedUntil > now) {
          // Still locked — fail without revealing password validity
          return null;
        }

        const ok = await bcrypt.compare(creds.password, user.passwordHash);
        if (!ok) {
          // Increment failed-login counter
          const newCount = (user.failedLoginCount ?? 0) + 1;
          const shouldLock = newCount >= 5;
          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount: shouldLock ? 0 : newCount,
              lockedUntil: shouldLock ? new Date(now.getTime() + 15 * 60_000) : null,
            },
          });
          if (shouldLock) {
            await db.auditLog.create({
              data: {
                actorId: null,
                action: "LOGIN_LOCKED",
                resourceType: "User",
                resourceId: user.id,
                detail: JSON.stringify({ email: user.email, lockedUntilMins: 15, reason: "5 failed login attempts" }),
              },
            }).catch(() => {});
          }
          return null;
        }

        // Success — reset counters
        if (user.failedLoginCount > 0 || user.lockedUntil) {
          await db.user.update({
            where: { id: user.id },
            data: { failedLoginCount: 0, lockedUntil: null },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).id = token.uid;
      (session.user as any).role = token.role;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function audit(
  actorId: string | null,
  action: string,
  resourceType: string,
  resourceId?: string,
  detail?: any,
) {
  await db.auditLog.create({
    data: {
      actorId: actorId ?? undefined,
      action,
      resourceType,
      resourceId,
      detail: detail ? JSON.stringify(detail) : undefined,
    },
  });
}
