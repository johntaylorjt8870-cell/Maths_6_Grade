import { MathBlock, M } from "@/components/math/Math";
import { RichText } from "@/components/math/RichText";
import { LocalQuiz } from "@/components/lesson/LocalQuiz";
import { SourceTag } from "@/components/lesson/SourceTag";
import { PrintNotebookButton } from "@/components/lesson/PrintNotebookButton";
import { LessonSteps, type LessonStep } from "@/components/lesson/LessonSteps";
import { LESSON_STAGES } from "@/content/lesson-stages";
import { ACTIVITY_REGISTRY, EXERCISE_REGISTRY, FIGURE_REGISTRY } from "@/components/lesson/interactive/registry";
import type { ContentSource, FigureBlock, Lesson, LessonBlock, LessonContent as Content, LessonNotebook, LessonSection, Quiz } from "@/content/types";

/**
 * عارض محتوى الدرس — يبني «خطوات» المراحل من بيانات المحتوى الثابتة
 * ويمررها إلى نظام المراحل العام `LessonSteps`.
 *
 * الكتل التفاعلية تُربط بمكوناتها عبر السجلّات، وتعمل في المتصفح فقط.
 * المحتوى العلمي لا يُعاد تشكيله هنا: القسم يظهر كما هو داخل بطاقته،
 * الاختبار مرحلة مستقلة قبل الملخص، ودفتر الطالب يبقى المرحلة الأخيرة.
 */
export function LessonContent({
  lesson,
  content,
  finishHref = "/curriculum",
}: {
  lesson: Lesson;
  content: Content;
  /** وجهة «إنهاء الدرس» من المرحلة الأخيرة (تُمرَّر من صفحة الدرس). */
  finishHref?: string;
}) {
  const steps = buildLessonSteps(lesson, content);
  return <LessonSteps lessonId={lesson.id} steps={steps} finishHref={finishHref} />;
}

/**
 * تحويل محتوى الدرس إلى مراحل مرتّبة حسب LESSON_STAGES المعتمد:
 * التهيئة ← اكتشاف المفهوم ← الشرح المفصل ← النشاط/المختبر ← تحقق من فهمك
 * ← التطبيق ← اختبار الدرس ← الملخص ← دفتر الطالب.
 * أي أقسام غير معروفة تُضاف بعد المراحل المعروفة مباشرة (لا تُحذف).
 * الاختبار مرحلة مستقلة برقمه في التسلسل (7)، ولا يُعرض قبل التطبيق.
 */
function buildLessonSteps(lesson: Lesson, content: Content): LessonStep[] {
  const sectionById = new Map(content.sections.map((section) => [section.id, section] as const));
  const consumed = new Set<string>();
  const steps: LessonStep[] = [];

  // عنوان القسم مثل «التهيئة — انطلاقة الدرس»: بعد الشرطتين وصف قصير للقائمة الجانبية.
  const hintFromTitle = (title: string): string | undefined => {
    const parts = title.split("—");
    return parts.length > 1 ? parts.slice(1).join("—").trim() : undefined;
  };

  const pushSectionStep = (stageId: string, name: string, icon: LessonStep["icon"], section: LessonSection, fallbackHint?: string) => {
    consumed.add(section.id);
    steps.push({
      id: stageId,
      name,
      hint: hintFromTitle(section.title) ?? fallbackHint,
      icon,
      content: <SectionCard section={section} />,
    });
  };

  const pushQuiz = () => {
    if (!content.quiz) return;
    const stage = LESSON_STAGES.find((s) => s.id === "quiz");
    steps.push({
      id: "quiz",
      name: stage?.name ?? "اختبار الدرس",
      hint: "اختبار من إعداد المنصة",
      icon: stage?.icon ?? "clipboard",
      content: <LessonQuiz quiz={content.quiz} lessonTitle={lesson.title} />,
    });
  };

  for (const stage of LESSON_STAGES) {
    if (stage.id === "quiz") {
      // اختبار الدرس مرحلة مستقلة، موضعها المعتمد قبل الملخص.
      pushQuiz();
      continue;
    }
    if (stage.id === "notebook") continue; // يُضاف أخيرًا
    const section = sectionById.get(stage.id);
    if (!section) continue;
    pushSectionStep(stage.id, stage.name, stage.icon, section, stage.hint);
  }

  // أقسام غير معروفة (دروس قادمة ببنية مختلفة) — تُعرض بعد المراحل المعروفة ولا تُستبعد.
  for (const section of content.sections) {
    if (consumed.has(section.id)) continue;
    steps.push({
      id: section.id,
      name: section.title,
      icon: "book",
      content: <SectionCard section={section} />,
    });
  }

  // دفتر الطالب يبقى المرحلة الأخيرة دائمًا.
  if (content.notebook) {
    const stage = LESSON_STAGES.find((s) => s.id === "notebook");
    steps.push({
      id: "notebook",
      name: stage?.name ?? "دفتر الطالب",
      hint: "انقله إلى دفترك أو اطبعه",
      icon: stage?.icon ?? "notebook",
      content: <Notebook notebook={content.notebook} lessonTitle={lesson.title} />,
    });
  }

  return steps;
}

/** بطاقة قسم واحد — كما كانت تُعرض في الصفحة الواحدة، دون أي تغيير في الكتل. */
function SectionCard({ section }: { section: LessonSection }) {
  return (
    <section id={section.id} className="card scroll-mt-24 p-3 sm:p-6" aria-labelledby={`sec-${section.id}`}>
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
  );
}

/** غلاف موحّد لكل كتلة: يعرض شارة المصدر «من الكتاب»/«إثراء». */
function BlockShell({ source, children }: { source?: ContentSource; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      {source && (
        <div className="flex items-center justify-end">
          <SourceTag source={source} />
        </div>
      )}
      {children}
    </div>
  );
}

