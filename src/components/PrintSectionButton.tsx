"use client";
import { Icon } from "./Icons";

/**
 * Small "Print this section" button for use in section headers.
 *
 * How it works:
 *  - Adds `print-only-<sectionId>` class to <body>
 *  - CSS hides everything except elements with that class (or `.printable-<id>`)
 *  - Calls window.print()
 *  - Removes the class when print dialog closes
 *
 * The section it's attached to should wrap itself in:
 *    <div className={`printable-${sectionId}`}>...</div>
 */
export function PrintSectionButton({ sectionId, label }: { sectionId: string; label?: string }) {
  function handlePrint() {
    const body = document.body;
    const printClass = `print-only-${sectionId}`;
    body.classList.add(printClass);

    // Listen once for the afterprint event to clean up
    const cleanup = () => {
      body.classList.remove(printClass);
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);

    // Trigger the browser print dialog
    setTimeout(() => window.print(), 50);
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="no-print text-xs text-gray-500 hover:text-primary-700 hover:bg-primary-50 px-2 py-1 rounded-md inline-flex items-center gap-1 transition active:scale-95"
      title={`Print ${label ?? "this section"}`}
    >
      <Icon.Print size={14} />
      <span className="hidden sm:inline">Print</span>
    </button>
  );
}
