"use client";

import { useState } from "react";

type Point = { x: number; y: number };
type Kind = "perpendicular" | "parallel";

const VIEW_W = 280;
const VIEW_H = 150;
const BASE = [{ x: 24, y: 100 }, { x: 256, y: 100 }] as const;

/** Student draws a line on the geometry itself by selecting its two endpoints. */
export function InteractiveLineConstruction({
  kind,
  caseNumber,
  onChange,
  requirePoint = true,
}: {
  kind: Kind;
  caseNumber: number;
  requirePoint?: boolean;
  onChange: (isCorrect: boolean, points: Point[] | null) => void;
}) {
  const a: Point = caseNumber === 1 ? { x: 130, y: 28 } : { x: 130, y: 100 };
  const [points, setPoints] = useState<Point[]>([]);
  const [message, setMessage] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);

  const reset = () => {
    setPoints([]);
    setMessage("");
    setIsCorrect(false);
    onChange(false, null);
  };

  const clickCanvas = (event: React.MouseEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const p = {
      x: ((event.clientX - box.left) / box.width) * VIEW_W,
      y: ((event.clientY - box.top) / box.height) * VIEW_H,
    };
    if (points.length === 0 || points.length === 2) {
      setPoints([p]);
      setMessage("نقطة البداية ثُبّتت؛ انقر موضعًا ثانيًا لرسم المستقيم.");
      setIsCorrect(false);
      onChange(false, null);
      return;
    }
    const drawn = [points[0], p];
    const dx = p.x - points[0].x;
    const dy = p.y - points[0].y;
    const length = Math.hypot(dx, dy);
    const bdx = BASE[1].x - BASE[0].x;
    const bdy = BASE[1].y - BASE[0].y;
    const cross = Math.abs(dx * bdy - dy * bdx) / (length * Math.hypot(bdx, bdy));
    const dot = Math.abs(dx * bdx + dy * bdy) / (length * Math.hypot(bdx, bdy));
    const distanceFromA = Math.abs(dx * (points[0].y - a.y) - dy * (points[0].x - a.x)) / Math.max(length, 1);
    const passesA = !requirePoint || distanceFromA <= 8;
    const angleOK = kind === "parallel" ? cross <= 0.10 : dot <= 0.10;
    const valid = length >= 55 && passesA && angleOK;
    setPoints(drawn);
    setIsCorrect(valid);
    setMessage(valid
      ? "الإنشاء يمر بالنقطة A ويحقق العلاقة المطلوبة."
      : !passesA
        ? "المستقيم المرسوم لا يمر بالنقطة A؛ أعد تحديد النقطتين."
        : !angleOK
          ? kind === "parallel" ? "المستقيم لا يوازي (d)؛ قارن اتجاهيهما." : "المستقيم لا يصنع زاوية قائمة مع (d)."
          : "مدّ المستقيم أكثر ليظهر اتجاهه بوضوح.");
    onChange(valid, drawn);
  };

  return <div className="space-y-2" data-testid={`construction-${kind}-${caseNumber}`}>
    <p className="text-sm text-ink-soft">{requirePoint ? `${caseNumber === 1 ? "النقطة A خارج (d)" : "النقطة A على (d)"}. ارسم مستقيمًا يمر بها` : "ارسم المستقيم المطلوب بالنسبة إلى (d)"}. انقر نقطتين على الرسم لإنشاء المستقيم، ثم تحقق من العلاقة الهندسية.</p>
    <svg data-testid={`construction-canvas-${kind}-${caseNumber}-${requirePoint ? "through-point" : "free"}`} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full max-w-[360px] touch-none cursor-crosshair rounded-lg border bg-white" role="application" aria-label={`رسم إنشاء ${kind === "perpendicular" ? "عمود" : "موازٍ"} من A، الحالة ${caseNumber}`} onClick={clickCanvas} style={{ direction: "ltr" }}>
      <line x1={BASE[0].x} y1={BASE[0].y} x2={BASE[1].x} y2={BASE[1].y} stroke="#334155" strokeWidth="3" />
      <text x="224" y="92" fontSize="14">(d)</text>
      {points.length === 2 && <line x1={points[0].x} y1={points[0].y} x2={points[1].x} y2={points[1].y} stroke={isCorrect ? "#16834a" : "#c2413b"} strokeWidth="3" />}
      {points.length === 1 && <circle cx={points[0].x} cy={points[0].y} r="5" fill="#c2413b" />}
      {requirePoint && <><circle cx={a.x} cy={a.y} r="6" fill="#172554" /><text x={a.x + 9} y={a.y - 5} fontSize="14">A</text></>}
      {isCorrect && kind === "perpendicular" && <path d={`M ${a.x} ${a.y} l 7 3 l -3 7`} fill="none" stroke="#111" strokeWidth="1.5" />}
    </svg>
    <div className="flex flex-wrap gap-2">
      <button type="button" className="btn btn-ghost" onClick={reset}>مسح الرسم</button>
    </div>
    {message && <p role="status" className={`text-sm font-semibold ${isCorrect ? "text-emerald-800" : "text-ink-soft"}`}>{message}</p>}
  </div>;
}
