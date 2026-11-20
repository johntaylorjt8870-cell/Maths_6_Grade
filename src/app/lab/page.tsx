import type { Metadata } from "next";
import Link from "next/link";
import { getAllLessons } from "@/content";

export const metadata: Metadata = { title: "المختبر التفاعلي" };

export default function LabPage() {
  // مختبرات الدروس تُعرض فقط للدروس المعتمدة (published). تُبنى الأنشطة داخل كل درس.
  const labLessons = getAllLessons().filter((entry) => entry.lesson.status === "published");

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10">
      <h1 className="text-[2.2rem] font-bold">المختبر التفاعلي</h1>
      <p className="mt-2 max-w-[46rem] text-[1.05rem] leading-[1.9] text-ink-soft">
        أنشطة ومحاكاة مرتبطة بدروس الكتاب: غيّر القيم، لاحظ النتيجة، ثم فسّر ما حدث. كل مختبر يعمل
        داخل متصفحك بلا تسجيل ولا خادم.
      </p>

      {labLessons.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="text-[1.25rem] font-bold">لا توجد أنشطة منشورة بعد</p>
          <p className="mx-auto mt-2 max-w-[34rem] text-ink-soft">
            يُبنى كل نشاط ضمن درسه بعد اعتماد محتوى الدرس، ولا تُضاف محاكاة مستقلة عن دروس الكتاب.
            الأنشطة القادمة ستعمل في المتصفح مباشرة على هذه المنصة الثابتة.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {labLessons.map(({ unit, lesson }) => (
            <li key={lesson.id} className="card flex h-full flex-col p-6">
              <p className="text-[0.85rem] text-ink-soft">{unit.title} · الدرس {lesson.number}</p>
              <h2 className="mt-1 text-[1.15rem] font-bold">{lesson.title}</h2>
              <p className="mt-2 text-[0.95rem] leading-[1.8] text-ink-soft">
                {lesson.summary ??
                  "مختبر تفاعلي مرتبط بمحتوى هذا الدرس: غيّر القيم، لاحظ النتيجة، ثم فسّر ما حدث."}
              </p>
              <div className="mt-auto pt-4">
                <Link href={`/lessons/${lesson.id}#lab`} className="btn btn-primary">
                  افتح المختبر
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
