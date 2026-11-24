import { test, expect } from "@playwright/test";

const base = "/Maths_6_Grade/lessons/lesson-1-6/";
const widths = [1440, 390, 360];

async function assertFeedbackCycle(activity, makeWrong, makeRight) {
  const check = activity.getByRole("button", { name: "تحقّق من الإنشاء" });
  await expect(check).toBeDisabled({ timeout: 4_000 });
  await makeWrong();
  await expect(check).toBeEnabled({ timeout: 4_000 });
  await check.click({ timeout: 4_000 });
  await expect(activity.getByRole("status")).toContainText("راجع", { timeout: 4_000 });
  await activity.getByRole("button", { name: "أحتاج تلميحًا" }).click({ timeout: 4_000 });
  await expect(activity.getByRole("status")).toContainText("تلميح:", { timeout: 4_000 });
  await activity.getByRole("button", { name: "إعادة المحاولة" }).click({ timeout: 4_000 });
  await expect(check).toBeDisabled({ timeout: 4_000 });
  await makeRight();
  await check.click({ timeout: 4_000 });
  await expect(activity.getByRole("status")).toContainText("أحسنت!", { timeout: 4_000 });
  await activity.getByRole("button", { name: "إعادة المحاولة" }).click({ timeout: 4_000 });
  await expect(check).toBeDisabled({ timeout: 4_000 });
}

async function choosePair(activity, sectionIndex, categoryIndex, label) {
  await activity.locator("section").nth(sectionIndex).locator("fieldset").nth(categoryIndex).getByRole("button", { name: label, exact: true }).click({ timeout: 4_000 });
}

test.describe("الدرس السادس — التعامد والتوازي، تفاعلات الكتاب", () => {
  for (const width of widths) test(`الأنشطة والفروع على عرض ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const consoleErrors = [], pageErrors = [];
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto(`${base}#discovery`);
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

    await page.goto(`${base}#check`);
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

    await page.goto(`${base}#practice`);
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
        await perpendicular.locator("fieldset").nth(0).getByRole("button", { name: "موازٍ" }).click({ timeout: 4_000 });
        await perpendicular.locator("fieldset").nth(1).getByRole("button", { name: "مائل غير عمودي" }).click({ timeout: 4_000 });
      },
      async () => {
        await perpendicular.locator("fieldset").nth(0).getByRole("button", { name: "عمود صحيح" }).click({ timeout: 4_000 });
        await perpendicular.locator("fieldset").nth(1).getByRole("button", { name: "عمود صحيح" }).click({ timeout: 4_000 });
      });

    const parallel = page.getByTestId("parallel-practice-parallel-parallel");
    await assertFeedbackCycle(parallel,
      async () => {
        await parallel.locator("fieldset").nth(0).getByRole("button", { name: "عمودي" }).click({ timeout: 4_000 });
        await parallel.locator("fieldset").nth(1).getByRole("button", { name: "موازٍ منفصل عن (d)" }).click({ timeout: 4_000 });
      },
      async () => {
        await parallel.locator("fieldset").nth(0).getByRole("button", { name: "موازٍ من A خارج (d)" }).click({ timeout: 4_000 });
        await parallel.locator("fieldset").nth(1).getByRole("button", { name: "منطبق على (d) عند A" }).click({ timeout: 4_000 });
      });

    await page.goto(`${base}#notebook`);
    await expect(page.getByRole("heading", { name: "دفتر الطالب" })).toBeVisible({ timeout: 4_000 });
    await expect(page.getByRole("button", { name: "طباعة الدفتر" })).toBeVisible({ timeout: 4_000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
});
