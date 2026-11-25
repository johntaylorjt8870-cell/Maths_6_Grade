import { defineConfig, devices } from "@playwright/test";

/**
 * إعداد اختبارات المتصفح.
 *
 * - `testMatch` يشمل أي ملف `*.spec.mjs` جديد تلقائيًا، فلا توجد قائمة تشغيل يدوية
 *   تحتاج تعديلًا عند إضافة ملف اختبار (تضاف الدروس الجديدة بلا أي إعداد إضافي).
 * - `webServer` يبني التصدير الثابت ثم يخدمه تحت المسار الفرعي نفسه الذي يستخدمه
 *   GitHub Pages، لذلك لا تُختبر نسخة مختلفة عن المنشورة.
 * - عند الفشل يُحفظ تتبّع (trace) ولقطة شاشة في `test-results/` ويُرفعان مع تقرير
 *   HTML، حتى يمكن تشخيص فشل CI دون إعادة تشغيله محليًا.
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.mjs",
  fullyParallel: false,
  // كل ملف يبقى تسلسليًا؛ التوزيع على عاملين يقصر زمن CI دون مساس بالخادم الثابت.
  workers: process.env.CI ? 2 : undefined,
  timeout: 120_000,
  // مهلات أطول من الافتراضي: ترطيب React على صفحات الدروس الثقيلة قد يتجاوز 5 ثوان
  // على عامل CI مشترك، والإخفاق هنا يكون تقلّبًا لا عيبًا حقيقيًا.
  expect: { timeout: 10_000 },
  // محاولة ثانية واحدة على CI فقط للتقلّب العارض؛ العيب الحقيقي يفشل في المحاولتين
  // فيبقى البوابة مانعًا للنشر.
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4001",
    headless: true,
    actionTimeout: 8_000,
    navigationTimeout: 15_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  outputDir: "test-results/artifacts",
  webServer: {
    command: "npm run build && npm run preview",
    url: "http://127.0.0.1:4001/Maths_6_Grade/",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { HOST: "0.0.0.0", PORT: "4001" },
    // إظهار سجل البناء والخادم في سجل الاختبار — ضروري لتشخيص فشل الإقلاع.
    stdout: "pipe",
    stderr: "pipe",
  },
});
