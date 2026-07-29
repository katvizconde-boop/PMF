/**
 * Shared monoline outline icon set — corporate, consistent stroke.
 * All icons are 1em-sized currentColor so they inherit text color/size.
 */
import React from "react";

const s = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
type P = { className?: string; size?: number | string };
const wrap = (size: P["size"]) => ({ width: size ?? "1em", height: size ?? "1em" });

export const Icon = {
  // ── Navigation ────────────────────────────────────────────
  Home: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
  Users: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  User: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Briefcase: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </svg>
  ),
  Building: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" />
      <path d="M10 21v-3h4v3" />
    </svg>
  ),
  Doc: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  ),
  Folder: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
  Calendar: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  ),
  Settings: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  ),
  // ── Status / actions ──────────────────────────────────────
  Check: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M5 12l5 5L20 7" />
    </svg>
  ),
  CheckCircle: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l3 3 5-6" />
    </svg>
  ),
  X: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M6 6l12 12M18 6l-12 12" />
    </svg>
  ),
  Alert: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M12 3l10 18H2z" />
      <path d="M12 10v5M12 18h0" />
    </svg>
  ),
  Info: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7h0" />
    </svg>
  ),
  Lock: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" />
    </svg>
  ),
  Unlock: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0" />
    </svg>
  ),
  Trash: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M4 7h16M10 7V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  ),
  Edit: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6" />
      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
    </svg>
  ),
  Plus: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Mail: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  ),
  Bell: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 3h16z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  ),
  Print: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M6 9V3h12v6" />
      <rect x="3" y="9" width="18" height="9" rx="2" />
      <path d="M6 18v3h12v-3" />
    </svg>
  ),
  Upload: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M12 16V4M6 10l6-6 6 6" />
      <path d="M4 20h16" />
    </svg>
  ),
  Download: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M12 4v12M6 14l6 6 6-6" />
      <path d="M4 20h16" />
    </svg>
  ),
  Pen: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M14 3l7 7-11 11H3v-7z" />
      <path d="M13 4l7 7" />
    </svg>
  ),
  // ── Data / metrics ────────────────────────────────────────
  BarChart: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M4 20V12M9 20V8M14 20V14M19 20V4" />
      <path d="M3 20h18" />
    </svg>
  ),
  LineChart: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M3 17l6-6 4 4 8-8" />
      <circle cx="3" cy="17" r="1.2" />
      <circle cx="9" cy="11" r="1.2" />
      <circle cx="13" cy="15" r="1.2" />
      <circle cx="21" cy="7" r="1.2" />
    </svg>
  ),
  PieChart: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v9l7 4" />
    </svg>
  ),
  Star: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M12 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
    </svg>
  ),
  Target: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </svg>
  ),
  Trophy: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
      <path d="M5 6H3v2a3 3 0 0 0 4 3M19 6h2v2a3 3 0 0 1-4 3" />
      <path d="M9 14h6l-1 4h-4z" />
      <path d="M8 22h8" />
    </svg>
  ),
  Sparkle: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </svg>
  ),
  Search: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  ),
  Eye: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M17 17a9 9 0 0 1-5 1.5C5 18.5 1 12 1 12a18 18 0 0 1 4.2-5.1M9.9 5.1A9 9 0 0 1 12 5c7 0 11 7 11 7a18 18 0 0 1-2.4 3.4M14.1 14.1A3 3 0 0 1 9.9 9.9" />
      <path d="M2 2l20 20" />
    </svg>
  ),
  GraduationCap: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M2 9l10-5 10 5-10 5z" />
      <path d="M6 11v5c2 2 10 2 12 0v-5" />
      <path d="M22 9v6" />
    </svg>
  ),
  Sprout: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M12 21V11" />
      <path d="M12 11c0-3-2-5-5-5 0 3 2 5 5 5z" />
      <path d="M12 11c0-3 2-5 5-5 0 3-2 5-5 5z" />
    </svg>
  ),
  Megaphone: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M3 11v2a2 2 0 0 0 2 2h1l5 4V5L6 9H5a2 2 0 0 0-2 2z" />
      <path d="M17 8a5 5 0 0 1 0 8" />
    </svg>
  ),
  Clipboard: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  ),
  Send: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4z" />
    </svg>
  ),
  Arrow: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  ),
  ArrowLeft: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M19 12H5M11 5l-7 7 7 7" />
    </svg>
  ),
  ChevronDown: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  Tool: ({ className, size }: P) => (
    <svg viewBox="0 0 24 24" {...wrap(size)} {...s} className={className}>
      <path d="M14.7 6.3a4 4 0 1 0 5.7 5.7l-1.4-1.4a2 2 0 1 1-2.9-2.9zM13 8L4 17v3h3l9-9" />
    </svg>
  ),
};

export type IconName = keyof typeof Icon;
