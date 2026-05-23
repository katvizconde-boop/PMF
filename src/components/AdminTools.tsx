"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type T = { id: string; name: string; type: string };
type C = { id: string; name: string };

export function AdminTools({
  templates, cycles, departments,
}: { templates: T[]; cycles: C[]; departments: string[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<null | "assign" | "cycle" | "export" | "import">(null);
  const [reminderState, setReminderState] = useState<string>("");
  const [importResult, setImportResult] = useState<any>(null);

  async function runImport(file: File) {
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/import/users", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({ error: "parse" }));
    setImportResult(data);
    if (data.ok) router.refresh();
  }

  async function sendReminders() {
    if (!confirm("Send reminders to all users with pending evaluations?")) return;
    setReminderState("Sending…");
    const res = await fetch("/api/cron/reminders", { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setReminderState(`✓ Sent ${d.sent} reminder(s) (scanned ${d.scanned})`);
    } else setReminderState("✗ " + (await res.text()));
    setTimeout(() => setReminderState(""), 6000);
  }

  return (
    <div className="card mb-6">
      <h3 className="section-header">⚡ Quick Actions</h3>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={() => setMode("assign")}>📋 Bulk Assign Evaluations</button>
        <button className="btn btn-primary" onClick={() => setMode("cycle")}>📅 + New Cycle</button>
        <button className="btn btn-secondary" onClick={() => setMode("export")}>📊 Export Cycle (CSV)</button>
        <button className="btn btn-secondary" onClick={() => { setImportResult(null); setMode("import"); }}>📥 Import Employees (CSV)</button>
        <button className="btn btn-secondary" onClick={sendReminders}>📧 Send Reminders Now</button>
        {reminderState && <span className="text-sm self-center text-gray-600">{reminderState}</span>}
      </div>

      {mode === "assign" && (
        <BulkAssignForm
          templates={templates} cycles={cycles} departments={departments}
          onClose={() => setMode(null)} onDone={() => { setMode(null); router.refresh(); }}
        />
      )}
      {mode === "cycle" && (
        <NewCycleForm onClose={() => setMode(null)} onDone={() => { setMode(null); router.refresh(); }} />
      )}
      {mode === "export" && (
        <ExportCycleForm cycles={cycles} onClose={() => setMode(null)} />
      )}
      {mode === "import" && (
        <ImportUsersForm result={importResult} runImport={runImport} onClose={() => { setMode(null); setImportResult(null); }} />
      )}
    </div>
  );
}

function ExportCycleForm({ cycles, onClose }: any) {
  const [cycleId, setCycleId] = useState(cycles[0]?.id ?? "");
  if (!cycleId) return null;
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
      <div>
        <label className="label">Select cycle to export</label>
        <select className="input max-w-md" value={cycleId} onChange={(e) => setCycleId(e.target.value)}>
          {cycles.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="text-xs text-gray-500">Downloads a CSV with all employees × sections × scores. Opens cleanly in Excel or Google Sheets.</div>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <a className="btn btn-primary" href={`/api/export/cycle/${cycleId}`}>⬇ Download CSV</a>
      </div>
    </div>
  );
}

function ImportUsersForm({ result, runImport, onClose }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    await runImport(file);
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="text-sm">
          <p className="font-medium text-gray-700">📋 New to bulk import?</p>
          <p className="text-xs text-gray-500 mt-0.5">Download our template, fill it in, then upload below.</p>
        </div>
        <a href="/employee-import-template.csv" download="PMF-Employee-Import-Template.csv" className="btn btn-secondary text-xs">⬇ Download CSV Template</a>
      </div>
      <div>
        <label className="label">CSV file</label>
        <input type="file" accept=".csv,text/csv" className="input" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </div>
      <div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 p-3 rounded">
        <b>Required header row:</b><br />
        <code className="text-[11px] block bg-white p-2 rounded mt-1 mb-2 overflow-x-auto whitespace-nowrap">firstName,lastName,email,position,company,department,role,employmentType,managerEmail,hireDate</code>
        <ul className="list-disc ml-4 space-y-0.5">
          <li><b>company:</b> M2.0 Communications · Media Meter Inc · 7GEN · Rythmos DB Inc.</li>
          <li><b>department:</b> any value (auto-creates if needed)</li>
          <li><b>role:</b> EMPLOYEE / MANAGER / HR_ADMIN (default EMPLOYEE)</li>
          <li><b>employmentType:</b> REGULAR / PROBATIONARY / CONTRACTUAL (default REGULAR)</li>
          <li><b>managerEmail:</b> must already exist in the system (leave blank for no supervisor)</li>
          <li><b>hireDate:</b> YYYY-MM-DD format (optional)</li>
          <li>All users get default password: <code className="bg-white px-1 rounded">password123</code> — they can change it on first login.</li>
        </ul>
      </div>
      {result && (
        <div className={`text-sm p-3 rounded ${result.errors?.length ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"}`}>
          ✓ Created <b>{result.created}</b> user(s).
          {result.errors?.length > 0 && (
            <>
              <div className="mt-2 font-semibold">{result.errors.length} row(s) skipped:</div>
              <ul className="text-xs mt-1 list-disc ml-4">
                {result.errors.slice(0, 8).map((e: any, i: number) => <li key={i}>Row {e.row} ({e.email}): {e.reason}</li>)}
                {result.errors.length > 8 && <li>+ {result.errors.length - 8} more</li>}
              </ul>
            </>
          )}
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
        <button type="submit" className="btn btn-primary" disabled={!file || busy}>{busy ? "Importing…" : "Upload & Import"}</button>
      </div>
    </form>
  );
}

function BulkAssignForm({ templates, cycles, departments, onClose, onDone }: any) {
  const [cycleId, setCycleId] = useState(cycles[0]?.id ?? "");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [department, setDepartment] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setResult(null);
    const res = await fetch("/api/assignments/bulk", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cycleId, templateId, department: department || undefined, employmentType: employmentType || undefined }),
    });
    setBusy(false);
    if (res.ok) {
      const d = await res.json();
      setResult(d);
      if (d.created > 0) setTimeout(onDone, 2000);
    } else setResult({ error: await res.text() });
  }

  return (
    <form onSubmit={submit} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="label">Cycle</label>
          <select className="input" value={cycleId} onChange={(e) => setCycleId(e.target.value)}>
            {cycles.map((c: C) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Template</label>
          <select className="input" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            {templates.map((t: T) => <option key={t.id} value={t.id}>{t.name} ({t.type})</option>)}
          </select>
        </div>
        <div>
          <label className="label">Department (optional)</label>
          <select className="input" value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">— All —</option>
            {departments.map((d: string) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Employment Type (optional)</label>
          <select className="input" value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
            <option value="">— All —</option>
            <option value="REGULAR">Regular</option>
            <option value="PROBATIONARY">Probationary</option>
            <option value="CONTRACTUAL">Contractual</option>
          </select>
        </div>
      </div>
      {result && (
        <div className={`text-sm p-2 rounded ${result.error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {result.error
            ? <>Error: {result.error}</>
            : <>✓ Created <b>{result.created}</b> assignment(s). Skipped: {result.skipped?.length ?? 0}{result.skipped?.length ? ` (${result.skipped.slice(0, 3).join(", ")}${result.skipped.length > 3 ? "…" : ""})` : ""}.</>}
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Assigning…" : "Assign"}</button>
      </div>
    </form>
  );
}

function NewCycleForm({ onClose, onDone }: any) {
  const [name, setName] = useState("");
  const [periodStart, setPS] = useState("");
  const [periodEnd, setPE] = useState("");
  const [dueDate, setDue] = useState("");
  const [autoReg, setAutoReg] = useState(false);
  const [autoProb, setAutoProb] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const res = await fetch("/api/cycles", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, periodStart, periodEnd, dueDate, autoAssignRegular: autoReg, autoAssignProbationary: autoProb }),
    });
    setBusy(false);
    if (res.ok) onDone();
    else setErr(await res.text());
  }

  return (
    <form onSubmit={submit} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
      <div><label className="label">Cycle Name</label><input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Q3 2026" /></div>
      <div className="grid md:grid-cols-3 gap-3">
        <div><label className="label">Period Start</label><input className="input" type="date" required value={periodStart} onChange={(e) => setPS(e.target.value)} /></div>
        <div><label className="label">Period End</label><input className="input" type="date" required value={periodEnd} onChange={(e) => setPE(e.target.value)} /></div>
        <div><label className="label">Due Date</label><input className="input" type="date" required value={dueDate} onChange={(e) => setDue(e.target.value)} /></div>
      </div>
      <div className="pt-2 border-t">
        <div className="text-xs font-semibold text-gray-600 mb-2">🔄 AUTO-ASSIGN ON HIRE DATE</div>
        <label className="flex items-center gap-2 text-sm mb-1"><input type="checkbox" checked={autoReg} onChange={(e) => setAutoReg(e.target.checked)} /> Auto-assign all Regular employees to this cycle (daily cron)</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={autoProb} onChange={(e) => setAutoProb(e.target.checked)} /> Auto-assign Probationary hires at ~3-month mark</label>
      </div>
      {err && <div className="text-sm text-red-600">{err}</div>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Creating…" : "Create Cycle"}</button>
      </div>
    </form>
  );
}
