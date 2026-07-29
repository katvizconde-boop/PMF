"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "./Icons";

type User = { id: string; firstName: string; lastName: string; position: string | null; department?: string | null; company?: string | null; profilePicture?: string | null };
type Kudo = {
  id: string; message: string; category: string | null; isPublic: boolean; createdAt: string;
  fromUser: User; toUser: User;
};

const CATEGORIES = [
  { v: "Collaboration",   color: "bg-blue-100 text-blue-700",       Icon: Icon.Users },
  { v: "Excellence",      color: "bg-emerald-100 text-emerald-700", Icon: Icon.Star },
  { v: "Innovation",      color: "bg-purple-100 text-purple-700",   Icon: Icon.Sparkle },
  { v: "Integrity",       color: "bg-amber-100 text-amber-700",     Icon: Icon.CheckCircle },
  { v: "Learning",        color: "bg-indigo-100 text-indigo-700",   Icon: Icon.GraduationCap },
  { v: "Customer-First",  color: "bg-pink-100 text-pink-700",       Icon: Icon.Trophy },
];

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function Avatar({ user, size = 40 }: { user: User; size?: number }) {
  const initial = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();
  if (user.profilePicture) {
    return <img src={user.profilePicture} alt="" style={{ width: size, height: size }} className="rounded-full object-cover flex-shrink-0" />;
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size / 2.4 }}
      className="rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white font-bold flex items-center justify-center flex-shrink-0"
    >
      {initial}
    </div>
  );
}

export function KudosWall({ currentUserId, users }: { currentUserId: string; users: User[] }) {
  const [kudos, setKudos] = useState<Kudo[]>([]);
  const [tab, setTab] = useState<"public" | "mine-received" | "mine-sent">("public");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const res = await fetch(`/api/kudos?scope=${tab}`);
    if (res.ok) {
      const d = await res.json(); setKudos(d.kudos);
    }
  }
  useEffect(() => { load(); }, [tab]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="page-title inline-flex items-center gap-2"><Icon.Trophy size={24} /> Kudos</h2>
          <p className="page-subtitle">Recognize great work — anytime, anywhere.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Send Kudos</button>
      </div>

      <div className="tabs-bar mb-6">
        <button className={`tab ${tab === "public" ? "active" : ""}`} onClick={() => setTab("public")}><span className="inline-flex items-center gap-1"><Icon.Users size={14} /> Public Wall</span></button>
        <button className={`tab ${tab === "mine-received" ? "active" : ""}`} onClick={() => setTab("mine-received")}><span className="inline-flex items-center gap-1"><Icon.Download size={14} /> Received by Me</span></button>
        <button className={`tab ${tab === "mine-sent" ? "active" : ""}`} onClick={() => setTab("mine-sent")}><span className="inline-flex items-center gap-1"><Icon.Send size={14} /> Sent by Me</span></button>
      </div>

      {kudos.length === 0 ? (
        <div className="card text-center py-16">
          <div className="flex justify-center mb-3"><Icon.Sprout size={48} className="text-emerald-500" /></div>
          <p className="text-gray-500">No kudos yet. Be the first to recognize someone's great work!</p>
          <button className="btn btn-primary mt-4" onClick={() => setShowForm(true)}>+ Send Kudos</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {kudos.map((k) => {
            const cat = CATEGORIES.find((c) => c.v === k.category);
            return (
              <div key={k.id} className="card relative">
                <div className="absolute -top-3 -right-3"><Icon.Trophy size={36} className="text-amber-500" /></div>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar user={k.fromUser} />
                  <div className="text-xs text-gray-500">→</div>
                  <Avatar user={k.toUser} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <Link href={`/employees/${k.fromUser.id}`} className="font-semibold text-gray-800 hover:text-primary-600">{k.fromUser.firstName} {k.fromUser.lastName}</Link>
                      <span className="text-gray-500"> recognized </span>
                      <Link href={`/employees/${k.toUser.id}`} className="font-semibold text-gray-800 hover:text-primary-600">{k.toUser.firstName} {k.toUser.lastName}</Link>
                    </div>
                    <div className="text-xs text-gray-400">{timeAgo(k.createdAt)}</div>
                  </div>
                </div>
                {cat && (
                  <span className={`chip ${cat.color} mb-2 inline-flex items-center gap-1`}>
                    <cat.Icon size={12} /> {cat.v}
                  </span>
                )}
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{k.message}</p>
                {!k.isPublic && <p className="text-xs text-gray-400 italic mt-2 inline-flex items-center gap-1"><Icon.Lock size={12} /> Private — only sender, recipient, and HR can see this</p>}
              </div>
            );
          })}
        </div>
      )}

      {showForm && <KudosForm users={users} currentUserId={currentUserId} onClose={() => setShowForm(false)} onSent={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function KudosForm({ users, onClose, onSent }: { users: User[]; currentUserId: string; onClose: () => void; onSent: () => void }) {
  const [toUserId, setToUserId] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");

  const filtered = users.filter((u) => `${u.firstName} ${u.lastName} ${u.position ?? ""} ${u.department ?? ""}`.toLowerCase().includes(filter.toLowerCase()));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!toUserId || !message.trim()) return;
    setBusy(true);
    const res = await fetch("/api/kudos", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId, message: message.trim(), category: category || null, isPublic }),
    });
    setBusy(false);
    if (res.ok) onSent();
    else alert(await res.text());
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 inline-flex items-center gap-2"><Icon.Trophy size={20} /> Send Kudos</h2>
          <button className="text-gray-400 hover:text-gray-700" onClick={onClose}><Icon.X size={16} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Who deserves kudos?</label>
            <input className="input mb-2" placeholder="Search a name…" value={filter} onChange={(e) => setFilter(e.target.value)} />
            <select className="input" required value={toUserId} onChange={(e) => setToUserId(e.target.value)}>
              <option value="">Select a colleague…</option>
              {filtered.map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}{u.position ? ` · ${u.position}` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  type="button" key={c.v}
                  onClick={() => setCategory(c.v === category ? "" : c.v)}
                  className={`p-2 rounded-lg border text-xs font-medium transition ${
                    category === c.v ? `${c.color} border-current ring-2 ring-offset-1` : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-center"><c.Icon size={18} /></div>
                  {c.v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Your message</label>
            <textarea className="input" rows={4} required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What did they do that was great?" maxLength={1000} />
            <div className="text-xs text-gray-400 text-right">{message.length} / 1000</div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
            <Icon.Users size={14} /> Post publicly on the kudos wall (recommended)
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy || !toUserId || !message.trim()}>{busy ? "Sending…" : <span className="inline-flex items-center gap-1"><Icon.Trophy size={14} /> Send Kudos</span>}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
