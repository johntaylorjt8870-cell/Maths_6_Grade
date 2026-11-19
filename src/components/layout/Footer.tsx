import Link from "next/link";
import { EngineerLink } from "@/components/identity/Engineer";
import { PlatformMark } from "./PlatformLogo";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-20 bg-ink text-white">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-8 px-6 py-9">
        <div className="flex items-center gap-4">
          <PlatformMark className="h-12 w-12" />
          <div className="leading-snug">
            <p className="text-lg font-bold">{SITE.name}</p>
            <p className="text-sm text-white/70">
              {SITE.subject} · {SITE.grade} · {SITE.curriculum}
            </p>
          </div>
        </div>

        <ul className="flex items-center gap-5 text-[0.95rem] text-white/80">
          <li><Link href="/curriculum" className="hover:text-gold">فهرس المنهاج</Link></li>
          <li><Link href="/student" className="hover:text-gold">منطقة الطالب</Link></li>
          <li><Link href="/exams" className="hover:text-gold">الاختبارات</Link></li>
        </ul>

        <div className="flex flex-col items-start gap-2">
          <span className="text-sm text-white/60">للتواصل والاستفسار</span>
          <EngineerLink variant="footer" />
        </div>
      </div>
    </footer>
  );
}
