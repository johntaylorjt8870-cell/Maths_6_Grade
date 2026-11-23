/** Browser checks for all eight textbook exercise groups transformed in lesson 2. */
import { chromium } from "@playwright/test";
import bundledChromium from "@sparticuz/chromium";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:4000/Maths_6_Grade";
await mkdir("test-results/pr5/lesson-2", { recursive: true });
const browser = await chromium.launch({ executablePath: await bundledChromium.executablePath(), args: bundledChromium.args.filter((a) => a !== "--single-process"), headless: true });
const errors = [];
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 360, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(`${base}/lessons/lesson-1-2/`);
    for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "المرحلة التالية" }).click();
    const tasks = page.locator(".lesson-stage:not([hidden]) .book-practice");
    assert.equal(await tasks.count(), 3, "check stage has all three source prompts interactive");
    const numberline = tasks.nth(0);
    await numberline.getByRole("button", { name: "0", exact: true }).click();
    await numberline.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await numberline.getByRole("status").innerText(), /اخترت/);
    await numberline.getByRole("button", { name: "أحتاج تلميحًا" }).click();
    assert.match(await numberline.getByRole("status").innerText(), /لا تضمّ الحدين/);
    await numberline.getByRole("button", { name: "إعادة المحاولة" }).click();
    for (let n = 1; n < 15; n++) await numberline.getByRole("button", { name: String(n), exact: true }).click();
    await numberline.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await numberline.getByRole("status").innerText(), /أحسنت/);
    await numberline.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/pr5/lesson-2/number-line-${viewport.width}.png` });

    const classify = tasks.nth(1);
    const natural = classify.locator('section[aria-label="خانة عدد طبيعي"]');
    const notNatural = classify.locator('section[aria-label="خانة ليس عددًا طبيعيًا"]');
    await natural.locator("button").filter({ hasText: /187932/ }).first().click();
    await notNatural.locator("button").filter({ hasText: /158/ }).first().click();
    await notNatural.locator("button").filter({ hasText: /48.3/ }).first().click();
    await classify.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await classify.getByRole("status").innerText(), /أحسنت/);
    await classify.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/pr5/lesson-2/classification-${viewport.width}.png` });

    const reflection = tasks.nth(2);
    await reflection.locator("textarea").fill("عدّ الكتب في المكتبة");
    await reflection.getByRole("button", { name: "حفظ فكرتي في النشاط" }).click();
    assert.match(await reflection.getByRole("status").innerText(), /تم حفظ فكرتك/);

    await page.getByRole("button", { name: "المرحلة التالية" }).click();
    const practiceTasks = page.locator(".lesson-stage:not([hidden]) .book-practice");
    assert.equal(await practiceTasks.count(), 5, "practice stage has all five groups interactive");
    const practiceLine = practiceTasks.nth(0);
    for (const n of [200, 210]) await practiceLine.getByRole("button", { name: String(n), exact: true }).click();
    await practiceLine.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await practiceLine.getByRole("status").innerText(), /اخترت/);
    await practiceLine.getByRole("button", { name: "أحتاج تلميحًا" }).click();
    assert.match(await practiceLine.getByRole("status").innerText(), /استبعد طرفي المجال/);
    await practiceLine.getByRole("button", { name: "إعادة المحاولة" }).click();
    for (let n = 201; n < 210; n++) await practiceLine.getByRole("button", { name: String(n), exact: true }).click();
    await practiceLine.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await practiceLine.getByRole("status").innerText(), /أحسنت/);
    await practiceLine.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/pr5/lesson-2/practice-number-line-${viewport.width}.png` });

    const practiceClassify = practiceTasks.nth(1);
    const bucket = (name) => practiceClassify.locator(`section[aria-label="خانة ${name}"]`);
    const move = async (category, item) => bucket(category).getByRole("button", { name: `صنّف ${item} في ${category}`, exact: true }).click();
    await move("عدد طبيعي", "$258.32$");
    for (const [category, item] of [["عدد طبيعي", "$8$"], ["عدد طبيعي", "$2369870$"], ["كسر", "$\\frac{15587}{8369}$"], ["عدد طبيعي", "$0$"], ["عدد طبيعي", "$10000$"]]) await move(category, item);
    assert.equal(await practiceClassify.getByRole("button", { name: "تحقّق من إجابتي" }).isEnabled(), false, "must refuse classification while an item is still unassigned");
    await move("عدد عشري", "$0.3$");
    await practiceClassify.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await practiceClassify.getByRole("status").innerText(), /صنفت بشكل صحيح 6 من 7/);
    await practiceClassify.getByRole("button", { name: "أحتاج تلميحًا" }).click();
    assert.match(await practiceClassify.getByRole("status").innerText(), /كسر مكتوب|كسر/);
    await practiceClassify.getByRole("button", { name: "إعادة المحاولة" }).click();
    for (const [category, item] of [["عدد طبيعي", "$8$"], ["عدد عشري", "$258.32$"], ["عدد طبيعي", "$2369870$"], ["كسر", "$\\frac{15587}{8369}$"], ["عدد طبيعي", "$0$"], ["عدد طبيعي", "$10000$"], ["عدد عشري", "$0.3$"]]) await move(category, item);
    await practiceClassify.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await practiceClassify.getByRole("status").innerText(), /أحسنت/);
    await practiceClassify.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/pr5/lesson-2/practice-classification-${viewport.width}.png` });

    const sets = practiceTasks.nth(2);
    await sets.locator("input").fill("1,2,3,5");
    await sets.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await sets.getByRole("status").innerText(), /لم تكتمل/);
    await sets.getByRole("button", { name: "أحتاج تلميحًا" }).click();
    assert.match(await sets.getByRole("status").innerText(), /أربع قيم متتالية/);
    await sets.getByRole("button", { name: "إعادة المحاولة" }).click();
    await sets.locator("input").fill("1، 2، 3، 4");
    await sets.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await sets.getByRole("status").innerText(), /أحسنت/);

    const digitSum = practiceTasks.nth(3);
    await digitSum.locator("input").fill("1248,1251,1254,1257,1260,1263");
    await digitSum.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await digitSum.getByRole("status").innerText(), /أحسنت/);
    const evens = practiceTasks.nth(4);
    await evens.locator("input").fill("1002,1004,1006,1008,1010,1012,1014,1016,1018,1020");
    await evens.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await evens.getByRole("status").innerText(), /أحسنت/);
    const size = await page.evaluate(() => ({ w: innerWidth, s: document.documentElement.scrollWidth }));
    assert.ok(size.s <= size.w + 1, `horizontal overflow ${JSON.stringify(size)}`);
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ pass: true, groups: 8, viewports: [1440, 390, 360], numberLineCorrectAndWrong: true, classify: true, setAnswerAndHintRetry: true, openReflection: true, consoleErrors: errors }, null, 2));
} finally { await browser.close(); }
