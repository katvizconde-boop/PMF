"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Icon } from "./Icons";

const ICON_COMPONENTS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  PMF_ASSIGNED: Icon.Clipboard,
  PMF_SELF_SUBMITTED: Icon.Send,
  PMF_MANAGER_SUBMITTED: Icon.Download,
  PMF_FINALIZED: Icon.CheckCircle,
  PMF_REOPENED: Icon.Edit,
  KUDOS_RECEIVED: Icon.Trophy,
  ONEONONE_SCHEDULED: Icon.Calendar,
  PIP_STARTED: Icon.Alert,
  PIP_UPDATED: Icon.LineChart,
  INFO: Icon.Info,
};

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};


function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationBell() {
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function fetchNotifs() {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const d = await res.json();
      setItems(d.items);
      setUnread(d.unread);
    } catch {}
  }
  useEffect(() => {
    fetchNotifs();
    const iv = setInterval(fetchNotifs, 30_000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    function clickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, [open]);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
    fetchNotifs();
  }
  async function markRead(id: string) {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [id] }) });
    fetchNotifs();
  }
  async function clearAll() {
    if (!confirm("Clear all notifications?")) return;
    await fetch("/api/notifications", { method: "DELETE" });
    fetchNotifs();
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition"
        aria-label="Notifications"
      >
        <Icon.Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="font-semibold text-gray-800">
              Notifications {unread > 0 && <span className="ml-1 text-xs text-gray-500">({unread} unread)</span>}
            </div>
            <div className="flex gap-3 text-xs">
              {unread > 0 && <button className="text-primary-600 hover:underline" onClick={markAllRead}>Mark all read</button>}
              {items.length > 0 && <button className="text-gray-500 hover:text-red-600" onClick={clearAll}>Clear all</button>}
            </div>
          </div>

          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              <div className="flex justify-center mb-2"><Icon.Sprout size={40} className="text-emerald-500" /></div>
              You're all caught up!
            </div>
          ) : (
            <div
              className="notif-scroll overflow-y-auto"
              style={{ maxHeight: "min(70vh, 480px)" }}
            >
              {items.map((n) => {
                const Inner = (
                  <div
                    className={`flex gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${!n.readAt ? "bg-blue-50/40" : ""}`}
                  >
                    <div className="flex-shrink-0">{(() => { const IC = ICON_COMPONENTS[n.type] ?? Icon.Bell; return <IC size={24} />; })()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-sm text-gray-800 leading-snug">{n.title}</div>
                        {!n.readAt && <span className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 flex-shrink-0" />}
                      </div>
                      {n.body && <div className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.body}</div>}
                      <div className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</div>
                    </div>
                  </div>
                );
                return n.link ? (
                  <Link key={n.id} href={n.link} onClick={() => { markRead(n.id); setOpen(false); }}>{Inner}</Link>
                ) : (
                  <div key={n.id} onClick={() => markRead(n.id)}>{Inner}</div>
                );
              })}
            </div>
          )}

          {items.length > 4 && (
            <div className="px-4 py-2 text-[11px] text-gray-500 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span>{items.length} notifications</span>
              <span className="inline-flex items-center gap-1"><Icon.ChevronDown size={12} /> Scroll for more</span>
            </div>
          )}
        </div>
      )}

      {/* Styled scrollbar — visible track */}
      <style jsx>{`
        :global(.notif-scroll)::-webkit-scrollbar { width: 8px; }
        :global(.notif-scroll)::-webkit-scrollbar-track { background: #f3f4f6; border-radius: 8px; }
        :global(.notif-scroll)::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; border: 2px solid #f3f4f6; }
        :global(.notif-scroll)::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        :global(.notif-scroll) { scrollbar-width: thin; scrollbar-color: #cbd5e1 #f3f4f6; }
      `}</style>
    </div>
  );
}
