/** Display coordinates only; no lengths or angles are asserted by the textbook. */
export type Point2 = readonly [number, number];
export type Segment2 = readonly [Point2, Point2];

export function pointOn([a, b]: Segment2, t: number): Point2 {
  return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
}
export function intersection([a, b]: Segment2, [c, d]: Segment2): Point2 {
  const cross = (u: Point2, v: Point2) => u[0] * v[1] - u[1] * v[0];
  const subtract = (u: Point2, v: Point2): Point2 => [u[0] - v[0], u[1] - v[1]];
  const ab = subtract(b, a), cd = subtract(d, c);
  const denominator = cross(ab, cd);
  if (Math.abs(denominator) < 1e-12) throw new Error("Parallel lines have no unique intersection");
  return pointOn([a, b], cross(subtract(c, a), cd) / denominator);
}

// p. 23: ① on the RIGHT is external; ② on the LEFT is incident.
export const PERP_CASE_LINES: readonly Segment2[] = [[[30,190],[250,60]], [[350,60],[570,190]]];
export const PARALLEL_CASE_LINES: readonly Segment2[] = [[[30,190],[250,90]], [[350,70],[570,200]]];
export const PERP_CASE_POINTS = [pointOn(PERP_CASE_LINES[0], 0.35), [490,50]] as const;
export const PARALLEL_CASE_POINTS = [pointOn(PARALLEL_CASE_LINES[0], 0.4), [490,90]] as const;

// p. 18: preserve the arrangement of A/B on the rising line and R/P on the falling line.
export const ABRP_POINTS = { A: [200,140], B: [380,90], R: [240,215], P: [320,225] } as const;
const { A, B, R, P } = ABRP_POINTS;
export const ABRP_LINES = { AB: [A,B], RP: [R,P], AR: [A,R], BP: [B,P], AP: [A,P], BR: [B,R] } as const;
export const ABRP_INTERSECTIONS = {
  M: intersection(ABRP_LINES.AB, ABRP_LINES.RP),
  N: intersection(ABRP_LINES.AR, ABRP_LINES.BP),
  O: intersection(ABRP_LINES.AP, ABRP_LINES.BR),
};
// Extensions are computed from the same lines, never independent approximate strokes.
export const ABRP_EXTENTS = {
  AB: [pointOn(ABRP_LINES.AB,-1.02), pointOn(ABRP_LINES.AB,1.3)],
  RP: [pointOn(ABRP_LINES.RP,-2.85), pointOn(ABRP_LINES.RP,2.7)],
  AR: [pointOn(ABRP_LINES.AR,-0.25), pointOn(ABRP_LINES.AR,2.5)],
  BP: [pointOn(ABRP_LINES.BP,-0.15), pointOn(ABRP_LINES.BP,1.7)],
  AP: [pointOn(ABRP_LINES.AP,-0.15), pointOn(ABRP_LINES.AP,1.2)],
  BR: [pointOn(ABRP_LINES.BR,-0.15), pointOn(ABRP_LINES.BR,1.2)],
} satisfies Record<keyof typeof ABRP_LINES, Segment2>;
