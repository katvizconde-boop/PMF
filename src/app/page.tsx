import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/rbac";

export default async function Home() {
  const u = await getSessionUser();
  if (!u) redirect("/login");
  redirect("/dashboard");
}
