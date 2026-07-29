import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

/**
 * GET /api/users/export
 *
 * HR_ADMIN only. Returns the full employee list as a CSV download.
 * Excludes sensitive fields (passwordHash, signatures, profilePicture base64).
 *
 * Query params (all optional):
 *   ?company=M2.0 Communications  — filter by company
 *   ?department=Marketing         — filter by department
 *   ?role=EMPLOYEE                — filter by role
 *   ?active=true                  — only active users (planned; currently no isActive column)
 */

function csvEscape(v: any): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export async function GET(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") {
    return new NextResponse("Only HR can export employee data.", { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const company = url.searchParams.get("company");
    const department = url.searchParams.get("department");
    const role = url.searchParams.get("role");

    const where: any = {};
    if (company) where.company = company;
    if (department) where.department = department;
    if (role) where.role = role;

    const users = await db.user.findMany({
      where,
      include: {
        manager: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: [{ company: "asc" }, { department: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
    });

    const headers = [
      "First Name", "Middle Name", "Last Name", "Email",
      "Role", "Employment Type", "Company", "Department", "Position",
      "Hire Date", "Manager Name", "Manager Email",
      "Phone", "Address", "Emergency Contact",
      "Must Change Password", "Failed Login Attempts", "Locked Until",
      "Onboarding Completed", "Created At",
    ];

    const rows = [headers.map(csvEscape).join(",")];

    for (const user of users) {
      rows.push([
        user.firstName,
        user.middleName ?? "",
        user.lastName,
        user.email,
        user.role,
        user.employmentType,
        user.company ?? "",
        user.department ?? "",
        user.position ?? "",
        user.hireDate ? new Date(user.hireDate).toISOString().slice(0, 10) : "",
        user.manager ? `${user.manager.firstName} ${user.manager.lastName}` : "",
        user.manager?.email ?? "",
        user.phone ?? "",
        user.address ?? "",
        user.emergencyContact ?? "",
        (user as any).mustChangePassword ? "YES" : "no",
        String((user as any).failedLoginCount ?? 0),
        (user as any).lockedUntil ? new Date((user as any).lockedUntil).toISOString() : "",
        user.onboardingCompleted ? "YES" : "no",
        new Date(user.createdAt).toISOString(),
      ].map(csvEscape).join(","));
    }

    const csv = rows.join("\n");

    await audit(u.id, "EXPORT_EMPLOYEE_LIST", "User", "bulk", {
      filters: { company, department, role },
      rowCount: users.length,
    });

    const filename = `pmf-employees-${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    console.error("[API_ERROR]", e);
    return new NextResponse("Export failed. Please try again or contact support.", { status: 500 });
  }
}
