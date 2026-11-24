import { test, expect } from "@playwright/test";
import { goToStage } from "./lesson-e2e-helpers.mjs";

const widths = [1440, 390, 360];

async function assertFeedbackCycle(activity, makeWrong, makeRight) {
  const check = activity.getByRole("button", { name: "تحقّق من الإنشاء" });
  await expect(check).toBeDisabled({ timeout: 4_000 });
  await makeWrong();
  await expect(check).toBeEnabled({ timeout: 4_000 });
  await check.click({ timeout: 4_000 });
  await expect(activity.getByRole("status").last()).toContainText("راجع", { timeout: 4_000 });
  await activity.getByRole("button", { name: "أحتاج تلميحًا" }).click({ timeout: 4_000 });
  await expect(activity.getByRole("status").last()).toContainText("تلميح:", { timeout: 4_000 });
  await activity.getByRole("button", { name: "إعادة المحاولة" }).click({ timeout: 4_000 });
  await expect(check).toBeDisabled({ timeout: 4_000 });
  await makeRight();
  await check.click({ timeout: 4_000 });
  await expect(activity.getByRole("status").last()).toContainText("أحسنت!", { timeout: 4_000 });
  await activity.getByRole("button", { name: "إعادة المحاولة" }).click({ timeout: 4_000 });
  await expect(check).toBeDisabled({ timeout: 4_000 });
}

async function choosePair(activity, sectionIndex, categoryIndex, label) {
  await activity.locator("section").nth(sectionIndex).locator("fieldset").nth(categoryIndex).getByRole("button", { name: label, exact: true }).click({ timeout: 4_000 });
}

async function drawLine(activity, start, end) {
  const svg = activity.locator('svg[role="application"]');
  const box = await svg.boundingBox();
  for (const [x, y] of [start, end]) await svg.click({ position: { x: (x / 280) * box.width, y: (y / 150) * box.height } });
}

