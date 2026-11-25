import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import {
  BASE,
  assertNoHorizontalOverflow,
  stageNames,
  viewports,
  watchErrors,
} from "./lesson-e2e-helpers.mjs";

/**
 * مصفوفة التحقق العامة لكل درس منشور — البديل الآلي عن `scripts/verify-unit-1-lessons.mjs`.
 *
 * القائمة تُكتشف من الموقع نفسه (`/curriculum` ← صفحات الوحدات ← صفحات الدروس)، ولا
 * تُكتب يدويًا: نشر درس جديد يُدخله في المصفوفة تلقائيًا بلا أي تعديل في هذا الملف.
 *
 * تغطية وظائف السكربت القديم:
 * | وظيفة السكربت القديم | مكان التغطية هنا |
 * |---|---|
 * | وجود صفحة `out/lessons/<id>/index.html` | استجابة 200 لكل صفحة درس في `beforeAll` |
 * | المراحل التسع، لوحة واحدة ظاهرة | «مصفوفة المراحل» |
 * | لا `.katex-error` ولا عنصر «غير مسجّل» | «مصفوفة المراحل» |
 * | بلا فائض أفقي على 1440/390/360 | «مصفوفة المراحل» (العروض الثلاثة) |
 * | الروابط المباشرة بالبصمة (#quiz، #notebook) | «الروابط المباشرة للمراحل» |
 * | إتمام المرحلة + `localStorage` + السابق/التالي + الاستعادة | «حالة المراحل» |
 * | دورة الاختبار: خطأ، تلميح، إعادة، صواب، 100% | «الاختبار المحلي» |
 * | دفتر الطالب + الطباعة + PDF | «دفتر الطالب والطباعة» |
 * | فحص تجاوز العناصر داخل الدفتر (كان يُسجّل) | يُرفق كملف تشخيص لكل درس |
 * | الروابط الداخلية 200 | «الروابط الداخلية» |
 * | الدروس غير المنشورة تعرض حالة الانتظار | «الدروس غير المنشورة» |
 * | لا أخطاء console/page | «مصفوفة المراحل» و«الاختبار المحلي» |
 *
 * ما لا يُغطّى هنا (لأنه خاص بكل درس) يبقى في `tests/lesson-<id>.spec.mjs`، ومنه
 * تفاعلات المختبرات، وقد نُقلت إليها صراحةً عند حذف السكربت القديم.
 */

const STAGE_IDS = Object.keys(stageNames);
const STAGE_LABELS = stageNames;

/** معرّفات الدروس المنشورة (لها مراحل) وغير المنشورة — تُملأ قبل التشغيل. */
const published = [];
const unpublished = [];

async function collectLinks(page, url, prefix) {
  await page.goto(url);
  await expect(page.locator("main")).toBeVisible();
  return page.locator(`a[href^="${prefix}"]`).evaluateAll(
    (anchors) => [...new Set(anchors.map((anchor) => anchor.getAttribute("href")))],
  );
}

test.beforeAll(async ({ browser, baseURL }) => {
  const page = await browser.newPage();
  try {
    const units = await collectLinks(page, `${BASE}/curriculum`, `${BASE}/curriculum/`);
    expect(units.length, "صفحات الوحدات في الفهرس").toBeGreaterThan(0);

    const lessonHrefs = new Set();
    for (const unit of units) {
      for (const href of await collectLinks(page, unit, `${BASE}/lessons/`)) lessonHrefs.add(href);
    }
    expect(lessonHrefs.size, "روابط الدروس في صفحات الوحدات").toBeGreaterThan(0);

    for (const href of [...lessonHrefs].sort()) {
      const response = await page.request.get(new URL(href, baseURL).toString());
      expect(response.status(), `صفحة الدرس ${href}`).toBe(200);
      const html = await response.text();
      const id = href.match(/\/lessons\/([^/]+)/)?.[1];
      expect(id, `معرّف الدرس في ${href}`).toBeTruthy();
      // الصفحة المنشورة تحتوي جذر نظام المراحل؛ غير المنشورة تعرض بطاقة الانتظار.
      (html.includes("lesson-steps-root") ? published : unpublished).push(id);
    }
  } finally {
    await page.close();
  }
});

