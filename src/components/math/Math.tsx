import katex from "katex";

/**
 * محرك الرياضيات: KaTeX الحقيقي (htmlAndMathml) دون أي استبدالات نصية يدوية.
 * كل التعابير معزولة باتجاه LTR حتى لا تتأثر بـ RTL في النص العربي.
 */
export function renderTex(tex: string, display = false): string {
  return katex.renderToString(tex, {
    displayMode: display,
    throwOnError: false,
    errorColor: "#c2410c",
    strict: "ignore",
    trust: false,
    output: "htmlAndMathml",
  });
}

/** تعبير رياضي داخل سطر (داخل فقرة عربية). */
export function M({ tex }: { tex: string }) {
  return (
    <span
      dir="ltr"
      className="math-inline"
      dangerouslySetInnerHTML={{ __html: renderTex(tex) }}
    />
  );
}

/** معادلة في سطر مستقل. */
export function MathBlock({ tex, label }: { tex: string; label?: string }) {
  return (
    <div className="math-block" dir="ltr" role="math" aria-label={label}>
      <div dangerouslySetInnerHTML={{ __html: renderTex(tex, true) }} />
    </div>
  );
}

/**
 * كمية قياسية: الرقم أولًا ثم الوحدة إلى يمينه، بترتيب ثابت داخل الفقرات العربية.
 * الوحدات المركبة (m/s) تبقى خطية ولا تتحول إلى كسر عمودي.
 */
export function Q({ v, u }: { v: string | number; u: string }) {
  const tex = `${String(v)}\\,\\mathrm{${u}}`;
  return (
    <span
      dir="ltr"
      className="math-inline qty"
      dangerouslySetInnerHTML={{ __html: renderTex(tex) }}
    />
  );
}

/** معادلة داخل SVG عبر foreignObject — ناتج KaTeX نفسه بلا تشويه. */
export function SvgMath({
  tex,
  x,
  y,
  width,
  height,
  color = "currentColor",
  fontSize = 18,
}: {
  tex: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  fontSize?: number;
}) {
  return (
    <foreignObject x={x} y={y} width={width} height={height} style={{ overflow: "visible" }}>
      <div
        dir="ltr"
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          fontSize,
          lineHeight: 1,
        }}
        dangerouslySetInnerHTML={{ __html: renderTex(tex) }}
      />
    </foreignObject>
  );
}
