"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { StageIcon } from "@/content/lesson-stages";

/**
 * نظام مراحل عرض الدرس (Step-based Lesson UI) — مكوّن عام لجميع دروس المنصة.
 *
 * يستقبل خطوات جاهزة (`steps`) فيها المحتوى كعناصر React، ولا يعرف شيئًا عن
 * بنية المحتوى نفسه. كل اللوحات تبقى مُركّبة واللوحات غير النشطة تُخفى فقط،
 * فتُحفظ حالة التفاعلات (الرسوم، الاختبارات، الجداول) عند التنقل.
 *
 * على الشاشات الكبيرة: قائمة مراحل جانبية ثابتة بجانب المحتوى.
 * على الهاتف: شريط مراحل أفقي قابل للتمرير بدل القائمة الجانبية.
 * الرابط المباشر يعمل عبر بصمة المرحلة في العنوان مثل `/lessons/lesson-1-1/#quiz`.
 */

export interface LessonStep {
  id: string;
  name: string;
  hint?: string;
  icon: StageIcon;
  content: ReactNode;
}

const STAGE_ICONS: Record<StageIcon, ReactNode> = {
  spark: <path d="M12 3l1.9 4.7 4.7 1.9-4.7 1.9L12 16.2l-1.9-4.7-4.7-1.9 4.7-1.9L12 3z" strokeLinejoin="round" strokeLinecap="round" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </>
  ),
  book: (
    <>
      <path d="M2 5h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" strokeLinejoin="round" />
      <path d="M22 5h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" strokeLinejoin="round" />
    </>
  ),
  flask: (
    <>
      <path d="M9.5 3h5" strokeLinecap="round" />
      <path d="M10.5 3v5.2L5.2 17a2.3 2.3 0 0 0 2.2 3h9.2a2.3 2.3 0 0 0 2.2-3L13.5 8.2V3" strokeLinejoin="round" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.4a2.5 2.5 0 0 1 5 .4c0 1.7-2.5 2-2.5 3.6" strokeLinecap="round" />
      <path d="M12 16.8h.01" strokeLinecap="round" />
    </>
  ),
  pencil: <path d="M4 20l4.6-1L20 7.6a2.15 2.15 0 0 0-3-3L5.6 16 4 20z" strokeLinejoin="round" strokeLinecap="round" />,
  clipboard: (
    <>
      <rect x="5" y="4.5" width="14" height="17" rx="2" />
      <path d="M9 4.5a2 2 0 0 1 6 0" strokeLinecap="round" />
      <path d="M9.5 13l2 2 3.5-4.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  list: (
    <>
      <path d="M9.5 6.5H21M9.5 12H21M9.5 17.5H21" strokeLinecap="round" />
      <path d="M4 6.5h1.5M4 12h1.5M4 17.5h1.5" strokeLinecap="round" />
    </>
  ),
  notebook: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M9.5 3v18" strokeLinecap="round" />
    </>
  ),
};

