import Link from "next/link";
import type { Metadata } from "next";
import { NotFoundContent } from "@/components/layout/NotFoundContent";
import { EngineerLink } from "@/components/identity/Engineer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getLessonIds, findLesson, getLessonNeighbours } from "@/content";
import { LESSON_STATUS, isLessonStatus } from "@/lib/site";
import { LessonContent } from "@/components/lesson/LessonContent";

/**
 * صفحات الدروس — مسار ثابت لكل درس معرّف في فهرس المحتوى.
 * generateStaticParams تضمن أن كل درس يُصدَّر كصفحة HTML جاهزة على GitHub Pages.
 */
/**
 * معرّف تقني لا يمثّل درسًا: عند خلوّ فهرس المحتوى لا يطلب Next.js التصدير الثابت
 * أي معرّف، فيرفض البناء إن لم يُولَّد مسار واحد. هذا المسار الوحيد يعرض صفحة
 * "غير موجود" النظامية، ويختفي تلقائيًا فور إضافة أول درس حقيقي إلى الفهرس.
 */
const EMPTY_INDEX_ROUTE = "_";

export function generateStaticParams() {
  const ids = getLessonIds();
  return (ids.length > 0 ? ids : [EMPTY_INDEX_ROUTE]).map((id) => ({ id }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const found = findLesson(id);
  if (!found) return { title: "درس غير موجود", robots: { index: false, follow: false } };
  return {
    title: `الدرس ${found.lesson.number}: ${found.lesson.title}`,
  };
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = findLesson(id);
  // لا يُستخدم notFound() هنا: في التصدير الثابت تُصدَّر هذه الصفحة عند خلوّ الفهرس،
  // وصفحة المتصفح الافتراضية للخطأ قد تظهر فارغة. نعرض المحتوى مباشرة بدلًا من ذلك.
  if (!found) return <NotFoundContent title="هذا الدرس غير موجود" />;
  const { unit, lesson } = found;

  const statusText = isLessonStatus(lesson.status) ? LESSON_STATUS[lesson.status].label : "";
  const hasContent = lesson.status === "published" && Boolean(lesson.content);
  const { prev, next } = getLessonNeighbours(lesson.id);

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10">
      <nav className="text-[0.9rem] text-ink-soft" aria-label="مسار التنقل">
        <Link href="/curriculum" className="hover:text-brand hover:underline">
          فهرس المنهاج
        </Link>
        <span className="mx-2">›</span>
        <Link href={`/curriculum/${unit.id}`} className="hover:text-brand hover:underline">
          {unit.title}
        </Link>
        <span className="mx-2">›</span>
        <span>الدرس {lesson.number}</span>
      </nav>

      <h1 className="mt-3 text-[2.2rem] font-bold">
        الدرس {lesson.number}: {lesson.title}
      </h1>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <StatusBadge status={lesson.status} long />
        <EngineerLink variant="strip" />
      </div>

      {hasContent && lesson.content ? (
        <LessonContent lesson={lesson} content={lesson.content} />
      ) : (
        <section className="card mt-8 p-10 text-center">
          <p className="text-[1.25rem] font-bold">محتوى هذا الدرس لم يُنشر بعد</p>
          <p className="mx-auto mt-3 max-w-[36rem] text-ink-soft">
            الحالة الحالية: {statusText}. يُبنى الدرس (الشرح، الأنشطة، الاختبار، دفتر الطالب) اعتمادًا على
            صفحات الكتاب بعد إرسالها واعتماد المحتوى، ولا يُعرض أي شرح قبل ذلك.
          </p>
          <Link href="/curriculum" className="btn btn-ghost mt-6">
            العودة إلى الفهرس
          </Link>
        </section>
      )}

      <nav className="mt-10 flex flex-wrap items-center justify-between gap-3" aria-label="التنقل بين الدروس">
        <div>
          {prev && (
            <Link href={`/lessons/${prev.lesson.id}`} className="btn btn-ghost">
              ← الدرس السابق: {prev.lesson.title}
            </Link>
          )}
        </div>
        <div>
          {next && (
            <Link href={`/lessons/${next.lesson.id}`} className="btn btn-ghost">
              الدرس التالي: {next.lesson.title} →
            </Link>
          )}
        </div>
      </nav>
    </main>
  );
}
