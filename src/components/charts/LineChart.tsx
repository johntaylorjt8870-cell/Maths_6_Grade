/**
 * مخطط خطي SVG دقيق — يُعاد رسم رسوم الكتاب آليًا لا كنسخ مصورة.
 *
 * - الاتجاه داخليًا LTR (المحور الأفقي يزيد لليسار→اليمين كما في الكتاب).
 * - شبكة متقطعة + نقاط حمراء + خط واصل أخضر (كما في أسلوب الكتاب).
 * - يعمل في التصدير الثابت بلا أي كود جهة العميل.
 */

export interface LineChartProps {
  /** عناوين المحور الأفقي (الأيام/السنوات/الأشهر) بالترتيب من اليسار إلى اليمين. */
  xLabels: string[];
  /** التدريجات الموضوعة على المحور الشاقولي. */
  yTicks: number[];
  yMin: number;
  yMax: number;
  /** القيمة المقابلة لكل عنصر في xLabels. */
  values: number[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  /** رسم الخط الواصل بين النقاط (الخطوة «ثالثًا» في حل الكتاب). */
  connect?: boolean;
  className?: string;
  ariaLabel?: string;
}

const W = 620;
const H = 380;
const ML = 64; // هامش يساري للمحور الشاقولي
const MR = 26;
const MT = 48;
const MB = 76;
const PLOT_W = W - ML - MR;
const PLOT_H = H - MT - MB;

const GRID = "#c9c4d6";
const AXIS = "#22304f";
const LINE = "#2e7d4f";
const DOT = "#d64545";

export function LineChart({
  xLabels,
  yTicks,
  yMin,
  yMax,
  values,
  xAxisLabel,
  yAxisLabel,
  connect = true,
  className,
  ariaLabel,
}: LineChartProps) {
  const n = xLabels.length;
  const xAt = (i: number) => ML + ((i + 0.5) * PLOT_W) / n;
  const yAt = (v: number) => MT + ((yMax - v) / (yMax - yMin)) * PLOT_H;
  const baseY = MT + PLOT_H;
  const rightX = ML + PLOT_W;
  const cropped = yMin > 0;

  const points = values.map((v, i) => [xAt(i), yAt(v)] as const);
  const polyline = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`block w-full ${className ?? ""}`}
      role="img"
      aria-label={ariaLabel ?? "مخطط خطي"}
      style={{ maxWidth: "100%", height: "auto", direction: "ltr" }}
    >
      {/* الشبكة الأفقية المتقطعة + تدريجات المحور الشاقولي */}
      {yTicks.map((t) => {
        const y = yAt(t);
        return (
          <g key={`y-${t}`}>
            <line x1={ML} y1={y} x2={rightX} y2={y} stroke={GRID} strokeWidth={1.4} strokeDasharray="7 6" />
            <line x1={ML - 5} y1={y} x2={ML} y2={y} stroke={AXIS} strokeWidth={1.6} />
            <text x={ML - 10} y={y + 5} textAnchor="end" fontSize={16} fill="#3b4670" className="tabular-nums">
              {t}
            </text>
          </g>
        );
      })}

      {/* الشبكة الشاقولية المتقطعة + عناوين المحور الأفقي */}
      {xLabels.map((label, i) => {
        const x = xAt(i);
        return (
          <g key={`x-${i}`}>
            <line x1={x} y1={MT} x2={x} y2={baseY} stroke={GRID} strokeWidth={1.4} strokeDasharray="7 6" />
            <line x1={x} y1={baseY} x2={x} y2={baseY + 5} stroke={AXIS} strokeWidth={1.6} />
            <text x={x} y={baseY + 24} textAnchor="middle" fontSize={16} fill="#3b4670">
              {label.split(" ").map((word, j) => (
                <tspan key={j} x={x} dy={j === 0 ? 0 : 18}>{word}</tspan>
              ))}
            </text>
          </g>
        );
      })}

      {/* محوران وسهمان بلا معرّفات مشتركة بين نسخ الرسم في الدرس والدفتر. */}
      <line x1={ML} y1={baseY} x2={rightX + 14} y2={baseY} stroke={AXIS} strokeWidth={2.4} />
      <path d={`M ${rightX + 16} ${baseY} l -11 -5 v 10 z`} fill={AXIS} />
      <path
        d={cropped
          ? `M ${ML} ${baseY} v -7 l -4 -4 l 8 -4 l -4 -4 V ${MT - 11}`
          : `M ${ML} ${baseY} V ${MT - 11}`}
        stroke={AXIS}
        strokeWidth={2.4}
        fill="none"
      />
      <path d={`M ${ML} ${MT - 13} l -5 11 h 10 z`} fill={AXIS} />
      {!cropped && yMin === 0 && (
        <text x={ML - 10} y={baseY + 5} textAnchor="end" fontSize={16} fill={AXIS}>0</text>
      )}
      {xAxisLabel && (
        <text x={rightX} y={baseY + 63} textAnchor="end" fontSize={16} fill={AXIS}>
          {xAxisLabel}
        </text>
      )}
      {yAxisLabel && (
        <text x={ML + PLOT_W / 2} y={22} textAnchor="middle" fontSize={17} fill={AXIS}>
          {yAxisLabel}
        </text>
      )}

      {/* الخط الواصل بين النقاط */}
      {connect && points.length > 1 && (
        <polyline points={polyline} fill="none" stroke={LINE} strokeWidth={3.4} strokeLinejoin="round" strokeLinecap="round" />
      )}

      {/* النقاط */}
      {points.map(([x, y], i) => (
        <circle key={`p-${i}`} cx={x} cy={y} r={5.2} fill={DOT} stroke="#fff" strokeWidth={1.6} />
      ))}
    </svg>
  );
}
