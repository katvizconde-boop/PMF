import { requireUser } from "@/lib/rbac";
import { db } from "@/lib/db";
import { KudosWall } from "@/components/KudosWall";

export default async function KudosPage() {
  const u = await requireUser();
  const allUsers = await db.user.findMany({
    where: { id: { not: u.id } },
    select: { id: true, firstName: true, lastName: true, position: true, department: true, company: true, profilePicture: true },
    orderBy: { firstName: "asc" },
  });
  return <KudosWall currentUserId={u.id} users={allUsers} />;
}
