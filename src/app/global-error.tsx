"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: "1.5rem",
          fontFamily: "Inter, system-ui, sans-serif", background: "#f9fafb",
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: "2rem", maxWidth: 440,
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center",
          }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 20 }}>
              We've been notified and our team is looking into it. Please try again, or contact HR if the problem persists.
            </p>
            <a href="/dashboard" style={{
              display: "inline-block", padding: "10px 20px", borderRadius: 8,
              background: "#2563eb", color: "#fff", textDecoration: "none", fontWeight: 600,
            }}>Back to dashboard</a>
          </div>
        </div>
      </body>
    </html>
  );
}
