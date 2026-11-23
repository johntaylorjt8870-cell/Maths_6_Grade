/** Chromium behavior checks for all 15 textbook exercise groups and their subparts in lesson 3. */
import { chromium } from "@playwright/test";
import bundledChromium from "@sparticuz/chromium";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:4000/Maths_6_Grade";
await mkdir("test-results/pr5/lesson-3", { recursive: true });
const browser = await chromium.launch({ executablePath: await bundledChromium.executablePath(), args: bundledChromium.args.filter((a) => a !== "--single-process"), headless: true });
const errors = [];
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 360, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(`${base}/lessons/lesson-1-3/`);
    for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "المرحلة التالية" }).click();
    let tasks = page.locator(".lesson-stage:not([hidden]) .book-practice");
    assert.equal(await tasks.count(), 3, "check: all three numbered groups are interactive");
    const classify = tasks.nth(0);
    await classify.locator('section[aria-label="خانة كتابة صحيحة"] button').filter({ hasText: /لبنى/ }).first().click();
    await classify.locator('section[aria-label="خانة كتابة غير صحيحة"] button').filter({ hasText: /باسم/ }).first().click();
    await classify.locator('section[aria-label="خانة كتابة غير صحيحة"] button').filter({ hasText: /ماهر/ }).first().click();
    await classify.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await classify.getByRole("status").innerText(), /صنفت بشكل صحيح 1 من 3/);
    await classify.getByRole("button", { name: "أحتاج تلميحًا" }).click();
    assert.match(await classify.getByRole("status").innerText(), /جزّئ العدد إلى حلقات/);
    await classify.getByRole("button", { name: "إعادة المحاولة" }).click();
    await classify.locator('section[aria-label="خانة كتابة صحيحة"] button').filter({ hasText: /ماهر/ }).first().click();
    for (const name of [/لبنى/, /باسم/]) await classify.locator('section[aria-label="خانة كتابة غير صحيحة"] button').filter({ hasText: name }).first().click();
    await classify.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await classify.getByRole("status").innerText(), /أحسنت/);
    await classify.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/pr5/lesson-3/classification-${viewport.width}.png` });

    const missing = tasks.nth(1);
    const oneField = missing.locator("input").first();
    await oneField.fill("1");
    assert.equal(await missing.getByRole("button", { name: "تحقّق من إجابتي" }).isDisabled(), false);
    await missing.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await missing.getByRole("status").innerText(), /الإجابات المكتملة الصحيحة/);
    await missing.getByRole("button", { name: "أحتاج تلميحًا" }).click();
    assert.match(await missing.getByRole("status").innerText(), /اطرح مجموع الحدود/);
    await missing.getByRole("button", { name: "إعادة المحاولة" }).click();
    await missing.locator("input").fill("300000");
    await missing.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await missing.getByRole("status").innerText(), /أحسنت/);

    const checkMulti = tasks.nth(2);
    const checkAnswers = ["907557002", "0 | 907 | 557 | 002", "900000000+7000000+500000+50000+7000+2"];
    for (let i = 0; i < checkAnswers.length; i++) await checkMulti.locator("input").nth(i).fill(checkAnswers[i]);
    await checkMulti.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await checkMulti.getByRole("status").innerText(), /أحسنت/);

    await page.getByRole("button", { name: "المرحلة التالية" }).click();
    tasks = page.locator(".lesson-stage:not([hidden]) .book-practice");
    assert.equal(await tasks.count(), 12, "practice: all 12 numbered groups are interactive");
    const incomplete = tasks.nth(1);
    await incomplete.locator("input").first().fill("300000");
    assert.equal(await incomplete.getByRole("button", { name: "تحقّق من إجابتي" }).isDisabled(), true, "form does not submit with missing subparts");
    await incomplete.getByRole("button", { name: "إعادة المحاولة" }).click();
    const answers = [
      ["خمسون مليونًا ومئة وخمسة وعشرون ألفًا وثلاثمئة وستة وعشرون", "خمسة مليارات وتسعمئة وتسعة وعشرون مليونًا وخمسمئة واثنان وتسعون ألفًا وثلاثون", "ملياران وسبعمئة وأربعة وخمسون مليونًا ومئتان وثلاثة آلاف وتسعمئة وخمسة عشر", "ملياران وخمسة"],
      ["300440510", "1007700700", "4007715070", "908700000"],
      ["مليار وأربعة ملايين وخمسمئة ألف", "مليار وأربعمئة وثلاثة وعشرون مليونًا وخمسمئة وتسعة وستون ألفًا وسبعمئة"],
      ["6370000"],
      ["5", "700000", "8", "200000000", "9", "4000000000"],
      ["50000000", "400000", "900000000", "20000000", "1000000"],
      ["5000000000+40000000+500000+30000+4000+500+60", "خمسة مليارات وأربعمئة وخمسة ملايين وثلاثمئة وخمسة وأربعون ألفًا وستة آلاف"],
      ["60000000"],
      ["5305707", "500305707"],
      ["301203"],
      ["5000000", "10"],
      ["14999992"],
    ];
    const puzzle = tasks.nth(9);
    await puzzle.locator("input").fill("123");
    await puzzle.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await puzzle.getByRole("status").innerText(), /ست خانات/);
    await puzzle.getByRole("button", { name: "إعادة المحاولة" }).click();
    await puzzle.locator("input").fill("200123");
    await puzzle.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await puzzle.getByRole("status").innerText(), /مئات الألوف يجب أن يكون 3/);
    await puzzle.getByRole("button", { name: "إعادة المحاولة" }).click();
    await puzzle.locator("input").fill("300122");
    await puzzle.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await puzzle.getByRole("status").innerText(), /الآحاد يجب أن يكون 3/);
    await puzzle.getByRole("button", { name: "إعادة المحاولة" }).click();
    await puzzle.locator("input").fill("300113");
    await puzzle.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await puzzle.getByRole("status").innerText(), /مجموع رقمي خانة آحاد الألوف والمئات/);
    await puzzle.getByRole("button", { name: "أحتاج تلميحًا" }).click();
    assert.match(await puzzle.getByRole("status").innerText(), /اختر رقمي آحاد الألوف والمئات/);
    await puzzle.getByRole("button", { name: "إعادة المحاولة" }).click();
    await puzzle.locator("input").fill("301203");
    await puzzle.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await puzzle.getByRole("status").innerText(), /تحقق العدد من عدد الخانات/);
    await puzzle.getByRole("button", { name: "إعادة المحاولة" }).click();
    await puzzle.locator("input").fill("302103");
    await puzzle.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await puzzle.getByRole("status").innerText(), /تحقق العدد من عدد الخانات/);

    const wrongGroup = tasks.nth(3);
    await wrongGroup.locator("input").fill("1");
    await wrongGroup.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await wrongGroup.getByRole("status").innerText(), /الإجابات المكتملة الصحيحة: 0/);
    await wrongGroup.getByRole("button", { name: "أحتاج تلميحًا" }).click();
    assert.match(await wrongGroup.getByRole("status").innerText(), /ستة ملايين وثلاثمئة وسبعون ألفًا/);
    await wrongGroup.getByRole("button", { name: "إعادة المحاولة" }).click();
    for (let g = 0; g < answers.length; g++) {
      const task = tasks.nth(g);
      const values = answers[g];
      for (let f = 0; f < values.length; f++) await task.locator("input").nth(f).fill(values[f]);
      await task.getByRole("button", { name: "تحقّق من إجابتي" }).click();
      if ([0, 2, 6].includes(g)) assert.match(await task.getByRole("status").innerText(), /أكملت تسجيل الفروع المفتوحة/ , `open response group ${g + 1}`);
      else assert.match(await task.getByRole("status").innerText(), /أحسنت/ , `practice group ${g + 1}`);
    }
    await tasks.nth(4).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/pr5/lesson-3/place-table-${viewport.width}.png` });
    const size = await page.evaluate(() => ({ w: innerWidth, s: document.documentElement.scrollWidth }));
    assert.ok(size.s <= size.w + 1, `horizontal overflow ${JSON.stringify(size)}`);
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ pass: true, groups: 15, responseFields: 35, classificationItems: 3, viewports: [1440, 390, 360], wrongAnswers: true, hintsAndRetry: true, correctAnswers: true, openResponseAcknowledgedWithoutFalseGrading: true, consoleErrors: errors }, null, 2));
} finally { await browser.close(); }
