import { expect } from "@playwright/test";

export const viewports = [1440, 390, 360];
export const lessonBase = (n) => `/Maths_6_Grade/lessons/lesson-1-${n}/`;

export async function watchErrors(page) {
  const errors = { console: [], page: [] };
  page.on("console", (msg) => { if (msg.type() === "error") errors.console.push(msg.text()); });
  page.on("pageerror", (err) => errors.page.push(err.message));
  return errors;
}

export async function assertNoHorizontalOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

const stageNames = { taheya: "التهيئة", discovery: "اكتشاف المفهوم", learn: "الشرح المفصل", lab: "النشاط / المختبر", check: "تحقق من فهمك", practice: "التطبيق", quiz: "اختبار الدرس", summary: "الملخص", notebook: "دفتر الطالب" };

export async function goToStage(page, lessonNumber, stage, width) {
  await page.goto(lessonBase(lessonNumber));
  await expect(page.locator(".lesson-steps-root")).toBeVisible();
  const nav = width >= 1024 ? page.locator(".lesson-steps-layout aside") : page.locator(".lesson-steps-chrome").first();
  await nav.getByRole("button", { name: new RegExp(stageNames[stage]) }).click();
  await expect(page.locator(`#stage-panel-${stage}`)).toBeVisible();
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
