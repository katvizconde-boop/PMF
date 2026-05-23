import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { CareerPathsAdmin } from "@/components/CareerPathsAdmin";

export default async function CareerPathsPage() {
  await requireRole("HR_ADMIN");
  const paths = await db.careerPath.findMany({
    include: { steps: { orderBy: { sortOrder: "asc" } } },
    orderBy: { name: "asc" },
  });
  return <CareerPathsAdmin initial={JSON.parse(JSON.stringify(paths))} />;
}
