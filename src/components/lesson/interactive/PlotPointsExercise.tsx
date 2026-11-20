"use client";

import { useMemo, useState } from "react";
import { LineChart } from "@/components/charts/LineChart";
import { PLOT_DATASETS, type PlotDataset } from "./datasets";

/**
 * تمرين تفاعلي لإنشاء التمثيل البياني بالخطوط:
 * يقرأ الطالب الجدول، ثم يضع النقاط على الشبكة، ثم يصلها بخطوط مستقيمة.
 * كل شيء يعمل في المتصفح؛ البيانات من جداول الكتاب حرفيًا.
 */

const W = 620;
const H = 360;
const ML = 64;
const MR = 26;
const MT = 22;
const MB = 64;
const PLOT_W = W - ML - MR;
const PLOT_H = H - MT - MB;

const GRID = "#c9c4d6";
const AXIS = "#22304f";
const DOT_IDLE = "#d64545";
const OK = "#16a34a";
const BAD = "#e5484d";

export function PlotPointsExercise({ datasetId }: { datasetId: PlotDataset["id"] }) {
  const ds = PLOT_DATASETS[datasetId];
  const n = ds.xLabels.length;
  const xAt = (i: number) => ML + ((i + 0.5) * PLOT_W) / n;
  const yAt = (v: number) => MT + ((ds.yMax - v) / (ds.yMax - ds.yMin)) * PLOT_H;
  const baseY = MT + PLOT_H;
  const rightX = ML + PLOT_W;

  const expected = useMemo(() => new Set(ds.values.map((v, i) => `${i},${v}`)), [ds]);
  const [placed, setPlaced] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);
  const [connected, setConnected] = useState(false);

  const correctCount = useMemo(
    () => [...placed].filter((k) => expected.has(k)).length,
    [placed, expected],
  );
  const wrongCount = placed.size - correctCount;
  const allCorrect = correctCount === n && wrongCount === 0;

  const toggle = (i: number, y: number) => {
    if (connected) return;
    const key = `${i},${y}`;
    setPlaced((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setChecked(false);
  };

  const onSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * W;
    const sy = ((e.clientY - rect.top) / rect.height) * H;
    let best: { i: number; y: number; d: number } | null = null;
    for (let i = 0; i < n; i++) {
      for (let y = ds.yFloor; y <= ds.yCeil; y++) {
        const dx = sx - xAt(i);
        const dy = sy - yAt(y);
        const d = Math.hypot(dx, dy);
        if (d < 26 && (!best || d < best.d)) best = { i, y, d };
      }
    }
    if (best) toggle(best.i, best.y);
  };

  const table = (
    <figure className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-center text-[0.95rem]">
        <caption className="mb-2 text-start text-[0.92rem] font-semibold text-ink-soft">{ds.tableCaption}</caption>
        <thead>
          <tr>
            {[ds.xAxisLabel, ...ds.xLabels].map((h, i) => (
              <th key={i} className="border border-ink/15 bg-brand-soft/50 px-3 py-2 font-bold text-ink">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th className="border border-ink/15 bg-brand-soft/50 px-3 py-2 font-bold text-ink">{ds.yAxisLabel}</th>
            {ds.values.map((v, i) => (
              <td key={i} className="border border-ink/15 px-3 py-2 tabular-nums">{v}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </figure>
  );

  if (connected) {
    return (
      <div className="space-y-3">
        {table}
        <LineChart
          xLabels={ds.xLabels}
          yTicks={ds.yTicks}
          yMin={ds.yMin}
          yMax={ds.yMax}
          values={ds.values}
          xAxisLabel={ds.xAxisLabel}
          yAxisLabel={ds.yAxisLabel}
          connect
          ariaLabel={`التمثيل البياني بالخطوط: ${ds.title}`}
        />
        <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-[0.95rem] font-semibold text-emerald-800">
          أحسنت! هذا هو التمثيل البياني بالخطوط للبيانات. لاحظ كيف يوضح الخط تغيّر القيم بمرور الزمن.
        </p>
        <button type="button" className="btn btn-ghost" onClick={() => { setConnected(false); }}>
          عرض شبكتي مجددًا
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {table}
      <p className="text-[0.98rem] text-ink">
        <span className="font-bold text-brand">مهمتك:</span> انقر على مواضع النقاط على الشبكة لتمثيل القيم أعلاه، ثم انقر «تحقق»، ثم «اربط النقاط».
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-[560px] cursor-crosshair select-none rounded-xl border border-ink/10 bg-white"
        onClick={onSvgClick}
        role="application"
        aria-label="شبكة للتمثيل البياني — انقر لوضع النقاط"
        style={{ direction: "ltr" }}
      >
        {/* الشبكة الأفقية والتدريجات */}
        {ds.yTicks.map((t) => {
          const y = yAt(t);
          return (
            <g key={`y-${t}`}>
              <line x1={ML} y1={y} x2={rightX} y2={y} stroke={GRID} strokeWidth={1.3} strokeDasharray="7 6" />
              <text x={ML - 8} y={y + 5} textAnchor="end" fontSize={14} fill="#3b4670">{t}</text>
            </g>
          );
        })}
        {/* الشبكة الشاقولية والعناوين */}
        {ds.xLabels.map((label, i) => {
          const x = xAt(i);
          return (
            <g key={`x-${i}`}>
              <line x1={x} y1={MT} x2={x} y2={baseY} stroke={GRID} strokeWidth={1.3} strokeDasharray="7 6" />
              <text x={x} y={baseY + 22} textAnchor="middle" fontSize={12.5} fill="#3b4670">{label}</text>
            </g>
          );
        })}
        {/* المحوران */}
        <line x1={ML} y1={baseY} x2={rightX + 12} y2={baseY} stroke={AXIS} strokeWidth={2.3} />
        <path
          d={ds.yMin > 0
            ? `M ${ML} ${baseY} v -7 l -4 -4 l 8 -4 l -4 -4 V ${MT - 8}`
            : `M ${ML} ${baseY} V ${MT - 8}`}
          fill="none"
          stroke={AXIS}
          strokeWidth={2.3}
        />
        {ds.yMin === 0 && <text x={ML - 8} y={baseY + 4} textAnchor="end" fontSize={13} fill={AXIS}>0</text>}
        {ds.xAxisLabel && (
          <text x={W - 6} y={baseY + 44} textAnchor="end" fontSize={13} fill={AXIS}>{ds.xAxisLabel}</text>
        )}
        {ds.yAxisLabel && (
          <text x={W - 8} y={MT - 8} textAnchor="end" fontSize={13} fill={AXIS}>{ds.yAxisLabel}</text>
        )}

        {/* مواضع متوقعة بعد التحقق: دوائر فارغة للنقاط الناقصة */}
        {checked && !allCorrect && [...expected].map((key) => {
          if (placed.has(key)) return null;
          const [i, y] = key.split(",").map(Number);
          return (
            <circle key={`missing-${key}`} cx={xAt(i)} cy={yAt(y)} r={6.5} fill="none" stroke={BAD} strokeWidth={1.6} strokeDasharray="3 3" opacity={0.75} />
          );
        })}

        {/* النقاط الموضوعة */}
        {[...placed].map((key) => {
          const [i, y] = key.split(",").map(Number);
          const ok = expected.has(key);
          const fill = checked ? (ok ? OK : BAD) : DOT_IDLE;
          return <circle key={key} cx={xAt(i)} cy={yAt(y)} r={7} fill={fill} stroke="#fff" strokeWidth={1.8} opacity={0.96} />;
        })}
      </svg>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-primary" onClick={() => setChecked(true)} disabled={placed.size === 0}>
          تحقق
        </button>
        <button type="button" className="btn btn-primary" onClick={() => setConnected(true)} disabled={!allCorrect}>
          اربط النقاط بخطوط مستقيمة
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => { setPlaced(new Set(expected)); setChecked(true); }}>
          إظهار الحل
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => { setPlaced(new Set()); setChecked(false); }}>
          إعادة
        </button>
        <span className="text-[0.92rem] tabular-nums text-ink-soft">النقاط الموضوعة: {placed.size} / {n}</span>
      </div>

      {checked && (
        <p role="status" className={`rounded-lg px-3 py-2 text-[0.95rem] font-semibold ${allCorrect ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
          {allCorrect
            ? "ممتاز! جميع النقاط في مواضعها الصحيحة. انقر «اربط النقاط» لإتمام التمثيل."
            : `الصحيح من نقاطك: ${correctCount} من ${n}${wrongCount ? `، وفيها ${wrongCount} نقطة زائدة (حمراء)` : ""}. الدوائر المتقطعة تُظهر مواضع النقاط الناقصة. حاول مجددًا.`}
        </p>
      )}
    </div>
  );
}
