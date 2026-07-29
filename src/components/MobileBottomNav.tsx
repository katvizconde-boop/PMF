"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, IconName } from "./Icons";

type Role = "HR_ADMIN" | "MANAGER" | "EMPLOYEE";

const TABS: { href: string; icon: IconName; label: string; roles?: Role[] }[] = [
  { href: "/dashboard", icon: "BarChart", label: "Home" },
  { href: "/team-compare", icon: "LineChart", label: "Team", roles: ["HR_ADMIN", "MANAGER"] },
  { href: "/employees", icon: "Users", label: "People", roles: ["HR_ADMIN"] },
  { href: "/kudos", icon: "Trophy", label: "Kudos" },
  { href: "/profile", icon: "User", label: "Profile" },
];

export function MobileBottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const tabs = TABS.filter((t) => !t.roles || t.roles.includes(role)).slice(0, 5);

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 no-print"
      style={{
        boxShadow: "0 -2px 12px rgba(15,23,42,0.06)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
        {tabs.map((t) => {
          const active = pathname === t.href || pathname.startsWith(t.href + "/");
          const C = Icon[t.icon];
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 transition relative active:scale-95 ${
                  active ? "text-primary-700" : "text-gray-500"
                }`}
              >
                {/* Active indicator pill */}
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-primary-600" />
                )}
                <span className={`flex items-center justify-center h-6 ${active ? "" : ""}`}>
                  <C size={22} />
                </span>
                <span className={`text-[10px] font-semibold leading-none ${active ? "" : ""}`}>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
