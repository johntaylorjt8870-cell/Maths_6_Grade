import type { ContentSource } from "@/content/types";

/**
 * شارة تمييز مصدر الكتلة التعليمية:
 * - «من الكتاب»: محتوى منقول عن صفحات الكتاب المدرسي (أخضر/كتاب).
 * - «إثراء»: إضافة تعليمية من المنصة موسومة بوضوح (كهرماني/شعلة).
 */
export function SourceTag({ source, className = "" }: { source: ContentSource; className?: string }) {
  const isExtra = source === "extra";
  return (
    <span
      data-source={source}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold ring-1 ring-inset ${
        isExtra
          ? "bg-amber-50 text-amber-800 ring-amber-300"
          : "bg-emerald-50 text-emerald-800 ring-emerald-300"
      } ${className}`}
      title={isExtra ? "إثراء تعليمي إضافي من المنصة — لا يغيّر محتوى الكتاب" : "محتوى منقول عن صفحات الكتاب المدرسي"}
    >
      {isExtra ? (
        <>
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor" aria-hidden="true">
            <path d="M8 1c.6 2.6-1.4 3.6-2.3 5.4C4.9 8 5.9 9.7 8 10.2c-.3-1.6.9-2.3 1.6-3.9.9-1.9-.3-4-1.6-5.3Z" />
            <path d="M8 12.4a4 4 0 1 0 0 2.6 4 4 0 0 0 0-2.6Z" opacity="0.85" />
          </svg>
          إثراء
        </>
      ) : (
        <>
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor" aria-hidden="true">
            <path d="M2.5 3.2A1.7 1.7 0 0 1 4.2 1.5H7v12.2H4.2a1.7 1.7 0 0 0-1.7 1.3V3.2Z" />
            <path d="M13.5 3.2A1.7 1.7 0 0 0 11.8 1.5H9v12.2h2.8a1.7 1.7 0 0 1 1.7 1.3V3.2Z" opacity="0.75" />
          </svg>
          من الكتاب
        </>
      )}
    </span>
  );
}
