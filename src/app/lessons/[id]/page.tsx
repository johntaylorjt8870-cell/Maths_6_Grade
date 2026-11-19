import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lessons, units } from "@/db/schema";
import { EngineerLink } from "@/components/identity/Engineer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LESSON_STATUS, isLessonStatus } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lessonId = Number(id);
  if (!Number.isInteger(lessonId)) notFound();

  const rows = await db
    .select({ lesson: lessons, unit: units })
    .from(lessons)
    .innerJoin(units, eq(units.id, lessons.unitId))
    .where(eq(lessons.id, lessonId))
    .limit(1);
  if (!rows[0]) notFound();
  const { lesson, unit } = rows[0];

  const statusText = isLessonStatus(lesson.status) ? LESSON_STATUS[lesson.status].label : "";

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10">
      <nav className="text-[0.9rem] text-ink-soft" aria-label="مسار التنقل">
        <Link href="/curriculum" className="hover:text-brand hover:underline">فهرس المنهاج</Link>
        <span className="mx-2">›</span>
        <span>الوحدة {unit.number}: {unit.title}</span>
      </nav>

      <h1 className="mt-3 text-[2.2rem] font-bold">
        الدرس {lesson.number}: {lesson.title}
      </h1>
      <div className="mt-3 flex items-center justify-between gap-4">
        <StatusBadge status={lesson.status} long />
        <EngineerLink variant="strip" />
      </div>

      <section className="card mt-8 p-10 text-center">
        <p className="text-[1.25rem] font-bold">محتوى هذا الدرس لم يُنشر بعد</p>
        <p className="mx-auto mt-3 max-w-[36rem] text-ink-soft">
          الحالة الحالية: {statusText}. يُبنى الدرس (الشرح، الأنشطة، الاختبار، دفتر الطالب) اعتمادًا على
          صفحات الكتاب بعد إرسالها واعتماد المحتوى، ولا يُعرض أي شرح قبل ذلك.
        </p>
        <Link href="/curriculum" className="btn btn-ghost mt-6">العودة إلى الفهرس</Link>
      </section>
    </main>
  );
}
