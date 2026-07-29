/**
 * In-memory rate limiter for Next.js API routes.
 *
 * Token-bucket-ish: each (key) gets up to `max` allowed actions per `windowMs`.
 * Keys are arbitrary strings — pass `${route}:${ip}` or `${route}:${userId}`.
 *
 * Limits & notes:
 *   - In-memory only. Vercel serverless functions have their own per-instance memory;
 *     a determined attacker hitting different cold-starts can briefly exceed the limit.
 *   - Acceptable for protecting against accidental loops + casual spam.
 *   - For real DoS protection at >250 users scale, upgrade to Upstash Redis or Vercel KV.
 *   - Includes automatic cleanup of expired entries to keep memory bounded.
 */

type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

// Periodic cleanup — runs every minute to evict expired buckets
const CLEANUP_INTERVAL = 60_000;
let cleanupTimer: NodeJS.Timeout | null = null;

function scheduleCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [k, b] of store.entries()) {
      if (b.resetAt <= now) store.delete(k);
    }
    // Hard ceiling — if the map grows beyond 10K entries (DoS attempt), wipe it
    if (store.size > 10_000) store.clear();
  }, CLEANUP_INTERVAL);
  // Don't keep the process alive on serverless cold starts
  cleanupTimer.unref?.();
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
  retryAfterSec: number;
};

/**
 * Check if `key` is within its rate budget. Increments the counter on success.
 *
 * Usage:
 *   const rl = rateLimit(`forgot-password:${ip}`, { max: 5, windowMs: 60_000 });
 *   if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, {
 *     status: 429, headers: { "Retry-After": String(rl.retryAfterSec) }
 *   });
 */
export function rateLimit(
  key: string,
  opts: { max: number; windowMs: number }
): RateLimitResult {
  scheduleCleanup();
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const newBucket = { count: 1, resetAt: now + opts.windowMs };
    store.set(key, newBucket);
    return {
      allowed: true,
      remaining: opts.max - 1,
      resetInMs: opts.windowMs,
      retryAfterSec: 0,
    };
  }

  if (bucket.count >= opts.max) {
    const resetInMs = bucket.resetAt - now;
    return {
      allowed: false,
      remaining: 0,
      resetInMs,
      retryAfterSec: Math.ceil(resetInMs / 1000),
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: opts.max - bucket.count,
    resetInMs: bucket.resetAt - now,
    retryAfterSec: 0,
  };
}

/** Pull the client IP from a Request — Vercel sets x-forwarded-for. */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

/** Convenience: build a standard 429 response. */
export function tooManyRequests(rl: RateLimitResult, msg?: string) {
  return new Response(
    msg ?? `Too many requests. Try again in ${rl.retryAfterSec}s.`,
    {
      status: 429,
      headers: {
        "Content-Type": "text/plain",
        "Retry-After": String(rl.retryAfterSec),
        "X-RateLimit-Reset-Ms": String(rl.resetInMs),
      },
    }
  );
}
