"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ratingClass, stateColor } from "@/lib/ui";
import { EmployeeModal, type EmployeeFormData } from "./EmployeeModal";
import { PerformanceChart } from "./PerformanceChart";
import { companyChipClass, companyLogoPath } from "@/lib/companies";
import { GoalsSection } from "./GoalsSection";
import { OneOnOnesSection } from "./OneOnOnesSection";
import { PIPSection } from "./PIPSection";
import { CareerPathSection } from "./CareerPathSection";
import { DocumentsSection } from "./DocumentsSection";
import { CoManagersSection } from "./CoManagersSection";
import { Icon } from "./Icons";

export function EmployeeDetail({
  user, managers, templates, cycles, viewerRole,
}: {
  user: any;
  managers: { id: string; name: string; position: string | null }[];
  templates: { id: string; name: string; type: string }[];
  cycles: { id: string; name: string }[];
  viewerRole?: "HR_ADMIN" | "MANAGER" | "EMPLOYEE";
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [evalOpen, setEvalOpen] = useState(false);

  async function update(data: EmployeeFormData) {
    const res = await fetch(`/api/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) { setEditOpen(false); router.refresh(); }
    else alert("Failed: " + (await res.text()));
  }

  async function remove() {
    if (!confirm(`Delete ${user.firstName} ${user.lastName}? This will also remove their evaluations.`)) return;
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    if (res.ok) router.push("/employees");
    else alert("Failed: " + (await res.text()));
  }

  async function regularize() {
    if (!confirm(`Move ${user.firstName} ${user.lastName} from PROBATIONARY to REGULAR status? This cannot be undone via the UI.`)) return;
    const res = await fetch(`/api/users/${user.id}/regularize`, { method: "POST" });
    if (res.ok) {
      alert(`✓ ${user.firstName} is now a Regular Employee. Notifications have been sent.`);
      router.refresh();
    } else alert("Failed: " + (await res.text()));
  }

  const isProb = user.employmentType === "PROBATIONARY" || user.employmentType === "CONTRACTUAL";
  const hasFinalizedProbEval = user.assignmentsAsEmployee?.some((a: any) => a.state === "FINALIZED" && a.template?.type === "PROBATIONARY");

  return (
    <div className="space-y-6">
      <Link href="/employees" className="text-primary-600 text-sm hover:underline">← Back to Employees</Link>

      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{user.firstName} {user.lastName}</h1>
            <p className="text-gray-600">{user.position ?? "—"} · {user.department ?? "—"}</p>
            <p className="text-sm text-gray-500 mt-1">
              Supervisor: {user.manager ? `${user.manager.firstName} ${user.manager.lastName}${user.manager.position ? ` (${user.manager.position})` : ""}` : "—"}
            </p>
            <div className="flex gap-2 mt-2 flex-wrap items-center">
              {user.company && companyLogoPath(user.company) && (
                <img src={companyLogoPath(user.company)!} alt="" style={{ height: 22, width: "auto", maxWidth: 90, objectFit: "contain" }} className="mr-1" />
              )}
              {user.company && <span className={`chip ${companyChipClass(user.company)}`}>{user.company}</span>}
              <span className="chip bg-gray-100 text-gray-700">{user.role.replace("_", " ")}</span>
              <span className="chip bg-gray-100 text-gray-700">{user.employmentType}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {isProb && (
              <button className="btn btn-success" onClick={regularize} title={hasFinalizedProbEval ? "Employee has a finalized probationary evaluation — recommended." : "Move directly to REGULAR status"}>
                <span className="inline-flex items-center gap-1"><Icon.Check size={14} /> Move to Regular</span>
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => setEditOpen(true)}>Edit</button>
            <button className="btn btn-danger" onClick={remove}>Delete</button>
          </div>
        </div>
      </div>

      <CoManagersSection
        employeeId={user.id}
        employeeName={`${user.firstName} ${user.lastName}`}
        primaryManagerId={user.managerId}
        viewerRole={viewerRole ?? "MANAGER"}
        managerOptions={managers.map((m) => {
          const [firstName, ...rest] = m.name.split(" ");
          return { id: m.id, firstName, lastName: rest.join(" "), position: m.position, email: "" };
        })}
      />

      <CareerPathSection employeeId={user.id} canEdit={true} />
      <GoalsSection employeeId={user.id} cycles={cycles} canRate={true} canAdd={true} />
      <OneOnOnesSection employeeId={user.id} currentUserCanEdit={true} />
      <DocumentsSection employeeId={user.id} currentUserCanEdit={true} />
      <PIPSection employeeId={user.id} currentUserCanEdit={true} />

      <div className="card">
        <h3 className="section-header inline-flex items-center gap-1"><Icon.Trophy size={16} /> Performance History</h3>
        <PerformanceChart
          history={(user.assignmentsAsEmployee ?? [])
            .filter((a: any) => a.state === "FINALIZED" && a.overallScore != null)
            .slice()
            .reverse()
            .map((a: any) => ({ cycle: a.cycle.name, score: Number(a.overallScore) }))}
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Evaluations</h2>
          <button className="btn btn-primary" onClick={() => setEvalOpen(true)}>+ New Evaluation</button>
        </div>
        {user.assignmentsAsEmployee.length === 0 ? (
          <div className="card text-center py-12 text-gray-400 text-sm">No evaluations yet.</div>
        ) : (
          <div className="space-y-2">
            {user.assignmentsAsEmployee.map((a: any) => (
              <div key={a.id} className="card flex items-center justify-between hover:shadow-md transition">
                <div>
                  <div className="font-semibold text-gray-800">{a.cycle.name}</div>
                  <div className="text-sm text-gray-500">{a.template.name} · Reviewed by {a.manager.firstName} {a.manager.lastName}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`chip ${stateColor(a.state)}`}>{a.state.replace("_", " ")}</span>
                  {a.overallScore != null && <span className={`rating-pill ${ratingClass(a.overallScore)}`}>{a.overallScore.toFixed(1)}</span>}
                  <Link href={`/assignments/${a.id}`} className="btn btn-secondary text-xs">View</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editOpen && (
        <EmployeeModal
          title="Edit Employee"
          initial={{
            firstName: user.firstName, lastName: user.lastName, email: user.email,
            position: user.position ?? "", company: user.company ?? "", department: user.department ?? "",
            employmentType: user.employmentType, role: user.role, managerId: user.managerId ?? "",
          }}
          managers={managers}
          onClose={() => setEditOpen(false)}
          onSave={update}
        />
      )}

      {evalOpen && (
        <NewEvaluationModal
          employee={user}
          templates={templates}
          cycles={cycles}
          onClose={() => setEvalOpen(false)}
          onCreated={() => { setEvalOpen(false); router.refresh(); }}
        />
      )}
    </div>
  );
}

function NewEvaluationModal({ employee, templates, cycles, onClose, onCreated }: any) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [cycleId, setCycleId] = useState(cycles[0]?.id ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/assignments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: employee.id, templateId, cycleId }),
    });
    setSaving(false);
    if (res.ok) onCreated();
    else alert("Failed: " + (await res.text()));
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-800 mb-1">New Evaluation</h2>
        <p className="text-sm text-gray-500 mb-4">{employee.firstName} {employee.lastName} · {employee.position}</p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Template</label>
            <select className="input" required value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.type})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Review Cycle</label>
            <select className="input" required value={cycleId} onChange={(e) => setCycleId(e.target.value)}>
              {cycles.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Creating…" : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
