import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { lessonProgress, lessons, quizAttempts } from "@/db/schema";
import { getStudent } from "@/lib/auth";
import { loginStudent, logoutStudent, registerStudent } from "@/app/actions";
import { ActionForm } from "@/components/ui/ActionForm";
import { Field } from "@/components/ui/Field";

export const metadata: Metadata = { title: "منطقة الطالب" };
export const dynamic = "force-dynamic";

export default async function StudentPage() {
  const student = await getStudent();

  if (!student) {
    return (
      <main className="mx-auto max-w-[1000px] px-6 py-10">
        <h1 className="text-[2.2rem] font-bold">منطقة الطالب</h1>
        <p className="mt-2 text-[1.05rem] text-ink-soft">
          أنشئ حسابًا ليحفظ تقدمك ونتائجك ويتابع معك من حيث توقفت.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-6">
          <section className="card p-6">
            <h2 className="mb-4 text-xl font-bold">لدي حساب</h2>
            <ActionForm action={loginStudent} submitLabel="تسجيل الدخول">
              <Field label="اسم المستخدم" name="username" dir="ltr" autoComplete="username" />
              <Field label="كلمة المرور" name="password" type="password" autoComplete="current-password" />
            </ActionForm>
          </section>
          <section className="card p-6">
            <h2 className="mb-4 text-xl font-bold">حساب جديد</h2>
            <ActionForm action={registerStudent} submitLabel="إنشاء الحساب">
              <Field label="اسمك" name="displayName" autoComplete="name" />
              <Field
                label="اسم المستخدم"
                name="username"
                dir="ltr"
                hint="أحرف لاتينية صغيرة وأرقام فقط، مثل: sara_6"
                autoComplete="username"
              />
              <Field label="كلمة المرور" name="password" type="password" hint="6 أحرف على الأقل" autoComplete="new-password" />
            </ActionForm>
          </section>
        </div>
      </main>
    );
  }

  const [published, completed, attempts] = await Promise.all([
    db.select({ n: count() }).from(lessons).where(eq(lessons.status, "published")),
    db
      .select({ n: count() })
      .from(lessonProgress)
      .where(and(eq(lessonProgress.studentId, student.id), eq(lessonProgress.completed, true))),
    db
      .select({
        id: quizAttempts.id,
        score: quizAttempts.score,
        total: quizAttempts.total,
        lesson: lessons.title,
      })
      .from(quizAttempts)
      .innerJoin(lessons, eq(lessons.id, quizAttempts.lessonId))
      .where(eq(quizAttempts.studentId, student.id))
      .orderBy(desc(quizAttempts.createdAt))
      .limit(10),
  ]);

  const total = published[0]?.n ?? 0;
  const done = completed[0]?.n ?? 0;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[2.2rem] font-bold">أهلًا {student.displayName}</h1>
          <p className="mt-1 text-[1.05rem] text-ink-soft">هذه لوحة تقدمك الشخصية.</p>
        </div>
        <form action={logoutStudent}>
          <button className="btn btn-ghost">تسجيل الخروج</button>
        </form>
      </div>

      <section className="card mt-8 p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold">نسبة التقدم</h2>
          <span className="text-[1.6rem] font-bold text-brand tabular-nums">{pct}%</span>
        </div>
        <div
          className="mt-3 h-3 overflow-hidden rounded-full bg-brand-soft"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-3 text-ink-soft">
          {total === 0
            ? "لا توجد دروس معتمدة بعد، وسيبدأ احتساب تقدمك عند توفرها."
            : `أكملت ${done} من ${total} درسًا معتمدًا.`}
        </p>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <section className="card p-6">
          <h2 className="text-xl font-bold">نتائج الاختبارات</h2>
          {attempts.length === 0 ? (
            <p className="mt-3 text-ink-soft">لم تجرِ أي اختبار بعد.</p>
          ) : (
            <ul className="mt-3 divide-y divide-ink/10">
              {attempts.map((a) => (
                <li key={a.id} className="flex justify-between py-2.5">
                  <span>{a.lesson}</span>
                  <span className="font-semibold tabular-nums">{a.score} / {a.total}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card p-6">
          <h2 className="text-xl font-bold">دفاتري والدروس</h2>
          <p className="mt-3 text-ink-soft">
            دفتر الطالب يظهر في آخر كل درس معتمد. تصفّح{" "}
            <Link href="/curriculum" className="font-semibold text-brand hover:underline">فهرس المنهاج</Link>{" "}
            لمعرفة حالة الدروس.
          </p>
        </section>
      </div>
    </main>
  );
}
