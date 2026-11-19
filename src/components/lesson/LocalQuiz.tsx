"use client";

import { useMemo, useState } from "react";
import { M } from "@/components/math/Math";
import { RichText } from "@/components/math/RichText";
import type { Quiz } from "@/content/types";

/**
 * اختبار محلي بالكامل: كل التصحيح يحدث في المتصفح، بلا طلبات شبكة ولا حفظ على خادم.
 * لا تُحفظ النتائج بعد إغلاق الصفحة (لا حسابات ولا قاعدة بيانات بحسب تصميم المنصة).
 */
export function LocalQuiz({ quiz }: { quiz: Quiz }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  const { correct, answered } = useMemo(() => {
    let correctCount = 0;
    for (const q of quiz.questions) {
      if (answers[q.id] === q.correctChoiceId) correctCount += 1;
    }
    return { correct: correctCount, answered: Object.keys(answers).length };
  }, [answers, quiz.questions]);

  const total = quiz.questions.length;
  const allAnswered = answered === total;
  const score = total === 0 ? 0 : Math.round((correct / total) * 100);

  return (
    <div className="mt-4 space-y-5">
      <ol className="space-y-6">
        {quiz.questions.map((q, qi) => {
          const chosen = answers[q.id];
          return (
            <li key={q.id} className="rounded-xl border border-ink/10 p-4">
              <p className="font-semibold">
                <span className="tabular-nums text-brand">{qi + 1}.</span>{" "}
                <RichText text={q.prompt} />
              </p>
              {q.tex && (
                <div className="math-inline mt-2" dir="ltr">
                  <M tex={q.tex} />
                </div>
              )}

              <div className="mt-3 grid gap-2">
                {q.choices.map((choice) => {
                  const isChosen = chosen === choice.id;
                  const isCorrect = choice.id === q.correctChoiceId;
                  let tone = "border-ink/15 bg-white hover:border-brand/50";
                  if (checked && isCorrect) tone = "border-emerald-500 bg-emerald-50";
                  else if (checked && isChosen && !isCorrect) tone = "border-coral bg-red-50";
                  else if (isChosen) tone = "border-brand bg-brand-soft/50";

                  return (
                    <label
                      key={choice.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-[1rem] transition-colors ${tone}`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={choice.id}
                        checked={isChosen}
                        onChange={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: choice.id }))
                        }
                        className="h-4 w-4 accent-[#4338ca]"
                      />
                      <span><RichText text={choice.text} /></span>
                      {choice.tex && (
                        <span className="math-inline" dir="ltr">
                          <M tex={choice.tex} />
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              {checked && (
                <p className="mt-3 rounded-lg bg-paper/70 px-3 py-2 text-[0.95rem] text-ink-soft">
                  {chosen === q.correctChoiceId ? "إجابة صحيحة. " : "إجابة غير صحيحة. "}
                  {q.explanation && <RichText text={q.explanation} />}
                  {q.explanationTex && (
                    <span className="math-inline ms-1" dir="ltr">
                      <M tex={q.explanationTex} />
                    </span>
                  )}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!allAnswered}
          onClick={() => setChecked(true)}
        >
          تصحيح الإجابات
        </button>
        {checked && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setAnswers({});
              setChecked(false);
            }}
          >
            إعادة المحاولة
          </button>
        )}
        <span className="text-[0.95rem] text-ink-soft">
          {allAnswered ? `أجبت عن ${answered} من ${total}` : `أجب عن ${total - answered} سؤالًا متبقيًا`}
        </span>
      </div>

      {checked && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 px-4 py-3 text-[1.05rem] font-semibold text-emerald-800"
        >
          النتيجة: <span className="tabular-nums">{correct} / {total}</span> —{" "}
          <span className="tabular-nums">{score}%</span>
        </p>
      )}

      <p className="text-[0.88rem] text-ink-soft">
        التصحيح يجري داخل متصفحك فقط، ولا تُرسَل إجاباتك ولا تُحفظ على أي خادم.
      </p>
    </div>
  );
}
