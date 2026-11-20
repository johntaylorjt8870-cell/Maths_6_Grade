"use client";

import { useState } from "react";
import { LineChart } from "@/components/charts/LineChart";
import { STUDENTS_DATASET } from "./datasets";

/**
 * «انطلاقة» (الكتاب، ص 3): التمثيل البياني المجاور يمثّل عدد طلاب الصف
 * السادس في إحدى المدارس في السنوات 2013–2016 — املأ الجدول المرافق.
 * الإجابات تُصحَّح داخل المتصفح.
 */

const YEARS = STUDENTS_DATASET.xLabels;
const ANSWERS: Record<string, string> = Object.fromEntries(YEARS.map((year, i) => [year, String(STUDENTS_DATASET.values[i])]));
const SOLUTION = YEARS.map((year) => `${year}: ${ANSWERS[year]}`).join("، ");

export function FillTableCheck() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  const correctCount = YEARS.filter((year) => Number(values[year]) === Number(ANSWERS[year])).length;
  const allCorrect = correctCount === YEARS.length;
  const allFilled = YEARS.every((year) => values[year]?.trim());

  return (
    <div className="space-y-4">
      <LineChart {...STUDENTS_DATASET} ariaLabel={STUDENTS_DATASET.title} />
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="جدول عدد الطلاب">
        <table className="w-full min-w-[480px] border-collapse text-center text-[0.95rem]">
          <thead>
            <tr>
              <th className="border border-ink/15 bg-brand-soft/50 px-3 py-2 font-bold">السنة</th>
              {YEARS.map((y) => (
                <th key={y} className="border border-ink/15 bg-brand-soft/50 px-3 py-2 font-bold tabular-nums">{y}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th className="border border-ink/15 bg-brand-soft/50 px-3 py-2 font-bold">عدد الطلاب</th>
              {YEARS.map((y) => {
                const state = checked ? (Number(values[y]) === Number(ANSWERS[y]) ? "ok" : "bad") : "idle";
                const ring =
                  state === "ok"
                    ? "border-emerald-500 bg-emerald-50"
                    : state === "bad"
                      ? "border-coral bg-red-50"
                      : "border-ink/20 bg-white";
                return (
                  <td key={y} className="border border-ink/15 px-2 py-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      aria-label={`عدد الطلاب في سنة ${y}`}
                      className={`w-20 rounded-lg border px-2 py-1.5 text-center tabular-nums outline-none focus:border-brand ${ring}`}
                      value={values[y] ?? ""}
                      onChange={(e) => {
                        setValues((v) => ({ ...v, [y]: e.target.value }));
                        setChecked(false);
                      }}
                    />
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-primary" onClick={() => setChecked(true)} disabled={!allFilled}>
          تحقق
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => { setValues(ANSWERS); setChecked(true); }}
        >
          إظهار الحل
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => { setValues({}); setChecked(false); }}
        >
          مسح
        </button>
      </div>
      {checked && (
        <p role="status" className={`rounded-lg px-3 py-2 text-[0.95rem] font-semibold ${allCorrect ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
          {allCorrect
            ? `أحسنت! قرأت التمثيل البياني بشكل صحيح: ${SOLUTION}.`
            : `الصحيح: ${correctCount} من ${YEARS.length}. ارجع إلى التمثيل وقارن ارتفاع كل نقطة مع التدريجات.`}
        </p>
      )}
    </div>
  );
}
