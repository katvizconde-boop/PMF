"use client";
import { useEffect, useState, useRef } from "react";
import { Icon } from "./Icons";
import { PrintSectionButton } from "./PrintSectionButton";

type Doc = { id: string; type: string; name: string; mimeType: string; size: number; notes: string | null; createdAt: string; uploadedById: string };

const TYPES = [
  { v: "CONTRACT",    label: "Contract",    color: "bg-blue-100 text-blue-700",        Icon: Icon.Doc },
  { v: "CERTIFICATE", label: "Certificate", color: "bg-emerald-100 text-emerald-700",  Icon: Icon.GraduationCap },
  { v: "MEMO",        label: "Memo",        color: "bg-amber-100 text-amber-700",      Icon: Icon.Pen },
  { v: "ID",          label: "ID",          color: "bg-purple-100 text-purple-700",    Icon: Icon.User },
  { v: "RESUME",      label: "Resume",      color: "bg-indigo-100 text-indigo-700",    Icon: Icon.Doc },
  { v: "OTHER",       label: "Other",       color: "bg-gray-100 text-gray-700",        Icon: Icon.Folder },
];

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function DocumentsSection({ employeeId, currentUserCanEdit }: { employeeId: string; currentUserCanEdit: boolean }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [uploading, setUploading] = useState(false);
  const [type, setType] = useState("OTHER");
  const [notes, setNotes] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch(`/api/documents?userId=${employeeId}`);
    if (res.ok) { const d = await res.json(); setDocs(d.documents); }
  }
  useEffect(() => { load(); }, [employeeId]);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("userId", employeeId);
    fd.append("type", type);
    fd.append("file", file);
    if (notes) fd.append("notes", notes);
    const res = await fetch("/api/documents", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) {
      if (fileRef.current) fileRef.current.value = "";
      setNotes(""); load();
    } else alert(await res.text());
  }

  async function remove(id: string) {
    if (!confirm("Delete this document?")) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) load(); else alert(await res.text());
  }

  const filtered = filter === "ALL" ? docs : docs.filter((d) => d.type === filter);

  return (
    <div className="card printable-documents">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="section-header mb-0 inline-flex items-center gap-1"><Icon.Folder size={16} /> Documents</h3>
        <div className="inline-flex items-center gap-2">
          <PrintSectionButton sectionId="documents" label="documents" />
        </div>
        <select className="input text-sm w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="ALL">All ({docs.length})</option>
          {TYPES.map((t) => {
            const c = docs.filter((d) => d.type === t.v).length;
            return c > 0 ? <option key={t.v} value={t.v}>{t.label} ({c})</option> : null;
          })}
        </select>
      </div>

      {currentUserCanEdit && (
        <form onSubmit={upload} className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="grid md:grid-cols-3 gap-2 mb-2">
            <select className="input text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
            </select>
            <input ref={fileRef} type="file" required className="input text-sm md:col-span-2" />
          </div>
          <input className="input text-sm mb-2" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Max 5MB. PDFs, images, Office docs.</span>
            <button type="submit" className="btn btn-primary text-xs" disabled={uploading}>{uploading ? "Uploading…" : <span className="inline-flex items-center gap-1"><Icon.Upload size={12} /> Upload</span>}</button>
          </div>
        </form>
      )}

      {filtered.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">No documents{filter !== "ALL" ? " of this type" : ""} yet.</p>
      ) : (
        <div className="space-y-1">
          {filtered.map((d) => {
            const t = TYPES.find((x) => x.v === d.type) ?? TYPES[5];
            return (
              <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition border border-transparent hover:border-gray-200">
                <span className={`chip ${t.color} flex-shrink-0 inline-flex items-center gap-1`}><t.Icon size={12} /> {t.label}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{d.name}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span>{fmtBytes(d.size)}</span>
                    <span>·</span>
                    <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                    {d.notes && (<><span>·</span><span className="italic truncate max-w-[200px]">{d.notes}</span></>)}
                  </div>
                </div>
                <a href={`/api/documents/${d.id}`} className="btn btn-secondary text-xs"><span className="inline-flex items-center gap-1"><Icon.Download size={12} /> Download</span></a>
                {currentUserCanEdit && (
                  <button onClick={() => remove(d.id)} className="text-xs text-gray-400 hover:text-red-600 px-2"><Icon.X size={12} /></button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
