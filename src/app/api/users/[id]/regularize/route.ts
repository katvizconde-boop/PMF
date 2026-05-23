import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });

  const emp = await db.user.findUnique({ where: { id: params.id }, include: { manager: true } });
  if (!emp) return new NextResponse("Not found", { status: 404 });
  if (emp.employmentType === "REGULAR") return new NextResponse("Already regular", { status: 409 });

  await db.user.update({
    where: { id: emp.id },
    data: { employmentType: "REGULAR" },
  });
  await audit(u.id, "REGULARIZE_EMPLOYEE", "User", emp.id, { from: emp.employmentType, to: "REGULAR" });

  // Notify the employee + their manager
  const url = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/employees/${emp.id}`;
  sendEmail({
    to: emp.email,
    subject: "🎉 Congratulations — You have been regularized",
    text: `Hi ${emp.firstName},\n\nYou are officially a REGULAR employee of the company effective today.\nYour future evaluations will now use the Regular Employee quarterly template.\n\nCongratulations from the HR team!`,
  }).catch(() => {});
  if (emp.manager) {
    sendEmail({
      to: emp.manager.email,
      subject: `[PMF] ${emp.firstName} ${emp.lastName} has been regularized`,
      text: `Hi ${emp.manager.firstName},\n\n${emp.firstName} ${emp.lastName} has been moved from probationary to regular status.\nGoing forward, use the Regular Employee template for their evaluations.\n\n${url}`,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
