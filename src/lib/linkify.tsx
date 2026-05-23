import React from "react";

/**
 * Render text where any URLs become clickable links (opens in new tab).
 * Detects: http://, https://, www.something.com
 */
const URL_RE = /(\bhttps?:\/\/[^\s<>"']+|\bwww\.[a-z0-9-]+(?:\.[a-z]{2,})+(?:\/[^\s<>"']*)?)/gi;

export function LinkedText({ text, className }: { text: string | null | undefined; className?: string }) {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  // Reset regex state for each call
  URL_RE.lastIndex = 0;
  let i = 0;
  while ((m = URL_RE.exec(text)) !== null) {
    if (m.index > lastIndex) {
      parts.push(text.slice(lastIndex, m.index));
    }
    const url = m[0];
    const href = url.startsWith("www.") ? `https://${url}` : url;
    parts.push(
      <a
        key={`l-${i++}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={"text-primary-600 underline hover:text-primary-700 break-all"}
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>,
    );
    lastIndex = m.index + url.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <span className={className}>{parts}</span>;
}