test.describe("الدرس السادس — التعامد والتوازي، تفاعلات الكتاب", () => {
  for (const width of widths) test(`الأنشطة والفروع على عرض ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const consoleErrors = [], pageErrors = [];
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await goToStage(page, 6, "discovery", width);
    const shapes = page.getByTestId("parallel-practice-parallel-shapes");
    await assertFeedbackCycle(shapes,
      async () => {
        await choosePair(shapes, 0, 0, "(AB) و(BC)");
        await choosePair(shapes, 0, 1, "(AB) و(BC)");
        await choosePair(shapes, 0, 2, "(AB) و(CD)");
        await choosePair(shapes, 1, 0, "(HM) و(PN)");
        await choosePair(shapes, 1, 1, "(HP) و(PM)");
        await choosePair(shapes, 1, 2, "(HN) و(PM)");
      },
      async () => {
        await choosePair(shapes, 0, 0, "(AC) و(BD)");
        await choosePair(shapes, 0, 1, "(AC) و(BD)");
        await choosePair(shapes, 0, 2, "(AD) و(BC)");
        await choosePair(shapes, 1, 0, "(HN) و(NM)");
        await choosePair(shapes, 1, 1, "(HN) و(NM)");
        await choosePair(shapes, 1, 2, "(HP) و(NM)");
      });

    const point = page.getByTestId("parallel-practice-parallel-point");
    await assertFeedbackCycle(point,
      async () => point.getByRole("button", { name: "خارج (d)" }).click({ timeout: 4_000 }),
      async () => point.getByRole("button", { name: "على (d) وخارج القطعة [AB]" }).click({ timeout: 4_000 }));

    const mcq = page.getByTestId("parallel-practice-parallel-mcq");
    await assertFeedbackCycle(mcq,
      async () => {
        await mcq.getByRole("group", { name: "أ — المستقيمان المتقاطعان" }).getByRole("button", { name: "يشتركان بنقطتين" }).click({ timeout: 4_000 });
        await mcq.getByRole("group", { name: "ب — المستقيمان المرسومان" }).getByRole("button", { name: "غير متقاطعين" }).click({ timeout: 4_000 });
      },
      async () => {
        await mcq.getByRole("group", { name: "أ — المستقيمان المتقاطعان" }).getByRole("button", { name: "يشتركان في نقطة واحدة" }).click({ timeout: 4_000 });
        await mcq.getByRole("group", { name: "ب — المستقيمان المرسومان" }).getByRole("button", { name: "متقاطعان" }).click({ timeout: 4_000 });
      });

    await goToStage(page, 6, "lab", width);
    const labPair = page.getByTestId("parallel-practice-parallel-lab-pair");
    await assertFeedbackCycle(labPair,
      async () => {
        await drawLine(labPair.getByTestId("construction-perpendicular-2"), [70, 35], [200, 35]);
        await drawLine(labPair.getByTestId("construction-parallel-2"), [130, 12], [130, 140]);
      },
      async () => {
        await drawLine(labPair.getByTestId("construction-perpendicular-2"), [130, 12], [130, 140]);
        await drawLine(labPair.getByTestId("construction-parallel-2"), [70, 100], [210, 100]);
      });
    const labPoint = page.getByTestId("parallel-practice-parallel-lab-point");
    await assertFeedbackCycle(labPoint,
      async () => drawLine(labPoint, [70, 28], [200, 28]),
      async () => drawLine(labPoint, [130, 12], [130, 105]));

    await goToStage(page, 6, "learn", width);
    const methodPerp = page.getByTestId("parallel-practice-parallel-lab-point");
    await assertFeedbackCycle(methodPerp,
      async () => drawLine(methodPerp, [70, 28], [200, 28]),
      async () => drawLine(methodPerp, [130, 12], [130, 105]));
    const methodParallel = page.getByTestId("parallel-practice-parallel-lab-parallel-point");
    await assertFeedbackCycle(methodParallel,
      async () => drawLine(methodParallel, [130, 12], [130, 140]),
      async () => drawLine(methodParallel, [70, 28], [200, 28]));

    await goToStage(page, 6, "check", width);
    const relations = page.getByTestId("parallel-practice-parallel-relations");
    await expect(relations.getByRole("button", { name: "تحقّق من الإنشاء" })).toBeDisabled();
    for (const r of ["(d) ⟂ (L)", "(d) ⟂ (M)", "(T) ⟂ (L)", "(T) ⟂ (M)", "(L) ∥ (M)"]) await relations.getByLabel(r).check({ timeout: 4_000 });
    await relations.getByRole("button", { name: "تحقّق من الإنشاء" }).click({ timeout: 4_000 });
    await expect(relations.getByRole("status")).toContainText("راجع");
    await relations.getByRole("button", { name: "أحتاج تلميحًا" }).click({ timeout: 4_000 });
    await expect(relations.getByRole("status")).toContainText("تلميح:");
    await relations.getByRole("button", { name: "إعادة المحاولة" }).click({ timeout: 4_000 });
    for (const r of ["(d) ⟂ (L)", "(d) ⟂ (M)", "(T) ⟂ (L)", "(T) ⟂ (M)", "(L) ∥ (M)", "(d) ∥ (T)"]) await relations.getByLabel(r).check({ timeout: 4_000 });
    await relations.getByRole("button", { name: "تحقّق من الإنشاء" }).click({ timeout: 4_000 });
    await expect(relations.getByRole("status")).toContainText("أحسنت!");

    await goToStage(page, 6, "practice", width);
    const reason1 = page.getByTestId("parallel-practice-parallel-reason-1");
    await assertFeedbackCycle(reason1,
      async () => {
        await reason1.locator("fieldset").nth(0).getByRole("button", { name: "متعامدان" }).click({ timeout: 4_000 });
        await reason1.locator("fieldset").nth(1).getByRole("button", { name: "تعريف المستقيمين المتقاطعين" }).click({ timeout: 4_000 });
      },
      async () => {
        await reason1.locator("fieldset").nth(0).getByRole("button", { name: "متوازيان" }).click({ timeout: 4_000 });
        await reason1.locator("fieldset").nth(1).getByRole("button", { name: "المستقيمان العموديان على مستقيم ثالث متوازيان" }).click({ timeout: 4_000 });
      });
    const reason2 = page.getByTestId("parallel-practice-parallel-reason-2");
    await assertFeedbackCycle(reason2,
      async () => {
        await reason2.locator("fieldset").nth(0).getByRole("button", { name: "متعامدان" }).click({ timeout: 4_000 });
        await reason2.locator("fieldset").nth(1).getByRole("button", { name: "تعريف المستقيمين المتقاطعين" }).click({ timeout: 4_000 });
      },
      async () => {
        await reason2.locator("fieldset").nth(0).getByRole("button", { name: "متوازيان" }).click({ timeout: 4_000 });
        await reason2.locator("fieldset").nth(1).getByRole("button", { name: "المستقيمان الموازيان لمستقيم ثالث متوازيان" }).click({ timeout: 4_000 });
      });

    const rebuild = page.getByTestId("parallel-practice-parallel-rebuild");
    await assertFeedbackCycle(rebuild,
      async () => {
        await rebuild.locator("fieldset").nth(0).getByRole("button", { name: "متعامدان" }).click({ timeout: 4_000 });
        await rebuild.locator("fieldset").nth(1).getByRole("button", { name: "متعامدان" }).click({ timeout: 4_000 });
      },
      async () => {
        await rebuild.locator("fieldset").nth(0).getByRole("button", { name: "متوازيان" }).click({ timeout: 4_000 });
        await rebuild.locator("fieldset").nth(1).getByRole("button", { name: "متوازيان" }).click({ timeout: 4_000 });
      });

    const perpendicular = page.getByTestId("parallel-practice-parallel-perpendicular");
    await assertFeedbackCycle(perpendicular,
      async () => {
        await drawLine(perpendicular.getByTestId("construction-perpendicular-1"), [70, 35], [200, 35]);
        await drawLine(perpendicular.getByTestId("construction-perpendicular-2"), [70, 100], [200, 100]);
      },
      async () => {
        await drawLine(perpendicular.getByTestId("construction-perpendicular-1"), [130, 12], [130, 105]);
        await drawLine(perpendicular.getByTestId("construction-perpendicular-2"), [130, 12], [130, 140]);
      });

    const parallel = page.getByTestId("parallel-practice-parallel-parallel");
    await assertFeedbackCycle(parallel,
      async () => {
        await drawLine(parallel.getByTestId("construction-parallel-1"), [130, 12], [130, 140]);
        await drawLine(parallel.getByTestId("construction-parallel-2"), [70, 75], [200, 75]);
      },
      async () => {
        await drawLine(parallel.getByTestId("construction-parallel-1"), [70, 28], [200, 28]);
        await drawLine(parallel.getByTestId("construction-parallel-2"), [24, 100], [256, 100]);
      });

    await goToStage(page, 6, "notebook", width);
    const notebook = page.locator("section#notebook.notebook-print");
    await expect(notebook).toBeVisible({ timeout: 4_000 });
    await expect(notebook.locator("p").filter({ hasText: "دفتر الطالب" }).first()).toBeVisible({ timeout: 4_000 });
    await expect(notebook.getByRole("heading", { level: 2 })).toHaveCount(1, { timeout: 4_000 });
    await expect(notebook.getByRole("heading", { level: 2 })).toContainText("التعامد والتوازي", { timeout: 4_000 });
    await expect(notebook.getByRole("button", { name: "طباعة الدفتر" })).toBeVisible({ timeout: 4_000 });
    await expect(notebook.locator(".notebook-group")).not.toHaveCount(0);
    await expect(notebook.locator(".notebook-group li").first()).toBeVisible({ timeout: 4_000 });
    await page.evaluate(() => { window.__printCalled = false; window.print = () => { window.__printCalled = true; }; });
    await notebook.getByRole("button", { name: "طباعة الدفتر" }).click({ timeout: 4_000 });
    await expect.poll(() => page.evaluate(() => window.__printCalled)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
});
