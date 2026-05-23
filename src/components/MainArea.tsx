"use client";
import { useEffect, useState } from "react";
import { NotificationBell } from "./NotificationBell";

export function MainArea({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const update = () => setCollapsed(typeof window !== "undefined" && localStorage.getItem("sg.sb.collapsed") === "1");
    update();
    window.addEventListener("storage", update);
    const interval = setInterval(update, 250); // poll for same-tab change
    return () => { window.removeEventListener("storage", update); clearInterval(interval); };
  }, []);

  return (
    <main className={`flex-1 w-full min-w-0 transition-all ${collapsed ? "lg:ml-[68px]" : "lg:ml-64"}`}>
      {/* Top bar with notification bell */}
      <div className="sticky top-0 z-30 bg-gray-50/80 backdrop-blur-md border-b border-gray-100 px-4 lg:px-8 h-14 flex items-center justify-end gap-3 no-print">
        <NotificationBell />
      </div>
      <div className="p-4 pt-6 lg:p-8">
        {children}
      </div>
    </main>
  );
}
