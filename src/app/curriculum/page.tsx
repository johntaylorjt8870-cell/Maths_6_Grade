import Link from "next/link";
import type { Metadata } from "next";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { curriculumStats, getCurriculum } from "@/content";

export const metadata: Metadata = { title: "فهرس المنهاج" };

export default function CurriculumPage() {
  const data = getCurriculum();
  const stats = curriculumStats(data);

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10">
      <h1 className="text-[2.2rem] font-bold">فهرس المنهاج</h1>
      <p className="mt-2 text-[1.05rem] text-ink-soft">
        الوحدات والدروس بترتيب الكتاب المدرسي. لا يُفتح درس للدراسة إلا بعد إعداد محتواه واعتماده.
      </p>

      {data.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="text-[1.25rem] font-bold">بانتظار فهرس المنهاج</p>
          <p className="mx-auto mt-2 max-w-[34rem] text-ink-soft">
            لم يُضف فهرس الكتاب إلى المنصة بعد. فور إضافته ستظهر هنا الوحدات والدروس بحالتها.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-3 text-[0.95rem] text-ink-soft">
            <span className="rounded-full bg-white px-4 py-1 ring-1 ring-inset ring-ink/10">
              الوحدات: <b className="text-brand tabular-nums">{stats.units}</b>
            </span>
            <span className="rounded-full bg-white px-4 py-1 ring-1 ring-inset ring-ink/10">
              الدروس: <b className="text-brand tabular-nums">{stats.lessons}</b>
            </span>
            <span className="rounded-full bg-white px-4 py-1 ring-1 ring-inset ring-ink/10">
              المكتملة: <b className="text-brand tabular-nums">{stats.published}</b>
            </span>
          </div>

          <div className="mt-6 space-y-6">
            {data.map((unit) => (
              <section key={unit.id} className="card overflow-hidden">
                <h2 className="flex items-center gap-3 border-b border-ink/10 bg-brand-soft/60 px-6 py-4 text-[1.3rem] font-bold">
                  <span className="grid h-9 min-w-9 place-items-center rounded-full bg-brand px-2 text-[1rem] text-white tabular-nums">
                    {unit.number}
                  </span>
                  <span>
                    الوحدة {unit.number}: {unit.title}
                  </span>
                </h2>
                {unit.summary && (
                  <p className="border-b border-ink/10 px-6 py-3 text-[0.98rem] text-ink-soft">
                    {unit.summary}
                  </p>
                )}
                {unit.lessons.length === 0 ? (
                  <p className="px-6 py-4 text-ink-soft">لا توجد دروس مضافة لهذه الوحدة في الفهرس بعد.</p>
                ) : (
                  <ul className="divide-y divide-ink/10">
                    {unit.lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 text-center font-semibold text-ink-soft tabular-nums">
                            {lesson.number}
                          </span>
                          <Link
                            href={`/lessons/${lesson.id}`}
                            className={`text-[1.05rem] hover:underline ${
                              lesson.status === "published"
                                ? "font-semibold text-brand"
                                : "font-medium text-ink-soft"
                            }`}
                          >
                            {lesson.title}
                          </Link>
                        </div>
                        <div className="flex items-center gap-3">
                          {lesson.pageRange && (
                            <span className="text-[0.85rem] text-ink-soft">ص {lesson.pageRange}</span>
                          )}
                          <StatusBadge status={lesson.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
