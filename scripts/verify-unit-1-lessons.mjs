/** Local verification only. Install without saving: npm i --no-save --package-lock=false @playwright/test @sparticuz/chromium */
import { chromium } from "@playwright/test";
import bundledChromium from "@sparticuz/chromium";
import { mkdir, writeFile, access } from "node:fs/promises";
import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:4000/Maths_6_Grade";
const folder = "test-results/unit-1";
await mkdir(folder, {recursive:true});
const browser = await chromium.launch({executablePath:await bundledChromium.executablePath(), args:bundledChromium.args.filter(arg => arg !== "--single-process"), headless:true});
const errors=[], results=[];
const correct={2:[0,1,1,1,2,1],3:[1,0,1,1,0,1],4:[1,0,1,1,1,1],5:[0,1,2,1,2,0],6:[0,0,1,0,0,1]};
const stages=["taheya","discovery","learn","lab","check","practice","quiz","summary","notebook"];
const context=await browser.newContext({baseURL:base,viewport:{width:1440,height:1000}});
const page=await context.newPage();
page.on("pageerror", e=>errors.push(e.message));
page.on("console", m=>{if(m.type()==="error")errors.push(m.text());});
const visible=()=>page.locator('.lesson-stage:not([hidden])');
async function open(n,stage){await page.goto("about:blank");await page.goto(`${base}/lessons/lesson-1-${n}/#${stage}`);await page.waitForFunction(s=>document.querySelector(`.lesson-stage:not([hidden]) #${s}`),stage);await page.evaluate(()=>document.fonts.ready);}
try {
 for(const n of (process.env.LESSONS ?? "2,3,4,5,6").split(",").map(Number)) {
  console.log(`Testing lesson ${n}`);
  await access(`out/lessons/lesson-1-${n}/index.html`);
  for(const stage of stages){await open(n,stage);assert.equal(await visible().count(),1);assert.equal(await page.locator('.katex-error').count(),0);assert.equal(await page.getByText(/غير مسجّل:/).count(),0);}
  await open(n,"taheya");await page.getByRole('button',{name:'إتمام المرحلة',exact:true}).click();
  await page.waitForFunction(n=>JSON.parse(localStorage.getItem(`lesson-steps:lesson-1-${n}`)).completed.includes('taheya'),n);
  await page.getByRole('button',{name:'المرحلة التالية',exact:true}).click();assert.ok(page.url().endsWith('#discovery'));
  await page.getByRole('button',{name:'المرحلة السابقة',exact:true}).click();assert.ok(page.url().endsWith('#taheya'));
  for(const stage of ['quiz','notebook']) {await open(n,stage);await page.waitForLoadState("networkidle");await page.reload({waitUntil:"networkidle"});await page.waitForFunction(s=>document.querySelector(`.lesson-stage:not([hidden]) #${s}`),stage);assert.ok((await page.evaluate(n=>JSON.parse(localStorage.getItem(`lesson-steps:lesson-1-${n}`)),n)).completed.includes('taheya'));}
  await open(n,'lab');const lab=page.locator(`[data-lab="${n}"]`);
  assert.match(await lab.getByRole('status').innerText(),/تظهر/);
  if(n===2){await lab.getByLabel('عدد الأشياء',{exact:true}).fill('7');assert.equal(await lab.locator('svg[role="img"] circle').count(),7);await lab.getByLabel('تعبير التصنيف').selectOption('1');await lab.getByRole('button',{name:'ليس عددًا طبيعيًا',exact:true}).click();assert.match(await lab.getByRole('status').innerText(),/حاول/);await lab.getByRole('button',{name:'عدد طبيعي',exact:true}).click();}
  if(n===3){await lab.getByLabel('قيمة الرقم المتوقعة').fill('1');await lab.getByRole('button',{name:'تحقق',exact:true}).click();assert.match(await lab.getByRole('status').innerText(),/ليست/);await lab.getByLabel('قيمة الرقم المتوقعة').fill('9000000');await lab.getByRole('button',{name:'تحقق',exact:true}).click();}
  if(n===4){await lab.getByLabel('ناتج التقريب المتوقع').fill('1');await lab.getByRole('button',{name:'تحقق',exact:true}).click();assert.match(await lab.getByRole('status').innerText(),/راجع/);await lab.getByLabel('ناتج التقريب المتوقع').fill('503700000');await lab.getByRole('button',{name:'تحقق',exact:true}).click();}
  if(n===5){await lab.getByLabel('موضع M').fill('100');await lab.getByRole('button',{name:'تنتمي',exact:true}).click();assert.match(await lab.getByRole('status').innerText(),/راجع/);await lab.getByRole('button',{name:'لا تنتمي',exact:true}).click();await lab.getByLabel('نوع الشكل').selectOption('line');await lab.getByRole('button',{name:'تنتمي',exact:true}).click();}
  if(n===6){await lab.getByLabel('زاوية الدوران').fill('90');await lab.getByRole('button',{name:'متوازيان',exact:true}).click();assert.match(await lab.getByRole('status').innerText(),/أعد/);await lab.getByRole('button',{name:'متعامدان',exact:true}).click();}
  assert.match(await lab.getByRole('status').innerText(),/صحيح/);
  await open(n,'quiz');const quiz=page.locator('#quiz');assert.equal(await quiz.locator('input[type="radio"]').count(),18);assert.ok(await quiz.getByRole('button',{name:'تصحيح الإجابات'}).isDisabled());
  for(let i=0;i<6;i++)await quiz.locator(`input[name="u1${n}q${i+1}"][value="${correct[n][i]}"]`).check();
  await quiz.getByRole('button',{name:'تصحيح الإجابات'}).click();assert.match(await quiz.getByRole('status').innerText(),/100%/);
  await quiz.getByRole('button',{name:'إعادة المحاولة'}).click();assert.equal(await quiz.locator('input:checked').count(),0);
  for(let i=0;i<6;i++)await quiz.locator(`input[name="u1${n}q${i+1}"][value="${(correct[n][i]+1)%3}"]`).check();
  await quiz.getByRole('button',{name:'تصحيح الإجابات'}).click();assert.match(await quiz.getByRole('status').innerText(),/0 \/ 6/);
  await open(n,'notebook');await page.screenshot({path:`${folder}/lesson-${n}-desktop.png`});
  await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('.lesson-steps-chrome:visible').count(),0);
  const overflow=await page.locator('#notebook table, #notebook .math-block, #notebook svg').evaluateAll(nodes=>nodes.filter(e=>e.scrollWidth>e.clientWidth+3).map(e=>({tag:e.tagName,text:e.textContent.slice(0,100),client:e.clientWidth,scroll:e.scrollWidth})));
  await page.pdf({path:`${folder}/lesson-${n}-notebook.pdf`,format:'A4',preferCSSPageSize:true,printBackground:true});
  await page.emulateMedia({media:'screen'});
  for(const width of [390,360]){await page.setViewportSize({width,height:844});for(const stage of stages){await open(n,stage);const size=await page.evaluate(()=>({w:innerWidth,s:document.documentElement.scrollWidth}));assert.ok(size.s<=size.w+1,`horizontal overflow ${n}/${stage} ${JSON.stringify(size)}`);}await page.screenshot({path:`${folder}/lesson-${n}-mobile-${width}.png`});}
  await page.setViewportSize({width:1440,height:1000});
  results.push({lesson:n,stages:9,quizQuestions:6,allCorrect:'100%',allWrong:'0%',pdf:`lesson-${n}-notebook.pdf`,printOverflow:overflow});
 }
 await page.goto(`${base}/curriculum/unit-1/`);
 for(let n=2;n<=6;n++){const a=page.locator(`a[href="/Maths_6_Grade/lessons/lesson-1-${n}/"]`).first();assert.ok(await a.count());const response=await page.request.get(await a.getAttribute('href'));assert.equal(response.status(),200);}
 const links=await page.locator('a[href^="/Maths_6_Grade"]').evaluateAll(as=>[...new Set(as.map(a=>a.href.split('#')[0]))]);
 for(const href of links){const r=await page.request.get(href);assert.equal(r.status(),200,href);}
 assert.deepEqual(errors,[]);
 await writeFile(`${folder}/browser-results-${process.env.LESSONS ?? "all"}.json`,JSON.stringify({results,consoleErrors:errors,internalLinksChecked:links.length},null,2));
 console.log(JSON.stringify({results,consoleErrors:errors,internalLinksChecked:links.length},null,2));
} catch(error) {console.log("FAIL",page.url(),errors, await page.locator(".lesson-stage:not([hidden])").getAttribute("aria-label"));await page.screenshot({path:`${folder}/failure.png`});throw error;} finally {await browser.close();}
