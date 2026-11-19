import Link from "next/link";
import { SITE } from "@/lib/site";

/** شعار المنصة: أربع عمليات حسابية داخل مربع، مرسومة بالأشكال لا بالنص. */
export function PlatformMark({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect width="48" height="48" rx="13" fill="#4338ca" />
      <rect x="2" y="2" width="44" height="44" rx="11" fill="none" stroke="#f5a524" strokeWidth="1.6" />
      <g stroke="#fff" strokeWidth="3" strokeLinecap="round">
        {/* + */}
        <path d="M13 14h8M17 10v8" />
        {/* − */}
        <path d="M28 14h8" />
        {/* × */}
        <path d="M13 29l8 8M21 29l-8 8" />
        {/* ÷ */}
        <path d="M28 33h8" />
      </g>
      <circle cx="32" cy="28.5" r="1.7" fill="#f5a524" />
      <circle cx="32" cy="37.5" r="1.7" fill="#f5a524" />
    </svg>
  );
}

export function PlatformLogo() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label={`${SITE.name} — الصفحة الرئيسية`}>
      <PlatformMark />
      <span className="leading-tight">
        <span className="block text-[1.35rem] font-bold text-ink">{SITE.name}</span>
        <span className="block text-[0.8rem] font-medium text-ink-soft">
          {SITE.grade} · {SITE.curriculum}
        </span>
      </span>
    </Link>
  );
}
