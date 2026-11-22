import type { ReactNode } from "react";

/** إعادة رسم العلاقات والتسميات من ص 6،16–23. إحداثيات العرض ليست أطوالًا معطاة في الكتاب. */
type P = [number, number, string];
type L = [number, number, number, number, string?];
const blue = "#2766b0";
export function Diagram({ title, lines = [], points = [], children, height = 220 }: { title: string; lines?: L[]; points?: P[]; children?: ReactNode; height?: number }) {
  return <svg className="unit-one-figure w-full" viewBox={`0 0 600 ${height}`} role="img" aria-label={title} style={{ maxHeight: 360 }}>
    <title>{title}</title>
    <g fill="none" stroke={blue} strokeWidth="2">{lines.map(([x1,y1,x2,y2,c],i)=><line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c || blue}/>)}</g>
    <g fill="#18253d" fontSize="18" fontFamily="serif">{points.map(([x,y,label],i)=><g key={i}><circle cx={x} cy={y} r="3"/><text x={x+8} y={y-9}>{label}</text></g>)}</g>
    {children}
  </svg>;
}
function Label({ x, y, children, color = "#18253d" }: { x: number; y: number; children: ReactNode; color?: string }) { return <text x={x} y={y} fill={color} fontSize="18" textAnchor="middle">{children}</text>; }
function Right({ x, y, rotate = 0 }: { x:number; y:number; rotate?:number }) {return <path d="M 0 -12 L 12 -12 L 12 0" transform={`translate(${x} ${y}) rotate(${rotate})`} fill="none" stroke="#b54f4f" strokeWidth="1.5"/>;}
function Construction({ parallel = false }: { parallel?:boolean }) {
 return <Diagram title={parallel ? "إنشاء الموازي في ثلاث مراحل" : "إنشاء العمود في ثلاث مراحل"} height={240}>
   {[0,1,2].map(i=><g key={i} transform={`translate(${i*200} 0)`}>
     <line x1="15" y1="190" x2="185" y2="190" stroke={blue}/><Label x={100} y={25}>{["①","②","③"][i]}</Label>
     <circle cx="85" cy="100" r="3"/><Label x={72} y={92}>A</Label><Label x={25} y={180}>(d)</Label>
     {i>0 && <><line x1="85" y1="45" x2="85" y2="210" stroke={parallel ? blue : "#e24b41"}/><path d={parallel && i===2 ? "M87 98 L87 40 L130 98 Z M97 88 L97 68 L112 88 Z" : "M87 188 L87 80 L153 188 Z M98 170 L98 120 L130 170 Z"} fill="#87b85c" fillRule="evenodd" stroke="#558638"/></>}
     {i===2 && (parallel ? <><line x1="35" y1="100" x2="185" y2="100" stroke="#e24b41"/><Label x={170} y={88}>(d′)</Label></> : <><rect x="74" y="65" width="9" height="145" fill="#d3d9e5"/><Label x={110} y={55}>(d′)</Label></>)}
   </g>)}
 </Diagram>;
}
function DigitAngles() {
 const paths = ["M48 90 L55 15 L37 52", "M20 20 L62 20 L25 85 L68 85", "M20 15 L62 33 L24 53 L62 68 L22 87", "M62 90 L62 15 L20 58 L62 58", "M65 15 L20 15 L20 48 L62 48 L62 85 L20 85 L20 77", "M65 15 L20 15 L20 85 L65 85 L65 48 L20 48", "M20 15 L60 15 L40 85 M28 48 L72 48 M33 85 L57 85", "M20 15 L65 15 L20 85 L65 85 Z", "M20 15 L65 15 L65 85 L20 85 L20 65 L35 65 L35 73 M20 15 L20 53 L65 53", ""];
 const dots: [number,number][][] = [[[49,36]],[[52,25],[31,80]],[[52,33],[34,53],[52,68]],[[57,27],[32,53],[57,53],[57,64]],[[25,21],[25,42],[56,53],[56,79],[25,79]],[[25,21],[25,42],[25,54],[60,54],[60,79],[25,79]],[[51,21],[47,42],[57,42],[45,54],[55,54],[39,79],[49,79]],[[26,20],[59,20],[41,40],[36,50],[46,50],[41,61],[29,80],[59,80]],[[25,20],[59,20],[25,47],[59,47],[59,59],[59,79],[25,79],[25,69],[31,69]],[]];
 return <Diagram title="أشكال انطلاقة عد الزوايا" height={270}>{paths.map((d,i)=><g key={i} transform={`translate(${(4-i%5)*118+5} ${Math.floor(i/5)*125+15})`}>
   <rect x="82" y="0" width="26" height="100" fill={i%2 ? "#e6edf3":"#f8f3ac"}/><Label x={95} y={55}>{["أ","ب","ج","د","هـ","و","ز","ح","ط","ك"][i]}</Label>
   {i===9 ? <ellipse cx="43" cy="50" rx="30" ry="34" fill="none" stroke={blue} strokeWidth="2"/> : <path d={d} fill="none" stroke={blue} strokeWidth="2"/>}
   {dots[i].map(([x,y],j)=><circle key={j} cx={x} cy={y} r="2" fill="#e23b32"/>)}
 </g>)}</Diagram>;
}
const numberLine = <Diagram title="الأعداد الطبيعية من صفر إلى اثني عشر" height={100} lines={[[25,40,580,40]]}>{Array.from({length:13},(_,n)=><g key={n}><line x1={40+n*42} x2={40+n*42} y1="33" y2="47" stroke="#18253d"/><Label x={40+n*42} y={72}>{n}</Label></g>)}<path d="M573 35 L580 40 L573 45" fill="none" stroke={blue}/></Diagram>;
export const UNIT_ONE_FIGURES: Record<string,ReactNode> = {
 "u1-angles-digits": <DigitAngles/>,
 "u1-natural-line": numberLine,
 "u1-count-sets": <Diagram title="مجموعات الأشياء من صفر إلى سبعة" height={150}>{Array.from({length:8},(_,n)=><g key={n} transform={`translate(${35+n*75} 65)`}><ellipse rx="26" ry="46" fill="none" stroke="#18253d"/>{Array.from({length:n},(_,i)=><circle key={i} cx={n===1?0:(i%2)*20-10} cy={n===1?0:Math.floor(i/2)*19-27} r="5" fill="#ffb339" stroke="#e45949"/>)}<Label x={0} y={72}>{n}</Label></g>)}</Diagram>,
 "u1-earth-sun": <Diagram title="الشمس والأرض والقمر؛ المسافة 150000000 km" height={240} lines={[[80,40,430,195,"#ab7d1d"]]} points={[[80,40,"الشمس"],[430,195,"الأرض"],[550,180,"القمر"]]}><circle cx="80" cy="40" r="12" fill="#f4c64c"/><circle cx="430" cy="195" r="8" fill="#4b9cbf"/><Label x={275} y={95}>150000000 km</Label></Diagram>,
 "u1-rspm": <Diagram title="P وR وS على المستقيم وM خارجه" lines={[[70,160,500,70]]} points={[[160,141.16,"R"],[280,116.05,"S"],[420,86.74,"P"],[380,170,"M"]]}/>,
 "u1-line-names": <Diagram title="تسمية المستقيم بنقطتين أو بحرف" lines={[[60,190,240,30],[350,190,530,30]]} points={[[105,150,"B"],[195,70,"A"]]}><Label x={350} y={210}>(d)</Label></Diagram>,
 "u1-collinear": <Diagram title="B A C على استقامة واحدة" lines={[[100,180,480,40]]} points={[[150,161.58,"B"],[290,110,"A"],[390,73.16,"C"]]}/>,
 "u1-opposite-rays": <Diagram title="A تقسم المستقيم BC إلى نصفي مستقيم" height={280} lines={[[80,70,490,25],[270,145,80,166],[270,230,490,206]]} points={[[160,61.22,"B"],[270,49.15,"A"],[410,33.78,"C"],[270,145,"A"],[160,157.16,"B"],[270,230,"A"],[410,214.73,"C"]]}/>,
 "u1-segment-bc": <Diagram title="المستقيم BC والقطعة BC" lines={[[80,100,510,30],[160,180,410,139.3]]} points={[[160,86.98,"B"],[410,46.28,"C"],[160,180,"B"],[410,139.3,"C"]]}/>,
 "u1-line-ray-segment": <Diagram title="مستقيم ونصف مستقيم وقطعة" lines={[[30,160,170,30],[240,160,370,39.29,"#49703e"],[440,160,560,48.57,"#d54a3d"]]} points={[[65,127.5,"B"],[135,62.5,"A"],[240,160,"D"],[330,76.43,"C"],[440,160,"M"],[560,48.57,"N"]]}><Label x={100} y={205}>(AB) / (d)</Label><Label x={300} y={205}>[DC)</Label><Label x={500} y={205}>[MN]</Label></Diagram>,
 "u1-intersection-a": <Diagram title="تقاطع d وL في A" lines={[[70,40,530,180,"#387646"],[70,180,530,40]]} points={[[300,110,"A"]]}><Label x={50} y={35}>(d)</Label><Label x={50} y={190}>(L)</Label></Diagram>,
 "u1-extend-before": <Diagram title="خطوط قبل التمديد" lines={[[60,60,310,60],[80,180,310,100,"#333"]]}><Label x={40} y={60}>(L)</Label><Label x={60} y={190}>(d)</Label></Diagram>,
 "u1-extend-after": <Diagram title="التقاطع بعد التمديد في C" lines={[[60,60,310,60],[80,180,310,100,"#333"]]} points={[[425,60,"C"]]}><path d="M310 60H480 M310 100L480 40.87" stroke="#666" fill="none" strokeDasharray="8 6"/><Label x={40} y={60}>(L)</Label><Label x={60} y={190}>(d)</Label></Diagram>,
 "u1-abc-practice": <Diagram title="النقاط A B C" height={110} lines={[[50,60,550,60,"#777"]]} points={[[120,60,"A"],[250,60,"B"],[450,60,"C"]]}/>,
 "u1-dlt": <Diagram title="المستقيمات d وL وT قبل التمديد" height={260} lines={[[280,20,400,240,"#333"],[110,190,360,60,"#d84c46"],[110,210,310,210]]}><Label x={290} y={15}>(d)</Label><Label x={95} y={185}>(L)</Label><Label x={130} y={236}>(T)</Label></Diagram>,
 "u1-abrp": <Diagram title="A B وR P" lines={[[60,95,490,25],[60,140,550,200]]} points={[[140,81.98,"A"],[430,34.77,"B"],[200,157.14,"R"],[350,175.51,"P"]]}/>,
 "u1-square": <Diagram title="ABCD وقطراه المتقاطعان في O" height={300} lines={[[180,260,400,260],[400,260,400,40],[400,40,180,40],[180,40,180,260],[180,40,400,260],[180,260,400,40]]} points={[[180,260,"A"],[400,260,"B"],[400,40,"C"],[180,40,"D"],[290,150,"O"]]}/>,
 "u1-hnpm": <Diagram title="HNPM وHM وPN والتقاطع G" height={310} lines={[[200,30,350,30],[200,30,200,180],[200,180,350,280],[350,280,350,30],[200,30,350,280],[200,180,350,30]]} points={[[200,30,"H"],[350,30,"N"],[200,180,"P"],[350,280,"M"],[256.25,123.75,"G"]]}/>,
 "u1-two-slants": <Diagram title="خطّان يحتاجان إلى التمديد" height={130} lines={[[160,85,360,30,"#333"],[280,110,410,30,"#333"]]}/>,
 "u1-perpendicular": <Diagram title="d عمودي على L" lines={[[70,120,530,120],[300,20,300,200,"#41864a"]]}><Right x={300} y={120}/><Label x={300} y={17}>(d)</Label><Label x={55} y={115}>(L)</Label></Diagram>,
 "u1-parallel": <Diagram title="d يوازي L" lines={[[80,110,500,30],[80,190,500,110,"#41864a"]]}><path d="M290 70l-12 -2 3 12 M290 150l-12 -2 3 12" stroke={blue} fill="none"/><Label x={515} y={30}>(d)</Label><Label x={515} y={120}>(L)</Label></Diagram>,
 "u1-three-parallel": <Diagram title="d وd′ وd″ متوازية" lines={[[100,100,430,20],[130,150,460,70,"#d94c40"],[160,200,490,120,"#d94c40"]]}><Label x={80} y={110}>(d)</Label><Label x={105} y={160}>(d′)</Label><Label x={135} y={210}>(d″)</Label></Diagram>,
 "u1-two-perpendiculars": <Diagram title="عمودان على مستقيم ثالث" lines={[[130,70,500,70,"#d94c40"],[130,150,500,150,"#d94c40"],[300,20,300,205]]}><Right x={300} y={70}/><Right x={300} y={150}/><Label x={110} y={65}>(d′)</Label><Label x={110} y={145}>(d″)</Label><Label x={320} y={205}>(d)</Label></Diagram>,
 "u1-unique-perp": <Diagram title="عمود من A على d" lines={[[80,190,500,40],[210,20,274.29,200,"#d94c40"]]} points={[[225,62,"A"]]}><g transform="translate(249.05 129.625) rotate(-19.654)"><Right x={0} y={0}/></g><Label x={510} y={40}>(d)</Label><Label x={295} y={205}>(d′)</Label></Diagram>,
 "u1-construct-perp": <Construction/>,
 "u1-m-ab": <Diagram title="النقطة M خارج المستقيم AB" lines={[[150,180,500,70]]} points={[[250,148.57,"A"],[450,85.71,"B"],[130,55,"M"]]}/>,
 "u1-m-ab-solution": <Diagram title="عمود M بعد تمديد AB" lines={[[50,211.43,500,70],[130,55,180,214.09,"#d94c40"]]} points={[[250,148.57,"A"],[450,85.71,"B"],[130,55,"M"]]}><g transform="translate(167.55 174.48) rotate(-17.45)"><Right x={0} y={0}/></g><Label x={110} y={40}>(d′)</Label></Diagram>,
 "u1-unique-parallel": <Diagram title="الموازي من A" lines={[[90,100,460,20,"#d94c40"],[120,190,490,110]]} points={[[300,54.59,"A"]]}><Label x={80} y={85}>(d′)</Label><Label x={505} y={110}>(d)</Label></Diagram>,
 "u1-construct-parallel": <Construction parallel/>,
 "u1-triangle-parallel": <Diagram title="مثلث قائم في A ومواز من B" lines={[[160,190,480,190],[160,30,160,210],[160,65,480,190],[80,65,520,65,"#d94c40"]]} points={[[160,190,"A"],[160,65,"B"],[480,190,"C"]]}><Right x={160} y={190}/><Right x={160} y={65} rotate={90}/><Label x={180} y={30}>(L)</Label><Label x={500} y={55}>(d)</Label></Diagram>,
 "u1-trapezoid": <Diagram title="AB وCD عموديان على BD" lines={[[220,35,440,35],[440,35,440,195],[440,195,90,195],[90,195,220,35]]} points={[[220,35,"A"],[440,35,"B"],[90,195,"C"],[440,195,"D"]]}><Right x={440} y={35} rotate={180}/><Right x={440} y={195} rotate={270}/></Diagram>,
 "u1-activity-perp": <Diagram title="نشاط رسم عمود من A" height={270} lines={[[100,20,330,250,"#e04c40"]]} points={[[380,80,"A"]]}><Label x={300} y={255}>(d)</Label></Diagram>,
 "u1-relations": <Diagram title="العلاقات بين d L M N T" height={320} lines={[[190,300,260,20],[370,300,440,20],[130,90,520,187.5,"#333"],[110,190,470,280,"#333"],[150,280,500,70,"#333"]]}><Right x={235.882} y={116.471} rotate={14.036}/><Right x={405.294} y={158.824} rotate={194.036}/><Right x={211.176} y={215.294} rotate={194.036}/><Label x={260} y={18}>(d)</Label><Label x={105} y={90}>(L)</Label><Label x={85} y={195}>(M)</Label><Label x={135} y={300}>(N)</Label><Label x={375} y={315}>(T)</Label></Diagram>,
 "u1-practice-perps": <Diagram title="L وT عموديان على d" height={260} lines={[[100,150,300,30],[240,230,440,110],[200,30,320,230,"#333"]]}><Right x={226.471} y={74.118} rotate={149.036}/><Right x={298.824} y={194.706} rotate={149.036}/><Label x={85} y={160}>(T)</Label><Label x={440} y={105}>(L)</Label><Label x={340} y={245}>(d)</Label></Diagram>,
 "u1-d1234": <Diagram title="d1 d2 d3 d4" height={260} lines={[[100,150,470,45,"#333"],[160,230,430,153.38,"#333"],[170,20,232.43,240,"#333"],[380,10,442.43,230,"#333"]]}><Label x={85} y={150}>(d₁)</Label><Label x={145} y={240}>(d₂)</Label><Label x={170} y={18}>(d₃)</Label><Label x={467} y={240}>(d₄)</Label></Diagram>,
 "u1-perp-cases": <Diagram title="رسم العمود من نقطة خارج المستقيم أو عليه" lines={[[30,190,250,60,"#333"],[350,60,570,190,"#333"]]} points={[[107,144.5,"A"],[490,50,"A"]]}><Label x={255} y={55}>(d)</Label><Label x={345} y={55}>(d)</Label><Label x={140} y={215}>②</Label><Label x={470} y={215}>①</Label></Diagram>,
 "u1-parallel-cases": <Diagram title="رسم الموازي من نقطة خارج المستقيم أو عليه" lines={[[30,190,250,90,"#333"],[350,70,570,200,"#333"]]} points={[[118,150,"A"],[490,90,"A"]]}><Label x={255} y={85}>(d)</Label><Label x={345} y={65}>(d)</Label><Label x={140} y={215}>②</Label><Label x={470} y={215}>①</Label></Diagram>,
};
