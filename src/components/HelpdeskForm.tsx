"use client";
import { useState } from "react";
import { Icon } from "./Icons";

const CATEGORIES = [
  "Login / password issue",
  "Cannot submit / form bug",
  "Signature not working",
  "Missing or wrong PMF",
  "Notification didn't arrive",
  "Profile / personal info change",
  "Suggestion / feature request",
  "Other",
];

export function HelpdeskForm({ user }: { user: { name: string; email: string; role: string } }) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const res = await fetch("/api/help", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, subject, body, url: typeof window !== "undefined" ? window.location.href : "" }),
    });
    setBusy(false);
    if (res.ok) {
      setSent(true);
      setSubject(""); setBody("");
    } else {
      setErr(await res.text());
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
        <div className="font-bold mb-1 inline-flex items-center gap-1"><Icon.Check size={16} className="text-emerald-600" /> Message sent</div>
        <p>HR has been notified. You'll get a reply at <strong>{user.email}</strong> within 1 business day.</p>
        <button onClick={() => setSent(false)} className="mt-3 text-xs text-emerald-700 underline">Send another message</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="label">Category</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Subject</label>
          <input className="input" required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Briefly describe the issue" />
        </div>
      </div>

      <div>
        <label className="label">Details</label>
        <textarea
          className="input"
          rows={5}
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Tell us what happened — include any error messages, what you were trying to do, and what device/browser you're using."
        />
        <p className="text-xs text-gray-500 mt-1">We'll automatically include your name, email, role, and current page URL.</p>
      </div>

      {err && <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-2.5">{err}</div>}

      <button type="submit" disabled={busy || !subject || !body} className="btn btn-primary inline-flex items-center gap-2">
        <Icon.Send size={14} /> {busy ? "Sending…" : "Send to HR"}
      </button>
    </form>
  );
}
