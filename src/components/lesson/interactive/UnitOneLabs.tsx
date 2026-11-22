"use client";
import { useState } from "react";
import { Diagram } from "./UnitOneFigures";
import { SourceTag } from "../SourceTag";

const normalize = (s:string) => s.replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[ ,٬]/g,"").replace("٫", ".");
function Feedback({ value }: { value:string }) { return <p role="status" aria-live="polite" className="mt-3 rounded-lg bg-white p-3">{value || "جرّب ثم أجب؛ تظهر التغذية الراجعة بعد التحقق."}</p>; }
function Intro() {return <p className="mb-3 text-sm"><SourceTag source="extra"/> إثراء — من إعداد المنصة</p>;}

export function NaturalLab() {
 const [n,setN]=useState(0), [answer,setAnswer]=useState(""), [message,setMessage]=useState("");
 const samples=[{label:"0",natural:true,why:"الصفر عدد طبيعي يعدّ مجموعة خالية."},{label:"8 ÷ 4",natural:true,why:"ناتج القسمة 2، وهو عدد طبيعي."},{label:"0.15",natural:false,why:"0.15 ليس عددًا طبيعيًا."},{label:"7 ÷ 6",natural:false,why:"الكسر 7/6 لا يساوي عددًا طبيعيًا."}];
 return <div data-lab="2"><Intro/><label>عدد الأشياء في المجموعة: {n}<input className="block w-full" aria-label="عدد الأشياء" type="range" min="0" max="12" value={n} onChange={e=>setN(Number(e.target.value))}/></label>
 <svg viewBox="0 0 600 100" className="w-full" role="img" aria-label={`مجموعة من ${n} أشياء`}>{Array.from({length:n},(_,i)=><circle key={i} cx={25+i*48} cy="45" r="13" fill="#f5bd4f" stroke="#c07030"/>)}</svg>
 <label>اختر تعبيرًا لتصنيفه<select className="field" aria-label="تعبير التصنيف" value={answer} onChange={e=>{setAnswer(e.target.value);setMessage("");}}><option value="">اختر…</option>{samples.map((s,i)=><option key={s.label} value={i}>{s.label}</option>)}</select></label>
 <div className="mt-3 flex gap-2">{[true,false].map(isNatural=><button key={String(isNatural)} className="btn btn-primary" disabled={answer===""} onClick={()=>{const s=samples[Number(answer)];setMessage(`${s.natural===isNatural ? "صحيح" : "حاول مجددًا"}: ${s.why}`);}}>{isNatural ? "عدد طبيعي" : "ليس عددًا طبيعيًا"}</button>)}</div><Feedback value={message}/></div>;
}

