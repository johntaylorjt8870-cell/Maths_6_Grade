"use client";

import { useState } from "react";
import type { BookPracticeBlock } from "@/content/types";

const RELATIONS = [
  "(d) ⟂ (L)", "(d) ⟂ (M)", "(T) ⟂ (L)", "(T) ⟂ (M)",
  "(L) ∥ (M)", "(d) ∥ (T)",
] as const;
const CORRECT_RELATIONS = new Set<string>(RELATIONS);
type Option = readonly [value: string, label: string];
type ChoiceGroup = readonly [key: string, label: string, options: readonly Option[]];
const SHAPES: readonly [string, string, readonly ChoiceGroup[]][] = [
  ["s1", "الشكل ① — A,B,C,D", [["intersect", "مستقيمان متقاطعان", [["AB/BC", "(AB) و(BC)"], ["AC/BD", "(AC) و(BD)"]]], ["perpendicular", "مستقيمان متعامدان", [["AB/BC", "(AB) و(BC)"], ["AC/BD", "(AC) و(BD)"]]], ["parallel", "مستقيمان يبدوان متوازيين", [["AB/CD", "(AB) و(CD)"], ["AD/BC", "(AD) و(BC)"]]]]],
  ["s2", "الشكل ② — H,N,P,M", [["intersect", "مستقيمان متقاطعان", [["HM/PN", "(HM) و(PN)"], ["HN/NM", "(HN) و(NM)"]]], ["perpendicular", "مستقيمان متعامدان", [["HN/NM", "(HN) و(NM)"], ["HP/PM", "(HP) و(PM)"]]], ["parallel", "مستقيمان يبدوان متوازيين", [["HP/NM", "(HP) و(NM)"], ["HN/PM", "(HN) و(PM)"]]]]],
];
const REASON_GROUPS: readonly ChoiceGroup[] = [["relation", "العلاقة بين (L) و(T)", [["parallel", "متوازيان"], ["perpendicular", "متعامدان"], ["intersect", "متقاطعان فقط"]]], ["property", "الخاصية المستعملة", [["perpendicular-third", "المستقيمان العموديان على مستقيم ثالث متوازيان"], ["parallel-third", "المستقيمان الموازيان لمستقيم ثالث متوازيان"], ["definition", "تعريف المستقيمين المتقاطعين"]]]];
const REBUILD_GROUPS: readonly ChoiceGroup[] = [["pair1", "العلاقة بين (d₁) و(d₂)", [["parallel", "متوازيان"], ["perpendicular", "متعامدان"]]], ["pair2", "العلاقة بين (d₃) و(d₄)", [["parallel", "متوازيان"], ["perpendicular", "متعامدان"]]]];

