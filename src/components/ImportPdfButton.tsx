"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icons";

export function ImportPdfButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("REGULAR");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setErr("Please choose a PDF."); return; }
    setBusy(true); setErr("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", name || file.name.replace(/\.pdf$/i, ""));
    fd.append("type", type);
    const res = await fetch("/api/templates/from-pdf", { method: "POST", body: fd });
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      alert(`✓ Imported: ${data.summary.sections} section(s), ${data.summary.questions} question(s).\nOpen the editor to review and publish.`);
      router.push(`/templates/${data.id}`);
    } else {
      setErr(await res.text());
    }
  }

  return (
    <>
      <button className="btn btn-secondary" onClick={() => setOpen(true)}><span className="inline-flex items-center gap-1"><Icon.Doc size={14} /> Import from PDF</span></button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Import Template from PDF</h2>
            <p className="text-sm text-gray-500 mb-4">Upload a PMF PDF and we'll extract sections & questions into a draft template.</p>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="label">PDF File (max 10MB)</label>
                <input
                  ref={fileRef} type="file" accept="application/pdf,.pdf"
                  className="input"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setFile(f);
                    if (f && !name) setName(f.name.replace(/\.pdf$/i, ""));
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Scanned-image PDFs need OCR (not yet supported). Use text-based PDFs.</p>
              </div>
              <div>
                <label className="label">Template Name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Regular Employee PMF (v2)" />
              </div>
              <div>
                <label className="label">Type</label>
                <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="REGULAR">Regular</option>
                  <option value="PROBATIONARY">Probationary</option>
                </select>
              </div>
              {err && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{err}</div>}
              <div className="text-xs bg-blue-50 text-blue-800 p-2 rounded inline-flex items-center gap-1">
                <Icon.Sparkle size={12} /> The draft is created <b>inactive</b> so you can review and edit before assigning.
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Parsing…" : "Import"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
