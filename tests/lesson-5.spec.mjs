import { test, expect } from "@playwright/test";
const widths = [1440, 390, 360], base = "/Maths_6_Grade/lessons/lesson-1-5/";
const points = { A:[200,140], B:[380,90], R:[240,215], P:[320,225] };
function intersection(a,b,c,d){const [x1,y1]=a,[x2,y2]=b,[x3,y3]=c,[x4,y4]=d,den=(x1-x2)*(y3-y4)-(y1-y2)*(x3-x4),det1=x1*y2-y1*x2,det2=x3*y4-y3*x4;return{x:(det1*(x3-x4)-(x1-x2)*det2)/den,y:(det1*(y3-y4)-(y1-y2)*det2)/den}}
const dlt={E:intersection([230,20],[405,255],[200,150],[500,20]),F:intersection([200,150],[500,20],[135,220],[300,220]),G:intersection([230,20],[405,255],[135,220],[300,220])};
const abrp={M:intersection(points.A,points.B,points.R,points.P),N:intersection(points.A,points.R,points.B,points.P),O:intersection(points.A,points.P,points.B,points.R)};
async function clickTarget(svg,p,v={x:0,y:0,w:560,h:280}){const b=await svg.boundingBox();await svg.click({position:{x:(p.x-v.x)/v.w*b.width,y:(p.y-v.y)/v.h*b.height}})}
async function pressPoint(activity,n){await activity.getByRole("button",{name:`النقطة ${n}`}).click()}
async function failedTry(a){await a.getByRole("button",{name:"تحقّق من الإنشاء"}).click();await expect(a.getByRole("status")).toContainText("راجع");await a.getByRole("button",{name:"أحتاج تلميحًا"}).click();await expect(a.getByRole("status")).toContainText("تلميح:");await a.getByRole("button",{name:"إعادة المحاولة"}).click();await expect(a.getByRole("status")).toHaveCount(0)}
async function passedTry(a){await a.getByRole("button",{name:"تحقّق من الإنشاء"}).click();await expect(a.getByRole("status")).toContainText("أحسنت!");await a.getByRole("button",{name:"إعادة المحاولة"}).click();await expect(a.getByRole("status")).toHaveCount(0)}
async function placeLinePoints(a,c){for(const[n,x]of [["B",c.B],["S",c.S],["M",c.M],["N",c.N]]){await a.getByRole("button",{name:new RegExp(`^${n}(?: ✓)?$`)}).click();await a.getByRole("button",{name:`موضع ${x}`}).click()}}
async function rays(a,red,blue){await a.getByRole("button",{name:/\[B[AC]\) الأحمر/}).click();await pressPoint(a,red[0]);await pressPoint(a,red[1]);await a.getByRole("button",{name:/\[AB\) الأزرق/}).click();await pressPoint(a,blue[0]);await pressPoint(a,blue[1])}
async function labelIntersections(a,targets,v){const svg=a.locator("svg");for(const name of Object.keys(targets)){await a.getByRole("button",{name:new RegExp(`^${name}(?: ✓)?$`)}).click();await clickTarget(svg,targets[name],v)}}