/** رسم واحد يُستخدم في الدرس وفي الدفتر؛ عنوانه مرئي ويُطبع معه. */
function LessonFigure({ figureId, caption, source }: Omit<FigureBlock, "type">) {
  const figure = FIGURE_REGISTRY[figureId];
  return (
    <figure className="lesson-figure rounded-xl border border-ink/10 bg-white p-2 sm:p-3" data-figure={figureId}>
      {(caption || source) && (
        <figcaption className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-[0.95rem] font-semibold text-ink">
          {caption && <span>{caption}</span>}
          {source && <SourceTag source={source} />}
        </figcaption>
      )}
      {figure ? (
        <>
          <div className="lesson-figure-scroll overflow-x-auto" dir="ltr" tabIndex={0} role="region" aria-label={caption ?? "الرسم البياني"}>
            <div className="lesson-figure-canvas mx-auto min-w-[296px] max-w-[620px]">{figure}</div>
          </div>
          <p className="lesson-figure-scroll-hint no-print mt-1 text-xs text-ink-soft">مرّر الرسم أفقيًا لتظهر بقية التدريجات.</p>
        </>
      ) : (
        <p className="rounded-lg bg-paper/60 p-4 text-ink-soft">رسم غير مسجّل: {figureId}</p>
      )}
    </figure>
  );
}

function SourcedLine({ source, children }: { source: ContentSource; children: React.ReactNode }) {
  return (
    <li className="sourced-line">
      <span className="me-2"><SourceTag source={source} /></span>
      {children}
    </li>
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

    case "figure":
      return <LessonFigure figureId={block.figureId} caption={block.caption} source={block.source} />;

    case "activity": {
      const Activity = ACTIVITY_REGISTRY[block.activityId];
      return (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-50/50 p-4">
          {block.prompt && (
            <p className="mb-3 text-[1rem] font-semibold leading-[1.9] text-emerald-900">
              {block.source && <span className="me-2"><SourceTag source={block.source} /></span>}
              <RichText text={block.prompt} />
            </p>
          )}
          {block.source !== "extra" && (
            <p className="mb-2 text-sm text-ink-soft">التفاعل والتصحيح <SourceTag source="extra" /></p>
          )}
          {Activity ? (
            <Activity />
          ) : (
            <p className="text-[0.9rem] text-amber-800">نشاط غير مسجّل: {block.activityId}</p>
          )}
        </div>
      );
    }

    case "exercise": {
      const Exercise = EXERCISE_REGISTRY[block.exerciseId];
      return (
        <div className="rounded-xl border border-gold/40 bg-gold-soft/30 p-4">
          {block.source === "book" ? (
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
              <span>الأسئلة <SourceTag source="book" /></span>
              <span>الخيارات والتصحيح <SourceTag source="extra" /></span>
            </div>
          ) : block.source && <SourceTag source={block.source} />}
          {Exercise ? (
            <Exercise />
          ) : (
            <p className="text-[0.9rem] text-amber-800">تمرين غير مسجّل: {block.exerciseId}</p>
          )}
        </div>
      );
    }

    case "summary":
      return (
        <div className="rounded-xl border border-ink/10 bg-white p-4">
          <h3 className="font-bold">خلاصة الدرس</h3>
          <ul className="mt-2 space-y-2.5 text-[1rem] leading-[1.9] text-ink-soft">
            {block.points.map((point, i) => (
              <SourcedLine key={i} source={point.source}>
                <RichText text={point.text} />
              </SourcedLine>
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
    <section id="quiz" className="card scroll-mt-24 p-3 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 pb-3">
        <h2 className="text-xl font-bold">{quiz.title ?? `اختبار الدرس: ${lessonTitle}`}</h2>
        <SourceTag source="extra" />
      </div>
      <p className="mt-3 text-sm text-ink-soft">اختبار من إعداد المنصة اعتمادًا على الدرس، وليس من نص الكتاب.</p>
      <LocalQuiz quiz={quiz} />
    </section>
  );
}

/** دفتر الطالب — كل ما ينقله الطالب إلى دفتره، مع زر طباعة يقصر النشر على هذا القسم. */
function Notebook({ notebook, lessonTitle }: { notebook: LessonNotebook; lessonTitle: string }) {
  return (
    <section id="notebook" className="card notebook-print scroll-mt-24 p-3 sm:p-6" aria-labelledby="notebook-title">
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
          <div key={gi} className="notebook-group rounded-xl border border-ink/10 bg-paper/50 p-2 sm:p-4">
            <h3 className="font-bold text-ink">{group.heading}</h3>
            <ul className="mt-2 space-y-2.5 text-[0.98rem] leading-[1.95] text-ink">
              {group.lines.map((line, li) => (
                <SourcedLine key={li} source={line.source}>
                  {line.text && <RichText text={line.text} />}
                  {line.tex && (
                    <span className="math-inline" dir="ltr">
                      <M tex={line.tex} />
                    </span>
                  )}
                </SourcedLine>
              ))}
            </ul>
            {group.blocks && <div className="notebook-blocks mt-3 space-y-4">{group.blocks.map((block, bi) => <Block key={bi} block={block} />)}</div>}
            {group.figures && (
              <div className="mt-3 space-y-3">
                {group.figures.map((figure) => <LessonFigure key={figure.figureId} {...figure} />)}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="no-print mt-4 text-[0.88rem] text-ink-soft">
        دفتر الطالب لدرس «{lessonTitle}» — يُنقل بخط اليد أو يُطبع مباشرة لهذا القسم فقط.
      </p>
    </section>
  );
}
