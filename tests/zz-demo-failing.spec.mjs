// ملف مؤقت لإثبات أن فشل E2E يمنع build وdeploy في ci.yml — يُحذف بعد التجربة.
import { test, expect } from "@playwright/test";
import { BASE } from "./lesson-e2e-helpers.mjs";

test("إثبات البوابة: فشل متعمّد", async ({ page }) => {
  await page.goto(`${BASE}/curriculum/`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("نصّ متعمّد الفشل لإثبات البوابة");
});
