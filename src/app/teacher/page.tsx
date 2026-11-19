import type { Metadata } from "next";
import Link from "next/link";
import {
  addLesson,
  addUnit,
  changePasswordAction,
  deleteLesson,
  deleteUnit,
  loginTeacherAction,
  logoutTeacher,
  setLessonStatus,
} from "@/app/actions";
import { isTeacher, isTeacherConfigured } from "@/lib/auth";
import { getCurriculum } from "@/lib/curriculum";
import { LESSON_STATUS } from "@/lib/site";
import { ActionForm } from "@/components/ui/ActionForm";
import { Field } from "@/components/ui/Field";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata: Metadata = { title: "منطقة المعلم", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function TeacherPage() {
  if (!(await isTeacher())) {
    const configured = await isTeacherConfigured();
    return (
      <main className="mx-auto max-w-[520px] px-6 py-14">
        <section className="card p-8">
          <h1 className="text-[1.8rem] font-bold">منطقة المعلم</h1>
          <p className="mb-5 mt-1 text-ink-soft">هذه المنطقة محمية. أدخل كلمة المرور للمتابعة.</p>
          {configured ? (
            <ActionForm action={loginTeacherAction} submitLabel="دخول">
              <Field label="كلمة المرور" name="password" type="password" autoComplete="current-password" />
            </ActionForm>
          ) : (
            <p className="rounded-lg bg-amber-50 px-3 py-2 font-medium text-amber-800">
              لم تُهيَّأ كلمة مرور المعلم. اضبط المتغير <bdi dir="ltr">TEACHER_PASSWORD</bdi> في إعدادات الخادم ثم أعد المحاولة.
            </p>
          )}
        </section>
      </main>
    );
  }

  const data = await getCurriculum();

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[2.2rem] font-bold">منطقة المعلم</h1>
          <p className="mt-1 text-[1.05rem] text-ink-soft">إدارة هيكل المنهاج، والحلول، وإعدادات الحماية.</p>
        </div>
        <form action={logoutTeacher}>
          <button className="btn btn-ghost">تسجيل الخروج</button>
        </form>
      </div>

      {/* هيكل المنهاج */}
      <section className="card mt-8 p-6">
        <h2 className="text-xl font-bold">هيكل المنهاج (من فهرس الكتاب)</h2>
        <p className="mt-1 text-[0.95rem] text-ink-soft">
          عناصر تنظيمية فقط: عنوان الوحدة أو الدرس كما ورد في الفهرس. إضافة العنوان لا تنشئ أي محتوى للدرس.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-6">
          <ActionForm action={addUnit} submitLabel="إضافة وحدة" className="space-y-3 rounded-xl bg-brand-soft/40 p-4">
            <h3 className="font-bold">وحدة جديدة</h3>
            <Field label="رقم الوحدة" name="number" type="number" min={1} />
            <Field label="عنوان الوحدة" name="title" />
          </ActionForm>

          <ActionForm action={addLesson} submitLabel="إضافة درس" className="space-y-3 rounded-xl bg-gold-soft/60 p-4">
            <h3 className="font-bold">درس جديد</h3>
            <label className="block">
              <span className="mb-1 block text-[0.95rem] font-semibold">الوحدة</span>
              <select name="unitId" required className="field" defaultValue="">
                <option value="" disabled>اختر الوحدة</option>
                {data.map((u) => (
                  <option key={u.id} value={u.id}>الوحدة {u.number}: {u.title}</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Field label="رقم الدرس" name="number" type="number" min={1} />
              <Field label="الصفحات" name="pageRange" required={false} hint="اختياري، مثل 12-15" />
            </div>
            <Field label="عنوان الدرس" name="title" />
          </ActionForm>
        </div>

        <div className="mt-6 space-y-5">
          {data.length === 0 && <p className="text-ink-soft">لا توجد وحدات بعد.</p>}
          {data.map((u) => (
            <div key={u.id} className="rounded-xl border border-ink/10">
              <div className="flex items-center justify-between bg-ink/[0.04] px-4 py-2.5">
                <h3 className="font-bold">الوحدة {u.number}: {u.title}</h3>
                <form action={deleteUnit}>
                  <input type="hidden" name="id" value={u.id} />
                  <button className="text-[0.9rem] font-semibold text-coral hover:underline">حذف الوحدة ودروسها</button>
                </form>
              </div>
              <ul className="divide-y divide-ink/10">
                {u.lessons.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span>
                      <span className="font-semibold tabular-nums">{l.number}.</span> {l.title}
                    </span>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={l.status} />
                      <form action={setLessonStatus} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={l.id} />
                        <select name="status" defaultValue={l.status} className="field !w-auto !py-1 text-[0.9rem]" aria-label="حالة الدرس">
                          {Object.entries(LESSON_STATUS).map(([key, v]) => (
                            <option key={key} value={key}>{v.short}</option>
                          ))}
                        </select>
                        <button className="btn btn-ghost !px-3 !py-1 text-[0.9rem]">حفظ</button>
                      </form>
                      <form action={deleteLesson}>
                        <input type="hidden" name="id" value={l.id} />
                        <button className="text-[0.9rem] font-semibold text-coral hover:underline">حذف</button>
                      </form>
                    </div>
                  </li>
                ))}
                {u.lessons.length === 0 && <li className="px-4 py-2.5 text-ink-soft">لا دروس في هذه الوحدة.</li>}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* الحلول */}
      <section className="card mt-6 p-6">
        <h2 className="text-xl font-bold">الأسئلة والحلول ومفاتيح الإجابة</h2>
        <p className="mt-2 text-ink-soft">
          لا توجد أسئلة بعد. تُضاف أسئلة الكتاب وحلولها التفصيلية هنا فقط بعد إرسال صور الدرس، وتبقى خادميًا
          خلف هذه الحماية ولا تصل إلى واجهة الطالب.
        </p>
      </section>

      {/* أدوات */}
      <div className="mt-6 grid grid-cols-2 gap-6">
        <section className="card p-6">
          <h2 className="text-xl font-bold">فحص محرك الرياضيات</h2>
          <p className="mb-4 mt-2 text-ink-soft">
            صفحة اختبار تعرض المتجهات والرموز اليونانية والكسور والوحدات والمعادلات داخل SVG وفق KaTeX.
          </p>
          <Link href="/teacher/math-test" className="btn btn-primary">فتح صفحة الفحص</Link>
        </section>
        <section className="card p-6">
          <h2 className="mb-4 text-xl font-bold">تغيير كلمة المرور</h2>
          <ActionForm action={changePasswordAction} submitLabel="تغيير كلمة المرور">
            <Field label="كلمة المرور الحالية" name="current" type="password" autoComplete="current-password" />
            <Field label="كلمة المرور الجديدة" name="next" type="password" hint="8 أحرف على الأقل" autoComplete="new-password" />
          </ActionForm>
        </section>
      </div>
    </main>
  );
}
