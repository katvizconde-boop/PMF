"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Logo } from "./Logo";
import { Icon, IconName } from "./Icons";

type User = { id: string; name: string; email: string; role: "HR_ADMIN" | "MANAGER" | "EMPLOYEE" };
type Link = { href: string; icon: IconName; label: string; roles?: User["role"][] };
type Section = { label: string; links: Link[] };

const SECTIONS: Section[] = [
  {
    label: "",
    links: [{ href: "/dashboard", icon: "BarChart", label: "Dashboard" }],
  },
  {
    label: "Performance",
    links: [
      { href: "/team-compare", icon: "LineChart", label: "Team Profile", roles: ["HR_ADMIN", "MANAGER"] },
      { href: "/employees", icon: "Users", label: "Employees", roles: ["HR_ADMIN"] },
      { href: "/teams", icon: "Users", label: "Teams", roles: ["HR_ADMIN"] },
      { href: "/templates", icon: "Clipboard", label: "Templates", roles: ["HR_ADMIN"] },
    ],
  },
  {
    label: "Engagement",
    links: [
      { href: "/kudos", icon: "Trophy", label: "Kudos" },
      { href: "/career-paths", icon: "GraduationCap", label: "Career Paths", roles: ["HR_ADMIN"] },
    ],
  },
  {
    label: "Insights",
    links: [
      { href: "/heat-map", icon: "PieChart", label: "Heat Map", roles: ["HR_ADMIN"] },
      { href: "/recommendations", icon: "Lock", label: "Recommendations", roles: ["HR_ADMIN"] },
      { href: "/compliance", icon: "Doc", label: "Compliance", roles: ["HR_ADMIN"] },
    ],
  },
  {
    label: "Admin",
    links: [
      { href: "/admin", icon: "Settings", label: "Settings", roles: ["HR_ADMIN"] },
    ],
  },
  {
    label: "Account",
    links: [
      { href: "/profile", icon: "User", label: "My Profile" },
      { href: "/help",    icon: "Info", label: "Help & Support" },
    ],
  },
];

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);            // mobile drawer
  const [collapsed, setCollapsed] = useState(false);  // desktop collapse

  // Persist collapse state
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("sg.sb.collapsed") : null;
    if (saved === "1") setCollapsed(true);
  }, []);
  function toggleCollapse() {
    setCollapsed((c) => {
      const v = !c;
      try { localStorage.setItem("sg.sb.collapsed", v ? "1" : "0"); } catch {}
      return v;
    });
  }

  const filterLinks = (links: Link[]) => links.filter((l) => !l.roles || l.roles.includes(user.role));
  const visibleSections = SECTIONS
    .map((s) => ({ ...s, links: filterLinks(s.links) }))
    .filter((s) => s.links.length > 0);

  const initial = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
      {/* Mobile hamburger */}
      <button
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 w-10 h-10 rounded-lg bg-gray-900 text-white flex items-center justify-center shadow-lg no-print"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
      </button>

      {/* Desktop collapse toggle */}
      <button
        aria-label="Collapse sidebar"
        onClick={toggleCollapse}
        className={`hidden lg:flex fixed top-4 z-50 w-7 h-7 rounded-md bg-white border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 items-center justify-center shadow-sm no-print transition-all ${collapsed ? "left-[60px]" : "left-[240px]"}`}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed ? "rotate(180deg)" : "none" }}><path d="M15 18l-6-6 6-6"/></svg>
      </button>

      {/* Mobile backdrop */}
      {open && <div className="lg:hidden fixed inset-0 bg-black/40 z-40 no-print" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed left-0 top-0 bottom-0 flex flex-col no-print transition-all z-50 bg-white
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
          ${collapsed ? "lg:w-[68px]" : "lg:w-64"} w-64`}
        style={{ borderRight: "1px solid #e5e7eb" }}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-gray-100 ${collapsed ? "justify-center" : "px-5"}`}>
          {collapsed ? (
            <img src="/logos/7gen.jpg" alt="7GEN" style={{ height: 36, width: "auto", objectFit: "contain" }} />
          ) : (
            <Logo variant="light" size="md" />
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          {visibleSections.map((sec, si) => (
            <div key={si} className={`${si > 0 ? "mt-5" : ""} ${collapsed ? "px-2" : "px-3"}`}>
              {sec.label && !collapsed && (
                <div className="px-2 pb-2 text-[10px] font-bold tracking-[0.14em] uppercase text-gray-400">{sec.label}</div>
              )}
              <ul className="space-y-0.5">
                {sec.links.map((l) => {
                  const active = pathname === l.href || pathname.startsWith(l.href + "/");
                  return (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        onClick={() => setOpen(false)}
                        title={collapsed ? l.label : undefined}
                        className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                          active
                            ? "bg-primary-50 text-primary-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        } ${collapsed ? "justify-center" : ""}`}
                      >
                        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">{(() => { const C = Icon[l.icon]; return <C size={18} />; })()}</span>
                        {!collapsed && <span className="truncate">{l.label}</span>}
                        {!collapsed && active && <span className="ml-auto w-1 h-4 rounded-full bg-primary-600" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="border-t border-gray-100 p-3">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center" title={user.name}>
                {initial}
              </div>
              <button onClick={() => signOut({ callbackUrl: "/login" })} title="Sign out" className="text-sm text-gray-400 hover:text-red-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-1">
              <div className="w-9 h-9 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">{user.name}</div>
                <div className="text-xs text-gray-500 truncate">{user.role.replace("_", " ")}</div>
              </div>
              <button onClick={() => signOut({ callbackUrl: "/login" })} title="Sign out" className="p-1 text-gray-400 hover:text-red-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
