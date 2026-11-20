"use client";

import { useState } from "react";
import { LineChart } from "@/components/charts/LineChart";
import { PLOT_DATASETS, type PlotDataset } from "./datasets";

/**
 * المختبر التفاعلي للدرس — يعرض مجموعات بيانات الكتاب الثلاث
 * (درجات حرارة اللاذقية، إنتاج التفاح، وجبات المطعم) كمختبر قراءة وملاحظة.
 * يعمل كله داخل المتصفح، والبيانات من الكتاب حرفيًا.
 */

const TABS: PlotDataset["id"][] = ["latakia", "apples", "meals"];

const OBSERVATIONS: Record<PlotDataset["id"], string> = {
  latakia: "لاحظ: ترتفع درجة الحرارة حتى الثلاثاء (18) ثم تهبط حتى الجمعة (15) ثم ترتفع مجددًا في السبت. التمثيل بالخطوط يجعل هذا النمط مرئيًا فورًا.",
  apples: "لاحظ: الإنتاج يبدأ بطنّين (2010 و2013) ويبلغ ذروته 5 أطنان في 2015. القاع والقمة يظهران كنقاط تحوّل في الخط.",
  meals: "لاحظ: أدنى مبيعات كانت يوم الثلاثاء (30 وجبة) وأقصاها يوم الخميس (40 وجبة). الخط يتذبذب صعودًا وهبوطًا خلال الأسبوع.",
};

export function GraphStudio() {
  const [tab, setTab] = useState<PlotDataset["id"]>("latakia");
  const [connect, setConnect] = useState(true);
  const [readout, setReadout] = useState<string | null>(null);

  const ds = PLOT_DATASETS[tab];
  const maxValue = Math.max(...ds.values);
  const minValue = Math.min(...ds.values);

  return (
    <div className="space-y-4">
      {/* تبويبات المجموعات */}
      <div role="tablist" aria-label="مجموعات البيانات" className="flex flex-wrap gap-2">
        {TABS.map((id) => {
          const active = id === tab;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => {
                setTab(id);
                setReadout(null);
              }}
              className={`rounded-full px-4 py-1.5 text-[0.92rem] font-semibold transition-colors ${
                active ? "bg-mint text-white" : "bg-emerald-50 text-emerald-900 ring-1 ring-inset ring-emerald-600/20 hover:bg-emerald-100"
              }`}
            >
              {PLOT_DATASETS[id].title}
            </button>
          );
        })}
      </div>

      {/* التبديل بين عرض النقاط والخط */}
      <label className="flex w-fit cursor-pointer items-center gap-2 text-[0.93rem] font-medium text-ink-soft">
        <input type="checkbox" className="h-4 w-4 accent-[#0f9d82]" checked={connect} onChange={(e) => setConnect(e.target.checked)} />
        إظهار الخط الواصل بين النقاط
      </label>

      <LineChart
        xLabels={ds.xLabels}
        yTicks={ds.yTicks}
        yMin={ds.yMin}
        yMax={ds.yMax}
        values={ds.values}
        xAxisLabel={ds.xAxisLabel}
        yAxisLabel={ds.yAxisLabel}
        connect={connect}
        ariaLabel={ds.title}
      />

      {/* قراءة تفاعلية: انقر أي نقطة لقراءة قيمتها */}
      <div className="flex flex-wrap gap-2" dir="ltr" aria-label="نقاط قابلة للنقر للقراءة">
        {ds.xLabels.map((label, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setReadout(`${label} ← ${ds.values[i]}`)}
            className="rounded-lg bg-paper px-3 py-1.5 text-[0.88rem] font-semibold tabular-nums text-ink ring-1 ring-inset ring-ink/15 transition-colors hover:bg-brand-soft hover:text-brand"
          >
            {label}
          </button>
        ))}
      </div>
      {readout && (
        <p role="status" className="rounded-lg bg-brand-soft/50 px-3 py-2 text-[0.95rem] font-semibold text-brand">
          القراءة: {readout}
        </p>
      )}

      <ul className="space-y-1.5 text-[0.95rem] text-ink">
        <li>
          <span className="font-bold text-brand">أعلى قيمة:</span> {maxValue} —{" "}
          {ds.xLabels[ds.values.indexOf(maxValue)]}
        </li>
        <li>
          <span className="font-bold text-brand">أدنى قيمة:</span> {minValue} —{" "}
          {ds.xLabels.filter((_, i) => ds.values[i] === minValue).join("، ")}
        </li>
      </ul>

      <p className="rounded-xl border border-emerald-600/20 bg-emerald-50/60 px-4 py-3 text-[0.97rem] leading-[1.9] text-emerald-900">
        <span className="font-bold">ماذا تلاحظ؟ </span>{OBSERVATIONS[tab]}
      </p>
      <p className="text-[0.85rem] text-ink-soft">جميع بيانات هذا المختبر مأخوذة من أمثلة الكتاب نفسها (ص 3–5).</p>
    </div>
  );
}