test("اكتشاف الدروس: كل صفحات الدروس تعمل ويوجد درس منشور", async () => {
  expect(published.length, "عدد الدروس المنشورة").toBeGreaterThan(0);
  expect(new Set(published).size, "تكرار معرّفات الدروس").toBe(published.length);
  await test.info().attach("lessons.json", {
    body: JSON.stringify({ published, unpublished }, null, 2),
    contentType: "application/json",
  });
});

for (const width of viewports) {
  test(`مصفوفة المراحل — عرض ${width}px`, async ({ page }) => {
    test.setTimeout(300_000);
    expect(published.length).toBeGreaterThan(0);
    await page.setViewportSize({ width, height: 900 });
    const errors = await watchErrors(page);

    for (const lessonId of published) {
      await test.step(`الدرس ${lessonId}`, async () => {
        await page.goto(`${BASE}/lessons/${lessonId}/`);
        await expect(page.locator(".lesson-steps-root"), `جذر المراحل في ${lessonId}`).toBeVisible();

        const panelIds = (await page.locator(".lesson-stage").evaluateAll((nodes) => nodes.map((node) => node.id.replace("stage-panel-", "")))).sort();
        expect(panelIds, `المراحل التسع في ${lessonId}`).toEqual([...STAGE_IDS].sort());

        for (const stage of STAGE_IDS) {
          await test.step(`${STAGE_LABELS[stage]}`, async () => {
            // الانتقال بالبصمة (#stage) يغطي الروابط المباشرة ويتجنّب التمرير الناعم
            // الذي يسبّبه زر المرحلة، وهو مصدر تقلّب معروف في شبكة المراحل.
            await page.goto(`${BASE}/lessons/${lessonId}/#${stage}`);
            await expect(page.locator(`#stage-panel-${stage}`), `لوحة ${stage} في ${lessonId}`).toBeVisible();
            await expect(page.locator(".lesson-stage:not([hidden])"), `لوحة واحدة ظاهرة في ${lessonId}`).toHaveCount(1);
            await expect(page.locator(".katex-error"), `أخطاء KaTeX في ${lessonId}/${stage}`).toHaveCount(0);
            await expect(page.getByText(/غير مسجّل/), `عنصر غير مسجّل في ${lessonId}/${stage}`).toHaveCount(0);
            await assertNoHorizontalOverflow(page);
          });
        }
      });
    }

    expect(errors.console, `أخطاء console على ${width}px`).toEqual([]);
    expect(errors.page, `أخطاء page على ${width}px`).toEqual([]);
  });
}

test("الروابط المباشرة للمراحل تعمل (#quiz و #notebook)", async ({ page }) => {
  test.setTimeout(180_000);
  expect(published.length).toBeGreaterThan(0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const lessonId of published) {
    for (const stage of ["quiz", "notebook"]) {
      await page.goto("about:blank");
      await page.goto(`${BASE}/lessons/${lessonId}/#${stage}`);
      await expect(page.locator(`#stage-panel-${stage}`), `${lessonId}#${stage}`).toBeVisible();
      await expect(page.locator(".lesson-stage:not([hidden])")).toHaveCount(1);
    }
  }
});

