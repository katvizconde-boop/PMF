import * as Sentry from "@sentry/nextjs";
import { redactSentryEvent } from "@/lib/sentryRedact";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
    environment: process.env.NODE_ENV,
    // PII protection — never send raw passwords, signatures, tokens
    sendDefaultPii: false,
    beforeSend: redactSentryEvent,
    beforeBreadcrumb: (breadcrumb) => {
      if (breadcrumb.data) breadcrumb.data = require("@/lib/sentryRedact").redactSentryEvent({ extra: breadcrumb.data })?.extra ?? breadcrumb.data;
      return breadcrumb;
    },
    // Filter noisy errors
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
    ],
  });
}
