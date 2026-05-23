"use client";
import { useState } from "react";

/**
 * Main app logo: 7GEN logo on top + "PMF System" wordmark below.
 */
export function Logo({ className = "", variant = "dark", size = "md", inline = false }: {
  className?: string;
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  inline?: boolean; // horizontal layout instead of stacked
}) {
  const [imageError, setImageError] = useState(false);
  const sizes = { sm: 26, md: 38, lg: 56 };
  const heightPx = sizes[size];
  const textPx = size === "sm" ? 11 : size === "lg" ? 18 : 13;
  const wordmarkColor = variant === "dark" ? "#ffffff" : "#1e3a5a";
  const accentColor = "#0033ff";

  const Stack = (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: inline ? "row" : "column",
        alignItems: inline ? "center" : "flex-start",
        gap: inline ? 10 : 4,
      }}
    >
      {!imageError ? (
        <img
          src="/logos/7gen.jpg"
          alt="7GEN"
          style={{ height: heightPx, width: "auto", objectFit: "contain" }}
          onError={() => setImageError(true)}
        />
      ) : (
        // SVG fallback
        <svg viewBox="0 0 60 60" width={heightPx} height={heightPx} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logo7" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00c3ff" />
              <stop offset="100%" stopColor="#0033ff" />
            </linearGradient>
          </defs>
          <path d="M8 10 L52 10 L52 22 L30 55 L18 55 L40 22 L8 22 Z" fill="url(#logo7)" />
        </svg>
      )}
      <div
        style={{
          fontSize: textPx,
          fontWeight: 800,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          lineHeight: 1.1,
        }}
      >
        <span style={{ color: wordmarkColor }}>PMF </span>
        <span style={{ color: accentColor }}>System</span>
      </div>
    </div>
  );

  return Stack;
}
