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
    <main className={`main-content flex-1 w-full min-w-0 transition-all scroll-smooth ${collapsed ? "lg:ml-[68px]" : "lg:ml-64"}`}>
      {/* Top bar with notification bell — leaves room for mobile hamburger */}
      <div className="sticky top-0 z-30 bg-gray-50/80 backdrop-blur-md border-b border-gray-100 pl-16 pr-4 lg:px-8 h-14 flex items-center justify-end gap-3 no-print">
        <NotificationBell />
      </div>
      <div className="p-4 pt-5 lg:p-8 pb-24 lg:pb-8 animate-fade-in">
        {children}
      </div>
    </main>
  );
}
