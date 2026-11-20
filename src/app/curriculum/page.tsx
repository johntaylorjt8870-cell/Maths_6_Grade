import type { Metadata } from "next";
import Link from "next/link";
import { curriculumStats, getCurriculum } from "@/content";

export const metadata: Metadata = {
  title: "فهرس المنهاج",
  description: "الوحدات والدروس بترتيب الكتاب المدرسي، مع حالة كل درس على المنصة.",
};

/**
 * فهرس المنهاج — وحدات الكتاب كبطاقات.
 * الضغط على بطاقة الوحدة يفتح صفحة الوحدة وفيها بطاقات دروسها بالترتيب.
 */
export default function CurriculumPage() {
  const data = getCurriculum();
  const stats = curriculumStats(data);

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-10">
      <h1 className="text-[2.2rem] font-bold">فهرس المنهاج</h1>
      <p className="mt-2 max-w-[46rem] text-[1.05rem] leading-[1.9] text-ink-soft">
        وحدات كتاب الرياضيات للصف السادس (المنهاج السوري) كما وردت في فهرس الكتاب، بالترتيب نفسه.
        افتح أي وحدة لترى دروسها بحالتها — لا يُعرض محتوى أي درس قبل إعداده من صفحات الكتاب واعتماده.
      </p>

      <div className="mt-6 flex flex-wrap gap-3 text-[0.95rem] text-ink-soft">
        <span className="rounded-full bg-white px-4 py-1 ring-1 ring-inset ring-ink/10">
          الوحدات: <b className="text-brand tabular-nums">{stats.units}</b>
        </span>
        <span className="rounded-full bg-white px-4 py-1 ring-1 ring-inset ring-ink/10">
          الدروس في الفهرس: <b className="text-brand tabular-nums">{stats.lessons}</b>
        </span>
        <span className="rounded-full bg-white px-4 py-1 ring-1 ring-inset ring-ink/10">
          الدروس المكتملة: <b className="text-brand tabular-nums">{stats.published}</b>
        </span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((unit) => {
          const published = unit.lessons.filter((l) => l.status === "published").length;
          const accent = unit.accent ?? "#4338ca";
          const firstPage = unit.lessons[0]?.pageRange?.split("-")[0] ?? "—";
          const lastLesson = unit.lessons[unit.lessons.length - 1];
          const lastPage = lastLesson?.pageRange?.split("-").pop() ?? "—";
          return (
            <Link
              key={unit.id}
              href={`/curriculum/${unit.id}`}
              aria-label={`افتح ${unit.title} — ${unit.lessons.length} دروس`}
              className="card group relative flex flex-col overflow-hidden p-6 transition-transform hover:-translate-y-1 focus-visible:-translate-y-1"
            >
              {/* شريط التمييز العلوي */}
              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5" style={{ background: accent }} />
              <div className="flex items-start justify-between gap-3">
                <div
                  className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-[1.7rem] font-bold text-white tabular-nums shadow-sm"
                  style={{ background: `linear-gradient(145deg, ${accent}, ${accent}cc)` }}
                >
                  {unit.number}
                </div>
                <span
                  className="rounded-full px-3 py-1 text-[0.78rem] font-bold"
                  style={{ background: unit.tint ?? "#eef0ff", color: accent }}
                >
                  {unit.lessons.length} دروس
                </span>
              </div>
              <h2 className="mt-4 text-[1.35rem] font-bold leading-snug">{unit.title}</h2>
              {unit.summary && (
                <p className="mt-1.5 line-clamp-2 text-[0.93rem] leading-[1.8] text-ink-soft">{unit.summary}</p>
              )}
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                <div className="text-[0.83rem] text-ink-soft">
                  <span className="block">صفحات الكتاب: <b className="tabular-nums text-ink">{firstPage}–{lastPage}</b></span>
                  <span className="mt-0.5 block">المكتمل: <b className="tabular-nums text-emerald-700">{published}</b> من {unit.lessons.length}</span>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[0.9rem] font-bold text-white transition-transform group-hover:-translate-x-0.5"
                  style={{ background: accent }}
                >
                  دروس الوحدة
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="mt-8 text-[0.9rem] text-ink-soft">
        ترتيب الوحدات والدروس وصفحات بدايتها كما وردت في فهرس الكتاب (ص 2). تُضاف دروس كل وحدة تباعًا مع وصول
        صور صفحاتها واعتماد محتواها.
      </p>
    </main>
  );
}
