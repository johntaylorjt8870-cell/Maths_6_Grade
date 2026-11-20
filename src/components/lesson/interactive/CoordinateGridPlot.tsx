"use client";

import { useMemo, useState } from "react";

/**
 * «انطلاقة» (الكتاب، ص 3): مثّل النقاط A(2,3)، B(4,0)، C(0,1)، D(3,2)
 * على شبكة الإحداثيات. تعمل داخل المتصفح — بلا خادم.
 */

const SIZE = 6; // الشبكة من 0 إلى 6
const CELL = 52;
const PAD = 34;
const W = SIZE * CELL + PAD + 46;
const H = SIZE * CELL + PAD + 34;

const TARGETS: { key: string; label: string; x: number; y: number }[] = [
  { key: "A", label: "A", x: 2, y: 3 },
  { key: "B", label: "B", x: 4, y: 0 },
  { key: "C", label: "C", x: 0, y: 1 },
  { key: "D", label: "D", x: 3, y: 2 },
];

const toPx = (v: number) => PAD + v * CELL;
const yToPx = (v: number) => PAD + (SIZE - v) * CELL;

export function CoordinateGridPlot() {
  const [placed, setPlaced] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);

  const targetKeys = useMemo(() => new Set(TARGETS.map((t) => `${t.x},${t.y}`)), []);
  const correctCount = useMemo(
    () => [...placed].filter((k) => targetKeys.has(k)).length,
    [placed, targetKeys],
  );
  const wrongCount = placed.size - correctCount;
  const allCorrect = correctCount === TARGETS.length && wrongCount === 0;

  const toggle = (x: number, y: number) => {
    const key = `${x},${y}`;
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
    const gx = Math.round((sx - PAD) / CELL);
    const gy = SIZE - Math.round((sy - PAD) / CELL);
    if (gx < 0 || gx > SIZE || gy < 0 || gy > SIZE) return;
    toggle(gx, gy);
  };

  return (
    <div className="not-prose">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full max-w-[360px] shrink-0 cursor-crosshair select-none rounded-xl border border-ink/10 bg-white"
          onClick={onSvgClick}
          role="application"
          aria-label="شبكة إحداثيات — انقر لوضع النقاط"
          style={{ direction: "ltr" }}
        >
          {/* شبكة */}
          {Array.from({ length: SIZE + 1 }, (_, i) => (
            <g key={`g-${i}`}>
              <line x1={toPx(i)} y1={yToPx(0)} x2={toPx(i)} y2={yToPx(SIZE)} stroke="#c9c4d6" strokeWidth={i === 0 ? 2 : 1.3} strokeDasharray={i === 0 ? "" : "6 5"} />
              <line x1={toPx(0)} y1={yToPx(i)} x2={toPx(SIZE)} y2={yToPx(i)} stroke="#c9c4d6" strokeWidth={i === 0 ? 2 : 1.3} strokeDasharray={i === 0 ? "" : "6 5"} />
              <text x={toPx(i)} y={yToPx(0) + 18} textAnchor="middle" fontSize={12.5} fill="#3b4670">{i}</text>
              {i > 0 && (
                <text x={toPx(0) - 8} y={yToPx(i) + 4.5} textAnchor="end" fontSize={12.5} fill="#3b4670">{i}</text>
              )}
            </g>
          ))}
          {/* المحوران */}
          <line x1={toPx(0) - 6} y1={yToPx(0)} x2={toPx(SIZE) + 22} y2={yToPx(0)} stroke="#22304f" strokeWidth={2.4} />
          <line x1={toPx(0)} y1={yToPx(0) + 6} x2={toPx(0)} y2={yToPx(SIZE) - 22} stroke="#22304f" strokeWidth={2.4} />
          <path d={`M ${toPx(SIZE) + 22} ${yToPx(0)} l -10 -5 l 0 10 z`} fill="#22304f" />
          <path d={`M ${toPx(0)} ${yToPx(SIZE) - 22} l -5 10 l 10 0 z`} fill="#22304f" />
          <text x={toPx(SIZE) + 26} y={yToPx(0) + 18} textAnchor="end" fontSize={12.5} fill="#22304f">المحور الأفقي</text>
          <text x={toPx(0) + 2} y={yToPx(SIZE) - 26} fontSize={12.5} fill="#22304f">المحور الشاقولي</text>
          <text x={toPx(0) - 8} y={yToPx(0) + 16} textAnchor="end" fontSize={13} fill="#22304f">O</text>

          {/* النقاط الموضوعة */}
          {[...placed].map((key) => {
            const [x, y] = key.split(",").map(Number);
            const ok = targetKeys.has(key);
            const fill = checked ? (ok ? "#16a34a" : "#e5484d") : "#d64545";
            return (
              <circle key={key} cx={toPx(x)} cy={yToPx(y)} r={7.5} fill={fill} stroke="#fff" strokeWidth={2} opacity={0.95} />
            );
          })}
        </svg>

        <div className="w-full max-w-sm space-y-3">
          <p className="text-[0.98rem] leading-[1.9] text-ink">
            انقر على شبكة الإحداثيات لوضع النقاط الأربع:
          </p>
          <ul dir="ltr" className="grid grid-cols-2 gap-2 text-center font-semibold text-brand">
            <li className="rounded-lg bg-brand-soft/60 px-3 py-1.5">A (2, 3)</li>
            <li className="rounded-lg bg-brand-soft/60 px-3 py-1.5">B (4, 0)</li>
            <li className="rounded-lg bg-brand-soft/60 px-3 py-1.5">C (0, 1)</li>
            <li className="rounded-lg bg-brand-soft/60 px-3 py-1.5">D (3, 2)</li>
          </ul>
          <p className="text-[0.9rem] text-ink-soft">
            تذكّر: العدد الأول على المحور الأفقي (x) والعدد الثاني على المحور الشاقولي (y). انقر نقطة موضوعة لإزالتها.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-primary" onClick={() => setChecked(true)} disabled={placed.size === 0}>
              تحقق
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => { setPlaced(new Set()); setChecked(false); }}
            >
              مسح النقاط
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => { setPlaced(new Set(targetKeys)); setChecked(true); }}
            >
              إظهار الحل
            </button>
          </div>
          {checked && (
            <p role="status" className={`rounded-lg px-3 py-2 text-[0.95rem] font-semibold ${allCorrect ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
              {allCorrect
                ? "أحسنت! جميع النقاط موضوعة بشكل صحيح."
                : `النقاط الصحيحة: ${correctCount} من ${TARGETS.length}${wrongCount ? `، وفيها ${wrongCount} نقطة زائدة` : ""}. حاول مجددًا.`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
