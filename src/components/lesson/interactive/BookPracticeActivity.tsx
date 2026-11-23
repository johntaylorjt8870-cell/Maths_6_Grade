"use client";

import { useMemo, useState } from "react";
import { RichText } from "@/components/math/RichText";
import type { BookPracticeBlock } from "@/content/types";

/** مكوّن بيانات موحّد لأنشطة تمارين الكتاب: خط أعداد، تصنيف، مجموعة قيم، وتأمل مفتوح. */
export function BookPracticeActivity(task: BookPracticeBlock) {
  const [points, setPoints] = useState<number[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [answer, setAnswer] = useState("");
  const [reflection, setReflection] = useState("");
  const [formValues, setFormValues] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [done, setDone] = useState(false);

  const lineValues = useMemo(() => Array.from({ length: (task.max ?? 0) - (task.min ?? 0) + 1 }, (_, i) => (task.min ?? 0) + i), [task.min, task.max]);
  const correctAssigned = (task.items ?? []).filter((item) => {
    const bucket = task.buckets?.find((candidate) => candidate.items.includes(item));
    return assignments[item] === bucket?.label;
  }).length;
  const allAssigned = (task.items ?? []).every((item) => assignments[item]);
  const fields = task.fields ?? [];
  const fieldsFilled = fields.length > 0 && fields.every((_, i) => Boolean(formValues[i]?.trim()));
  const correctFields = fields.filter((field, i) => !field.expected || (Array.isArray(field.expected) ? field.expected : [field.expected]).some((expected) => normalizeAnswer(formValues[i] ?? "") === normalizeAnswer(expected))).length;
  const puzzleErrors = task.validator === "sixDigitPuzzle" ? validateSixDigitPuzzle(formValues[0] ?? "") : [];
  const success = task.mode === "numberLine"
    ? points.length === (task.targets?.length ?? 0) && task.targets?.every((n) => points.includes(n))
    : task.mode === "classify"
      ? allAssigned && correctAssigned === (task.items?.length ?? 0)
      : task.mode === "setEntry"
        ? sameSet(answer.split(/[،,\s]+/).filter(Boolean), task.expectedSet ?? [])
        : task.mode === "form"
          ? fieldsFilled && (task.validator === "sixDigitPuzzle" ? puzzleErrors.length === 0 : correctFields === fields.length)
          : done;

  const reset = () => { setPoints([]); setAssignments({}); setAnswer(""); setReflection(""); setFormValues([]); setChecked(false); setShowHint(false); setDone(false); };

  return <div className="book-practice mt-4 rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-soft/35 to-white p-4 sm:p-5" dir="rtl">
    <div className="mb-4 flex items-center justify-between gap-2">
      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand">تفاعل من المنصة · لا يغيّر نص الكتاب</span>
      {task.mode !== "reflection" && <span className="text-sm text-ink-soft">حاول بنفسك ثم تحقّق</span>}
    </div>
    <p className="text-base font-bold leading-8 text-ink"><RichText text={task.prompt} /></p>

    {task.mode === "numberLine" && <div className="mt-5">
      <p className="mb-3 text-sm text-ink-soft">اختر النقاط على مستقيم الأعداد. انقر العدد مرة أخرى لإزالته.</p>
      <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white px-3 py-4" role="group" aria-label="مستقيم الأعداد التفاعلي" dir="ltr">
        <div className="relative flex min-w-max items-center gap-1 px-1">
          <span aria-hidden="true" className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 bg-brand/45" />
          {lineValues.map((n) => <button key={n} type="button" aria-pressed={points.includes(n)} onClick={() => { setPoints((old) => old.includes(n) ? old.filter((x) => x !== n) : [...old, n].sort((a,b)=>a-b)); setChecked(false); }} className={`relative z-10 min-h-11 min-w-10 rounded-full border font-bold tabular-nums transition ${points.includes(n) ? "border-brand bg-brand text-white shadow-sm" : "border-ink/15 bg-white text-ink hover:border-brand"}`}>{n}</button>)}
        </div>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-ink/10"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, points.length / (task.targets?.length || 1) * 100)}%` }} /></div>
      <p className="mt-1 text-xs text-ink-soft">حددت {points.length} عددًا</p>
    </div>}

    {task.mode === "classify" && <div className="mt-4 space-y-4">
      <p className="text-sm text-ink-soft">اختر عنصرًا ثم ضعه في الخانة المناسبة. تعمل الخانات بالنقر لتناسب الهاتف ولوحة المفاتيح.</p>
      <div className="flex flex-wrap gap-2" aria-label="عناصر التصنيف">
        {(task.items ?? []).map((item) => <button key={item} type="button" aria-pressed={!assignments[item]} onClick={() => { setAssignments((old) => { const next = { ...old }; delete next[item]; return next; }); setChecked(false); }} className={`min-h-11 rounded-xl border px-3 py-2 font-semibold transition ${assignments[item] ? "border-ink/10 bg-paper text-ink-soft line-through" : "border-brand/30 bg-white text-brand hover:bg-brand-soft/40"}`}><RichText text={item} /></button>)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {(task.buckets ?? []).map((bucket) => <section key={bucket.label} className="rounded-xl border border-ink/10 bg-white p-3" aria-label={`خانة ${bucket.label}`}>
          <h4 className="mb-2 font-bold text-ink">{bucket.label}</h4>
          <div className="flex flex-wrap gap-2">{(task.items ?? []).filter((item) => !assignments[item]).map((item) => <button key={item} type="button" aria-label={`صنّف ${item} في ${bucket.label}`} onClick={() => { setAssignments((old) => ({ ...old, [item]: bucket.label })); setChecked(false); }} className="min-h-10 rounded-lg border border-ink/10 bg-paper/70 px-2 py-1.5 text-sm hover:border-brand"><RichText text={item} /></button>)}</div>
          <ul className="mt-2 flex flex-wrap gap-2">{(task.items ?? []).filter((item) => assignments[item] === bucket.label).map((item) => <li key={item}><button type="button" onClick={() => { setAssignments((old) => { const next = { ...old }; delete next[item]; return next; }); setChecked(false); }} className="rounded-lg bg-brand-soft/50 px-2 py-1 text-sm" aria-label={`إعادة ${item} إلى العناصر غير المصنفة`}><RichText text={item} /></button></li>)}</ul>
        </section>)}
      </div>
      <p className="text-xs text-ink-soft">لإعادة تصنيف عنصر، انقر عليه ضمن العناصر المصنفة لإعادته إلى القائمة.</p>
    </div>}

    {task.mode === "setEntry" && <div className="mt-4 space-y-2">
      <label className="block font-semibold" htmlFor={`answer-${task.prompt.slice(0,12)}`}>أدخل إجابتك، وافصل بين القيم بفاصلة</label>
      <input id={`answer-${task.prompt.slice(0,12)}`} value={answer} onChange={(e) => { setAnswer(e.target.value); setChecked(false); }} inputMode="text" className="min-h-12 w-full rounded-xl border border-ink/15 bg-white px-3 text-lg tabular-nums outline-none focus:border-brand" placeholder="مثال: ١، ٢، ٣" />
    </div>}

    {task.mode === "form" && (task.fieldsLayout === "table" ? <div className="mt-4 overflow-x-auto rounded-xl border border-ink/10 bg-white" role="region" aria-label="جدول إجابات تفاعلي">
      <table className="w-full min-w-[420px] border-collapse text-start">
        <thead><tr><th className="border-b border-ink/10 bg-brand-soft/40 px-3 py-2">الفرع</th><th className="border-b border-ink/10 bg-brand-soft/40 px-3 py-2">إجابتك</th></tr></thead>
        <tbody>{fields.map((field, i) => <tr key={i}><th scope="row" className="border-b border-ink/10 px-3 py-2 font-semibold">{field.label}</th><td className="border-b border-ink/10 px-3 py-2"><input aria-label={field.label} value={formValues[i] ?? ""} onChange={(e) => { setFormValues((old) => { const next = [...old]; next[i] = e.target.value; return next; }); setChecked(false); }} className="min-h-11 w-full rounded-lg border border-ink/15 bg-white px-3 text-base tabular-nums outline-none focus:border-brand" /></td></tr>)}</tbody>
      </table>
    </div> : <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {fields.map((field, i) => <label key={i} className="block space-y-1.5 text-sm font-semibold">
        <span>{field.label}</span>
        <input value={formValues[i] ?? ""} onChange={(e) => { setFormValues((old) => { const next = [...old]; next[i] = e.target.value; return next; }); setChecked(false); }} className="min-h-12 w-full rounded-xl border border-ink/15 bg-white px-3 text-base outline-none focus:border-brand" />
      </label>)}
    </div>)}

    {task.mode === "reflection" && <div className="mt-4 space-y-3">
      <label className="block font-semibold" htmlFor={`reflection-${task.prompt.slice(0,12)}`}>دوّن مثالًا من واقعك</label>
      <textarea id={`reflection-${task.prompt.slice(0,12)}`} value={reflection} onChange={(e) => { setReflection(e.target.value); setDone(false); }} rows={3} className="w-full rounded-xl border border-ink/15 bg-white p-3 leading-7 outline-none focus:border-brand" placeholder="اكتب فكرتك هنا…" />
    </div>}

    <div className="mt-4 flex flex-wrap gap-2">
      {task.mode !== "reflection" && <button type="button" disabled={task.mode === "classify" ? !allAssigned : task.mode === "setEntry" ? !answer.trim() : task.mode === "form" ? !fieldsFilled : points.length === 0} className="btn btn-primary disabled:opacity-40" onClick={() => { setChecked(true); setShowHint(false); }}>تحقّق من إجابتي</button>}
      {task.mode === "reflection" && <button type="button" disabled={!reflection.trim()} className="btn btn-primary disabled:opacity-40" onClick={() => setDone(true)}>حفظ فكرتي في النشاط</button>}
      <button type="button" className="btn btn-ghost" onClick={reset}>إعادة المحاولة</button>
      {checked && !success && <button type="button" className="btn btn-ghost" onClick={() => setShowHint(true)}>أحتاج تلميحًا</button>}
    </div>
    {checked && <p role="status" className={`mt-3 rounded-xl p-3 font-semibold leading-7 ${success ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-950"}`}>
      {success ? task.mode === "form" && !task.validator && fields.some((field) => !field.expected) ? <>أكملت تسجيل الفروع المفتوحة. قارنها بجدول الخانات وفكّر في صحة تمثيلك.</> : <>أحسنت! {task.explanation}</> : task.mode === "classify" ? `صنفت بشكل صحيح ${correctAssigned} من ${(task.items ?? []).length} عناصر. راجع القاعدة ثم حاول مجددًا.` : task.mode === "numberLine" ? `اخترت ${points.length} نقطة. قارن مواضعك بحدّي السؤال، ثم راجع تلميحك إن احتجت.` : task.mode === "form" && task.validator === "sixDigitPuzzle" ? `تحقق من هذه الشروط: ${puzzleErrors.join("، ")}.` : task.mode === "form" ? `الإجابات المكتملة الصحيحة: ${correctFields} من ${fields.length}. راجع القيم التي أدخلتها وحاول مجددًا.` : "لم تكتمل الإجابة بعد. راجع الشرط في السؤال وحاول مرة أخرى."}
      {!success && showHint && <span className="mt-1 block">تلميح: {task.hint}</span>}
    </p>}
    {task.mode === "reflection" && done && <p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 font-semibold text-emerald-900">تم حفظ فكرتك لهذه المحاولة. {task.explanation}</p>}
  </div>;
}

function validateSixDigitPuzzle(raw: string) {
  const digits = normalizeAnswer(raw).replace(/\D/g, "");
  const errors: string[] = [];
  if (digits.length !== 6) return ["العدد يجب أن يتكوّن من ست خانات"];
  if (digits[0] !== "3") errors.push("رقم خانة مئات الألوف يجب أن يكون 3");
  if (digits[5] !== "3") errors.push("رقم خانة الآحاد يجب أن يكون 3");
  if (Number(digits[2]) + Number(digits[3]) !== 3) errors.push("مجموع رقمي خانة آحاد الألوف والمئات يجب أن يساوي 3");
  return errors;
}

function normalizeAnswer(value: string) {
  return value.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/[،,\s]/g, "").trim();
}
function sameSet(input: string[], expected: string[]) {
  const a = input.map(normalizeAnswer).sort();
  const b = expected.map(normalizeAnswer).sort();
  return a.length === b.length && a.every((value, i) => value === b[i]);
}
