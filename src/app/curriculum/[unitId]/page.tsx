import Link from "next/link";
import type { Metadata } from "next";
import { NotFoundContent } from "@/components/layout/NotFoundContent";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EngineerLink } from "@/components/identity/Engineer";
import { findUnit, getUnitIds, getUnitNeighbours } from "@/content";

/**
 * صفحة الوحدة — بطاقات دروسها بترتيب الكتاب.
 * تُولَّد ثابتًا لكل وحدة في الفهرس (generateStaticParams) وتعمل على GitHub Pages.
 */

export function generateStaticParams() {
  return getUnitIds().map((id) => ({ unitId: id }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ unitId: string }>;
}): Promise<Metadata> {
  const { unitId } = await params;
  const unit = findUnit(unitId);
  if (!unit) return { title: "وحدة غير موجودة", robots: { index: false, follow: false } };
  return {
    title: `${unit.title} — فهرس المنهاج`,
    description: `دروس ${unit.title} بترتيب الكتاب المدرسي، مع حالة كل درس على المنصة.`,
  };
}

export default async function UnitPage({ params }: { params: Promise<{ unitId: string }> }) {
  const { unitId } = await params;
  const unit = findUnit(unitId);
  if (!unit) return <NotFoundContent title="هذه الوحدة غير موجودة" />;

  const accent = unit.accent ?? "#4338ca";
  const tint = unit.tint ?? "#eef0ff";
  const published = unit.lessons.filter((l) => l.status === "published").length;
  const { prev, next } = getUnitNeighbours(unit.id);
  const firstPage = unit.lessons[0]?.pageRange?.split("-")[0] ?? "—";
  const lastPage = unit.lessons[unit.lessons.length - 1]?.pageRange?.split("-").pop() ?? "—";

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10">
      {/* مسار التنقل */}
      <nav className="text-[0.9rem] text-ink-soft" aria-label="مسار التنقل">
        <Link href="/curriculum" className="hover:text-brand hover:underline">
          فهرس المنهاج
        </Link>
        <span className="mx-2">›</span>
        <span className="font-semibold text-ink">{unit.title}</span>
      </nav>

      {/* ترويسة الوحدة */}
      <header className="card relative mt-4 overflow-hidden p-6 sm:p-7">
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5" style={{ background: accent }} />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div
            className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl text-[2.6rem] font-bold text-white tabular-nums shadow"
            style={{ background: `linear-gradient(145deg, ${accent}, ${accent}cc)` }}
            aria-hidden="true"
          >
            {unit.number}
          </div>
          <div className="min-w-0">
            <h1 className="text-[2rem] font-bold leading-tight">{unit.title}</h1>
            {unit.summary && <p className="mt-1.5 max-w-[46rem] leading-[1.9] text-ink-soft">{unit.summary}</p>}
            <div className="mt-3 flex flex-wrap gap-2 text-[0.88rem]">
              <span className="rounded-full px-3 py-1 font-semibold" style={{ background: tint, color: accent }}>
                {unit.lessons.length} دروس
              </span>
              <span className="rounded-full bg-white px-3 py-1 font-semibold text-ink-soft ring-1 ring-inset ring-ink/10">
                صفحات الكتاب: <b className="tabular-nums text-ink">{firstPage}–{lastPage}</b>
              </span>
              <span className="rounded-full bg-white px-3 py-1 font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                المكتمل: <b className="tabular-nums">{published}</b> / {unit.lessons.length}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* بطاقات الدروس */}
      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[1.35rem] font-bold">دروس {unit.title}</h2>
          <EngineerLink variant="strip" />
        </div>
        <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {unit.lessons.map((lesson) => {
            const isPublished = lesson.status === "published";
            return (
              <li key={lesson.id}>
                <Link
                  href={`/lessons/${lesson.id}`}
                  className={`card group flex h-full items-start gap-4 p-5 transition-transform hover:-translate-y-0.5 ${
                    isPublished ? "ring-2 ring-inset ring-emerald-500/30" : ""
                  }`}
                  aria-label={`الدرس ${lesson.number}: ${lesson.title} — ${isPublished ? "متاح للدراسة" : "لم يُضف المحتوى بعد"}`}
                >
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-[1.2rem] font-bold tabular-nums text-white"
                    style={{ background: isPublished ? accent : "#94a3b8" }}
                    aria-hidden="true"
                  >
                    {lesson.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[1.08rem] font-bold leading-[1.7]">{lesson.title}</span>
                    <span className="mt-0.5 block text-[0.82rem] tabular-nums text-ink-soft">
                      صفحات الكتاب: ص {lesson.pageRange}
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={lesson.status} />
                      {isPublished ? (
                        <span className="text-[0.82rem] font-bold text-emerald-700">متاح للدراسة الآن ←</span>
                      ) : (
                        <span className="text-[0.82rem] font-semibold text-slate-500">لم يُضف المحتوى بعد</span>
                      )}
                    </span>
                  </span>
                  <svg
                    viewBox="0 0 16 16"
                    className="mt-1 h-5 w-5 shrink-0 text-ink-soft transition-transform group-hover:-translate-x-1"
                    fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"
                  >
                    <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* التنقل بين الوحدات */}
      <nav className="mt-8 flex flex-wrap items-center justify-between gap-3" aria-label="التنقل بين الوحدات">
        <div>
          {prev && (
            <Link href={`/curriculum/${prev.id}`} className="btn btn-ghost">
              ← {prev.title}
            </Link>
          )}
        </div>
        <Link href="/curriculum" className="btn btn-ghost">
          كل الوحدات
        </Link>
        <div>
          {next && (
            <Link href={`/curriculum/${next.id}`} className="btn btn-ghost">
              {next.title} →
            </Link>
          )}
        </div>
      </nav>
    </main>
  );
}
