"use client";

// Tiny client wrapper so a server-rendered page can offer "print / save as PDF"
// (used by the Single Central Record for Ofsted-ready export).
export function PrintButton({ label = "Print / save as PDF" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-secondary">
      {label}
    </button>
  );
}
