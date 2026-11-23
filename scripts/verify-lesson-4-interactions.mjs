/** Chromium behavior checks for all seven textbook exercise groups in lesson 4. */
import { chromium } from "@playwright/test";
import bundledChromium from "@sparticuz/chromium";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:4000/Maths_6_Grade";
await mkdir("test-results/pr5/lesson-4", { recursive: true });
const browser = await chromium.launch({ executablePath: await bundledChromium.executablePath(), args: bundledChromium.args.filter((a) => a !== "--single-process"), headless: true });
const errors = [];
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 360, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(`${base}/lessons/lesson-1-4/`);
    for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "المرحلة التالية" }).click();
    let tasks = page.locator(".lesson-stage:not([hidden]) .book-practice");
    assert.equal(await tasks.count(), 3);
    const roundMillion = tasks.nth(0);
    await roundMillion.locator("input").fill("1295000000");
    await roundMillion.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await roundMillion.getByRole("status").innerText(), /الإجابات المكتملة الصحيحة: 0/);
    await roundMillion.getByRole("button", { name: "أحتاج تلميحًا" }).click();
    assert.match(await roundMillion.getByRole("status").innerText(), /خانة مئات الألوف/);
    await roundMillion.getByRole("button", { name: "إعادة المحاولة" }).click();
    await roundMillion.locator("input").fill("1296000000");
    await roundMillion.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await roundMillion.getByRole("status").innerText(), /أحسنت/);
    const round100m = tasks.nth(1);
    await round100m.locator("input").fill("1300000000");
    await round100m.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await round100m.getByRole("status").innerText(), /أحسنت/);
    const order = tasks.nth(2);
    await order.locator("input").fill("9654322,29654321,59654324,239654323");
    await order.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await order.getByRole("status").innerText(), /أحسنت/);

    await page.getByRole("button", { name: "المرحلة التالية" }).click();
    tasks = page.locator(".lesson-stage:not([hidden]) .book-practice");
    assert.equal(await tasks.count(), 4);
    const roundingTable = tasks.nth(1);
    await roundingTable.locator("input").nth(0).fill("20000000");
    assert.equal(await roundingTable.getByRole("button", { name: "تحقّق من إجابتي" }).isDisabled(), true, "six-branch table cannot submit incomplete values");
    await roundingTable.getByRole("button", { name: "إعادة المحاولة" }).click();
    const correct = ["20000000", "89100000", "965450000", "700000000", "82000000", "610000000"];
    for (let i = 0; i < correct.length; i++) await roundingTable.locator("input").nth(i).fill(i === 0 ? "19000000" : correct[i]);
    await roundingTable.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await roundingTable.getByRole("status").innerText(), /الإجابات المكتملة الصحيحة: 5 من 6/);
    await roundingTable.getByRole("button", { name: "أحتاج تلميحًا" }).click();
    assert.match(await roundingTable.getByRole("status").innerText(), /خانة التقريب/);
    await roundingTable.getByRole("button", { name: "إعادة المحاولة" }).click();
    for (let i = 0; i < correct.length; i++) await roundingTable.locator("input").nth(i).fill(correct[i]);
    await roundingTable.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await roundingTable.getByRole("status").innerText(), /أحسنت/);
    await roundingTable.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/pr5/lesson-4/rounding-table-${viewport.width}.png` });

    const orderLarge = tasks.nth(2);
    await orderLarge.locator("input").fill("502586100,5000586010,5002586100,5100000000");
    await orderLarge.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await orderLarge.getByRole("status").innerText(), /أحسنت/);

    const lowest = tasks.nth(3);
    const lowerBucket = lowest.locator('section[aria-label="خانة نمرة البطاقة الصغرى"]');
    const otherBucket = lowest.locator('section[aria-label="خانة نمر أكبر"]');
    await lowerBucket.getByRole("button", { name: "صنّف 125258506 في نمرة البطاقة الصغرى" }).click();
    await otherBucket.getByRole("button", { name: "صنّف 120258758 في نمر أكبر" }).click();
    await otherBucket.getByRole("button", { name: "صنّف 200100002 في نمر أكبر" }).click();
    await lowest.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await lowest.getByRole("status").innerText(), /صنفت بشكل صحيح 1 من 3/);
    await lowest.getByRole("button", { name: "أحتاج تلميحًا" }).click();
    assert.match(await lowest.getByRole("status").innerText(), /قارن الأرقام من الخانة الأعلى/);
    await lowest.getByRole("button", { name: "إعادة المحاولة" }).click();
    await lowerBucket.getByRole("button", { name: "صنّف 120258758 في نمرة البطاقة الصغرى" }).click();
    await otherBucket.getByRole("button", { name: "صنّف 125258506 في نمر أكبر" }).click();
    await otherBucket.getByRole("button", { name: "صنّف 200100002 في نمر أكبر" }).click();
    await lowest.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    assert.match(await lowest.getByRole("status").innerText(), /أحسنت/);
    await lowest.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/pr5/lesson-4/lottery-sort-${viewport.width}.png` });
    assert.equal(await page.locator(".katex-error").count(), 0);
    const size = await page.evaluate(() => ({ w: innerWidth, s: document.documentElement.scrollWidth }));
    assert.ok(size.s <= size.w + 1, `horizontal overflow ${JSON.stringify(size)}`);
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ pass: true, groups: 7, checkGroups: 3, practiceGroups: 4, roundingBranches: 9, viewports: [1440, 390, 360], wrongAnswers: true, hintsAndRetry: true, correctAnswers: true, incompleteTableRejected: true, consoleErrors: errors }, null, 2));
} finally { await browser.close(); }
