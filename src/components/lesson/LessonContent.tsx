import { MathBlock, M } from "@/components/math/Math";
import { RichText } from "@/components/math/RichText";
import { LocalQuiz } from "@/components/lesson/LocalQuiz";
import type { Lesson, LessonBlock, LessonContent as Content, Quiz } from "@/content/types";

/**
 * عارض محتوى الدرس — يستقبل كتلًا مُعرَّفة في ملفات المحتوى الثابتة.
 * كل نوع كتلة له عرض مستقل، والكتل التفاعلية تعمل في المتصفح فقط.
 */
export function LessonContent({ lesson, content }: { lesson: Lesson; content: Content }) {
  return (
    <article className="mt-8 space-y-6">
      {content.sections.map((section) => (
        <section key={section.id} className="card p-6" aria-labelledby={`sec-${section.id}`}>
          <h2 id={`sec-${section.id}`} className="text-xl font-bold">
            {section.title}
          </h2>
          <div className="mt-4 space-y-4">
            {section.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </div>
        </section>
      ))}

      {content.quiz && <LessonQuiz quiz={content.quiz} lessonTitle={lesson.title} />}
    </article>
  );
}

function Block({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case "text":
      return (
        <p className="text-[1.05rem] text-ink">
          <RichText text={block.text} />
        </p>
      );

    case "formula":
      return (
        <div className="rounded-xl bg-paper/70 p-3">
          <MathBlock tex={block.tex} />
          {block.note && (
            <p className="mt-1 text-center text-[0.92rem] text-ink-soft">{block.note}</p>
          )}
        </div>
      );

    case "example":
      return (
        <div className="rounded-xl border border-brand/20 bg-brand-soft/25 p-4">
          <h3 className="font-bold text-brand">{block.title}</h3>
          <ol className="mt-3 space-y-2.5">
            {block.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-[0.8rem] font-bold text-white tabular-nums">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  {step.text && <p className="text-[1rem]"><RichText text={step.text} /></p>}
                  {step.tex && (
                    <div className="math-inline mt-1" dir="ltr">
                      <M tex={step.tex} />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      );

    case "figure":
      return (
        <figure className="rounded-xl border border-ink/10 p-3">
          {/* الرسم يُسجَّل بمعرّفه في سجل الرسوم — يُضاف مع محتوى الدرس. */}
          <div className="grid place-items-center rounded-lg bg-paper/60 p-6 text-ink-soft">
            <span className="text-[0.9rem]">رسم توضيحي: {block.figureId}</span>
          </div>
          {block.caption && (
            <figcaption className="mt-2 text-center text-[0.9rem] text-ink-soft">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case "activity":
      return (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-50/60 p-4">
          <p className="font-semibold text-emerald-800">نشاط تفاعلي: {block.activityId}</p>
          {block.prompt && <p className="mt-1 text-[0.98rem] text-ink-soft">{block.prompt}</p>}
        </div>
      );

    case "exercise":
      return (
        <div className="rounded-xl border border-gold/40 bg-gold-soft/40 p-4">
          <p className="font-semibold text-amber-800">تمرين مع تصحيح فوري: {block.exerciseId}</p>
        </div>
      );

    case "summary":
      return (
        <div className="rounded-xl border border-ink/10 bg-white p-4">
          <h3 className="font-bold">خلاصة الدرس</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-[1rem] text-ink-soft">
            {block.points.map((point, i) => (
              <li key={i}><RichText text={point} /></li>
            ))}
          </ul>
        </div>
      );

    default:
      return null;
  }
}

function LessonQuiz({ quiz, lessonTitle }: { quiz: Quiz; lessonTitle: string }) {
  return (
    <section id="quiz" className="card scroll-mt-24 p-6">
      <h2 className="text-xl font-bold">{quiz.title ?? `اختبار الدرس: ${lessonTitle}`}</h2>
      <LocalQuiz quiz={quiz} />
    </section>
  );
}
