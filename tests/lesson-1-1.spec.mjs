import { test, expect } from "@playwright/test";
import { assertNoHorizontalOverflow, assertNotebookAndPrint, lessonBase, viewports, watchErrors } from "./lesson-e2e-helpers.mjs";

test("الدرس 1 — الرسوم البيانية: إجابة خاطئة، تلميح، إعادة ومحاولة صحيحة على المقاسات الثلاثة", async ({ page }) => {
  const errors = await watchErrors(page);
  for (const width of viewports) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${lessonBase(1)}#quiz`);
    const firstQuestion = page.locator("#quiz li").first();
    await expect(firstQuestion).toBeVisible();
    await firstQuestion.locator("label").nth(0).click();
    await firstQuestion.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    await expect(firstQuestion.getByRole("status")).toContainText("ليست هذه المرة");
    await firstQuestion.getByRole("button", { name: "أعطني تلميحًا" }).click();
    await expect(firstQuestion.getByRole("status")).toContainText("تلميح:");
    await firstQuestion.getByRole("button", { name: "إعادة المحاولة" }).click();
    await firstQuestion.locator('input[type="radio"]').nth(1).check();
    await firstQuestion.getByRole("button", { name: "تحقّق من إجابتي" }).click();
    await expect(firstQuestion.getByRole("status")).toContainText("إجابتك صحيحة");
    await assertNoHorizontalOverflow(page);
    await assertNotebookAndPrint(page, { number: 1, name: "التمثيل البياني بالخطوط" });
    await assertNoHorizontalOverflow(page);
  }
  expect(errors.console).toEqual([]);
  expect(errors.page).toEqual([]);
});
