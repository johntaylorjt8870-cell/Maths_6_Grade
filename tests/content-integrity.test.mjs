import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { auditContentIntegrity } from "../scripts/verify-content-integrity.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const CLI_SCRIPT = path.join(REPO_ROOT, "scripts/verify-content-integrity.mjs");

/**
 * ينشئ نسخة اختبارية معزولة من مجلد `src/` في مجلد مؤقت، وينفّذ الدالة المطلوبة
 * ثم يحذف المجلد المؤقت دائمًا دون المساس بالمحتوى الحقيقي للمستودع.
 */
async function withIsolatedProject(mutateFn, runFn) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "maths6-integrity-test-"));
  try {
    fs.cpSync(path.join(REPO_ROOT, "src"), path.join(tmpDir, "src"), { recursive: true });
    if (mutateFn) await mutateFn(tmpDir);
    return await runFn(tmpDir);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function editFile(rootDir, relPath, transform) {
  const abs = path.join(rootDir, relPath);
  const before = fs.readFileSync(abs, "utf8");
  const after = transform(before);
  assert.notEqual(after, before, `لم يتغيّر الملف ${relPath} أثناء تجهيز حالة الاختبار`);
  fs.writeFileSync(abs, after, "utf8");
}

function runCli(rootDir, extraArgs = []) {
  return spawnSync(process.execPath, [CLI_SCRIPT, "--root", rootDir, ...extraArgs], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
}

test("1) ينجح الفاحص مع المحتوى الحالي السليم ويعيد رمز خروج 0 وتقريرًا واضحًا", async () => {
  const report = await auditContentIntegrity({ rootDir: REPO_ROOT });
  assert.equal(report.ok, true, `أخطاء غير متوقعة: ${JSON.stringify(report.errors, null, 2)}`);
  assert.equal(report.errors.length, 0);
  assert.equal(report.stats.units, 6);
  assert.equal(report.stats.totalLessons, 45);
  assert.equal(report.stats.publishedLessons, 6);
  assert.equal(report.stats.unpublishedLessons, 39);
  assert.equal(report.stats.registeredFigures, 43);
  assert.equal(report.stats.registeredActivities, 12);
  assert.equal(report.stats.registeredExercises, 2);
  assert.equal(report.stats.registeredGeometryIds, 19);

  const cli = runCli(REPO_ROOT);
  assert.equal(cli.status, 0, cli.stderr || cli.stdout);
  assert.match(cli.stdout, /نجح فحص تكامل محتوى الدروس/);
  assert.match(cli.stdout, /الدروس المنشورة المفحوصة: 6/);
});

test("2أ) يكتشف ملف درس منشور مفقود (حذف ملف مستورد) برمز خروج غير صفري ودون انهيار", async () => {
  await withIsolatedProject(
    (root) => {
      fs.rmSync(path.join(root, "src/content/lessons/lesson-1-2.ts"));
    },
    async (root) => {
      const report = await auditContentIntegrity({ rootDir: root });
      assert.equal(report.ok, false);
      assert.ok(
        report.errors.some(
          (e) => e.code === "PUBLISHED_LESSON_MISSING_FILE" && e.lessonId === "lesson-1-2",
        ),
        `الأخطاء الفعلية: ${JSON.stringify(report.errors, null, 2)}`,
      );

      const cli = runCli(root);
      assert.equal(cli.status, 1);
      assert.match(cli.stdout, /PUBLISHED_LESSON_MISSING_FILE/);
      assert.match(cli.stdout, /lesson-1-2/);
    },
  );
});

test("2ب) يكتشف درسًا منشورًا في الفهرس بلا ملف محتوى مقابل وبلا content", async () => {
  await withIsolatedProject(
    (root) => {
      editFile(root, "src/content/curriculum.ts", (src) =>
        src.replace(
          'indexed("lesson-1-7", 7, "الزوايا", "24-27")',
          '{ id: "lesson-1-7", number: 7, title: "الزوايا", pageRange: "24-27", status: "published" }',
        ),
      );
    },
    async (root) => {
      const report = await auditContentIntegrity({ rootDir: root });
      assert.equal(report.ok, false);
      assert.ok(
        report.errors.some(
          (e) => e.code === "PUBLISHED_LESSON_MISSING_FILE" && e.lessonId === "lesson-1-7",
        ),
      );
      assert.ok(
        report.errors.some(
          (e) => e.code === "PUBLISHED_LESSON_MISSING_CONTENT" && e.lessonId === "lesson-1-7",
        ),
      );
    },
  );
});

test("2ج) يكتشف ملف درس يتيمًا في src/content/lessons غير مسجّل في الفهرس", async () => {
  await withIsolatedProject(
    (root) => {
      fs.copyFileSync(
        path.join(root, "src/content/lessons/lesson-1-2.ts"),
        path.join(root, "src/content/lessons/lesson-9-9.ts"),
      );
    },
    async (root) => {
      const report = await auditContentIntegrity({ rootDir: root });
      assert.equal(report.ok, false);
      assert.ok(
        report.errors.some(
          (e) => e.code === "ORPHAN_LESSON_FILE" && e.lessonId === "lesson-9-9",
        ),
      );
    },
  );
});

test("3أ) يكتشف مرحلة ناقصة (حذف مرحلة lab من درس منشور)", async () => {
  await withIsolatedProject(
    (root) => {
      editFile(root, "src/content/lessons/lesson-1-2.ts", (src) =>
        src.replace("]), lab(2),", "]),"),
      );
    },
    async (root) => {
      const report = await auditContentIntegrity({ rootDir: root });
      assert.equal(report.ok, false);
      assert.ok(
        report.errors.some(
          (e) =>
            e.code === "STAGE_MISSING" &&
            e.lessonId === "lesson-1-2" &&
            e.message.includes("lab"),
        ),
        `الأخطاء الفعلية: ${JSON.stringify(report.errors, null, 2)}`,
      );
      // رابط /lab الديناميكي إلى #lab يكتشف أيضًا غياب المرحلة في lesson-1-2
      assert.ok(
        report.errors.some(
          (e) => e.code === "INTERNAL_LINK_MISSING_TARGET_STAGE" && e.lessonId === "lesson-1-2",
        ),
      );
    },
  );
});

test("3ب) يكتشف اختلال ترتيب المراحل المعتمدة", async () => {
  await withIsolatedProject(
    (root) => {
      editFile(root, "src/content/lessons/lesson-1-2.ts", (src) =>
        src.replace('section("taheya",', 'section("__TMP_TAHEYA__",')
          .replace('section("discovery",', 'section("taheya",')
          .replace('section("__TMP_TAHEYA__",', 'section("discovery",'),
      );
    },
    async (root) => {
      const report = await auditContentIntegrity({ rootDir: root });
      assert.equal(report.ok, false);
      assert.ok(
        report.errors.some(
          (e) => e.code === "STAGE_OUT_OF_ORDER" && e.lessonId === "lesson-1-2",
        ),
      );
    },
  );
});

test("4أ) يكتشف معرّف درس مكرّرًا في سجل المنهاج", async () => {
  await withIsolatedProject(
    (root) => {
      editFile(root, "src/content/curriculum.ts", (src) =>
        src.replace('indexed("lesson-1-7", 7, "الزوايا", "24-27")', 'indexed("lesson-1-2", 7, "الزوايا", "24-27")'),
      );
    },
    async (root) => {
      const report = await auditContentIntegrity({ rootDir: root });
      assert.equal(report.ok, false);
      assert.ok(
        report.errors.some(
          (e) => e.code === "ID_DUPLICATE" && e.lessonId === "lesson-1-2",
        ),
      );
    },
  );
});

test("4ب) يكتشف معرّف سؤال مكرّرًا ومعرّف مرحلة مكرّرًا ومعرّف نشاط مكرّرًا", async () => {
  await withIsolatedProject(
    (root) => {
      editFile(root, "src/content/lessons/lesson-1-2.ts", (src) =>
        src
          .replace('q("u12q2",', 'q("u12q1",')
          .replace('section("discovery",', 'section("taheya",')
          .replace('activityId: "act-natural-angle-count"', 'activityId: "unit1-lab-2"'),
      );
    },
    async (root) => {
      const report = await auditContentIntegrity({ rootDir: root });
      assert.equal(report.ok, false);
      assert.ok(
        report.errors.some(
          (e) =>
            e.code === "ID_DUPLICATE" &&
            e.lessonId === "lesson-1-2" &&
            e.location.includes("u12q1"),
        ),
        `الأخطاء الفعلية: ${JSON.stringify(report.errors, null, 2)}`,
      );
      assert.ok(
        report.errors.some(
          (e) =>
            e.code === "ID_DUPLICATE" &&
            e.lessonId === "lesson-1-2" &&
            e.location.includes("sections[1] (taheya)"),
        ),
      );
      assert.ok(
        report.errors.some(
          (e) =>
            e.code === "ID_DUPLICATE" &&
            e.lessonId === "lesson-1-2" &&
            e.location.includes("unit1-lab-2"),
        ),
      );
    },
  );
});

test("5أ) يكتشف مرجع رسم غير مسجّل (في قسم الدرس وفي دفتر الطالب)", async () => {
  await withIsolatedProject(
    (root) => {
      editFile(root, "src/content/lessons/lesson-1-2.ts", (src) =>
        src.replace('figure("u1-natural-line",', 'figure("u1-missing-figure",'),
      );
      editFile(root, "src/content/lessons/lesson-1-1.ts", (src) =>
        src.replace(
          'figureId: "fig-students-chart"',
          'figureId: "fig-unregistered-notebook-chart"',
        ),
      );
    },
    async (root) => {
      const report = await auditContentIntegrity({ rootDir: root });
      assert.equal(report.ok, false);
      assert.ok(
        report.errors.some(
          (e) =>
            e.code === "FIGURE_UNREGISTERED" &&
            e.lessonId === "lesson-1-2" &&
            e.location.includes("u1-missing-figure"),
        ),
      );
      assert.ok(
        report.errors.some(
          (e) =>
            e.code === "FIGURE_UNREGISTERED" &&
            e.lessonId === "lesson-1-1" &&
            e.location.includes("fig-unregistered-notebook-chart"),
        ),
      );

      const cli = runCli(root);
      assert.equal(cli.status, 1);
      assert.match(cli.stdout, /FIGURE_UNREGISTERED/);
    },
  );
});

test("5ب) يكتشف مرجع نشاط أو إنشاء هندسي غير مسجّل", async () => {
  await withIsolatedProject(
    (root) => {
      editFile(root, "src/content/lessons/lesson-1-2.ts", (src) =>
        src.replace('activityId: "act-natural-angle-count"', 'activityId: "act-ghost-widget"'),
      );
      editFile(root, "src/content/lessons/lesson-1-5.ts", (src) =>
        src.replace('"rspm"', '"nonexistent-geometry"'),
      );
    },
    async (root) => {
      const report = await auditContentIntegrity({ rootDir: root });
      assert.equal(report.ok, false);
      assert.ok(
        report.errors.some(
          (e) => e.code === "ACTIVITY_UNREGISTERED" && e.lessonId === "lesson-1-2",
        ),
      );
      assert.ok(
        report.errors.some(
          (e) => e.code === "GEOMETRY_ID_UNREGISTERED" && e.lessonId === "lesson-1-5",
        ),
      );
    },
  );
});

test("6أ) يكتشف سؤال اختبار ببيانات غير مكتملة (نص فارغ أو إجابة صحيحة خارج الخيارات أو تفسير مفقود)", async () => {
  await withIsolatedProject(
    (root) => {
      editFile(root, "src/content/lessons/lesson-1-2.ts", (src) =>
        src
          .replace(
            'q("u12q1", "سلة فارغة: أي عدد طبيعي يعبّر عن محتواها؟", ["0", "1", "0.5"], 0, "الصفر يعدّ الأشياء في المجموعة الخالية.")',
            'q("u12q1", "", ["0"], 9, "")',
          ),
      );
    },
    async (root) => {
      const report = await auditContentIntegrity({ rootDir: root });
      assert.equal(report.ok, false);
      const codes = new Set(report.errors.map((e) => e.code));
      assert.ok(codes.has("QUIZ_QUESTION_PROMPT_MISSING"));
      assert.ok(codes.has("QUIZ_TOO_FEW_CHOICES"));
      assert.ok(codes.has("QUIZ_CORRECT_CHOICE_INVALID"));
      assert.ok(codes.has("QUIZ_EXPLANATION_MISSING"));
    },
  );
});

test("6ب) يكتشف تمرين كتاب (bookPractice) ببيانات ناقصة أو غير قابلة للحل", async () => {
  await withIsolatedProject(
    (root) => {
      editFile(root, "src/content/lessons/lesson-1-2.ts", (src) =>
        src
          // حذف عنصر من خانات التصنيف فتصبح المسألة غير قابلة للحل
          .replace(
            'buckets: [{ label: "عدد طبيعي", items: ["$187932$"] }, { label: "ليس عددًا طبيعيًا", items: ["$\\\\frac{158}{268}$", "$48.3$"] }]',
            'buckets: [{ label: "عدد طبيعي", items: ["$187932$"] }, { label: "ليس عددًا طبيعيًا", items: ["$48.3$"] }]',
          )
          // وضع قيمة مستهدفة خارج نطاق مستقيم الأعداد
          .replace(
            "min: 0, max: 15, targets: [1,2,3,4,5,6,7,8,9,10,11,12,13,14]",
            "min: 0, max: 15, targets: [1,2,99]",
          ),
      );
    },
    async (root) => {
      const report = await auditContentIntegrity({ rootDir: root });
      assert.equal(report.ok, false);
      const codes = new Set(report.errors.map((e) => e.code));
      assert.ok(
        codes.has("BOOK_PRACTICE_CLASSIFY_UNASSIGNED_ITEM"),
        `الأخطاء الفعلية: ${JSON.stringify(report.errors, null, 2)}`,
      );
      assert.ok(codes.has("BOOK_PRACTICE_NUMBERLINE_TARGET_OUT_OF_RANGE"));
    },
  );
});

test("6ج) يكتشف خللًا في الجداول، والكتل التفاعلية الممنوعة داخل الدفتر، وصيغ KaTeX المعطوبة", async () => {
  await withIsolatedProject(
    (root) => {
      editFile(root, "src/content/lessons/lesson-1-2.ts", (src) =>
        src.replace('["", "$800$", ""]', '["", "$800$"]'),
      );
      editFile(root, "src/content/lessons/lesson-1-1.ts", (src) =>
        src
          .replace(
            'text: "الدرس 1 — التمثيل البياني بالخطوط (الوحدة الأولى، ص 3–5)."',
            'text: "تعبير خاطئ $\\\\frac{1}{$"',
          )
          .replace(
            'heading: "1) عنوان الدرس والفكرة الرئيسية",',
            'heading: "1) عنوان الدرس والفكرة الرئيسية", blocks: [{ type: "activity", source: "extra", activityId: "act-graph-studio" }],',
          ),
      );
    },
    async (root) => {
      const report = await auditContentIntegrity({ rootDir: root });
      assert.equal(report.ok, false);
      const codes = new Set(report.errors.map((e) => e.code));
      assert.ok(codes.has("TABLE_COLUMN_MISMATCH"));
      assert.ok(codes.has("NOTEBOOK_INTERACTIVE_BLOCK_FORBIDDEN"));
      assert.ok(codes.has("KATEX_SYNTAX_ERROR"));
    },
  );
});

test("7) لا يعتبر الدروس المفهرسة أو غير المنشورة أخطاءً لغياب محتواها أو ملفها", async () => {
  await withIsolatedProject(
    (root) => {
      editFile(root, "src/content/curriculum.ts", (src) =>
        src.replace(
          'indexed("lesson-6-8", 8, "الموشور القائم", "168"),',
          [
            'indexed("lesson-6-8", 8, "الموشور القائم", "168"),',
            '      indexed("lesson-6-9", 9, "درس مستقبلي مفهرس", "169-170"),',
            '      { id: "lesson-6-10", number: 10, title: "درس قيد الإعداد", pageRange: "171-172", status: "drafting" },',
          ].join("\n"),
        ),
      );
    },
    async (root) => {
      const report = await auditContentIntegrity({ rootDir: root });
      assert.equal(report.ok, true, `أخطاء غير متوقعة: ${JSON.stringify(report.errors, null, 2)}`);
      assert.equal(report.errors.length, 0);
      assert.equal(report.stats.unpublishedLessons, 41);
    },
  );
});

test("8) يحترم الاستثناء الموثّق للدرس lesson-1-1 في التلميحات، ويفرض التلميح على غيره والتفسير على الجميع", async () => {
  // أ) التحقق من تسجيل الاستثناء على المحتوى السليم دون خطأ
  const cleanReport = await auditContentIntegrity({ rootDir: REPO_ROOT });
  assert.equal(cleanReport.ok, true);
  assert.ok(
    cleanReport.exceptionsApplied.some(
      (ex) => ex.lessonId === "lesson-1-1" && ex.rule === "QUIZ_HINT_EXEMPTION",
    ),
  );

  // ب) حذف تلميح سؤال في lesson-1-2 (غير مستثنى) يجب أن يُرفض
  await withIsolatedProject(
    (root) => {
      editFile(root, "src/content/lessons/unit-1-helpers.ts", (src) =>
        src.replace(
          '  u12q1: "تخيّل المجموعة قبل العدّ: هل يوجد فيها عنصر واحد أم لا يوجد أي عنصر؟",\n',
          "",
        ),
      );
    },
    async (root) => {
      const report = await auditContentIntegrity({ rootDir: root });
      assert.equal(report.ok, false);
      assert.ok(
        report.errors.some(
          (e) =>
            e.code === "QUIZ_HINT_MISSING" &&
            e.lessonId === "lesson-1-2" &&
            e.location.includes("u12q1"),
        ),
        `الأخطاء الفعلية: ${JSON.stringify(report.errors, null, 2)}`,
      );
    },
  );

  // ج) حذف التفسير (explanation) من lesson-1-1 نفسه يجب أن يُرفض — الاستثناء لا يُخفي أخطاء أخرى
  await withIsolatedProject(
    (root) => {
      editFile(root, "src/content/lessons/lesson-1-1.ts", (src) =>
        src.replace(
          'explanation: "الكتاب: يستعمل لتبيان كيفية تغيّر البيانات بمرور الزمن، كتغيّر درجات الحرارة بمرور الزمن، وكذلك تغيّر عدد السكّان.",',
          'explanation: "",',
        ),
      );
    },
    async (root) => {
      const report = await auditContentIntegrity({ rootDir: root });
      assert.equal(report.ok, false);
      assert.ok(
        report.errors.some(
          (e) =>
            e.code === "QUIZ_EXPLANATION_MISSING" &&
            e.lessonId === "lesson-1-1" &&
            e.location.includes("q1"),
        ),
      );
    },
  );
});

test("9) يكتشف الروابط الداخلية المعطوبة في المكوّنات أو داخل نصوص المحتوى", async () => {
  await withIsolatedProject(
    (root) => {
      editFile(root, "src/app/page.tsx", (src) =>
        src.replace('href="/curriculum"', 'href="/missing-route"'),
      );
      editFile(root, "src/content/lessons/lesson-1-2.ts", (src) =>
        src.replace(
          'text("اكتب عدد الزوايا المتشكلة في كل مما يأتي:")',
          'text("اكتب عدد الزوايا [رابط معطوب](/lessons/lesson-9-9#bad-stage):")',
        ),
      );
    },
    async (root) => {
      const report = await auditContentIntegrity({ rootDir: root });
      assert.equal(report.ok, false);
      assert.ok(
        report.errors.some(
          (e) => e.code === "INTERNAL_LINK_BROKEN_ROUTE" && e.file === "src/app/page.tsx",
        ),
      );
      assert.ok(
        report.errors.some(
          (e) => e.code === "INTERNAL_LINK_BROKEN_LESSON" && e.lessonId === "lesson-1-2",
        ),
      );
    },
  );
});
