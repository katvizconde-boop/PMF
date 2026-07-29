"use client";
import { useState } from "react";
import { Icon } from "./Icons";

const COMPANIES = [
  "M2.0 Communications",
  "Media Meter Inc.",
  "Rythmos DB Inc.",
  "7GEN",
];

type ResultRow = { email: string; tempPassword: string; status: string };

export function BulkWelcomeTool() {
  const [company, setCompany] = useState<string>("");
  const [dryRun, setDryRun] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; count: number; success: number; failed: number; dryRun: boolean; sample: ResultRow[]; note?: string }>(null);
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [revealPasswords, setRevealPasswords] = useState(false);

  async function run() {
    if (!company) {
      setErr("Choose a company first.");
      return;
    }
    if (!dryRun && !confirm) {
      setErr("Tick the confirmation checkbox before sending real emails.");
      return;
    }
    setErr(null);
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/bulk-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, dryRun, revealPasswords }),
      });
      if (!res.ok) {
        setErr(await res.text());
      } else {
        const data = await res.json();
        setResult(data);
        setConfirm(false);
      }
    } catch (e: any) {
      setErr(e.message ?? "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  function downloadCSV() {
    if (!result?.sample) return;
    const lines = ["email,temp_password,status", ...result.sample.map((r) => `"${r.email}","${r.tempPassword}","${r.status}"`)];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pmf-bulk-welcome-${company.replace(/\W+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="card">
      <h3 className="section-header inline-flex items-center gap-2">
        <Icon.Send size={18} className="text-primary-600" />
        Bulk Welcome — Provision a Wave
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Resets each active user's password to a fresh temporary one (<code className="bg-gray-100 px-1.5 py-0.5 rounded">Welcome-XXXX</code>) and sends them a welcome email with login instructions. Use this on the morning of a Wave go-live.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Company</label>
          <select className="input" value={company} onChange={(e) => setCompany(e.target.value)}>
            <option value="">— Select company —</option>
            {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Mode</label>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => setDryRun(true)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold border transition ${
                dryRun ? "bg-amber-50 border-amber-300 text-amber-800" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon.Eye size={14} className="inline-block mr-1" /> Dry run (preview)
            </button>
            <button
              type="button"
              onClick={() => setDryRun(false)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold border transition ${
                !dryRun ? "bg-red-50 border-red-300 text-red-800" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon.Send size={14} className="inline-block mr-1" /> SEND for real
            </button>
          </div>
        </div>
      </div>

      {!dryRun && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm">
          <div className="font-bold text-red-800 inline-flex items-center gap-1">
            <Icon.Alert size={16} className="text-red-700" /> Live mode — this WILL:
          </div>
          <ul className="list-disc ml-5 mt-1 text-red-700 text-xs space-y-0.5">
            <li>Reset each user's password (existing passwords will be invalidated)</li>
            <li>Send a real email to each user</li>
            <li>Log the action in the audit trail</li>
            <li>Force each user to change their password on first login</li>
          </ul>
          <label className="mt-2 flex items-start gap-2 cursor-pointer text-red-800">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-sm">I understand and want to send welcome emails to <strong>{company || "<select a company>"}</strong>.</span>
          </label>

          <details className="mt-3 text-xs">
            <summary className="cursor-pointer text-red-700 font-semibold">⚠ Advanced: also show me the plaintext passwords (NOT recommended)</summary>
            <label className="mt-2 flex items-start gap-2 cursor-pointer text-red-800">
              <input
                type="checkbox"
                checked={revealPasswords}
                onChange={(e) => setRevealPasswords(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Show passwords in the response & CSV download.
                <strong className="block mt-0.5">Only enable if email delivery is failing and you need to share passwords manually.</strong>
                Passwords shown stay in browser memory + the CSV is unencrypted.
              </span>
            </label>
          </details>
        </div>
      )}

      {err && (
        <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-2.5 inline-flex items-center gap-1">
          <Icon.Alert size={14} className="text-red-600" /> {err}
        </div>
      )}

      <div className="mt-4">
        <button
          type="button"
          onClick={run}
          disabled={busy || !company || (!dryRun && !confirm)}
          className="btn btn-primary inline-flex items-center gap-2 disabled:opacity-50"
        >
          {busy ? "Working…" : (dryRun ? "Run dry-run" : "Send welcome emails")}
        </button>
      </div>

      {result && (
        <div className="mt-5 border-t pt-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h4 className="font-semibold text-gray-800">
              {result.dryRun ? "Dry-run preview" : "Results"}
            </h4>
            {result.sample.length > 0 && (
              <button onClick={downloadCSV} className="btn btn-secondary text-xs inline-flex items-center gap-1">
                <Icon.Download size={12} /> Download CSV
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
              <div className="text-2xl font-bold text-gray-800">{result.count}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Users matched</div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-200">
              <div className="text-2xl font-bold text-emerald-700">{result.success}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">{result.dryRun ? "Would succeed" : "Sent"}</div>
            </div>
            <div className={`rounded-lg p-3 text-center border ${result.failed > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
              <div className={`text-2xl font-bold ${result.failed > 0 ? "text-red-700" : "text-gray-400"}`}>{result.failed}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Failed</div>
            </div>
          </div>

          {result.note && (
            <div className="text-xs text-gray-500 italic mb-2">{result.note}</div>
          )}

          {result.sample.length > 0 && (
            <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Email</th>
                    <th className="text-left px-3 py-2 font-medium">Temp Password</th>
                    <th className="text-left px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.sample.map((row, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-gray-700">{row.email}</td>
                      <td className="px-3 py-2 font-mono text-xs text-primary-700">{row.tempPassword}</td>
                      <td className="px-3 py-2 text-xs">
                        <span className={`chip ${
                          row.status === "SENT" ? "bg-emerald-100 text-emerald-700" :
                          row.status === "DRY-RUN" ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.dryRun && result.count > 0 && (
            <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 inline-flex items-center gap-1">
              <Icon.Info size={14} className="text-amber-700" />
              This was a preview. No passwords were changed and no emails were sent. Toggle to <strong>SEND for real</strong> when ready.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
