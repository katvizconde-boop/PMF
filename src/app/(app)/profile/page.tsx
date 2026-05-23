import { requireUser } from "@/lib/rbac";
import { db } from "@/lib/db";
import { ProfileForm } from "@/components/ProfileForm";

export default async function ProfilePage() {
  const u = await requireUser();
  const me = await db.user.findUnique({
    where: { id: u.id },
    include: { manager: true },
  });
  if (!me) return null;
  return (
    <ProfileForm
      user={JSON.parse(JSON.stringify(me))}
    />
  );
}
