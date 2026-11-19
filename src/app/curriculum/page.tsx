import Link from "next/link";
import type { Metadata } from "next";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getCurriculum } from "@/lib/curriculum";

export const metadata: Metadata = { title: "فهرس المنهاج" };
export const dynamic = "force-dynamic";

export default async function CurriculumPage() {
  const data = await getCurriculum();

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
        <div className="mt-8 space-y-6">
          {data.map((unit) => (
            <section key={unit.id} className="card overflow-hidden">
              <h2 className="flex items-center gap-3 border-b border-ink/10 bg-brand-soft/60 px-6 py-4 text-[1.3rem] font-bold">
                <span className="grid h-9 min-w-9 place-items-center rounded-full bg-brand px-2 text-[1rem] text-white tabular-nums">
                  {unit.number}
                </span>
                <span>الوحدة {unit.number}: {unit.title}</span>
              </h2>
              {unit.lessons.length === 0 ? (
                <p className="px-6 py-4 text-ink-soft">لا توجد دروس مضافة لهذه الوحدة في الفهرس بعد.</p>
              ) : (
                <ul className="divide-y divide-ink/10">
                  {unit.lessons.map((lesson) => {
                    const open = lesson.status === "published";
                    return (
                      <li key={lesson.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="w-7 text-center font-semibold text-ink-soft tabular-nums">
                            {lesson.number}
                          </span>
                          {open ? (
                            <Link href={`/lessons/${lesson.id}`} className="text-[1.05rem] font-semibold text-brand hover:underline">
                              {lesson.title}
                            </Link>
                          ) : (
                            <Link href={`/lessons/${lesson.id}`} className="text-[1.05rem] font-medium text-ink-soft hover:underline">
                              {lesson.title}
                            </Link>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {lesson.pageRange && (
                            <span className="text-[0.85rem] text-ink-soft">ص {lesson.pageRange}</span>
                          )}
                          <StatusBadge status={lesson.status} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
