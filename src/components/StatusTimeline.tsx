import { Icon } from "./Icons";

type Step = {
  state: string;
  label: string;
  by: string | null;
  at: Date | null;
  current: boolean;
  done: boolean;
};

function fmtDate(d: Date | null) {
  if (!d) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function daysSince(from: Date | null, to: Date | null) {
  if (!from || !to) return null;
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

export function StatusTimeline({
  state, createdAt, selfSubmittedAt, managerSubmittedAt, hrApprovedAt, finalizedAt,
  employeeName, managerName,
}: {
  state: string;
  createdAt: Date;
  selfSubmittedAt: Date | null;
  managerSubmittedAt: Date | null;
  hrApprovedAt: Date | null;
  finalizedAt: Date | null;
  employeeName: string;
  managerName: string;
}) {
  const order = ["SELF_ASSESS", "MANAGER_REVIEW", "HR_REVIEW", "FINALIZED"];
  const currentIdx = order.indexOf(state);

  const steps: Step[] = [
    { state: "SELF_ASSESS",    label: "Self-Assessment", by: employeeName, at: selfSubmittedAt,    current: state === "SELF_ASSESS",    done: currentIdx > 0 },
    { state: "MANAGER_REVIEW", label: "Manager Review",  by: managerName,  at: managerSubmittedAt, current: state === "MANAGER_REVIEW", done: currentIdx > 1 },
    { state: "HR_REVIEW",      label: "HR Review",       by: "HR Admin",   at: hrApprovedAt,       current: state === "HR_REVIEW",      done: currentIdx > 2 },
    { state: "FINALIZED",      label: "Finalized",       by: null,         at: finalizedAt,        current: state === "FINALIZED",      done: state === "FINALIZED" },
  ];

  // Compute time spent at each stage for completed steps
  const startTimes: (Date | null)[] = [createdAt, selfSubmittedAt, managerSubmittedAt, hrApprovedAt];
  const endTimes:   (Date | null)[] = [selfSubmittedAt, managerSubmittedAt, hrApprovedAt, finalizedAt];

  return (
    <div className="card">
      <h3 className="section-header inline-flex items-center gap-1"><Icon.BarChart size={16} /> Workflow Status</h3>
      <div className="relative">
        {/* Connector line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200" />
        <div
          className="absolute top-5 left-5 h-0.5 bg-emerald-500 transition-all"
          style={{ width: currentIdx >= 0 ? `calc(${(currentIdx / (order.length - 1)) * 100}% - ${(currentIdx / (order.length - 1)) * 40}px)` : "0%" }}
        />

        <div className="grid grid-cols-4 gap-2 relative">
          {steps.map((s, i) => {
            const dotColor = s.done ? "bg-emerald-500 text-white" : s.current ? "bg-primary-500 text-white ring-4 ring-primary-100" : "bg-gray-100 text-gray-400 border border-gray-200";
            const lblColor = s.done ? "text-emerald-700" : s.current ? "text-primary-700" : "text-gray-400";
            const days = s.done ? daysSince(startTimes[i], endTimes[i]) : null;
            return (
              <div key={s.state} className="flex flex-col items-center text-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${dotColor} relative z-10`}>
                  {s.done ? <Icon.Check size={18} /> : i + 1}
                </div>
                <div className={`mt-2 text-xs font-semibold ${lblColor}`}>{s.label}</div>
                {s.by && <div className="text-[10px] text-gray-500 mt-0.5 truncate max-w-full">{s.by}</div>}
                {s.at && <div className="text-[10px] text-gray-400 mt-0.5">{fmtDate(s.at)}</div>}
                {days != null && days >= 0 && (
                  <div className="text-[10px] text-gray-400 italic mt-0.5">{days === 0 ? "same day" : `${days}d`}</div>
                )}
                {s.current && !s.at && (
                  <div className="text-[10px] text-primary-600 italic mt-0.5">In progress</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
