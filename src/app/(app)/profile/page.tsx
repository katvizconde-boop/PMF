import { requireUser } from "@/lib/rbac";
import { db } from "@/lib/db";
import { ProfileForm } from "@/components/ProfileForm";

export default async function ProfilePage({ searchParams }: { searchParams: { must_change?: string } }) {
  const u = await requireUser();
  const me = await db.user.findUnique({
    where: { id: u.id },
    include: { manager: true },
  });
  if (!me) return null;
  const mustChange = searchParams.must_change === "1" || me.mustChangePassword;
  return (
    <div className="space-y-4">
      {mustChange && (
        <div className="card border-amber-300 bg-amber-50">
          <div className="flex items-start gap-3">
            <div className="text-amber-600 text-2xl">🔒</div>
            <div>
              <h3 className="font-bold text-amber-800">You must change your password before continuing</h3>
              <p className="text-sm text-amber-700 mt-1">
                You're using a temporary password issued by HR. For security, please change it now using the
                <strong> Change Password </strong>tab below. After you change it, you'll have full access to the app.
              </p>
            </div>
          </div>
        </div>
      )}
      <ProfileForm
        user={JSON.parse(JSON.stringify(me))}
      />
    </div>
  );
}
