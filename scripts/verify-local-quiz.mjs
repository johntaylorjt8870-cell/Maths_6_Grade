/** Browser regression for per-question quiz feedback. Optional tooling: @playwright/test + @sparticuz/chromium. */
import { chromium } from "@playwright/test";
import bundledChromium from "@sparticuz/chromium";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:4000/Maths_6_Grade";
const out = "test-results/pr5";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: await bundledChromium.executablePath(), args: bundledChromium.args.filter((arg) => arg !== "--single-process"), headless: true });
const errors = [];
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 360, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(`${base}/lessons/lesson-1-2/#quiz`);
    const quiz = page.locator("#quiz");
    const question = quiz.locator("li").first();
    await question.locator('input[type="radio"]').nth(1).check(); // deliberately wrong choice
    await question.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await question.getByRole("status").innerText(), /ليست هذه المرة/);
    assert.equal(await question.getByText("الصحيح", { exact: true }).count(), 0, "must not reveal the correct option");
    await question.getByRole("button", { name: "أعطني تلميحًا" }).click();
    assert.match(await question.getByRole("status").innerText(), /تخيّل المجموعة قبل العدّ/);
    assert.equal(await question.getByText("الصحيح", { exact: true }).count(), 0);
    await page.screenshot({ path: `${out}/quiz-wrong-hint-${viewport.width}.png` });
    await question.getByRole("button", { name: "إعادة المحاولة" }).click();
    assert.equal(await question.locator('input[type="radio"]:checked').count(), 0);
    await question.locator('input[type="radio"]').first().check();
    await question.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await question.getByRole("status").innerText(), /أحسنت/);
    assert.match(await quiz.locator("[aria-label^='تم إنجاز']").getAttribute("aria-label"), /1 من 6/);
    const dims = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
    assert.ok(dims.scroll <= dims.width + 1, `horizontal overflow: ${JSON.stringify(dims)}`);
    await page.goto(`${base}/lessons/lesson-1-1/#taheya`);
    assert.equal(await page.locator(".lesson-stage:not([hidden])").count(), 1);
    const graph = page.getByRole("application", { name: /شبكة إحداثيات/ });
    await graph.scrollIntoViewIfNeeded();
    const rect = await graph.boundingBox();
    await page.mouse.click(rect.x + rect.width * 138 / 392, rect.y + rect.height * 190 / 380); // A(2,3)
    await page.getByRole("button", { name: "تحقق", exact: true }).first().click();
    assert.match(await page.getByRole("status").first().innerText(), /جميع النقاط|النقاط الصحيحة/);
    await page.screenshot({ path: `${out}/coordinate-grid-${viewport.width}.png`, fullPage: true });
    const tableActivity = page.getByRole("region", { name: "جدول عدد الطلاب" });
    const cells = tableActivity.getByLabel(/عدد الطلاب في سنة/);
    for (let i = 0; i < await cells.count(); i++) await cells.nth(i).fill("1");
    await page.getByRole("button", { name: "تحقق", exact: true }).nth(1).click();
    assert.match(await page.getByRole("status").nth(1).innerText(), /الصحيح/);
    await page.screenshot({ path: `${out}/editable-table-${viewport.width}.png`, fullPage: true });
    await page.goto(`${base}/lessons/lesson-1-1/#lab`);
    assert.equal(await page.locator(".lesson-stage:not([hidden])").count(), 1);
    await page.locator(".lesson-stage:not([hidden])").evaluate((el) => el.scrollIntoView({ block: "center" }));
    await page.screenshot({ path: `${out}/graph-lab-${viewport.width}.png`, fullPage: true });
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ pass: true, viewports: [1440, 390, 360], wrongAnswer: true, answerNotRevealed: true, contextualHint: true, retry: true, correctAnswer: true, progress: true, consoleErrors: errors }, null, 2));
} finally { await browser.close(); }
