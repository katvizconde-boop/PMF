// Next.js calls this on server start.
//   1) Asserts required env vars are present in production (fail fast).
//   2) Loads Sentry config based on runtime if DSN is set.

export async function register() {
  // ── Production env var assertions ────────────────────────────────
  // Fail fast in production if anything critical is missing. Logged to stderr;
  // the request that triggers the check returns 500.
  if (process.env.NODE_ENV === "production") {
    const required = [
      "DATABASE_URL",
      "NEXTAUTH_SECRET",
      "NEXTAUTH_URL",
    ];
    const recommended = [
      "CRON_SECRET",
      "HR_NOTIFY_EMAIL",
    ];

    const missingRequired = required.filter((k) => !process.env[k]);
    const missingRecommended = recommended.filter((k) => !process.env[k]);

    if (missingRequired.length > 0) {
      const msg = `[STARTUP] CRITICAL — missing required env vars in production: ${missingRequired.join(", ")}`;
      console.error(msg);
      throw new Error(msg);
    }
    if (missingRecommended.length > 0) {
      console.warn(`[STARTUP] Warning — recommended env vars missing: ${missingRecommended.join(", ")}. Some features (crons, password reset, helpdesk emails) may not work properly.`);
    }
    // NEXTAUTH_URL must be HTTPS in production (cookies depend on it)
    if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith("https://")) {
      const msg = `[STARTUP] CRITICAL — NEXTAUTH_URL must be HTTPS in production. Got: ${process.env.NEXTAUTH_URL}`;
      console.error(msg);
      throw new Error(msg);
    }
  }

  // ── Sentry ───────────────────────────────────────────────────────
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
