import { test, expect } from "@playwright/test";
import { assertNoHorizontalOverflow, assertNotebookAndPrint, goToStage, viewports, watchErrors } from "./lesson-e2e-helpers.mjs";

test("الدرس 2 — مستقيم الأعداد والتصنيف: الناقص والخطأ والتلميح والإعادة والصواب", async ({ page }) => {
  const errors = await watchErrors(page);
  for (const width of viewports) {
    await page.setViewportSize({ width, height: 900 });
    await goToStage(page, 2, "discovery", width);
    const angles = page.getByTestId("natural-angle-count");
    const angleCheck = angles.getByRole("button", { name: "تحقّق من الإجابات" });
    await expect(angleCheck).toBeDisabled();
    for (const shape of ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح", "ط", "ك"]) await angles.getByLabel(`عدد الزوايا في الشكل ${shape}`).fill("0");
    await angleCheck.click();
    await expect(angles.getByRole("status")).toContainText("الإجابات الصحيحة: 1 من 10");
    await angles.getByRole("button", { name: "أحتاج تلميحًا" }).click();
    await expect(angles.getByRole("status")).toContainText("تلميح:");
    await angles.getByRole("button", { name: "إعادة المحاولة" }).click();
    for (const [shape, count] of [["أ",1],["ب",2],["ج",3],["د",4],["هـ",5],["و",6],["ز",7],["ح",8],["ط",9],["ك",0]]) await angles.getByLabel(`عدد الزوايا في الشكل ${shape}`).fill(String(count));
    await angleCheck.click();
    await expect(angles.getByRole("status")).toContainText("أحسنت!");

    await goToStage(page, 2, "check", width);
    const lineActivity = page.locator("#check .book-practice").filter({ hasText: "مثّل الأعداد الطبيعية المحصورة بين 0 و15" }).first();
    const check = lineActivity.getByRole("button", { name: "تحقّق من إجابتي" });
    await expect(check).toBeDisabled();
    await lineActivity.getByRole("button", { name: "1", exact: true }).click();
    await check.click();
    await expect(lineActivity.getByRole("status")).toContainText("قارن مواضعك");
    await lineActivity.getByRole("button", { name: "أحتاج تلميحًا" }).click();
    await expect(lineActivity.getByRole("status")).toContainText("تلميح:");
    await lineActivity.getByRole("button", { name: "إعادة المحاولة" }).click();
    await expect(check).toBeDisabled();
    for (let n = 1; n <= 14; n++) await lineActivity.getByRole("button", { name: String(n), exact: true }).click();
    await check.click();
    await expect(lineActivity.getByRole("status")).toContainText("أحسنت!");
    await lineActivity.getByRole("button", { name: "إعادة المحاولة" }).click();
    await expect(check).toBeDisabled();
    await assertNoHorizontalOverflow(page);
    await assertNotebookAndPrint(page, { number: 2, name: "الأعداد الطبيعية (1)" }, width);
    await assertNoHorizontalOverflow(page);
  }
  expect(errors.console).toEqual([]);
  expect(errors.page).toEqual([]);
});
