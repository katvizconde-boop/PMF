export const COMPANIES = [
  "M2.0 Communications",
  "Media Meter Inc",
  "7GEN",
  "Rythmos DB Inc.",
] as const;

// Exact departments per company from the master list
export const DEPARTMENTS_BY_COMPANY: Record<string, string[]> = {
  "M2.0 Communications": [
    "Client Success Team",
    "Business and Strategy Team",
    "Content Team",
    "Creatives Team",
  ],
  "Media Meter Inc": [
    "Client Success Team",
    "Business Development Team",
    "Operations Team",
  ],
  "7GEN": [
    "Back End Team",
    "Front End and QA Team",
    "Product Development Team",
    "Data Collection and Machine Learning Team",
    "Infrastructure and DevOps Team",
    "Finance Team",
    "HR and Admin Team",
    "Reports Team",
  ],
  "Rythmos DB Inc.": [
    "SG Newsletter",
    "SG Reports",
    "SG Gov",
    "AU Reports",
    "AU Newsletter",
    "EMEA",
    "Innovations Team",
  ],
};

/** Merge default + DB-stored departments per company. */
export function mergeDepartments(
  dbDepts: { company: string; name: string }[]
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const c of COMPANIES) out[c] = [...(DEPARTMENTS_BY_COMPANY[c] ?? [])];
  for (const d of dbDepts) {
    if (!out[d.company]) out[d.company] = [];
    if (!out[d.company].includes(d.name)) out[d.company].push(d.name);
  }
  return out;
}

export function companyChipClass(company?: string | null) {
  switch (company) {
    case "M2.0 Communications": return "bg-blue-100 text-blue-700";
    case "Media Meter Inc":     return "bg-purple-100 text-purple-700";
    case "7GEN":                return "bg-emerald-100 text-emerald-700";
    case "Rythmos DB Inc.":     return "bg-orange-100 text-orange-700";
    default:                     return "bg-gray-100 text-gray-600";
  }
}

/** Path to the official logo file for each company (under /public/logos/). */
export function companyLogoPath(company?: string | null): string | null {
  switch (company) {
    case "M2.0 Communications": return "/logos/m20-communications.png";
    case "Media Meter Inc":     return "/logos/media-meter.png";
    case "7GEN":                return "/logos/7gen.jpg";
    case "Rythmos DB Inc.":     return "/logos/rythmos-db.png";
    default:                     return null;
  }
}