/** Book-page 19–23 line/angle tasks: visual choices are drawn on SVG and checked locally. */
export function ParallelBookPractice({ task }: { task: BookPracticeBlock }) {
  const id = task.geometryId ?? "";
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [hint, setHint] = useState(false);
  const set = (key: string, value: string) => { setAnswers((old) => ({ ...old, [key]: value })); setChecked(false); setHint(false); };
  const reset = () => { setAnswers({}); setChecked(false); setHint(false); };

  const required = id === "parallel-shapes" ? ["s1-intersect", "s1-perpendicular", "s1-parallel", "s2-intersect", "s2-perpendicular", "s2-parallel"]
    : id === "parallel-point" ? ["position"]
    : id === "parallel-mcq" ? ["a", "b"]
      : id === "parallel-relations" ? ["relations"]
        : id === "parallel-reason-1" || id === "parallel-reason-2" ? ["relation", "property"]
          : id === "parallel-rebuild" ? ["pair1", "pair2"]
            : id === "parallel-perpendicular" || id === "parallel-parallel" ? ["case1", "case2"] : [];
  const filled = required.length > 0 && required.every((key) => answers[key]);
  const correct = id === "parallel-shapes" ? ["AB/BC", "AC/BD"].includes(answers["s1-intersect"]) && ["AB/BC", "AC/BD"].includes(answers["s1-perpendicular"]) && ["AB/CD", "AD/BC"].includes(answers["s1-parallel"]) && ["HM/PN", "HN/NM"].includes(answers["s2-intersect"]) && answers["s2-perpendicular"] === "HN/NM" && answers["s2-parallel"] === "HP/NM"
    : id === "parallel-point" ? answers.position === "outside-on-line"
    : id === "parallel-mcq" ? answers.a === "one" && answers.b === "intersect"
      : id === "parallel-relations" ? (answers.relations ?? "").split("|").filter(Boolean).length === CORRECT_RELATIONS.size && (answers.relations ?? "").split("|").every((r) => CORRECT_RELATIONS.has(r))
        : id === "parallel-reason-1" ? answers.relation === "parallel" && answers.property === "perpendicular-third"
          : id === "parallel-reason-2" ? answers.relation === "parallel" && answers.property === "parallel-third"
            : id === "parallel-rebuild" ? answers.pair1 === "parallel" && answers.pair2 === "parallel"
              : id === "parallel-perpendicular" ? answers.case1 === "perpendicular" && answers.case2 === "perpendicular"
                : id === "parallel-parallel" ? answers.case1 === "parallel" && answers.case2 === "coincident-parallel" : false;

  const title = id === "parallel-shapes" ? "مستقيما الشكلين في ص 19"
    : id === "parallel-point" ? "المستقيم (d) والنقطتان A وB"
    : id === "parallel-mcq" ? "اختر وصف المستقيمين المرسومين"
      : id === "parallel-relations" ? "الشكل الهندسي — اختر العلاقات الظاهرة"
        : id.startsWith("parallel-reason") ? "استدلال من الشكل الهندسي"
          : id === "parallel-rebuild" ? "إعادة بناء العلاقات بين المستقيمات"
            : id === "parallel-perpendicular" ? "ارسم عمودًا من النقطة A على (d) في الحالتين"
              : "ارسم موازيًا من النقطة A إلى (d) في الحالتين";
  const constructionOptions = (caseNo: number): readonly Option[] => id === "parallel-perpendicular"
    ? [["perpendicular", "عمود صحيح"], ["parallel", "موازٍ"], ["other", "مائل غير عمودي"]]
    : caseNo === 1
      ? [["parallel", "موازٍ من A خارج (d)"], ["perpendicular", "عمودي"], ["other", "خط مائل"]]
      : [["coincident-parallel", "منطبق على (d) عند A"], ["parallel", "موازٍ منفصل عن (d)"], ["perpendicular", "عمودي"]];

  return <div className="mt-4 rounded-xl border border-brand/20 bg-white p-4" data-testid={`parallel-practice-${id}`}>
    <h3 className="mb-3 font-bold text-brand">{title}</h3>
    {id === "parallel-shapes" ? <p className="mb-4 rounded-lg border border-ink/10 bg-paper/30 p-3">ارجع إلى الشكلين الأصليين أعلاه في انطلاقة ص 19؛ اختر زوجًا من كل شكل لكل علاقة مطلوبة.</p> : <figure className="mb-4 overflow-x-auto rounded-lg border border-ink/10 bg-paper/30 p-2">
      <svg viewBox="0 0 520 180" role="img" aria-label={title} className="mx-auto h-auto w-full min-w-[300px] max-w-[520px]" style={{ direction: "ltr" }}>
        <rect width="520" height="180" fill="white" />
        {id === "parallel-point" && <><line x1="65" y1="90" x2="455" y2="90" stroke="#334155" strokeWidth="3"/><text x="430" y="78">(d)</text><circle cx="180" cy="90" r="6" fill="#172554"/><text x="166" y="78">A</text><circle cx="310" cy="90" r="6" fill="#172554"/><text x="316" y="78">B</text>{answers.position && <><circle cx={answers.position === "outside-on-line" ? 390 : answers.position === "inside" ? 245 : 390} cy={answers.position === "off-line" ? 40 : 90} r="7" fill="#c2413b"/><text x={answers.position === "off-line" ? 400 : 398} y={answers.position === "off-line" ? 44 : 96}>M</text></>}</>}
        {id === "parallel-mcq" && <><line x1="100" y1="135" x2="270" y2="35" stroke="#334155" strokeWidth="3"/><line x1="245" y1="145" x2="415" y2="45" stroke="#334155" strokeWidth="3"/><text x="95" y="155">(d)</text><text x="400" y="38">(L)</text></>}
        {id === "parallel-relations" && <><line x1="130" y1="20" x2="65" y2="160" stroke="#344b9b" strokeWidth="3"/><text x="115" y="20">(d)</text><line x1="100" y1="50" x2="485" y2="135" stroke="#2d7b48" strokeWidth="3"/><text x="465" y="150">(L)</text><line x1="80" y1="95" x2="465" y2="178" stroke="#db4b45" strokeWidth="3"/><text x="445" y="176">(M)</text><line x1="330" y1="10" x2="265" y2="150" stroke="#7354a1" strokeWidth="3"/><text x="325" y="20">(T)</text><line x1="118" y1="45" x2="128" y2="62" stroke="#111" strokeWidth="2"/><line x1="82" y1="91" x2="94" y2="108" stroke="#111" strokeWidth="2"/><line x1="306" y1="55" x2="317" y2="73" stroke="#111" strokeWidth="2"/></>}
        {id === "parallel-reason-1" && <><line x1="70" y1="145" x2="445" y2="45" stroke="#3655a4" strokeWidth="3"/><text x="426" y="40">(L)</text><line x1="70" y1="45" x2="445" y2="145" stroke="#bd4741" strokeWidth="3"/><text x="425" y="165">(T)</text><line x1="260" y1="15" x2="260" y2="165" stroke="#334155" strokeWidth="3"/><text x="270" y="28">(d)</text><path d="M260 70h18v18" fill="none" stroke="#111" strokeWidth="2"/><path d="M260 105h18v18" fill="none" stroke="#111" strokeWidth="2"/></>}
        {id === "parallel-reason-2" && <><line x1="55" y1="45" x2="465" y2="45" stroke="#3655a4" strokeWidth="3"/><text x="470" y="50">(L)</text><line x1="55" y1="90" x2="465" y2="90" stroke="#334155" strokeWidth="3"/><text x="470" y="95">(d)</text><line x1="55" y1="135" x2="465" y2="135" stroke="#bd4741" strokeWidth="3"/><text x="470" y="140">(T)</text></>}
        {id === "parallel-rebuild" && <><line x1="110" y1="25" x2="110" y2="155" stroke="#31509c" strokeWidth="3"/><line x1="405" y1="25" x2="405" y2="155" stroke="#31509c" strokeWidth="3"/><line x1="45" y1="55" x2="475" y2="55" stroke="#c14740" strokeWidth="3"/><line x1="45" y1="125" x2="475" y2="125" stroke="#c14740" strokeWidth="3"/><text x="55" y="48">d₁</text><text x="55" y="119">d₂</text><text x="415" y="45">d₃</text><text x="415" y="115">d₄</text></>}
        {(id === "parallel-perpendicular" || id === "parallel-parallel") && <>{[0,1].map((i) => { const x = i === 0 ? 150 : 370, y = 90, pointY = i === 0 ? 35 : y; const kind = answers[`case${i+1}`]; return <g key={i}><line x1={x-90} y1={y+45} x2={x+90} y2={y-45} stroke="#334155" strokeWidth="3"/><text x={x+75} y={y-48}>(d)</text><circle cx={x} cy={pointY} r="6" fill="#172554"/><text x={x+8} y={pointY+5}>A</text>{kind === "perpendicular" && <line x1={x-28} y1={pointY-56} x2={x+28} y2={pointY+56} stroke="#c2413b" strokeWidth="3"/>}{kind === "parallel" && <line x1={x-90} y1={pointY+45} x2={x+90} y2={pointY-45} stroke="#c2413b" strokeWidth="3"/>}{kind === "coincident-parallel" && <line x1={x-90} y1={y+45} x2={x+90} y2={y-45} stroke="#c2413b" strokeWidth="5" opacity=".65"/>}<text x={x-8} y="165">{i === 0 ? "①" : "②"}</text></g>; })}</>}
      </svg>
    </figure>}

    {id === "parallel-shapes" && <div className="mb-4 grid gap-3 md:grid-cols-2">{SHAPES.map(([shape,label,groups])=><section key={shape} className="rounded-lg border border-ink/10 p-3"><h4 className="mb-2 font-semibold">{label}</h4>{groups.map(([kind,caption,options])=><fieldset key={kind} className="mb-3"><legend className="mb-1 text-sm font-semibold">{caption}</legend><div className="flex flex-wrap gap-2">{options.map(([v,l])=><Choice key={v} value={v} label={l} selected={answers[`${shape}-${kind}`]===v} onClick={()=>set(`${shape}-${kind}`,v)}/>)}</div></fieldset>)}</section>)}</div>}

    {id === "parallel-point" && <div className="flex flex-wrap gap-2">{[["outside-on-line","على (d) وخارج القطعة [AB]"],["inside","بين A وB"],["off-line","خارج (d)"]].map(([v,l]) => <Choice key={v} value={v} label={l} selected={answers.position===v} onClick={()=>set("position",v)}/>)}</div>}
    {id === "parallel-mcq" && <div className="grid gap-4 sm:grid-cols-2">{[["a","أ — المستقيمان المتقاطعان"],["b","ب — المستقيمان المرسومان"]].map(([key,label])=><fieldset key={key}><legend className="mb-2 font-semibold">{label}</legend><div className="flex flex-wrap gap-2">{(key==="a"?[["none","لا يشتركان بنقطة"],["one","يشتركان في نقطة واحدة"],["two","يشتركان بنقطتين"]]:[["unknown","لا يمكن معرفة ذلك"],["parallel","غير متقاطعين"],["intersect","متقاطعان"]]).map(([v,l])=><Choice key={v} value={v} label={l} selected={answers[key]===v} onClick={()=>set(key,v)}/>)}</div></fieldset>)}</div>}
    {id === "parallel-relations" && <div className="grid gap-2 sm:grid-cols-2">{RELATIONS.map((relation)=><label key={relation} className="flex min-h-11 items-center gap-2 rounded-lg border p-2"><input type="checkbox" checked={(answers.relations??"").split("|").includes(relation)} onChange={(e)=>{const selected=new Set((answers.relations??"").split("|").filter(Boolean));e.target.checked?selected.add(relation):selected.delete(relation);set("relations",[...selected].join("|"));}}/><span dir="ltr">{relation}</span></label>)}</div>}
    {(id === "parallel-reason-1" || id === "parallel-reason-2") && <div className="grid gap-4 sm:grid-cols-2">{REASON_GROUPS.map(([key,label,opts])=><fieldset key={key}><legend className="mb-2 font-semibold">{label}</legend><div className="flex flex-wrap gap-2">{opts.map(([v,l])=><Choice key={v} value={v} label={l} selected={answers[key]===v} onClick={()=>set(key,v)}/>)}</div></fieldset>)}</div>}
    {id === "parallel-rebuild" && <div className="grid gap-4 sm:grid-cols-2">{REBUILD_GROUPS.map(([key,label,opts])=><fieldset key={key}><legend className="mb-2 font-semibold">{label}</legend><div className="flex flex-wrap gap-2">{opts.map(([v,l])=><Choice key={v} value={v} label={l} selected={answers[key]===v} onClick={()=>set(key,v)}/>)}</div></fieldset>)}</div>}
    {(id === "parallel-perpendicular" || id === "parallel-parallel") && <div className="grid gap-4 sm:grid-cols-2">{[1,2].map((n)=><fieldset key={n}><legend className="mb-2 font-semibold">الحالة {n === 1 ? "الأولى" : "الثانية"}</legend><div className="flex flex-wrap gap-2">{constructionOptions(n).map(([v,l])=><Choice key={v} value={v} label={l} selected={answers[`case${n}`]===v} onClick={()=>set(`case${n}`,v)}/>)}</div></fieldset>)}</div>}

    <div className="mt-4 flex flex-wrap gap-2"><button type="button" className="btn btn-primary disabled:opacity-40" disabled={!filled} onClick={()=>{setChecked(true);setHint(false);}}>تحقّق من الإنشاء</button><button type="button" className="btn btn-ghost" onClick={reset}>إعادة المحاولة</button>{checked&&!correct&&<button type="button" className="btn btn-ghost" onClick={()=>setHint(true)}>أحتاج تلميحًا</button>}</div>
    {checked&&<p role="status" aria-live="polite" className={`mt-3 rounded-lg p-3 font-semibold ${correct?"bg-emerald-50 text-emerald-900":"bg-amber-50 text-amber-950"}`}>{correct?<>أحسنت! {task.explanation}</>:<>راجع العلاقة الهندسية أو موضع النقطة، ثم حاول ثانية.{hint&&<span className="block">تلميح: {task.hint}</span>}</>}</p>}
  </div>;
}
function Choice({value,label,selected,onClick}:{value:string;label:string;selected:boolean;onClick:()=>void}){return <button type="button" aria-pressed={selected} onClick={onClick} className={`min-h-11 rounded-lg border px-3 py-2 text-sm ${selected?"border-brand bg-brand text-white":"border-ink/15 bg-white text-ink"}`}>{label}</button>}
