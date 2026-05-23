import Link from "next/link";

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
        <span className="text-lg">🔔</span>
        <h3 className={`font-semibold ${overdueCount ? "text-red-800" : "text-amber-800"}`}>
          You have {items.length} PMF {items.length === 1 ? "item" : "items"} pending — {action}
          {overdueCount > 0 && <span className="ml-2 text-red-600">· {overdueCount} OVERDUE</span>}
        </h3>
      </div>
      <ul className="space-y-1">
        {items.slice(0, 5).map((i) => (
          <li key={i.id} className="text-sm flex items-center justify-between">
            <span className={i.overdue ? "text-red-700" : "text-gray-700"}>
              {i.label}{i.due && <span className="text-xs text-gray-500 ml-2">· due {i.due}</span>}
            </span>
            <Link href={`/assignments/${i.id}`} className="btn btn-secondary text-xs">Open</Link>
          </li>
        ))}
        {items.length > 5 && <li className="text-xs text-gray-500">+ {items.length - 5} more</li>}
      </ul>
    </div>
  );
}
