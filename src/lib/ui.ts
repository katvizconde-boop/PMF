export function ratingClass(s?: number | null) {
  if (s == null) return "rating-na";
  if (s >= 4) return "rating-good";
  if (s >= 3) return "rating-mid";
  return "rating-low";
}

export function ratingLabel(s?: number | null) {
  if (s == null) return "N/A";
  const r = Math.round(s * 2) / 2;
  if (r >= 5) return "Significantly Exceeds";
  if (r >= 4) return "Exceeds Expectations";
  if (r >= 3) return "Meets Expectations";
  if (r >= 2) return "Partially Meets";
  return "Unsatisfactory";
}

export function stateColor(state: string) {
  const map: Record<string, string> = {
    SELF_ASSESS: "bg-amber-100 text-amber-700",
    MANAGER_REVIEW: "bg-primary-100 text-primary-700",
    HR_REVIEW: "bg-accent-500/20 text-accent-600",
    FINALIZED: "bg-emerald-100 text-emerald-700",
  };
  return map[state] ?? "bg-gray-100 text-gray-700";
}
