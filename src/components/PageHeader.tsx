"use client";
import { ReactNode } from "react";

export function PageHeader({
  title, subtitle, badge, children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="page-title">{title}</h1>
          {badge && <span className="chip bg-primary-50 text-primary-700 border border-primary-100">{badge}</span>}
        </div>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-3 flex-wrap">{children}</div>}
    </div>
  );
}

export function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</span>
      {children}
    </div>
  );
}
