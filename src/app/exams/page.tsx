import type { Metadata } from "next";
import Link from "next/link";
import { SourceTag } from "@/components/lesson/SourceTag";
import { getAllLessons } from "@/content";

export const metadata: Metadata = { title: "الاختبارات" };

export default function ExamsPage() {
  // اختبارات المنصة متاحة للدروس المعتمدة (published) فقط.
  const quizLessons = getAllLessons().filter(
    (entry) => entry.lesson.status === "published" && entry.lesson.content?.quiz,
  );

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10">
      <h1 className="text-[2.2rem] font-bold">الاختبارات</h1>
      <p className="mt-2 text-[1.05rem] text-ink-soft">
        لكل درس معتمد اختبار خاص به يعمل ويُصحَّح داخل متصفحك مباشرة، دون إرسال أي بيانات إلى خادم.
      </p>

      {quizLessons.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="text-[1.25rem] font-bold">لا توجد اختبارات متاحة حاليًا</p>
          <p className="mx-auto mt-2 max-w-[34rem] text-ink-soft">
            لم يُعتمد أي درس بعد، ولذلك لا يوجد اختبار لأي درس. ستظهر الاختبارات هنا مع اعتماد الدروس.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {quizLessons.map(({ unit, lesson }) => (
            <li key={lesson.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="text-[0.9rem] text-ink-soft">{unit.title}</p>
                <p className="text-[1.1rem] font-semibold">
                  الدرس {lesson.number}: {lesson.title}
                </p>
                <p className="mt-1 text-sm text-ink-soft">اختبار من إعداد المنصة <SourceTag source="extra" /></p>
              </div>
              <Link href={`/lessons/${lesson.id}#quiz`} className="btn btn-primary">
                بدء الاختبار
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="card mt-8 p-6">
        <h2 className="text-xl font-bold">كيف تعمل الاختبارات؟</h2>
        <p className="mt-2 text-ink-soft">
          تُقدَّم الأسئلة في المتصفح، ويظهر التصحيح مع التفسير فور الضغط على «تصحيح الإجابات». لا تُحفظ أي نتائج على
          خادم، ولا حاجة إلى حساب أو تسجيل دخول.
        </p>
      </section>
    </main>
  );
}