test.describe("درس 5: كل التفاعلات الهندسية والفروع",()=>{
 for(const width of widths)test(`تحقق كامل على viewport ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});const consoleErrors=[],pageErrors=[];page.on("console",m=>{if(m.type()==="error")consoleErrors.push(m.text())});page.on("pageerror",e=>pageErrors.push(e.message));
  await page.goto(`${base}#discovery`);
  // 1: P وR على المستقيم، M خارجه.
  const rspm=page.getByTestId("geometry-rspm");await expect(rspm).toBeVisible();await expect(rspm.getByRole("button",{name:"تحقّق من الإنشاء"})).toBeDisabled();
  for(const[i,v]of [[0,"تقع على"],[1,"تقع على"],[2,"تقع على"]])await rspm.locator("fieldset").nth(i).getByRole("button",{name:v}).click();await failedTry(rspm);
  for(const[i,v]of [[0,"تقع على"],[1,"تقع على"],[2,"لا تقع على"]])await rspm.locator("fieldset").nth(i).getByRole("button",{name:v}).click();await passedTry(rspm);
  // 2: تحريك B,S,M,N والتحقق من القطعة والمستقيم ونصف المستقيم.
  const absmn=page.getByTestId("geometry-absmn");await expect(absmn.getByRole("button",{name:"تحقّق من الإنشاء"})).toBeDisabled();await placeLinePoints(absmn,{B:310,S:391,M:175,N:391});await failedTry(absmn);await placeLinePoints(absmn,{B:310,S:283,M:175,N:391});await passedTry(absmn);

  await page.goto(`${base}#check`);
  // 3: إنشاء نصفي المستقيمين من المبدأ ونقطة المرور باللون الصحيح.
  const checkRays=page.getByTestId("geometry-check-rays");await expect(checkRays).toBeVisible();await expect(checkRays.getByRole("button",{name:"تحقّق من الإنشاء"})).toBeDisabled();await rays(checkRays,["A","B"],["A","B"]);await failedTry(checkRays);await rays(checkRays,["B","A"],["A","B"]);await passedTry(checkRays);
  // 4: وضع Q خارج d، رسم (AQ),(BQ)، واختيار نقطة التقاطع الصحيحة.
  const cross=page.getByTestId("geometry-check-intersection");await expect(cross.getByRole("button",{name:"تحقّق من الإنشاء"})).toBeDisabled();const qAbove=cross.getByRole("button",{name:"ضع Q فوق (d)"});await qAbove.focus();await page.keyboard.press("Enter");await cross.getByRole("button",{name:"A",exact:true}).click();await failedTry(cross);await cross.getByRole("button",{name:"ضع Q تحت (d)"}).click();await cross.getByRole("button",{name:"Q",exact:true}).click();await passedTry(cross);
  // 5: التعبير الشفهي يظل إدخالًا مفتوحًا لأن له صيغًا صحيحة كثيرة.
  const oral=page.locator(".book-practice").filter({hasText:"تعبير شفهي"});await expect(oral).toHaveCount(1);const inputs=oral.locator("input");await expect(oral.getByRole("button",{name:/تحقّق من إجابتي/})).toBeDisabled();const answers=["ليس له بداية وليس له نهاية، غير محدود","له بداية وليس له نهاية، غير محدود","لها بداية ولها نهاية، محدود"];for(let i=0;i<3;i++)await inputs.nth(i).fill(answers[i]);await oral.getByRole("button",{name:/تحقّق من إجابتي/}).click();await expect(oral.getByRole("status")).toContainText("أكملت تسجيل الفروع المفتوحة");await oral.getByRole("button",{name:"إعادة المحاولة"}).click();for(let i=0;i<3;i++)await expect(inputs.nth(i)).toHaveValue("");

  await page.goto(`${base}#practice`);
  // 6: ترتيب A,B,C ورسم [BC) بالأحمر و[BA) بالأزرق.
  const abc=page.getByTestId("geometry-abc-rays");await expect(abc).toBeVisible();await expect(abc.getByRole("button",{name:"تحقّق من الإنشاء"})).toBeDisabled();await rays(abc,["A","B"],["B","A"]);await failedTry(abc);await rays(abc,["B","C"],["B","A"]);await passedTry(abc);
  // 7: مواضع تقاطعات d/L وL/T وd/T وتسميتها E,F,G.
  const d=page.getByTestId("geometry-dlt");await expect(d.getByRole("button",{name:"تحقّق من الإنشاء"})).toBeDisabled();await labelIntersections(d,{E:dlt.F,F:dlt.E,G:dlt.G});await failedTry(d);await d.getByRole("button",{name:"E",exact:true}).click();await d.getByRole("button",{name:"موضع تقاطع محتمل"}).first().focus();await page.keyboard.press("Enter");await labelIntersections(d,{F:dlt.F,G:dlt.G});await passedTry(d);
  // 8: تقاطعات (AB)/(RP)، (AR)/(BP)، (AP)/(BR) وتسميتها M,N,O.
  const ab=page.getByTestId("geometry-abrp");await expect(ab.getByRole("button",{name:"تحقّق من الإنشاء"})).toBeDisabled();const view={x:0,y:45,w:490,h:310};await labelIntersections(ab,{M:abrp.N,N:abrp.M,O:abrp.O},view);await failedTry(ab);await labelIntersections(ab,abrp,view);await passedTry(ab);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);expect(consoleErrors).toEqual([]);expect(pageErrors).toEqual([]);
 });
});
