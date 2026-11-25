import { test, expect } from "@playwright/test";
import { assertNoHorizontalOverflow, assertNotebookAndPrint, goToStage, viewports, watchErrors } from "./lesson-e2e-helpers.mjs";

test("الدرس 3 — كتابة العدد: تصنيف جميع صيغ 320200002 مع الخطأ والتلميح والإعادة", async ({ page }) => {
  const errors = await watchErrors(page);
  const items = [
    ["لبنى:", "كتابة غير صحيحة"],
    ["ماهر:", "كتابة صحيحة"],
    ["باسم:", "كتابة غير صحيحة"],
  ];
  for (const width of viewports) {
    await page.setViewportSize({ width, height: 900 });
    await goToStage(page, 3, "lab", width);
    const placeLab = page.locator('[data-lab="3"]');
    await expect(placeLab.getByRole("status")).toContainText("تظهر");
    await placeLab.getByLabel("قيمة الرقم المتوقعة").fill("1");
    await placeLab.getByRole("button", { name: "تحقق", exact: true }).click();
    await expect(placeLab.getByRole("status")).toContainText("ليست القيمة الصحيحة");
    await placeLab.getByLabel("قيمة الرقم المتوقعة").fill("9000000");
    await placeLab.getByRole("button", { name: "تحقق", exact: true }).click();
    await expect(placeLab.getByRole("status")).toContainText("صحيح");

    await goToStage(page, 3, "check", width);
    const activity = page.locator("#check .book-practice").first();
    const check = activity.getByRole("button", { name: "تحقّق من إجابتي" });
    await expect(check).toBeDisabled();
    const correctBucket = activity.locator('[aria-label="خانة كتابة صحيحة"]');
    await correctBucket.locator('button[aria-label^="صنّف لبنى:"]').click();
    await correctBucket.locator('button[aria-label^="صنّف باسم:"]').click();
    await correctBucket.locator('button[aria-label^="صنّف ماهر:"]').click();
    await expect(check).toBeEnabled();
    await check.click();
    await expect(activity.getByRole("status")).toContainText("صنفت بشكل صحيح 1 من 3");
    await activity.getByRole("button", { name: "أحتاج تلميحًا" }).click();
    await expect(activity.getByRole("status")).toContainText("تلميح:");
    await activity.getByRole("button", { name: "إعادة المحاولة" }).click();
    for (const [prefix, bucket] of items) {
      await activity.locator(`[aria-label="خانة ${bucket}"]`).locator(`button[aria-label^="صنّف ${prefix}"]`).click();
    }
    await activity.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    await expect(activity.getByRole("status")).toContainText("أحسنت!");
    await assertNoHorizontalOverflow(page);
    await assertNotebookAndPrint(page, { number: 3, name: "الأعداد الطبيعية (2)" }, width);
    await assertNoHorizontalOverflow(page);
  }
  expect(errors.console).toEqual([]);
  expect(errors.page).toEqual([]);
});
