import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireUser } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/Sidebar";
import { MainArea } from "@/components/MainArea";
import { OnboardingTour } from "@/components/OnboardingTour";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ScrollToTopFab } from "@/components/ScrollToTopFab";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const u = await requireUser();
  const dbUser = await db.user.findUnique({
    where: { id: u.id },
    select: { onboardingCompleted: true, mustChangePassword: true },
  });

  // ── Force password change before app access ──
  // If the user has a temp password, send them to /profile. We read the current
  // pathname from `x-pathname` (set by middleware.ts) — fall back to `next-url`
  // and `referer` so the check never accidentally creates a redirect loop or
  // blank page when the header isn't available.
  if (dbUser?.mustChangePassword) {
    const h = headers();
    const path =
      h.get("x-pathname") ??
      h.get("x-invoke-path") ??
      (() => {
        const nextUrl = h.get("next-url");
        if (nextUrl) {
          try { return new URL(nextUrl, "http://x").pathname; } catch { return ""; }
        }
        return "";
      })();
    const alreadyOnProfile = path.startsWith("/profile");
    if (!alreadyOnProfile && path !== "") {
      redirect("/profile?must_change=1");
    }
    // If we couldn't determine the path (path === ""), DON'T redirect.
    // The user can still navigate to /profile from the nav, and we avoid
    // any chance of a redirect loop or blank page.
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={u} />
      <MainArea>{children}</MainArea>
      <OnboardingTour role={u.role} alreadyCompleted={dbUser?.onboardingCompleted ?? false} />
      <MobileBottomNav role={u.role} />
      <ScrollToTopFab />
    </div>
  );
}
