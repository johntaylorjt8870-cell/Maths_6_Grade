import { test, expect } from "@playwright/test";

const base = "/Maths_6_Grade/lessons/lesson-1-5/";

async function draw(activity, red, blue) {
  await activity.getByRole("button", { name: "[BC) الأحمر", exact: true }).click({ timeout: 4_000 });
  for (const point of red) await activity.getByRole("button", { name: `النقطة ${point}` }).click({ timeout: 4_000 });
  await activity.getByRole("button", { name: "[BA) الأزرق", exact: true }).click({ timeout: 4_000 });
  for (const point of blue) await activity.getByRole("button", { name: `النقطة ${point}` }).click({ timeout: 4_000 });
}

test("abc-rays: names, incorrect answer, hint, retry, and correct answer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${base}#practice`);
  const activity = page.getByTestId("geometry-abc-rays");
  const check = activity.getByRole("button", { name: "تحقّق من الإنشاء" });
  await expect(activity).toBeVisible({ timeout: 4_000 });
  await expect(check).toBeDisabled({ timeout: 4_000 });

  await draw(activity, ["A", "B"], ["B", "A"]);
  await expect(check).toBeEnabled({ timeout: 4_000 });
  await check.click({ timeout: 4_000 });
  await expect(activity.getByRole("status")).toContainText("راجع", { timeout: 4_000 });
  await activity.getByRole("button", { name: "أحتاج تلميحًا" }).click({ timeout: 4_000 });
  await expect(activity.getByRole("status")).toContainText("تلميح:", { timeout: 4_000 });
  await activity.getByRole("button", { name: "إعادة المحاولة" }).click({ timeout: 4_000 });
  await expect(check).toBeDisabled({ timeout: 4_000 });
  await expect(activity.getByRole("status")).toHaveCount(0);

  await draw(activity, ["B", "C"], ["B", "A"]);
  await check.click({ timeout: 4_000 });
  await expect(activity.getByRole("status")).toContainText("أحسنت!", { timeout: 4_000 });
});
