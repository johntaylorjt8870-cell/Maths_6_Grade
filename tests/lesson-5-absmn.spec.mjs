import { test, expect } from "@playwright/test";

test("absmn: اختيار كل نقطة وتسجيلها، منع الناقص، الخطأ والتلميح والإعادة والنجاح", async ({ page }) => {
  const width = 390;
  const progress = (message) => console.log(`[absmn ${width}px] ${message}`);
  const consoleErrors = [], pageErrors = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/Maths_6_Grade/lessons/lesson-1-5/#discovery");
  const activity = page.getByTestId("geometry-absmn");
  const check = activity.getByRole("button", { name: "تحقّق من الإنشاء" });
  await expect(activity).toBeVisible();
  await expect(check).toBeDisabled();

  async function setPoint(name, x) {
    await test.step(`حدد ${name}، ثم اضغط موضع ${x}`, async () => {
      const label = activity.locator(`[data-point-label="${name}"]`);
      const slot = activity.getByTestId(`absmn-slot-${x}`);
      await expect(label).toBeVisible({ timeout: 4_000 });
      await label.click({ timeout: 4_000 });
      progress(`تم تحديد اسم ${name}`);
      await expect(slot).toBeEnabled({ timeout: 4_000 });
      await slot.click({ timeout: 4_000 });
      await expect(activity.getByRole("status")).toContainText(`تم وضع النقطة ${name} عند الموضع ${x}`, { timeout: 4_000 });
      progress(`تم تسجيل ${name} في ${x}، والموضع ظاهر على SVG`);
    });
  }

  // B=310 وS=364 يضع S خارج القطعة؛ M وN مع ذلك يحققان بقية الشروط.
  await setPoint("B", 310);
  await setPoint("S", 364);
  await setPoint("M", 94);
  await expect(check).toBeDisabled();
  progress("التأكد من أن فرع N الناقص يمنع التحقق");
  await setPoint("N", 364);
  await expect(check).toBeEnabled();
  progress("اكتملت مواضع B/S/M/N الأربع");
  await check.click({ timeout: 4_000 });
  await expect(activity.getByRole("status")).toContainText("راجع مواضع النقاط");
  await activity.getByRole("button", { name: "أحتاج تلميحًا" }).click({ timeout: 4_000 });
  await expect(activity.getByRole("status")).toContainText("تلميح:");
  progress("الإجابة الخاطئة أظهرت سببًا وتلميحًا");
  await activity.getByRole("button", { name: "إعادة المحاولة" }).click({ timeout: 4_000 });
  await expect(check).toBeDisabled();
  for (const name of ["B", "S", "M", "N"]) await expect(activity.locator(`[data-point-label="${name}"]`)).not.toContainText("✓");
  progress("إعادة المحاولة صفّرت جميع النقاط وعطّلت التحقق");

  // A ثابت عند 250؛ B=310، S=256 بينهما، M=94 على امتداد المستقيم، N=364 بعد B على [AB).
  await setPoint("B", 310);
  await setPoint("S", 256);
  await expect(check).toBeDisabled();
  await setPoint("M", 94);
  await expect(check).toBeDisabled();
  await setPoint("N", 364);
  await expect(check).toBeEnabled();
  await check.click({ timeout: 4_000 });
  await expect(activity.getByRole("status")).toContainText("أحسنت!");
  progress("نجحت الشروط الهندسية الأربعة وتحققت التغذية الراجعة الصحيحة");

  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
