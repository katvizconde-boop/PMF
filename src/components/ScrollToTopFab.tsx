"use client";
import { useEffect, useState } from "react";

export function ScrollToTopFab() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="lg:hidden fixed right-4 z-30 w-11 h-11 rounded-full bg-primary-600 text-white shadow-lg flex items-center justify-center active:scale-90 transition no-print"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)", // sits above bottom nav
        boxShadow: "0 6px 16px rgba(37,99,235,0.35)",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
