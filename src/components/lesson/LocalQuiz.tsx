"use client";

import { useMemo, useState } from "react";
import { M } from "@/components/math/Math";
import { RichText } from "@/components/math/RichText";
import type { Quiz } from "@/content/types";

/** تصحيح فوري داخل المتصفح؛ لكل سؤال محاولة مستقلة مع تلميح وإعادة محاولة. */
export function LocalQuiz({ quiz }: { quiz: Quiz }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [hints, setHints] = useState<Record<string, boolean>>({});
  const correct = quiz.questions.filter((q) => checked[q.id] && answers[q.id] === q.correctChoiceId).length;
  const attempted = Object.keys(checked).length;
  const total = quiz.questions.length;
  const score = total ? Math.round((correct / total) * 100) : 0;
  const progress = useMemo(() => total ? Math.round((attempted / total) * 100) : 0, [attempted, total]);
  const hintFor = (prompt: string) => {
    if (/سلة فارغة|مجموعة خالية|محتواها/.test(prompt)) return "فكّر في معنى العدّ عندما لا يوجد أي عنصر داخل المجموعة.";
    if (/زوجي|فردي/.test(prompt)) return "تذكّر: قسمة العدد الزوجي على ٢ تترك باقيًا صفرًا؛ افحص الرقم الأخير.";
    if (/مجموع أرقام|مضاعفات العدد 3|مضاعفات 3/.test(prompt)) return "اجمع أرقام العدد أولًا، ثم اختبر قابلية المجموع للقسمة على ٣؛ لا تحكم من الرقم الأخير.";
    if (/مستقيم|يلي|السابق|التالي/.test(prompt)) return "تخيّل الحركة على مستقيم الأعداد: كل خطوة إلى اليمين تزيد وحدة واحدة.";
    if (/تقريب|أقرب/.test(prompt)) return "حدّد منزلة التقريب، ثم انظر إلى الرقم الذي يقع مباشرةً على يمينها.";
    if (/أكبر|أصغر|ترتيب|مقارنة/.test(prompt)) return "قارن القيم من المرتبة الأكبر إلى الأصغر، ولا تبدأ من الأرقام الأخيرة.";
    if (/كسر|طبيعي|عشري/.test(prompt)) return "بسّط القيمة أو اكتبها بصورة واضحة، ثم قرّر إلى أي مجموعة تنتمي.";
    if (/زاوية|متعامد|توازي|مستقيمين/.test(prompt)) return "ابحث عن العلاقة الهندسية المطلوبة في الرسم، وميّز بين التقاطع والتعامد والتوازي.";
    if (/قراءة|رسم بياني|نقطة|محور/.test(prompt)) return "ابدأ بقراءة التدريج والمحورين، ثم طابق الموضع مع القيمة المطلوبة.";
    return "أعد قراءة المطلوب وحدّد القاعدة الرياضية التي تختبرها المسألة، ثم استبعد الخيارات التي لا تحققها.";
  };

  return (
    <div className="mt-4 space-y-5">
      <div className="rounded-2xl border border-brand/15 bg-brand-soft/25 p-4" aria-label={`تم إنجاز ${attempted} من ${total} أسئلة`}>
        <div className="flex items-center justify-between gap-2 text-sm font-bold"><span>مسار التحدّي</span><span className="tabular-nums">{attempted} / {total}</span></div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>
      </div>
      <ol className="space-y-5">
        {quiz.questions.map((q, qi) => {
          const chosen = answers[q.id];
          const isChecked = Boolean(checked[q.id]);
          const isCorrect = chosen === q.correctChoiceId;
          return (
            <li key={q.id} className={`rounded-2xl border p-4 sm:p-5 transition-colors ${isChecked ? isCorrect ? "border-emerald-400 bg-emerald-50/70" : "border-amber-300 bg-amber-50/60" : "border-ink/10 bg-white"}`}>
              <p className="font-semibold leading-8"><span className="me-2 inline-grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-brand tabular-nums">{qi + 1}</span><RichText text={q.prompt} /></p>
              {q.tex && <div className="math-inline mt-2" dir="ltr"><M tex={q.tex} /></div>}
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {q.choices.map((choice) => {
                  const selected = chosen === choice.id;
                  return <label key={choice.id} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition hover:-translate-y-0.5 ${selected && isChecked ? isCorrect ? "border-emerald-500 bg-emerald-100" : "border-amber-400 bg-amber-100" : selected ? "border-brand bg-brand-soft/50" : "border-ink/10 bg-white hover:border-brand/40"}`}>
                    <input type="radio" name={q.id} value={choice.id} checked={selected} disabled={isChecked && isCorrect} onChange={() => { setAnswers((prev) => ({ ...prev, [q.id]: choice.id })); setChecked((prev) => { const next = { ...prev }; delete next[q.id]; return next; }); }} className="h-5 w-5 accent-[#4338ca]" />
                    <span className="flex-1"><RichText text={choice.text} />{choice.tex && <span className="math-inline ms-1" dir="ltr"><M tex={choice.tex} /></span>}</span>
                  </label>;
                })}
              </div>
              {isChecked && <div role="status" className={`mt-4 rounded-xl p-3 leading-7 ${isCorrect ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-950"}`}>
                <strong>{isCorrect ? "أحسنت! إجابتك صحيحة." : "ليست هذه المرة؛ جرّب التفكير من زاوية أخرى."}</strong>{isCorrect && (q.explanation || q.explanationTex) && <span> <RichText text={q.explanation ?? ""} />{q.explanationTex && <span className="math-inline ms-1" dir="ltr"><M tex={q.explanationTex} /></span>}</span>}
                {!isCorrect && hints[q.id] && <p className="mt-1">تلميح: {hintFor(q.prompt)}</p>}
                {!isCorrect && <button type="button" className="mt-2 me-3 rounded-lg px-3 py-2 font-semibold text-brand underline" onClick={() => setHints((prev) => ({ ...prev, [q.id]: true }))}>أعطني تلميحًا</button>}
                {!isCorrect && <button type="button" className="mt-2 rounded-lg bg-white px-3 py-2 font-semibold text-brand shadow-sm" onClick={() => { setChecked((prev) => { const next = { ...prev }; delete next[q.id]; return next; }); setAnswers((prev) => { const next = { ...prev }; delete next[q.id]; return next; }); }}>إعادة المحاولة</button>}
              </div>}
              {!isChecked && <button type="button" disabled={!chosen} className="btn btn-primary mt-4 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => setChecked((prev) => ({ ...prev, [q.id]: true }))}>تحقّق من إجابتي</button>}
            </li>
          );
        })}
      </ol>
      {attempted === total && <p role="status" className="rounded-2xl bg-emerald-50 px-4 py-3 text-lg font-bold text-emerald-900">أنهيت التحدّي: <span className="tabular-nums">{correct} / {total} — {score}%</span>{correct === total ? " • ممتاز، أتقنتها!" : " • يمكنك إعادة المحاولة لتحسين نتيجتك."}</p>}
      <p className="text-sm text-ink-soft">التصحيح يجري داخل متصفحك فقط؛ لا تُرسل إجاباتك ولا تُحفظ على خادم.</p>
    </div>
  );
}
