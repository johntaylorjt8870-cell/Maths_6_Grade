import { expect } from "@playwright/test";

export const BASE = "/Maths_6_Grade";
export const viewports = [1440, 390, 360];
export const lessonBase = (n) => `/Maths_6_Grade/lessons/lesson-1-${n}/`;
export async function watchErrors(page) {
  const errors = { console: [], page: [] };
  page.on("console", (msg) => { if (msg.type() === "error") errors.console.push(msg.text()); });
  page.on("pageerror", (err) => errors.page.push(err.message));
  return errors;
}

export async function assertNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(() => {
    const offenders = [...document.querySelectorAll("body *")]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.right > window.innerWidth + 1 && getComputedStyle(element).position !== "fixed";
      })
      .slice(0, 8)
      .map((element) => ({ tag: element.tagName, className: typeof element.className === "string" ? element.className : "svg", right: Math.round(element.getBoundingClientRect().right), width: Math.round(element.getBoundingClientRect().width) }));
    return { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, offenders };
  });
  expect(metrics.scrollWidth, `horizontal overflow metrics: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(metrics.clientWidth);
}

/** أسماء المراحل كما تُعرض في شريط التنقل — تطابق `src/content/lesson-stages.ts`. */
export const stageNames = { taheya: "التهيئة", discovery: "اكتشاف المفهوم", learn: "الشرح المفصل", lab: "النشاط / المختبر", check: "تحقق من فهمك", practice: "التطبيق", quiz: "اختبار الدرس", summary: "الملخص", notebook: "دفتر الطالب" };

/** شريط المراحل المناسب للعرض: قائمة جانبية على الحاسوب، شريط أفقي على الهاتف. */
export function stageNav(page, width) {
  return width >= 1024 ? page.locator(".lesson-steps-layout aside") : page.locator(".lesson-steps-chrome").first();
}

export async function goToStage(page, lessonNumber, stage, width) {
  await page.goto(lessonBase(lessonNumber));
  await expect(page.locator(".lesson-steps-root")).toBeVisible();
  await stageNav(page, width).getByRole("button", { name: new RegExp(stageNames[stage]) }).click();
  await expect(page.locator(`#stage-panel-${stage}`)).toBeVisible();
}

/** الانتقال بالمعرّف الكامل للدرس — تُستخدمه الاختبارات المدفوعة ببيانات الفهرس. */
export async function goToLessonStage(page, lessonId, stage, width) {
  await page.goto(`${BASE}/lessons/${lessonId}/`);
  await expect(page.locator(".lesson-steps-root")).toBeVisible();
  await stageNav(page, width).getByRole("button", { name: new RegExp(stageNames[stage]) }).first().click();
  await expect(page.locator(`#stage-panel-${stage}`)).toBeVisible();
}

/**
 * ضبط قيمة `<input type="range">` كما يفعل المستخدم.
 * `fill()` لا يدعم مدى الأعداد، والتحديث المباشر لـ`value` لا يُشعر React؛
 * لذلك نستخدم مُعيّن القيمة الأصلي ثم نُطلق حدث `input` كما يتوقعه React.
 */
export async function setRangeInput(locator, value) {
  await locator.evaluate((element, nextValue) => {
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
    descriptor.set.call(element, String(nextValue));
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}

export async function assertNotebookAndPrint(page, lessonTitle, width) {
  await goToStage(page, lessonTitle.number, "notebook", width);
  const notebook = page.locator("section#notebook.notebook-print");
  await expect(notebook).toBeVisible();
  await expect(notebook.locator("p").filter({ hasText: "دفتر الطالب" }).first()).toBeVisible();
  await expect(notebook.getByRole("heading", { level: 2 })).toContainText(lessonTitle.name);
  await expect(notebook.locator(".notebook-group li").first()).toBeVisible();
  const printButton = notebook.getByRole("button", { name: "طباعة الدفتر" });
  await expect(printButton).toBeVisible();
  await page.evaluate(() => { window.__printCalled = false; window.print = () => { window.__printCalled = true; }; });
  await printButton.click();
  await expect.poll(() => page.evaluate(() => window.__printCalled)).toBe(true);
}
