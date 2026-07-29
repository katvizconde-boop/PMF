"use client";
import { Icon } from "./Icons";
export function PrintButton() {
  return (
    <div style={{ display: "flex", gap: 8, padding: 10, background: "#fffbe6", border: "1px solid #fcd34d", borderRadius: 6, marginBottom: 16 }}>
      <button
        onClick={() => window.print()}
        style={{ background: "#111", color: "#fff", border: 0, padding: "8px 14px", borderRadius: 4, cursor: "pointer", fontSize: 13 }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon.Print size={14} /> Print / Save as PDF</span>
      </button>
      <button
        onClick={() => window.close()}
        style={{ background: "#fff", color: "#111", border: "1px solid #ccc", padding: "8px 14px", borderRadius: 4, cursor: "pointer", fontSize: 13 }}
      >
        Close
      </button>
      <span style={{ fontSize: 11, color: "#666", alignSelf: "center", marginLeft: 8 }}>
        Tip: In the print dialog, choose <b>"Save as PDF"</b> as the destination.
      </span>
    </div>
  );
}
