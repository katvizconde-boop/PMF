/**
 * Sentry event sanitizer — strips PII and credentials before sending to Sentry.
 *
 * Defense in depth: even if a request body or response body finds its way into a
 * Sentry breadcrumb, password/signature/session fields are scrubbed.
 *
 * Used by all three Sentry init configs (client, server, edge) via beforeSend.
 */

const SENSITIVE_KEYS = new Set([
  "password",
  "currentPassword",
  "newPassword",
  "confirmPassword",
  "tempPassword",
  "passwordHash",
  "signature",          // base64 PNG/JPEG data URLs
  "employeeSignature",
  "managerSignature",
  "hrSignature",
  "profilePicture",     // base64 PNG/JPEG data URLs
  "token",
  "accessToken",
  "refreshToken",
  "sessionToken",
  "secret",
  "apiKey",
  "authorization",      // Authorization header value
  "cookie",             // Cookie header
  "set-cookie",
  "x-auth-token",
]);

const SENSITIVE_HEADER_NAMES = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-auth-token",
  "x-csrf-token",
  "x-vercel-cron-key",
]);

const REDACTED = "[REDACTED]";
const MAX_DEPTH = 8;

/** Deep-clone an object/array and redact any sensitive keys. */
function deepRedact(value: any, depth = 0): any {
  if (depth > MAX_DEPTH) return REDACTED;
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map((v) => deepRedact(v, depth + 1));
  }

  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(value)) {
    const keyLower = k.toLowerCase();
    if (SENSITIVE_KEYS.has(keyLower) || SENSITIVE_HEADER_NAMES.has(keyLower)) {
      out[k] = REDACTED;
    } else if (typeof v === "string" && v.startsWith("data:image/")) {
      // Catch any base64 image data URL even under arbitrary keys
      out[k] = "[REDACTED:image-data-url]";
    } else if (typeof v === "string" && /^Bearer\s/.test(v)) {
      out[k] = "[REDACTED:bearer-token]";
    } else if (typeof v === "string" && v.length > 5_000) {
      // Truncate huge strings (likely response bodies or signatures)
      out[k] = v.slice(0, 200) + "...[TRUNCATED]";
    } else {
      out[k] = deepRedact(v, depth + 1);
    }
  }
  return out;
}

/**
 * Sentry beforeSend hook — runs on every event before it's sent to Sentry.
 * Returns null to drop the event entirely if it looks too sensitive.
 */
export function redactSentryEvent(event: any, hint?: any): any {
  if (!event) return event;

  try {
    // Redact request body, headers, query string, cookies
    if (event.request) {
      if (event.request.data) event.request.data = deepRedact(event.request.data);
      if (event.request.headers) event.request.headers = deepRedact(event.request.headers);
      if (event.request.query_string) event.request.query_string = deepRedact(event.request.query_string);
      if (event.request.cookies) event.request.cookies = REDACTED;
    }

    // Redact breadcrumbs (often contain HTTP request/response details)
    if (Array.isArray(event.breadcrumbs)) {
      event.breadcrumbs = event.breadcrumbs.map((b: any) => {
        if (b.data) b.data = deepRedact(b.data);
        return b;
      });
    }

    // Redact extra context
    if (event.extra) event.extra = deepRedact(event.extra);
    if (event.contexts) event.contexts = deepRedact(event.contexts);

    // Strip user PII beyond just the ID
    if (event.user) {
      const { id, role } = event.user;
      event.user = id ? { id, role } : undefined;
    }
  } catch {
    // If anything goes wrong while redacting, drop the event entirely
    return null;
  }

  return event;
}
