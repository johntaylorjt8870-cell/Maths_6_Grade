import type { Metadata } from "next";
import { getStudent } from "@/lib/auth";
import { db } from "@/db";
import { lessons, quizAttempts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const metadata: Metadata = { title: "الاختبارات" };
export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  const student = await getStudent();
  const attempts = student
    ? await db
        .select({
          id: quizAttempts.id,
          score: quizAttempts.score,
          total: quizAttempts.total,
          createdAt: quizAttempts.createdAt,
          lesson: lessons.title,
        })
        .from(quizAttempts)
        .innerJoin(lessons, eq(lessons.id, quizAttempts.lessonId))
        .where(eq(quizAttempts.studentId, student.id))
        .orderBy(desc(quizAttempts.createdAt))
        .limit(20)
    : [];

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10">
      <h1 className="text-[2.2rem] font-bold">الاختبارات</h1>
      <p className="mt-2 text-[1.05rem] text-ink-soft">
        لكل درس معتمد اختبار خاص به يظهر بعد إكمال محتوى الدرس. تُسجَّل نتائجك ومحاولاتك في منطقة الطالب.
      </p>

      <div className="card mt-8 p-10 text-center">
        <p className="text-[1.25rem] font-bold">لا توجد اختبارات متاحة حاليًا</p>
        <p className="mx-auto mt-2 max-w-[34rem] text-ink-soft">
          لم يُعتمد أي درس بعد، ولذلك لا يوجد اختبار لأي درس. ستظهر الاختبارات هنا مع اعتماد الدروس.
        </p>
      </div>

      {student && attempts.length > 0 && (
        <section className="card mt-8 p-6">
          <h2 className="text-xl font-bold">محاولاتك السابقة</h2>
          <ul className="mt-3 divide-y divide-ink/10">
            {attempts.map((a) => (
              <li key={a.id} className="flex justify-between py-2.5">
                <span>{a.lesson}</span>
                <span className="font-semibold tabular-nums">{a.score} / {a.total}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
