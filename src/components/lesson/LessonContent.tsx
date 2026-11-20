import { MathBlock, M } from "@/components/math/Math";
import { RichText } from "@/components/math/RichText";
import { LocalQuiz } from "@/components/lesson/LocalQuiz";
import { SourceTag } from "@/components/lesson/SourceTag";
import { PrintNotebookButton } from "@/components/lesson/PrintNotebookButton";
import { ACTIVITY_REGISTRY, EXERCISE_REGISTRY, FIGURE_REGISTRY } from "@/components/lesson/interactive/registry";
import type { Lesson, LessonBlock, LessonContent as Content, LessonNotebook, Quiz } from "@/content/types";

/**
 * عارض محتوى الدرس — يستقبل كتلًا مُعرَّفة في ملفات المحتوى الثابتة.
 * الكتل التفاعلية تُربط بمكوناتها عبر السجلّات، وتعمل في المتصفح فقط.
 */
export function LessonContent({ lesson, content }: { lesson: Lesson; content: Content }) {
  return (
    <article className="mt-8 space-y-6">
      {content.sections.map((section) => (
        <section key={section.id} id={section.id} className="card scroll-mt-24 p-6" aria-labelledby={`sec-${section.id}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 pb-3">
            <h2 id={`sec-${section.id}`} className="text-xl font-bold">
              {section.title}
            </h2>
            {section.source && <SourceTag source={section.source} />}
          </div>
          <div className="mt-4 space-y-4">
            {section.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </div>
        </section>
      ))}

      {content.quiz && <LessonQuiz quiz={content.quiz} lessonTitle={lesson.title} />}
      {content.notebook && <Notebook notebook={content.notebook} lessonTitle={lesson.title} />}
    </article>
  );
}

/** غلاف موحّد لكل كتلة: يعرض شارة المصدر «من الكتاب»/«إثراء». */
function BlockShell({ source, children }: { source?: "book" | "extra"; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-end">
        <SourceTag source={source ?? "book"} />
      </div>
      {children}
    </div>
  );
}

function Block({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case "text":
      return (
        <BlockShell source={block.source}>
          <p className="text-[1.05rem] leading-[2] text-ink">
            <RichText text={block.text} />
          </p>
        </BlockShell>
      );

    case "formula":
      return (
        <BlockShell source={block.source}>
          <div className="rounded-xl bg-paper/70 p-3">
            <MathBlock tex={block.tex} />
            {block.note && (
              <p className="mt-1 text-center text-[0.92rem] text-ink-soft">
                <RichText text={block.note} />
              </p>
            )}
          </div>
        </BlockShell>
      );

    case "table":
      return (
        <BlockShell source={block.source}>
          <figure className="overflow-x-auto">
            <table className="w-full min-w-[540px] border-collapse text-center text-[0.98rem]">
              {block.caption && (
                <caption className="mb-2 text-start text-[0.95rem] font-semibold text-ink-soft">
                  {block.caption}
                </caption>
              )}
              <thead>
                <tr>
                  {block.headers.map((h, i) => (
                    <th key={i} className="border border-ink/15 bg-brand-soft/50 px-3 py-2 font-bold text-ink">
                      <RichText text={h} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) =>
                      ci === 0 ? (
                        <th key={ci} className="border border-ink/15 bg-brand-soft/50 px-3 py-2 font-bold text-ink">
                          <RichText text={cell} />
                        </th>
                      ) : (
                        <td key={ci} className="border border-ink/15 px-3 py-2 tabular-nums">
                          <RichText text={cell} />
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </figure>
        </BlockShell>
      );

    case "example":
      return (
        <BlockShell source={block.source}>
          <div className="rounded-xl border border-brand/20 bg-brand-soft/25 p-4">
            <h3 className="font-bold text-brand">{block.title}</h3>
            <ol className="mt-3 space-y-2.5">
              {block.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-[0.8rem] font-bold text-white tabular-nums">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    {step.text && (
                      <p className="text-[1rem]">
                        <RichText text={step.text} />
                      </p>
                    )}
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
        </BlockShell>
      );

    case "figure": {
      const figure = FIGURE_REGISTRY[block.figureId];
      return (
        <BlockShell source={block.source}>
          <figure className="rounded-xl border border-ink/10 bg-white p-3">
            {figure ? (
              <div className="mx-auto max-w-[600px]">{figure}</div>
            ) : (
              <div className="grid place-items-center rounded-lg bg-paper/60 p-6 text-ink-soft">
                <span className="text-[0.9rem]">رسم توضيحي: {block.figureId}</span>
              </div>
            )}
            {block.caption && (
              <figcaption className="mt-2 text-center text-[0.9rem] text-ink-soft">
                {block.caption}
              </figcaption>
            )}
          </figure>
        </BlockShell>
      );
    }

    case "activity": {
      const Activity = ACTIVITY_REGISTRY[block.activityId];
      return (
        <BlockShell source={block.source}>
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-50/50 p-4">
            {block.prompt && (
              <p className="mb-3 text-[1rem] font-semibold leading-[1.9] text-emerald-900">
                <RichText text={block.prompt} />
              </p>
            )}
            {Activity ? (
              <Activity />
            ) : (
              <p className="text-[0.9rem] text-amber-800">نشاط غير مسجّل: {block.activityId}</p>
            )}
          </div>
        </BlockShell>
      );
    }

    case "exercise": {
      const Exercise = EXERCISE_REGISTRY[block.exerciseId];
      return (
        <BlockShell source={block.source}>
          <div className="rounded-xl border border-gold/40 bg-gold-soft/30 p-4">
            {Exercise ? (
              <Exercise />
            ) : (
              <p className="text-[0.9rem] text-amber-800">تمرين غير مسجّل: {block.exerciseId}</p>
            )}
          </div>
        </BlockShell>
      );
    }

    case "summary":
      return (
        <BlockShell source={block.source}>
          <div className="rounded-xl border border-ink/10 bg-white p-4">
            <h3 className="font-bold">خلاصة الدرس</h3>
            <ul className="mt-2 list-inside list-disc space-y-1.5 text-[1rem] leading-[1.9] text-ink-soft">
              {block.points.map((point, i) => (
                <li key={i}>
                  <RichText text={point} />
                </li>
              ))}
            </ul>
          </div>
        </BlockShell>
      );

    default:
      return null;
  }
}

function LessonQuiz({ quiz, lessonTitle }: { quiz: Quiz; lessonTitle: string }) {
  return (
    <section id="quiz" className="card scroll-mt-24 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 pb-3">
        <h2 className="text-xl font-bold">{quiz.title ?? `اختبار الدرس: ${lessonTitle}`}</h2>
        <SourceTag source="book" />
      </div>
      <LocalQuiz quiz={quiz} />
    </section>
  );
}

/** دفتر الطالب — كل ما ينقله الطالب إلى دفتره، مع زر طباعة يقصر النشر على هذا القسم. */
function Notebook({ notebook, lessonTitle }: { notebook: LessonNotebook; lessonTitle: string }) {
  return (
    <section id="notebook" className="card notebook-print scroll-mt-24 p-6" aria-labelledby="notebook-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-brand/25 pb-4">
        <div>
          <p className="text-[0.82rem] font-bold uppercase tracking-wide text-brand">دفتر الطالب</p>
          <h2 id="notebook-title" className="mt-1 text-[1.45rem] font-bold">
            {notebook.title}
          </h2>
          <p className="text-[0.85rem] text-ink-soft">كل ما تحتاجه في دفتر المدرسة — بلا رجوع إلى الشرح الكامل.</p>
        </div>
        <PrintNotebookButton />
      </div>
      {notebook.intro && <p className="mt-4 text-[0.98rem] leading-[1.95] text-ink">{notebook.intro}</p>}
      <div className="mt-4 space-y-5">
        {notebook.groups.map((group, gi) => (
          <div key={gi} className="rounded-xl border border-ink/10 bg-paper/50 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-ink">{group.heading}</h3>
              <SourceTag source={group.source ?? "book"} />
            </div>
            <ul className="mt-2 space-y-1.5">
              {group.lines.map((line, li) => (
                <li key={li} className="flex flex-wrap items-baseline gap-2 text-[0.98rem] leading-[1.95] text-ink">
                  <span aria-hidden="true" className="text-brand">◦</span>
                  <span className="min-w-0 flex-1">
                    {line.text && <RichText text={line.text} />}
                    {line.tex && (
                      <span className="math-inline" dir="ltr">
                        <M tex={line.tex} />
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="no-print mt-4 text-[0.88rem] text-ink-soft">
        دفتر الطالب لدرس «{lessonTitle}» — يُنقل بخط اليد أو يُطبع مباشرة لهذا القسم فقط.
      </p>
    </section>
  );
}
