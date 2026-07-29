/**
 * Server-side error sanitization helpers.
 *
 * Goal: don't leak Prisma schema, DB internals, file paths, or stack traces
 * to API clients. Always log the full detail server-side (via console.error
 * which Sentry captures) and return a generic message to the client.
 */

import { NextResponse } from "next/server";

/**
 * Wrap an error in a safe 500 response.
 * The full error goes to server logs / Sentry; the client sees a generic message.
 */
export function safeError(e: unknown, opts?: { fallback?: string; status?: number }): NextResponse {
  const fallback = opts?.fallback ?? "Server error. Please try again.";
  const status = opts?.status ?? 500;

  // Log everything server-side
  try {
    const detail = e instanceof Error ? { name: e.name, message: e.message, stack: e.stack } : { value: String(e) };
    console.error("[API_ERROR]", JSON.stringify(detail));
  } catch {
    console.error("[API_ERROR] (unloggable)", e);
  }

  return new NextResponse(fallback, { status });
}

/**
 * Return a generic 400 with the user-supplied message (validated by caller).
 * Use this when the error genuinely came from user input and we want to tell them what's wrong.
 */
export function userError(msg: string, status = 400): NextResponse {
  return new NextResponse(msg, { status });
}
