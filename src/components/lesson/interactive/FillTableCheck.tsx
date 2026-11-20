"use client";

import { useState } from "react";
import { LineChart } from "@/components/charts/LineChart";

/**
 * «انطلاقة» (الكتاب، ص 3): التمثيل البياني المجاور يمثّل عدد طلاب الصف
 * السادس في إحدى المدارس في السنوات 2013–2016 — املأ الجدول المرافق.
 * الإجابات تُصحَّح داخل المتصفح.
 */

const YEARS = [2013, 2014, 2015, 2016] as const;
const ANSWERS: Record<(typeof YEARS)[number], number> = {
  2013: 60,
  2014: 70,
  2015: 65,
  2016: 60,
};

export function FillTableCheck() {
  const [values, setValues] = useState<Record<number, string>>({ 2013: "", 2014: "", 2015: "", 2016: "" });
  const [checked, setChecked] = useState(false);

  const correctCount = YEARS.filter((y) => Number(values[y]) === ANSWERS[y]).length;
  const allCorrect = correctCount === YEARS.length;
  const allFilled = YEARS.every((y) => values[y].trim() !== "");

  return (
    <div className="space-y-4">
      <LineChart
        xLabels={["2013", "2014", "2015", "2016"]}
        yTicks={[60, 65, 70, 75]}
        yMin={57}
        yMax={78}
        values={[60, 70, 65, 60]}
        xAxisLabel="السنة"
        yAxisLabel="عدد الطلاب"
        connect
        ariaLabel="التمثيل البياني بالخطوط لعدد طلاب الصف السادس في السنوات 2013 إلى 2016"
      />
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
              const state = checked ? (Number(values[y]) === ANSWERS[y] ? "ok" : "bad") : "idle";
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
                    value={values[y]}
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
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-primary" onClick={() => setChecked(true)} disabled={!allFilled}>
          تحقق
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => { setValues({ 2013: "60", 2014: "70", 2015: "65", 2016: "60" }); setChecked(true); }}
        >
          إظهار الحل
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => { setValues({ 2013: "", 2014: "", 2015: "", 2016: "" }); setChecked(false); }}
        >
          مسح
        </button>
      </div>
      {checked && (
        <p role="status" className={`rounded-lg px-3 py-2 text-[0.95rem] font-semibold ${allCorrect ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
          {allCorrect
            ? "أحسنت! قرأت التمثيل البياني بشكل صحيح: 2013 ← 60، 2014 ← 70، 2015 ← 65، 2016 ← 60."
            : `الصحيح: ${correctCount} من ${YEARS.length}. ارجع إلى التمثيل وقارن ارتفاع كل نقطة مع التدريجات.`}
        </p>
      )}
    </div>
  );
}