function StageIcon({ icon, className }: { icon: StageIcon; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      {STAGE_ICONS[icon]}
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const storageKey = (lessonId: string) => `lesson-steps:${lessonId}`;

export function LessonSteps({
  lessonId,
  steps,
  finishHref,
  finishLabel = "إنهاء الدرس",
}: {
  lessonId: string;
  steps: LessonStep[];
  /** الوجهة عند إتمام المرحلة الأخيرة (صفحة الوحدة أو فهرس المنهاج). */
  finishHref: string;
  finishLabel?: string;
}) {
  const firstId = steps[0]?.id ?? "";
  const [current, setCurrent] = useState(0);
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set<string>(firstId ? [firstId] : []));
  const rootRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef(steps);
  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  const indexFromHash = useCallback((): number | null => {
    if (typeof window === "undefined") return null;
    const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (!hash) return null;
    const index = stepsRef.current.findIndex((step) => step.id === hash);
    return index >= 0 ? index : null;
  }, []);

  const scrollToTop = useCallback(() => {
    rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const persist = useCallback(
    (index: number, visitedSet: ReadonlySet<string>) => {
      try {
        window.localStorage.setItem(
          storageKey(lessonId),
          JSON.stringify({ v: 1, current: index, visited: [...visitedSet] }),
        );
      } catch {
        /* التخزين المحلي قد يكون محظورًا — لا يؤثر في التنقل */
      }
    },
    [lessonId],
  );

  const goTo = useCallback(
    (index: number, options?: { push?: boolean; scroll?: boolean }) => {
      const list = stepsRef.current;
      if (list.length === 0) return;
      const clamped = Math.max(0, Math.min(list.length - 1, index));
      const target = list[clamped];
      setCurrent(clamped);
      setVisited((prev) => new Set(prev).add(target.id));
      try {
        if (options?.push === false) window.history.replaceState(null, "", `#${target.id}`);
        else window.history.pushState(null, "", `#${target.id}`);
      } catch {
        /* بعض البيئات تمنع pushState — التنقل يبقى يعمل */
      }
      if (options?.scroll !== false) scrollToTop();
    },
    [scrollToTop],
  );

  // عند التثبيت: استرجاع المرحلة من بصمة الرابط أو من التخزين المحلي،
  // والاستماع لزرّي «السابق/التالي» في المتصفح.
  useEffect(() => {
    let initial: number | null = indexFromHash();
    let storedVisited: string[] = [];
    if (initial === null) {
      try {
        const raw = window.localStorage.getItem(storageKey(lessonId));
        if (raw) {
          const data = JSON.parse(raw) as { current?: number; visited?: string[] };
          if (typeof data.current === "number" && Number.isInteger(data.current) && data.current >= 0 && data.current < stepsRef.current.length) {
            initial = data.current;
          }
          if (Array.isArray(data.visited)) storedVisited = data.visited.filter((v): v is string => typeof v === "string");
        }
      } catch {
        /* تجاهل التخزين التالف */
      }
    }
    const fallback = initial ?? 0;
    const fallbackId = stepsRef.current[fallback]?.id;
    setVisited(new Set<string>([...storedVisited, ...(fallbackId ? [fallbackId] : [])]));
    if (fallback !== 0) setCurrent(fallback);
    try {
      window.history.replaceState(null, "", `#${fallbackId ?? ""}`);
    } catch {
      /* تجاهل */
    }
    const onPopState = () => {
      const index = indexFromHash();
      if (index === null) return;
      setCurrent(index);
      setVisited((prev) => new Set(prev).add(stepsRef.current[index].id));
      scrollToTop();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const total = steps.length;
  const safeCurrent = Math.min(current, Math.max(total - 1, 0));
  const currentStep = steps[safeCurrent];
  const isFirst = safeCurrent === 0;
  const isLast = safeCurrent === total - 1;
  const doneCount = useMemo(() => steps.filter((step) => visited.has(step.id)).length, [steps, visited]);
  const progressPct = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  // حفظ التقدّم محليًا كلما تغيّرت المرحلة أو مجموعة المراحل المنجزة.
  useEffect(() => {
    persist(safeCurrent, visited);
  }, [safeCurrent, visited, persist]);

  // إبقاء المرحلة الحالية ظاهرة داخل شريط الهاتف الأفقي.
  useEffect(() => {
    try {
      const active = stripRef.current?.querySelector<HTMLElement>('[aria-current="step"]');
      active?.scrollIntoView({ block: "nearest", inline: "center" });
    } catch {
      /* تجاهل بيئات لا تدعم scrollIntoView */
    }
  }, [safeCurrent]);

  // بلا مراحل لا يوجد ما يُعرض (لا محتوى معتمدًا للدرس بعد).
  if (total === 0) return null;

  const stageButtonClasses = (state: "current" | "done" | "todo") =>
    [
      "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-start transition-colors",
      state === "current"
        ? "border-brand bg-brand-soft/60 shadow-sm"
        : state === "done"
          ? "border-emerald-600/25 bg-emerald-50/60 hover:border-emerald-600/40"
          : "border-ink/10 bg-white hover:border-brand/40 hover:bg-brand-soft/20",
    ].join(" ");

  const renderBadge = (index: number, state: "current" | "done" | "todo") =>
    state === "done" ? (
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-600 text-white">
        <CheckIcon className="h-4 w-4" />
      </span>
    ) : (
      <span
        className={[
          "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[0.85rem] font-bold tabular-nums",
          state === "current" ? "bg-brand text-white" : "bg-paper text-ink-soft",
        ].join(" ")}
      >
        {index + 1}
      </span>
    );

  const stageState = (index: number, id: string): "current" | "done" | "todo" =>
    index === safeCurrent ? "current" : visited.has(id) ? "done" : "todo";

  const progressText = `أنجزت ${doneCount} من ${total} مراحل`;

  const progressBar = (
    <div aria-hidden="true" className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
      <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${progressPct}%` }} />
    </div>
  );

  return (
    <div ref={rootRef} className="lesson-steps-root mt-8 scroll-mt-24">
      {/* ── الهاتف: شريط مراحل أفقي قابل للتمرير بدل القائمة الجانبية ── */}
      <div className="lesson-steps-chrome no-print lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[0.82rem] font-bold text-ink-soft">مراحل الدرس</p>
          <p className="text-[0.82rem] font-semibold text-brand tabular-nums" aria-live="polite">
            المرحلة {safeCurrent + 1} من {total}
          </p>
        </div>
        <div ref={stripRef} className="mt-2 flex snap-x gap-2 overflow-x-auto pb-2 pt-1 [scrollbar-width:thin]" role="list" aria-label="مراحل الدرس">
          {steps.map((step, index) => {
            const state = stageState(index, step.id);
            const isCurrent = state === "current";
            return (
              <button
                key={step.id}
                type="button"
                role="listitem"
                onClick={() => goTo(index)}
                aria-current={isCurrent ? "step" : undefined}
                className={[
                  "flex w-[7.5rem] shrink-0 snap-start flex-col items-center gap-1.5 rounded-xl border px-2 py-2 text-center transition-colors",
                  isCurrent
                    ? "border-brand bg-brand-soft/60 text-brand"
                    : state === "done"
                      ? "border-emerald-600/25 bg-emerald-50/60 text-emerald-800"
                      : "border-ink/10 bg-white text-ink-soft",
                ].join(" ")}
              >
                <span className="flex items-center gap-1.5">
                  {state === "done" ? <CheckIcon className="h-4 w-4 text-emerald-700" /> : <StageIcon icon={step.icon} className="h-4 w-4" />}
                  <span className="text-[0.72rem] font-bold tabular-nums">{index + 1}</span>
                </span>
                <span className="text-[0.78rem] font-bold leading-[1.4]">{step.name}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-1.5 flex items-center gap-3">
          {progressBar}
          <span className="shrink-0 text-[0.75rem] font-semibold text-ink-soft tabular-nums">{progressText}</span>
        </div>
      </div>

      <div className="lesson-steps-layout mt-5 lg:mt-0 lg:grid lg:grid-cols-[19.5rem_minmax(0,1fr)] lg:items-start lg:gap-6">
        {/* ── الشاشات الكبيرة: قائمة المراحل الجانبية ── */}
        <aside className="lesson-steps-chrome no-print hidden lg:sticky lg:top-24 lg:block" aria-label="مراحل الدرس">
          <div className="card p-4">
            <div className="flex items-center justify-between gap-2 border-b border-ink/10 pb-3">
              <h2 className="text-[1.05rem] font-bold">مراحل الدرس</h2>
              <span className="rounded-full bg-brand-soft/60 px-3 py-1 text-[0.78rem] font-bold text-brand tabular-nums">
                {safeCurrent + 1} / {total}
              </span>
            </div>
            <p className="mt-3 text-[0.8rem] font-semibold text-ink-soft" aria-live="polite">{progressText}</p>
            <div className="mt-1.5">{progressBar}</div>
            <ol className="mt-4 space-y-2">
              {steps.map((step, index) => {
                const state = stageState(index, step.id);
                const isCurrent = state === "current";
                return (
                  <li key={step.id}>
                    <button
                      type="button"
                      onClick={() => goTo(index)}
                      aria-current={isCurrent ? "step" : undefined}
                      className={stageButtonClasses(state)}
                    >
                      {renderBadge(index, state)}
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <StageIcon icon={step.icon} className={`h-4 w-4 shrink-0 ${state === "current" ? "text-brand" : state === "done" ? "text-emerald-700" : "text-ink-soft"}`} />
                          <span className={`text-[0.98rem] font-bold leading-[1.5] ${state === "current" ? "text-brand" : "text-ink"}`}>
                            {step.name}
                          </span>
                        </span>
                        {step.hint && <span className="mt-0.5 block text-[0.75rem] text-ink-soft">{step.hint}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>

        {/* ── المساحة الرئيسية: محتوى المرحلة المحددة فقط ── */}
        <div className="lesson-steps-panels min-w-0">
          {steps.map((step, index) => (
            <div
              key={step.id}
              id={`stage-panel-${step.id}`}
              className="lesson-stage"
              role="region"
              aria-label={`المرحلة ${index + 1}: ${step.name}`}
              hidden={index !== safeCurrent}
            >
              {step.content}
            </div>
          ))}

          {/* ── أزرار السابق / التالي (أو «إنهاء الدرس» في المرحلة الأخيرة) ── */}
          <div className="lesson-steps-chrome no-print mt-5 flex items-center justify-between gap-3 border-t border-ink/10 pt-4">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => goTo(safeCurrent - 1)}
              disabled={isFirst}
              aria-label="المرحلة السابقة"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              السابق
            </button>

            <span className="hidden text-[0.85rem] font-semibold text-ink-soft tabular-nums sm:inline">
              {currentStep ? `${currentStep.name} — ${safeCurrent + 1} من ${total}` : ""}
            </span>

            {isLast ? (
              <Link href={finishHref} className="btn btn-primary">
                <CheckIcon className="h-5 w-5" />
                {finishLabel}
              </Link>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => goTo(safeCurrent + 1)} aria-label="المرحلة التالية">
                التالي
                <span className="hidden font-normal opacity-80 md:inline">· {steps[safeCurrent + 1]?.name}</span>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
