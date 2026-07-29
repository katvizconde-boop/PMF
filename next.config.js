/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Prevent embedding the app in <iframe> — clickjacking protection
  { key: "X-Frame-Options", value: "DENY" },

  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Force HTTPS for 2 years; include subdomains
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },

  // Don't leak full URLs across origins
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Disable powerful APIs (camera, mic, geolocation) — PMF doesn't use them
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },

  // Content Security Policy — balance security with Next.js + analytics needs
  //
  // 'unsafe-inline' on script-src is needed because Next.js inlines hydration scripts.
  // 'unsafe-eval' is needed for React's dev mode (in prod build it's still safe).
  // For img-src we allow data: for signatures and profile pics.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-insights.com https://*.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob:",
      "connect-src 'self' https://*.vercel-insights.com https://*.vercel-scripts.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://*.ingest.us.sentry.io https://o*.ingest.sentry.io https://openrouter.ai https://api.anthropic.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

module.exports = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};
