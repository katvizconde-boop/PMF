"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (res.ok) setSent(true);
    else setError(await res.text());
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <Link href="/login" className="text-sm text-gray-500 hover:text-gray-800 mb-4 inline-block">← Back to sign in</Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Forgot your password?</h1>
        <p className="text-sm text-gray-500 mb-6">
          Enter the email tied to your PMF account. We'll send a password-reset request to HR — they'll contact you with next steps within 1 business day.
        </p>

        {sent ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
            <div className="font-bold mb-1">Request received ✓</div>
            <p>
              We've notified HR that you need a password reset for <strong>{email}</strong>. They'll reach out to you directly to verify your identity and issue a temporary password.
            </p>
            <p className="mt-2 text-xs text-emerald-700">If you don't hear back within 1 business day, contact HR at <a className="underline" href="mailto:hr@sevengen.com">hr@sevengen.com</a>.</p>
            <Link href="/login" className="mt-4 inline-block btn btn-primary text-sm">Return to sign in</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-2.5">{error}</div>}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-md hover:shadow-lg transition active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Sending…" : "Request password reset"}
            </button>
            <p className="text-xs text-gray-500 text-center">
              HR will verify your identity and issue a temporary password. For security, we don't allow self-service resets.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
