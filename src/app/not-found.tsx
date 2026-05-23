import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="en">
      <head>
        <title>Page not found · PMF System</title>
      </head>
      <body style={{ margin: 0, fontFamily: "Segoe UI, Arial, sans-serif", background: "linear-gradient(135deg, #1e3a5a 0%, #0033ff 100%)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <div style={{ textAlign: "center", maxWidth: 540, padding: 32 }}>
          <div style={{ marginBottom: 32 }}>
            <img src="/pmf-logo.png" alt="PMF System" style={{ height: 80, filter: "brightness(0) invert(1)", opacity: 0.9 }} />
          </div>

          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, marginBottom: 8, color: "#00c3ff" }}>404</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
            Page not found
          </h1>
          <p style={{ fontSize: 16, opacity: 0.9, lineHeight: 1.5, marginBottom: 24 }}>
            The page you're looking for doesn't exist, or it may have been moved or deleted.
            <br />
            If you bookmarked an evaluation link, the data may have changed since then.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/dashboard" style={{ background: "#fff", color: "#0033ff", padding: "10px 20px", borderRadius: 8, fontWeight: 600, textDecoration: "none", fontSize: 14 }}>
              ← Back to Dashboard
            </Link>
            <Link href="/" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", padding: "10px 20px", borderRadius: 8, fontWeight: 600, textDecoration: "none", fontSize: 14, border: "1px solid rgba(255,255,255,0.3)" }}>
              Sign in / Home
            </Link>
          </div>

          <p style={{ fontSize: 12, opacity: 0.7, marginTop: 32 }}>
            If you keep seeing this error, contact your HR team and mention the URL you tried to open.
          </p>
        </div>
      </body>
    </html>
  );
}
