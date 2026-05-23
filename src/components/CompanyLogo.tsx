"use client";
import { companyLogoPath, companyChipClass } from "@/lib/companies";

export function CompanyLogo({ company, size = 28, className = "" }: { company?: string | null; size?: number; className?: string }) {
  const path = companyLogoPath(company);
  if (!path) {
    return (
      <span className={`chip ${companyChipClass(company)} ${className}`} style={{ fontSize: 10 }}>
        {company ?? "—"}
      </span>
    );
  }
  return (
    <img
      src={path}
      alt={company ?? ""}
      style={{ height: size, width: "auto", maxWidth: size * 4, objectFit: "contain" }}
      className={className}
      title={company ?? undefined}
    />
  );
}

export function CompanyBadge({ company, size = 24 }: { company?: string | null; size?: number }) {
  const path = companyLogoPath(company);
  if (!path) {
    return <span className={`chip ${companyChipClass(company)}`}>{company ?? "—"}</span>;
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-2 py-0.5"
      title={company ?? undefined}
    >
      <img src={path} alt="" style={{ height: size, width: "auto", maxWidth: size * 3.5, objectFit: "contain" }} />
      <span className="text-xs font-medium text-gray-700">{company}</span>
    </span>
  );
}
