"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { stripBasePath } from "@/lib/base-path";

const LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/curriculum", label: "فهرس المنهاج" },
  { href: "/exams", label: "الاختبارات" },
  { href: "/lab", label: "المختبر" },
  { href: "/math-engine", label: "محرك الرياضيات" },
];

export function NavLinks() {
  // usePathname يعيد المسار مع basePath على GitHub Pages؛ نزيله قبل المقارنة.
  const pathname = stripBasePath(usePathname() ?? "/");
  return (
    <nav aria-label="التنقل الرئيسي" className="flex min-w-0 flex-wrap items-center gap-1">
      {LINKS.map((l) => {
        const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-lg px-2 py-1.5 text-sm font-medium transition-colors sm:px-3 sm:text-[0.95rem] ${
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
