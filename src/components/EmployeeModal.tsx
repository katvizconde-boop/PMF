"use client";
import { useState } from "react";
import { COMPANIES, DEPARTMENTS_BY_COMPANY } from "@/lib/companies";

export type EmployeeFormData = {
  firstName: string; lastName: string; email: string; position: string;
  company: string; department: string;
  employmentType: string; role: string; managerId: string;
  password?: string;
};

export function EmployeeModal({
  title, initial, managers, onClose, onSave, departmentsByCompany,
}: {
  title: string;
  initial?: Partial<EmployeeFormData>;
  managers: { id: string; name: string; position: string | null }[];
  onClose: () => void;
  onSave: (d: EmployeeFormData) => Promise<void> | void;
  departmentsByCompany?: Record<string, string[]>;
}) {
  const [form, setForm] = useState<EmployeeFormData>({
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    email: initial?.email ?? "",
    position: initial?.position ?? "",
    company: initial?.company ?? COMPANIES[0],
    department: initial?.department ?? "",
    employmentType: initial?.employmentType ?? "REGULAR",
    role: initial?.role ?? "EMPLOYEE",
    managerId: initial?.managerId ?? "",
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof EmployeeFormData) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  const deptSuggestions = (departmentsByCompany?.[form.company]) ?? DEPARTMENTS_BY_COMPANY[form.company] ?? [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">First Name</label><input className="input" required value={form.firstName} onChange={set("firstName")} /></div>
            <div><label className="label">Last Name</label><input className="input" required value={form.lastName} onChange={set("lastName")} /></div>
          </div>
          <div><label className="label">Email</label><input className="input" type="email" required value={form.email} onChange={set("email")} /></div>
          <div><label className="label">Position</label><input className="input" required value={form.position} onChange={set("position")} /></div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Company</label>
              <select className="input" required value={form.company} onChange={set("company")}>
                {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <input list="dept-suggestions" className="input" required value={form.department} onChange={set("department")} placeholder="Type or choose…" />
              <datalist id="dept-suggestions">
                {deptSuggestions.map((d) => <option key={d} value={d} />)}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={set("role")}>
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="HR_ADMIN">HR Admin</option>
              </select>
            </div>
            <div>
              <label className="label">Employment Type</label>
              <select className="input" value={form.employmentType} onChange={set("employmentType")}>
                <option value="REGULAR">Regular Employee</option>
                <option value="PROBATIONARY">Probationary</option>
                <option value="CONTRACTUAL">Contractual</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Supervisor / Manager</label>
            <select className="input" value={form.managerId} onChange={set("managerId")}>
              <option value="">— None —</option>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.name}{m.position ? ` (${m.position})` : ""}</option>)}
            </select>
          </div>
          {!initial && (
            <div>
              <label className="label">Initial Password (optional)</label>
              <input
                className="input"
                type="password"
                placeholder="Leave empty for auto-generated"
                value={form.password}
                onChange={set("password")}
                autoComplete="new-password"
              />
              <div className="text-xs text-gray-500 mt-1">
                Leave empty and the system will generate a strong random password.
                The user will be forced to change it on first login.
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
