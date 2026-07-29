"use client";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/Toast";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize Sentry client-side only if DSN is configured
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import("../../sentry.client.config").catch(() => {});
    }
  }, []);

  return (
    <SessionProvider>
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  );
}