export function PlaceLab() {
 const [digits,setDigits]=useState("299792485"),[place,setPlace]=useState(6),[answer,setAnswer]=useState(""),[message,setMessage]=useState("");
 const names=["الآحاد","العشرات","المئات","آحاد الألوف","عشرات الألوف","مئات الألوف","آحاد الملايين","عشرات الملايين","مئات الملايين","المليارات"];
 const valid=/^\d{1,10}$/.test(normalize(digits));
 const value=valid?Number(normalize(digits)):0;
 function clear(){setAnswer("");setMessage("");}
 return <div data-lab="3"><Intro/><label>اكتب عددًا طبيعيًا من عشر خانات على الأكثر<input className="field" inputMode="numeric" aria-label="العدد للاستكشاف" value={digits} onChange={e=>{setDigits(e.target.value);clear();}}/></label>
 {!valid&&<p role="alert">أدخل من 1 إلى 10 أرقام دون كسور.</p>}
 <label>الخانة<select className="field" aria-label="الخانة" value={place} onChange={e=>{setPlace(Number(e.target.value));clear();}}>{names.map((p,i)=><option key={p} value={i}>{p}</option>)}</select></label>
 <p className="my-3">الحلقات (من اليسار): <b dir="ltr">{valid?String(value).replace(/\B(?=(\d{3})+(?!\d))/g," | "):"—"}</b></p>
 <label>توقّع قيمة الرقم في الخانة المختارة<input className="field" inputMode="numeric" aria-label="قيمة الرقم المتوقعة" value={answer} onChange={e=>{setAnswer(e.target.value);setMessage("");}}/></label>
 <button className="btn btn-primary mt-3" disabled={!valid||!/^\d+$/.test(normalize(answer))} onClick={()=>{const digit=Math.floor(value/10**place)%10, expected=digit*10**place;setMessage(`${Number(normalize(answer))===expected?"صحيح":"ليست القيمة الصحيحة"}: الرقم ${digit} × قيمة الخانة ${10**place} = ${expected}. جرّب نقل الرقم إلى خانة أخرى ولاحظ تغير قيمته.`);}}>تحقق</button><Feedback value={message}/></div>;
}
export function RoundingLab() {
 const [n,setN]=useState("503682137"),[p,setP]=useState(5),[answer,setAnswer]=useState(""),[message,setMessage]=useState("");
 const valid=/^\d{1,10}$/.test(normalize(n));
 function clear(){setAnswer("");setMessage("");}
 return <div data-lab="4"><Intro/><label>العدد<input className="field" inputMode="numeric" aria-label="عدد التقريب" value={n} onChange={e=>{setN(e.target.value);clear();}}/></label>
 <label>قرّب إلى أقرب<select className="field" aria-label="خانة التقريب" value={p} onChange={e=>{setP(Number(e.target.value));clear();}}>{["عشرة","مئة","ألف","عشرة آلاف","مئة ألف","مليون","عشرة ملايين","مئة مليون","مليار"].map((s,i)=><option key={s} value={i+1}>{s}</option>)}</select></label>
 <label>توقع الناتج قبل التحقق<input className="field" inputMode="numeric" aria-label="ناتج التقريب المتوقع" value={answer} onChange={e=>{setAnswer(e.target.value);setMessage("");}}/></label>
 <button className="btn btn-primary mt-3" disabled={!valid||!/^\d+$/.test(normalize(answer))} onClick={()=>{const value=Number(normalize(n)), unit=10**p, digit=Math.floor(value/(unit/10))%10, expected=Math.floor((value+unit/2)/unit)*unit;setMessage(`${Number(normalize(answer))===expected?"صحيح":"راجع الخانة المجاورة"}: الرقم إلى اليمين هو ${digit}؛ ${digit>=5?"نزيد واحدًا":"نترك الرقم"} ثم نصفّر الخانات إلى اليمين. الناتج ${expected}. جرّب عددًا مجاورًا ولاحظ متى تتغير النتيجة.`);}}>تحقق</button><Feedback value={message}/></div>;
}
export function LineLab() {
 const [x,setX]=useState(300),[kind,setKind]=useState("segment"),[message,setMessage]=useState("");
 const inside=kind==="line"||kind==="ray"&&x>=200||kind==="segment"&&x>=200&&x<=400;
 return <div data-lab="5"><Intro/><label>الشكل<select className="field" aria-label="نوع الشكل" value={kind} onChange={e=>{setKind(e.target.value);setMessage("");}}><option value="segment">القطعة [AB]</option><option value="ray">نصف المستقيم [AB)</option><option value="line">المستقيم (AB)</option></select></label>
 <Diagram title="حرك النقطة M وحدد انتماءها" height={160} lines={[[kind==="line"?30:200,90,kind==="segment"?400:570,90]]} points={[[200,90,"A"],[400,90,"B"],[x,90,"M"]]}>{kind!=="segment"&&<path d="M560 84L570 90L560 96" fill="none" stroke="#2766b0"/>}{kind==="line"&&<path d="M40 84L30 90L40 96" fill="none" stroke="#2766b0"/>}</Diagram>
 <label>موضع M<input aria-label="موضع M" className="block w-full" type="range" min="40" max="560" step="10" value={x} onChange={e=>{setX(Number(e.target.value));setMessage("");}}/></label>
 <p>هل تنتمي M إلى الشكل المختار؟ جرّب قبل A وبين A وB وبعد B.</p><div className="flex gap-2 mt-3">{[true,false].map(a=><button key={String(a)} className="btn btn-primary" onClick={()=>setMessage(`${a===inside?"صحيح":"راجع حدود الشكل"}: ${kind==="line"?"المستقيم ممتد في الاتجاهين.":kind==="ray"?"نصف المستقيم يبدأ من A ويمر بـB ويمتد بعدها.":"القطعة تضم النقطتين A وB وما بينهما فقط."}`)}>{a?"تنتمي":"لا تنتمي"}</button>)}</div><Feedback value={message}/></div>;
}
export function ParallelLab() {
 const [angle,setAngle]=useState(0),[message,setMessage]=useState("");
 const rad=angle*Math.PI/180, dx=180*Math.cos(rad),dy=180*Math.sin(rad);
 return <div data-lab="6"><Intro/><p>المستقيم الأزرق أفقي. دوّر المستقيم الأحمر المار بالنقطة A، ثم صنّف العلاقة. اجعل الزاوية 0 ثم 90 ولاحظ ما يتغير.</p>
 <Diagram title="استكشاف التوازي والتعامد" height={440} lines={[[60,280,540,280],[300-dx,210-dy,300+dx,210+dy,"#d54a3d"]]} points={[[300,210,"A"]]} />
 <label>دوران المستقيم الأحمر: {angle}°<input className="block w-full" aria-label="زاوية الدوران" type="range" min="0" max="180" step="15" value={angle} onChange={e=>{setAngle(Number(e.target.value));setMessage("");}}/></label>
 <div className="mt-3 flex flex-wrap gap-2">{["متوازيان","متعامدان","متقاطعان غير متعامدين"].map((label,i)=><button className="btn btn-primary" key={label} onClick={()=>{const correct=angle===0||angle===180?0:angle===90?1:2;setMessage(`${i===correct?"صحيح":"أعد النظر"}: ${["لا يتقاطع المستقيمان، فهما متوازيان.","يشكلان زاوية قائمة، فهما متعامدان.","يتقاطعان ولكن الزاوية ليست قائمة؛ مدّ الخطين ذهنيًا عند الحاجة."][correct]}`);}}>{label}</button>)}</div><Feedback value={message}/></div>;
}
export const UNIT_ONE_ACTIVITIES = { "unit1-lab-2": NaturalLab, "unit1-lab-3": PlaceLab, "unit1-lab-4": RoundingLab, "unit1-lab-5": LineLab, "unit1-lab-6": ParallelLab };
