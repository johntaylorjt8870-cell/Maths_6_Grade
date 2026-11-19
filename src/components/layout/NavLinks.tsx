"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/curriculum", label: "فهرس المنهاج" },
  { href: "/student", label: "منطقة الطالب" },
  { href: "/exams", label: "الاختبارات" },
  { href: "/lab", label: "المختبر" },
  { href: "/teacher", label: "منطقة المعلم" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="التنقل الرئيسي" className="flex items-center gap-1">
      {LINKS.map((l) => {
        const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-[0.95rem] font-medium transition-colors ${
              active
                ? "bg-brand text-white"
                : "text-ink-soft hover:bg-brand-soft hover:text-brand"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
