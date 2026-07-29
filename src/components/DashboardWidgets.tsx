import Link from "next/link";
import { Icon } from "./Icons";

type Person = { id: string; name: string; position: string | null; date: Date; years: number };
type DueItem = { id: string; label: string; due: Date; days: number };

export function AnniversariesWidget({ people }: { people: Person[] }) {
  if (people.length === 0) return null;
  return (
    <div className="card mb-6">
      <h3 className="section-header inline-flex items-center gap-1"><Icon.Trophy size={16} /> This Week's Milestones</h3>
      <div className="space-y-2">
        {people.map((p) => (
          <Link key={p.id + "-" + p.date.toISOString()} href={`/employees/${p.id}`}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-pink-500 text-white flex items-center justify-center flex-shrink-0">
              <Icon.Trophy size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-800">{p.name}</div>
              <div className="text-xs text-gray-500">{p.position ?? "—"}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-amber-600">{p.years} {p.years === 1 ? "year" : "years"}</div>
              <div className="text-xs text-gray-400">{p.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function DueThisWeekWidget({ items }: { items: DueItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="card mb-6">
      <h3 className="section-header inline-flex items-center gap-1 justify-between w-full">
        <span className="inline-flex items-center gap-1"><Icon.Calendar size={16} /> Due This Week</span>
        <span className="text-xs font-normal text-gray-400">{items.length} item{items.length === 1 ? "" : "s"}</span>
      </h3>
      <div className="due-scroll grid grid-cols-1 md:grid-cols-2 gap-2 overflow-y-auto pr-2" style={{ maxHeight: 360 }}>
        {items.map((it) => {
          const overdue = it.days < 0;
          const today = it.days === 0;
          return (
            <Link key={it.id} href={`/assignments/${it.id}`}
              className={`flex items-center gap-3 p-2.5 rounded-lg border transition ${
                overdue ? "border-red-200 bg-red-50 hover:bg-red-100" :
                today ? "border-amber-200 bg-amber-50 hover:bg-amber-100" :
                "border-gray-100 hover:bg-gray-50"
              }`}>
              <div className={`w-10 text-center flex-shrink-0`}>
                <div className={`text-lg font-bold ${overdue ? "text-red-600" : today ? "text-amber-600" : "text-gray-700"}`}>
                  {Math.abs(it.days)}
                </div>
                <div className={`text-[10px] uppercase tracking-wide ${overdue ? "text-red-500" : today ? "text-amber-500" : "text-gray-400"}`}>
                  {overdue ? "days late" : today ? "today" : it.days === 1 ? "day" : "days"}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{it.label}</div>
                <div className="text-xs text-gray-500">due {it.due.toLocaleDateString()}</div>
              </div>
              <div className="text-xs text-gray-400">→</div>
            </Link>
          );
        })}
      </div>
      {items.length > 6 && (
        <div className="text-[11px] text-gray-400 mt-2 text-center inline-flex items-center justify-center gap-1 w-full">
          <Icon.ChevronDown size={12} /> Scroll for more
        </div>
      )}
      <style jsx>{`
        :global(.due-scroll)::-webkit-scrollbar { width: 8px; }
        :global(.due-scroll)::-webkit-scrollbar-track { background: #f3f4f6; border-radius: 8px; }
        :global(.due-scroll)::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; border: 2px solid #f3f4f6; }
        :global(.due-scroll)::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        :global(.due-scroll) { scrollbar-width: thin; scrollbar-color: #cbd5e1 #f3f4f6; }
      `}</style>
    </div>
  );
}