test("حالة المراحل: الإتمام والحفظ والتنقل والاستعادة بعد إعادة التحميل", async ({ page }) => {
  test.setTimeout(180_000);
  expect(published.length).toBeGreaterThan(0);
  await page.setViewportSize({ width: 1440, height: 1000 });

  for (const lessonId of published) {
    await test.step(`الدرس ${lessonId}`, async () => {
      await page.goto(`${BASE}/lessons/${lessonId}/`);
      await expect(page.locator("#stage-panel-taheya")).toBeVisible();

      await page.getByRole("button", { name: "إتمام المرحلة", exact: true }).click();
      await expect(page.getByRole("button", { name: "أُتمّت", exact: true })).toBeVisible();
      await expect
        .poll(
          () =>
            page.evaluate((id) => {
              const raw = window.localStorage.getItem(`lesson-steps:${id}`);
              return raw ? Boolean(JSON.parse(raw).completed?.includes("taheya")) : false;
            }, lessonId),
          `حفظ الإتمام في ${lessonId}`,
        )
        .toBe(true);

      await page.getByRole("button", { name: "المرحلة التالية" }).click();
      await expect(page).toHaveURL(/#discovery$/);
      await page.getByRole("button", { name: "المرحلة السابقة" }).click();
      await expect(page).toHaveURL(/#taheya$/);

      await page.goto(`${BASE}/lessons/${lessonId}/#quiz`);
      await expect(page.locator("#stage-panel-quiz")).toBeVisible();
      await page.reload();
      await expect(page.locator("#stage-panel-quiz")).toBeVisible();
      await expect
        .poll(
          () =>
            page.evaluate((id) => {
              const raw = window.localStorage.getItem(`lesson-steps:${id}`);
              return raw ? Boolean(JSON.parse(raw).completed?.includes("taheya")) : false;
            }, lessonId),
          `استعادة الإتمام بعد إعادة التحميل في ${lessonId}`,
        )
        .toBe(true);
    });
  }
});

test("الاختبار المحلي: خطأ ثم تلميح ثم إعادة محاولة ثم صواب لكل درس", async ({ page }) => {
  test.setTimeout(300_000);
  expect(published.length).toBeGreaterThan(0);
  await page.setViewportSize({ width: 390, height: 900 });
  const errors = await watchErrors(page);

  for (const lessonId of published) {
    await test.step(`الدرس ${lessonId}`, async () => {
      const quizUrl = `${BASE}/lessons/${lessonId}/#quiz`;
      /** إعادة تحميل مرحلة الاختبار من الصفر ثم تصحيح خيار واحد والسؤال الأول. */
      const checkChoice = async (index) => {
        // المرور بـ about:blank يضمن مستندًا جديدًا حتى لو كان العنوان نفسه (حالة نظيفة).
        await page.goto("about:blank");
        await page.goto(quizUrl);
        await expect(page.locator("#stage-panel-quiz")).toBeVisible();
        const first = page.locator("#quiz ol > li").first();
        await first.locator('input[type="radio"]').nth(index).check();
        await first.getByRole("button", { name: "تحقّق من إجابتي" }).click();
        const status = first.getByRole("status");
        await expect(status).toBeVisible();
        return status.innerText();
      };

      await page.goto(quizUrl);
      await expect(page.locator("#quiz")).toHaveCount(1);
      const total = await page.locator("#quiz ol > li").count();
      expect(total, `أسئلة اختبار ${lessonId}`).toBeGreaterThan(0);
      const choiceCount = await page.locator('#quiz ol > li').first().locator('input[type="radio"]').count();
      expect(choiceCount, `خيارات سؤال ${lessonId}`).toBeGreaterThan(1);

      // تحديد خيار خاطئ وخيار صحيح معًا — كل محاولة تبدأ من حالة نظيفة،
      // لأن زر «إعادة المحاولة» لا يظهر إلا بعد إجابة خاطئة.
      let wrongIndex = -1;
      let correctIndex = -1;
      for (let index = 0; index < choiceCount; index += 1) {
        const text = await checkChoice(index);
        if (text.includes("ليست هذه المرة") && wrongIndex === -1) wrongIndex = index;
        if (text.includes("إجابتك صحيحة") && correctIndex === -1) correctIndex = index;
        if (wrongIndex !== -1 && correctIndex !== -1) break;
      }
      expect(wrongIndex, `لم يوجد خيار خاطئ في ${lessonId}`).toBeGreaterThanOrEqual(0);
      expect(correctIndex, `لم يوجد خيار صحيح في ${lessonId}`).toBeGreaterThanOrEqual(0);

      // الخطأ لا يكشف الإجابة الصحيحة، ويظهر التلميح بعد الفشل.
      const wrongText = await checkChoice(wrongIndex);
      expect(wrongText).not.toContain("إجابتك صحيحة");
      const first = page.locator("#quiz ol > li").first();
      await expect(first.getByRole("button", { name: "إعادة المحاولة" })).toBeVisible();
      await first.getByRole("button", { name: "أعطني تلميحًا" }).click();
      await expect(first.getByRole("status")).toContainText("تلميح:");
      await first.getByRole("button", { name: "إعادة المحاولة" }).click();
      await expect(first.locator('input[type="radio"]:checked'), "إعادة المحاولة تصفّر الاختيار").toHaveCount(0);

      // الإجابة الصحيحة تُقبل، ويُحدَّث عدّاد التقدّم.
      const correctText = await checkChoice(correctIndex);
      expect(correctText).toContain("إجابتك صحيحة");
      await expect(page.locator('#quiz [aria-label^="تم إنجاز"]')).toHaveAttribute("aria-label", new RegExp(`1 من ${total}`));

      // إتمام بقية الأسئلة يُظهر ملخص النتيجة.
      for (let index = 1; index < total; index += 1) {
        const question = page.locator("#quiz ol > li").nth(index);
        await question.locator('input[type="radio"]').first().check();
        await question.getByRole("button", { name: "تحقّق من إجابتي" }).click();
      }
      const summary = page.locator('#quiz p[role="status"]');
      await expect(summary).toContainText("أنهيت التحدّي");
      await expect(summary).toContainText(/\d+ \/ \d+/);
    });
  }

  expect(errors.console).toEqual([]);
  expect(errors.page).toEqual([]);
});

test("دفتر الطالب والطباعة: الطباعة منفردة وتخطيط A4", async ({ page }) => {
  test.setTimeout(300_000);
  expect(published.length).toBeGreaterThan(0);
  mkdirSync("test-results/notebooks", { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });

  for (const lessonId of published) {
    await test.step(`الدرس ${lessonId}`, async () => {
      await page.goto(`${BASE}/lessons/${lessonId}/#notebook`);
      const notebook = page.locator("section#notebook.notebook-print");
      await expect(notebook, `دفتر ${lessonId}`).toBeVisible();
      await expect(notebook.locator(".notebook-group li").first()).toBeVisible();

      await page.evaluate(() => {
        window.__printCalled = false;
        window.print = () => { window.__printCalled = true; };
      });
      await notebook.getByRole("button", { name: "طباعة الدفتر" }).click();
      await expect.poll(() => page.evaluate(() => window.__printCalled)).toBe(true);

      await page.emulateMedia({ media: "print" });
      await expect(page.locator(".lesson-steps-chrome:visible"), "التنقل مخفي في الطباعة").toHaveCount(0);
      await expect(notebook, `الدفتر ظاهر في الطباعة ${lessonId}`).toBeVisible();

      const overflow = await page
        .locator("#notebook table, #notebook .math-block, #notebook svg")
        .evaluateAll((nodes) =>
          nodes
            .filter((node) => node.scrollWidth > node.clientWidth + 3)
            .map((node) => ({ tag: node.tagName, client: node.clientWidth, scroll: node.scrollWidth, text: (node.textContent ?? "").slice(0, 80) })),
        );
      await test.info().attach(`print-overflow-${lessonId}.json`, {
        body: JSON.stringify({ lessonId, offenders: overflow }, null, 2),
        contentType: "application/json",
      });

      await page.pdf({ path: `test-results/notebooks/${lessonId}.pdf`, format: "A4", preferCSSPageSize: true, printBackground: true });
      await page.emulateMedia({ media: "screen" });
    });
  }
});

test("الروابط الداخلية للموقع تعمل (HTTP 200)", async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  const seeds = [`${BASE}/`, `${BASE}/curriculum`, `${BASE}/curriculum/unit-1`, `${BASE}/exams`, `${BASE}/lab`];
  if (published[0]) seeds.push(`${BASE}/lessons/${published[0]}/`);

  const targets = new Set();
  for (const seed of seeds) {
    await page.goto(seed);
    const hrefs = await page.locator(`a[href^="${BASE}"]`).evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute("href")));
    for (const href of hrefs) targets.add(href.split("#")[0]);
  }

  expect(targets.size, "عدد الوجهات الداخلية المفحوصة").toBeGreaterThan(10);
  for (const href of [...targets]) {
    const response = await page.request.get(new URL(href, baseURL).toString());
    expect(response.status(), `الوجهة ${href}`).toBe(200);
  }
  await test.info().attach("internal-links.json", {
    body: JSON.stringify([...targets].sort(), null, 2),
    contentType: "application/json",
  });
});

test("الدروس غير المنشورة تعرض حالة الانتظار بلا مراحل", async ({ page }) => {
  test.setTimeout(120_000);
  expect(unpublished.length).toBeGreaterThan(0);
  for (const lessonId of unpublished.slice(0, 3)) {
    await page.goto(`${BASE}/lessons/${lessonId}/`);
    await expect(page.getByText("محتوى هذا الدرس لم يُنشر بعد"), lessonId).toBeVisible();
    await expect(page.locator(".lesson-steps-root"), lessonId).toHaveCount(0);
  }
});
