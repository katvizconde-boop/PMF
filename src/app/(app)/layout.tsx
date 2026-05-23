import { requireUser } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/Sidebar";
import { MainArea } from "@/components/MainArea";
import { OnboardingTour } from "@/components/OnboardingTour";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const u = await requireUser();
  const dbUser = await db.user.findUnique({ where: { id: u.id }, select: { onboardingCompleted: true } });
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={u} />
      <MainArea>{children}</MainArea>
      <OnboardingTour role={u.role} alreadyCompleted={dbUser?.onboardingCompleted ?? false} />
    </div>
  );
}
