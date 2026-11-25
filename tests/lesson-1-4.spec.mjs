import { test, expect } from "@playwright/test";
import { assertNoHorizontalOverflow, assertNotebookAndPrint, goToStage, viewports, watchErrors } from "./lesson-e2e-helpers.mjs";

test("الدرس 4 — تقريب العدد 295992458 إلى أقرب مليون: إجابة خاطئة وصحيحة وإعادة", async ({ page }) => {
  const errors = await watchErrors(page);
  for (const width of viewports) {
    await page.setViewportSize({ width, height: 900 });
    await goToStage(page, 4, "lab", width);
    const roundingLab = page.locator('[data-lab="4"]');
    await expect(roundingLab.getByRole("status")).toContainText("تظهر");
    await roundingLab.getByLabel("ناتج التقريب المتوقع").fill("1");
    await roundingLab.getByRole("button", { name: "تحقق", exact: true }).click();
    await expect(roundingLab.getByRole("status")).toContainText("راجع الخانة المجاورة");
    await roundingLab.getByLabel("ناتج التقريب المتوقع").fill("503700000");
    await roundingLab.getByRole("button", { name: "تحقق", exact: true }).click();
    await expect(roundingLab.getByRole("status")).toContainText("صحيح");

    await goToStage(page, 4, "check", width);
    const activity = page.locator("#check .book-practice").first();
    const answer = activity.getByLabel("إلى أقرب مليون");
    const check = activity.getByRole("button", { name: "تحقّق من إجابتي" });
    await expect(check).toBeDisabled();
    await answer.fill("295000000");
    await expect(check).toBeEnabled();
    await check.click();
    await expect(activity.getByRole("status")).toContainText("الإجابات المكتملة الصحيحة: 0 من 1");
    await activity.getByRole("button", { name: "أحتاج تلميحًا" }).click();
    await expect(activity.getByRole("status")).toContainText("تلميح:");
    await activity.getByRole("button", { name: "إعادة المحاولة" }).click();
    await expect(answer).toHaveValue("");
    await answer.fill("296000000");
    await check.click();
    await expect(activity.getByRole("status")).toContainText("أحسنت!");
    await assertNoHorizontalOverflow(page);
    await assertNotebookAndPrint(page, { number: 4, name: "الأعداد الطبيعية (3)" }, width);
    await assertNoHorizontalOverflow(page);
  }
  expect(errors.console).toEqual([]);
  expect(errors.page).toEqual([]);
});
