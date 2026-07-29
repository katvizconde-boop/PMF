import Link from "next/link";
import { Icon } from "./Icons";

export function PendingBanner({
  items, action,
}: {
  items: { id: string; label: string; due?: string; overdue?: boolean }[];
  action: string;
}) {
  if (!items.length) return null;
  const overdueCount = items.filter((i) => i.overdue).length;
  return (
    <div className={`rounded-2xl border p-4 mb-6 ${overdueCount ? "border-blush-200 bg-blush-50" : "border-peach-200 bg-peach-50"}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon.Bell size={18} />
        <h3 className={`font-semibold ${overdueCount ? "text-red-800" : "text-amber-800"}`}>
          You have {items.length} PMF {items.length === 1 ? "item" : "items"} pending — {action}
          {overdueCount > 0 && <span className="ml-2 text-red-600">· {overdueCount} OVERDUE</span>}
        </h3>
      </div>
      <ul
        className={`space-y-1 ${items.length > 6 ? "max-h-72 overflow-y-auto pr-1" : ""}`}
      >
        {items.map((i) => (
          <li key={i.id} className="text-sm flex items-center justify-between gap-2">
            <span className={`${i.overdue ? "text-red-700" : "text-gray-700"} min-w-0 truncate`}>
              {i.label}{i.due && <span className="text-xs text-gray-500 ml-2">· due {i.due}</span>}
            </span>
            <Link href={`/assignments/${i.id}`} className="btn btn-secondary text-xs flex-shrink-0">Open</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
