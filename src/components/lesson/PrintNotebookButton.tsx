"use client";

/** زر طباعة دفتر الطالب — يطبع قسم «دفتر الطالب» فقط (أنظر @media print في globals.css). */
export function PrintNotebookButton() {
  return (
    <button type="button" className="btn btn-ghost no-print" onClick={() => window.print()}>
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M5.5 7V2.5h9V7M5.5 13.5H3a1 1 0 0 1-1-1V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4.5a1 1 0 0 1-1 1h-2.5M5.5 11h9v6h-9z" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      طباعة الدفتر
    </button>
  );
}
