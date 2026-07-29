import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";
import { hashPassword, generateStrongTempPassword } from "@/lib/password";

const ALLOWED_ROLES = new Set(["EMPLOYEE", "MANAGER", "HR_ADMIN"]);
const ALLOWED_EMPLOYMENT = new Set(["REGULAR", "PROBATIONARY", "CONTRACTUAL"]);

export const runtime = "nodejs";

/**
 * CSV format (header row required):
 *   firstName,lastName,email,position,company,department,role,employmentType,managerEmail,hireDate
 *
 *   role:           EMPLOYEE | MANAGER | HR_ADMIN  (default EMPLOYEE)
 *   employmentType: REGULAR | PROBATIONARY | CONTRACTUAL (default REGULAR)
 *   managerEmail:   optional — must exist or row is rejected
 *   hireDate:       ISO date YYYY-MM-DD, optional
 */

function parseCSV(text: string): Record<string, string>[] {
  // Minimal CSV parser (supports quoted fields and doubled quotes)
  const rows: string[][] = [];
  let cur = "", row: string[] = [], inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n") { row.push(cur); cur = ""; rows.push(row); row = []; }
      else if (c === "\r") { /* skip */ }
      else cur += c;
    }
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => r.some((x) => x.trim().length)).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = (r[i] ?? "").trim()));
    return obj;
  });
}

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return new NextResponse("No file", { status: 400 });

  const text = await file.text();
  const records = parseCSV(text);
  if (records.length === 0) return NextResponse.json({ ok: true, created: 0, errors: [], note: "Empty file" });

  let created = 0;
  const errors: { row: number; email: string; reason: string }[] = [];
  const createdUsers: { email: string; tempPassword: string }[] = [];

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const rowNum = i + 2; // +1 for header, +1 for 1-indexed
    const email = (r.email || "").trim().toLowerCase();
    if (!email || !r.firstName || !r.lastName) { errors.push({ row: rowNum, email, reason: "Missing required fields (firstName/lastName/email)" }); continue; }

    // Validate role + employment type against allowlist
    const role = (r.role || "EMPLOYEE").trim().toUpperCase();
    const employmentType = (r.employmentType || "REGULAR").trim().toUpperCase();
    if (!ALLOWED_ROLES.has(role)) { errors.push({ row: rowNum, email, reason: `Invalid role: "${r.role}". Allowed: EMPLOYEE, MANAGER, HR_ADMIN.` }); continue; }
    if (!ALLOWED_EMPLOYMENT.has(employmentType)) { errors.push({ row: rowNum, email, reason: `Invalid employmentType: "${r.employmentType}".` }); continue; }

    const exists = await db.user.findUnique({ where: { email } });
    if (exists) { errors.push({ row: rowNum, email, reason: "Email already exists" }); continue; }
    let managerId: string | null = null;
    if (r.managerEmail) {
      const m = await db.user.findUnique({ where: { email: r.managerEmail.trim().toLowerCase() } });
      if (!m) { errors.push({ row: rowNum, email, reason: `Manager ${r.managerEmail} not found` }); continue; }
      managerId = m.id;
    }

    // Generate strong per-user temp password — must be changed on first login
    const tempPassword = generateStrongTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    try {
      await db.user.create({
        data: {
          email,
          firstName: r.firstName, lastName: r.lastName,
          position: r.position || null,
          company: r.company || null,
          department: r.department || null,
          role: role as any,
          employmentType: employmentType as any,
          managerId,
          hireDate: r.hireDate ? new Date(r.hireDate) : null,
          passwordHash,
          mustChangePassword: true,
        },
      });
      created++; createdUsers.push({ email, tempPassword });
    } catch (e: any) {
      errors.push({ row: rowNum, email, reason: e.message });
    }
  }

  await audit(u.id, "IMPORT_USERS_CSV", "User", undefined, { created, errors: errors.length });
  return NextResponse.json({ ok: true, created, errors, createdUsers });
}
