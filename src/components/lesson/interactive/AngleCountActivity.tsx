"use client";

import { useState } from "react";

const FIGURES = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح", "ط", "ك"];
// Count the marked angle vertices shown in the ten source-book drawings on printed p. 6.
const COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

export function AngleCountActivity() {
  const [answers, setAnswers] = useState<string[]>(Array(10).fill(""));
  const [checked, setChecked] = useState(false);
  const [hint, setHint] = useState(false);
  const filled = answers.every((value) => value.trim() !== "");
  const correctCount = answers.filter((value, i) => Number(value) === COUNTS[i]).length;
  const allCorrect = correctCount === FIGURES.length;
  const reset = () => { setAnswers(Array(10).fill("")); setChecked(false); setHint(false); };

  return <div className="mt-4 rounded-2xl border border-brand/20 bg-white p-4" data-testid="natural-angle-count">
    <p className="font-bold leading-7">نشاط تفاعلي: اكتب عدد الزوايا المتشكلة في كل شكل من الأشكال (أ–ك) المعروضة أعلاه.</p>
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
      {FIGURES.map((label, i) => <label key={label} className="flex items-center gap-2 rounded-lg border border-ink/10 p-2">
        <span className="font-bold">الشكل {label}</span>
        <input aria-label={`عدد الزوايا في الشكل ${label}`} type="number" min="0" step="1" inputMode="numeric" value={answers[i]} onChange={(event) => {
          setAnswers((old) => old.map((value, index) => index === i ? event.target.value : value));
          setChecked(false); setHint(false);
        }} className="min-h-10 w-16 rounded-lg border border-ink/20 text-center" />
      </label>)}
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" className="btn btn-primary disabled:opacity-40" disabled={!filled} onClick={() => { setChecked(true); setHint(false); }}>تحقّق من الإجابات</button>
      <button type="button" className="btn btn-ghost" onClick={reset}>إعادة المحاولة</button>
      {checked && !allCorrect && <button type="button" className="btn btn-ghost" onClick={() => setHint(true)}>أحتاج تلميحًا</button>}
    </div>
    {checked && <p role="status" className={`mt-3 rounded-lg p-3 font-semibold ${allCorrect ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-950"}`}>
      {allCorrect ? "أحسنت! عددت زوايا الأشكال العشرة جميعها." : `الإجابات الصحيحة: ${correctCount} من 10. راجع مواضع الزوايا المعلّمة في كل شكل.`}
      {!allCorrect && hint && <span className="mt-1 block">تلميح: عدّ كل زاوية عند رأس أو انعطاف في الخط؛ لا تعدّ امتداد الخط المستقيم زاوية جديدة.</span>}
    </p>}
  </div>;
}
