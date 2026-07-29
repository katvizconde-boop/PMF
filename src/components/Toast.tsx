"use client";
/**
 * Toast notification system — interactive feedback for user actions.
 * Usage:
 *   import { useToast, ToastProvider } from "@/components/Toast";
 *   const toast = useToast();
 *   toast.success("Saved!");
 *   toast.error("Something failed.");
 *   toast.info("Check your inbox");
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Icon } from "./Icons";

type ToastKind = "success" | "error" | "info" | "warning";
type ToastItem = { id: string; kind: ToastKind; message: string; ttl: number };

type ToastApi = {
  success: (msg: string, opts?: { ttl?: number }) => void;
  error:   (msg: string, opts?: { ttl?: number }) => void;
  info:    (msg: string, opts?: { ttl?: number }) => void;
  warning: (msg: string, opts?: { ttl?: number }) => void;
};

const Ctx = createContext<ToastApi | null>(null);

const KIND_STYLE: Record<ToastKind, { bg: string; border: string; text: string; ring: string }> = {
  success: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", ring: "text-emerald-600" },
  error:   { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-800",     ring: "text-red-600" },
  warning: { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-800",   ring: "text-amber-600" },
  info:    { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-800",    ring: "text-blue-600" },
};

function iconFor(k: ToastKind) {
  if (k === "success") return Icon.Check;
  if (k === "error")   return Icon.X;
  if (k === "warning") return Icon.Alert;
  return Icon.Info;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((kind: ToastKind, message: string, ttl = 3500) => {
    const id = Math.random().toString(36).slice(2);
    setItems((arr) => [...arr, { id, kind, message, ttl }]);
    setTimeout(() => setItems((arr) => arr.filter((t) => t.id !== id)), ttl);
  }, []);

  const api: ToastApi = {
    success: (m, o) => push("success", m, o?.ttl),
    error:   (m, o) => push("error", m, o?.ttl ?? 5000),
    info:    (m, o) => push("info", m, o?.ttl),
    warning: (m, o) => push("warning", m, o?.ttl),
  };

  return (
    <Ctx.Provider value={api}>
      {children}
      {/* Stack of toasts */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-[92vw] w-[360px] pointer-events-none">
        {items.map((t) => {
          const Style = KIND_STYLE[t.kind];
          const I = iconFor(t.kind);
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto rounded-xl border ${Style.bg} ${Style.border} shadow-lg px-4 py-3 flex items-start gap-3 animate-slide-in-r`}
            >
              <div className={`flex-shrink-0 ${Style.ring} mt-0.5`}><I size={18} /></div>
              <div className={`flex-1 text-sm font-medium ${Style.text}`}>{t.message}</div>
              <button
                onClick={() => setItems((arr) => arr.filter((x) => x.id !== t.id))}
                className={`flex-shrink-0 ${Style.ring} hover:opacity-70`}
                aria-label="Dismiss"
              >
                <Icon.X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Fallback — log to console if Provider missing, so app doesn't crash
    return {
      success: (m) => console.log("[toast/success]", m),
      error:   (m) => console.error("[toast/error]", m),
      info:    (m) => console.info("[toast/info]", m),
      warning: (m) => console.warn("[toast/warn]", m),
    };
  }
  return ctx;
}
