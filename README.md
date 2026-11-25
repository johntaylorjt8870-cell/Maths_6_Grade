# الرياضيات الممتعة — الصف السادس (المنهاج السوري)

منصة تعليمية **ثابتة بالكامل** (Static) تعمل على GitHub Pages بلا خادم ولا قاعدة بيانات ولا حسابات.
تشرح منهاج الرياضيات للصف السادس من **الكتاب المدرسي السوري** انطلاقًا من صور صفحات الكتاب،
وكل التفاعلات (الاختبارات والتصحيح والأنشطة) تجري داخل المتصفح.

- الرابط المستهدف: `https://johntaylorjt8870-cell.github.io/Maths_6_Grade/`
- المسار الفرعي: `/Maths_6_Grade` (مضبوط في `next.config.ts` وفي `src/lib/base-path.ts`)
- هوية المنصة والمهندس في `src/lib/site.ts`؛ اسم المنصة: «الرياضيات الممتعة» — الصف السادس — المنهاج السوري.

---

## الدروس المنشورة حاليًا

**الدروس 1–6 من الوحدة الأولى** منشورة بمحتواها الكامل (كلها بحالة `published` ولها محتوى تفاعلي واختبار ودفتر طالب):

| # | الدرس | صفحات الكتاب |
|---|---|---|
| 1 | التمثيل البياني بالخطوط | 3–5 |
| 2 | الأعداد الطبيعية (1) | 6–7 |
| 3 | الأعداد الطبيعية (2) | 8–12 |
| 4 | الأعداد الطبيعية (3) | 13–15 |
| 5 | المستقيم | 16–18 |
| 6 | التعامد والتوازي | 19–23 |

الفهرس الكامل: **6 وحدات و45 درسًا** مستخرج من صورة «الفهرس» في الكتاب (ص 2). بقية الدروس (39 درسًا)
في حالة `indexed` (عناوين ونطاقات صفحات بلا محتوى) إلى أن تُرسل صور صفحاتها ويُبنى محتواها — انظر
[معيار الدروس](docs/lesson-standard.md) القيد الإلزامي لأي درس قادم.

---

## التقنيات والبنية

- **Next.js 16** (App Router) مع **التصدير الثابت** `output: "export"` + `trailingSlash: true` + `images.unoptimized`.
- **React 19** و**TypeScript** بوضع `strict` (`tsc --noEmit`).
- **Tailwind CSS v4** عبر `@tailwindcss/postcss`.
- **KaTeX** للرياضيات (`htmlAndMathml`) مع عزل LTR لكل تعبير داخل نص RTL.
- **IBM Plex Sans Arabic** عبر `@fontsource` (محزومة محليًا، لا تعتمد على CDN).
- **Playwright** لاختبارات المتصفح (عبر `tests/*.spec.mjs`).
- المحتوى كله **ملفات TypeScript ثابتة** في `src/content/` — لا API ولا قاعدة بيانات.

## تشغيل النسخة محليًا

```bash
npm ci

# التطوير
npm run dev          # http://localhost:3000/Maths_6_Grade/

# الفحوصات المطلوبة قبل الدمج
npm run lint
npm run typecheck
npm run verify:content  # فحص تكامل محتوى الدروس والسجلات والمراحل والروابط
npm run test:content    # اختبارات الفاحص على نسخ معزولة (حالات نجاح وفشل مضبوطة)
npm run test:e2e        # Playwright: يبني out/ ويخدمه على 4001 تلقائيًا
npm run verify          # السلسلة الكاملة: lint ثم typecheck ثم verify:content ثم test:content ثم test:e2e

# النسخة النهائية الثابتة (نفس مخرجات GitHub Pages)
npm run build        # يُنتج مجلد out/
npm run preview      # http://localhost:4000/Maths_6_Grade/
```

`npm run preview` يقدّم مجلد `out/` تحت المسار الفرعي نفسه الذي يستخدمه GitHub Pages،
لذلك يُظهر الروابط والخطوط والصور كما ستظهر بعد النشر.

---

## بوابة الجودة (CI) والتحقق قبل النشر

أُضيفت في **PR #6** («CI: بوابة تحقق موحّدة تمنع النشر قبل نجاح lint وtypecheck وbuild وE2E»).
سير عمل واحد في `.github/workflows/ci.yml` يحكم الدمج والنشر:

| الوظيفة | ما تفعله | متى |
| --- | --- | --- |
| `quality` | `npm run lint` ثم `npm run typecheck` ثم `npm run verify:content` ثم `npm run test:content` | كل تغيير غير توثيقي (طلب دمج أو دفع) |
| `e2e` | `npm run test:e2e` بعد `quality` — يبني التصدير الثابت ثم يشغّل Playwright | كل تغيير غير توثيقي |
| `build` | `npm run build` (في كل تشغيل، بما فيه طلبات الدمج) ورفع التصدير كـ Pages artifact على غير طلبات الدمج | بعد نجاح `e2e` |
| `deploy` | نشر GitHub Pages | بعد `build`، ومقيّد بالفرع `main` فقط |

- **لا نشر قبل نجاح الفحوصات:** `e2e` يعتمد على `quality`، و`build` يعتمد على `quality` و`e2e`، و`deploy` يعتمد على `build`؛ فأي فشل في lint أو typecheck أو فحص تكامل المحتوى (`verify:content` / `test:content`) أو Playwright أو build يمنع الوصول إلى `out/` والنشر.
- **لا قائمة اختبارات يدوية:** `playwright.config.ts` يستخدم `testMatch: "**/*.spec.mjs"`، فأي ملف اختبار جديد يُشغَّل تلقائيًا. و`tests/all-lessons.spec.mjs` يكتشف الدروس المنشورة من الموقع نفسه، فالدرس الجديد يدخل المصفوفة بلا تعديل.
- **السجلات والتشخيص:** يُرفع `test-results/` (ومعه `playwright-report/`) كـ artifact عند كل تشغيل، ويحتوي عند الفشل على `trace` ولقطات شاشة وملفات سياق الخطأ. ويُطبع ملخص الفشل في سجل التشغيل نفسه. محاولة إعادة واحدة على CI فقط للتقلّب العارض.
- **سياق الملفات:** أي تغيير في `docs/**` أو `*.md` أو `.gitignore` وحده لا يشغّل البوابة (لا يمسّ الموقع).
- **لا دفع مباشر إلى `main`:** كل تغيير برمجي يمر عبر PR ومراجعة؛ الدمج والنشر يتمان بعد خضرة البوابة.

الاختبارات:

| الملف | النطاق |
| --- | --- |
| `tests/all-lessons.spec.mjs` | مصفوفة عامة لكل درس منشور: المراحل التسع على ثلاثة عروض (1440/390/360)، العروض الثلاثة، الروابط المباشرة، حفظ الإنجاز، دورة الاختبار، دفتر الطالب وPDF، الروابط الداخلية، الدروس غير المنشورة |
| `tests/lesson-1-1.spec.mjs` | الرسوم البيانية (الدرس 1): إجابة خاطئة، تلميح، إعادة، صواب |
| `tests/lesson-1-2.spec.mjs` | الدرس 2: مستقيم الأعداد والتصنيف — الناقص والخطأ والتلميح |
| `tests/lesson-1-3.spec.mjs` | الدرس 3: كتابة العدد — تصنيف جميع صيغ العدد 320200002 |
| `tests/lesson-1-4.spec.mjs` | الدرس 4: تقريب العدد 295992458 إلى أقرب مليون |
| `tests/lesson-5.spec.mjs` | الدرس 5: كل التفاعلات الهندسية والفروع على ثلاثة عروض |
| `tests/lesson-5-absmn.spec.mjs` | الدرس 5: التفاعل `absmn` — اختيار النقاط وتسجيلها |
| `tests/lesson-5-abc-rays.spec.mjs` | الدرس 5: `abc-rays` — التسمية والمواضع والتلميح |
| `tests/lesson-6.spec.mjs` | الدرس 6: التعامد والتوازي — تفاعلات الكتاب والفروع على ثلاثة عروض |
| `tests/lesson-e2e-helpers.mjs` | دوال مشتركة (`goToLessonStage`، `setRangeInput`، `watchErrors`، كشف الفائض الأفقي…) |
| `tests/content-integrity.test.mjs` | اختبارات معزولة لفاحص تكامل المحتوى (`scripts/verify-content-integrity.mjs`): حالات النجاح والفشل المضبوطة دون تعديل المحتوى الحقيقي |

---

## بنية المشروع

```
src/
  app/                      صفحات Next.js (كلها ثابتة)
    page.tsx                الصفحة الرئيسية
    curriculum/page.tsx     فهرس المنهاج — بطاقات الوحدات الست
    curriculum/[unitId]/page.tsx  صفحة الوحدة — بطاقات دروسها (generateStaticParams)
    lessons/[id]/page.tsx   صفحة درس (تُولَّد لكل درس في الفهرس)
    exams/page.tsx          الاختبارات (تظهر اختبارات الدروس المعتمدة فقط)
    lab/page.tsx            المختبر التفاعلي (يظهر مختبرات الدروس المعتمدة)
    math-engine/page.tsx    معاينة محرك KaTeX
    not-found.tsx           صفحة 404 بالعربية (تُصدَّر إلى out/404.html)
  components/
    layout/                 Header, Footer, NavLinks, PlatformLogo
    identity/Engineer.tsx   هوية المهندس سومر شاهين (SR + واتساب)
    math/Math.tsx           KaTeX: M, MathBlock, Q, SvgMath, renderTex
    math/RichText.tsx       نص عربي يضم تعابير $...$ و **نصًا عريضًا**
    charts/LineChart.tsx    مخطط خطي SVG دقيق (يُعيد رسم رسوم الكتاب)
    lesson/LessonContent.tsx يعيد بناء محتوى الدرس كمراحل ويمرره لنظام المراحل
    lesson/LessonSteps.tsx نظام مراحل عرض الدرس (client): قائمة جانبية + شريط هاتف
    lesson/LocalQuiz.tsx    اختبار محلي بالتصحيح الفوري والتلميح وإعادة المحاولة (client)
    lesson/SourceTag.tsx    شارة مصدر الكتلة: «من الكتاب» / «إثراء»
    lesson/PrintNotebookButton.tsx  طباعة دفتر الطالب فقط (window.print)
    lesson/interactive/     سجلّات الأنشطة/التمارين/الرسوم + مكوّنات المتصفح
      registry.tsx          يربط activityId/exerciseId/figureId بالمكوّنات
      datasets.ts           بيانات الكتاب المستعملة في الأنشطة (ص 3-5)
      UnitOneFigures.tsx    رسوم الوحدة الأولى الهندسية (SVG)
      UnitOneGeometry.ts    حسابات هندسية دقيقة (تقاطعات، توازٍ، تعامد)
      UnitOneLabs.tsx       مختبرات الدروس 2–6 (data-lab لكل درس)
      CoordinateGridPlot.tsx   «انطلاقة (1)»: وضع النقاط على شبكة الإحداثيات
      FillTableCheck.tsx       «انطلاقة (2)»: قراءة تمثيل الطلاب وملء الجدول
      PlotPointsExercise.tsx   وضع النقاط ثم وصلها (مثال الكتاب و«تحقق» و«تدرّب»)
      GraphStudio.tsx          المختبر التفاعلي: بيانات الكتاب الثلاث + قراءة النقاط
      CheckAppleExercise.tsx   «تحقق من فهمك» (ب، ج)
      RainReadingExercise.tsx  «تدرّب (2)» أ–د: هطول الأمطار في دمشق
      AngleCountActivity.tsx   عدّ الزوايا في أشكال ص 6
      BookPracticeActivity.tsx  محرك تمارين الكتاب التفاعلية (مستقيم أعداد/تصنيف/إدخال/نماذج)
      GeometryBookPractice.tsx  إنشاءات هندسية تفاعلية (نصفا مستقيمين، تقاطعات)
      ParallelBookPractice.tsx  تمارين التعامد والتوازي من ص 19–23
      InteractiveLineConstruction.tsx  تركيب عمود/موازٍ من نقطة (الدرس 6)
    ui/StatusBadge.tsx      شارة حالة الدرس
  content/                  ← بيانات المنهاج (المصدر الوحيد)
    types.ts                أنواع الوحدات والدروس والكتل والدفتر والاختبار
    curriculum.ts           الفهرس الفعلي: 6 وحدات، 45 درسًا (الدروس 1–6 منشورة)
    index.ts                دوال القراءة و generateStaticParams
    lesson-stages.ts        المراحل التسع المعتمدة لعرض الدرس (الأسماء والأيقونات والترتيب)
    lessons/unit-1-helpers.ts  أدوات بناء الدروس (text/figure/table/lesson/lab/… + QUESTION_HINTS)
    lessons/lesson-1-1.ts   محتوى الدرس الأول (ص 3–5)
    lessons/lesson-1-2.ts   الأعداد الطبيعية (1) — ص 6–7
    lessons/lesson-1-3.ts   الأعداد الطبيعية (2) — ص 8–12
    lessons/lesson-1-4.ts   الأعداد الطبيعية (3) — ص 13–15
    lessons/lesson-1-5.ts   المستقيم — ص 16–18
    lessons/lesson-1-6.ts   التعامد والتوازي — ص 19–23
  lib/
    site.ts                 هوية المنصة والمهندس وحالات الدروس
    base-path.ts            المسار الفرعي لـ GitHub Pages
docs/                       تقارير التدقيق والتحقق والمعايير (منها docs/lesson-standard.md)
public/
  .nojekyll                 ضروري كي لا يحذف GitHub Pages مجلد _next
  robots.txt
scripts/serve-static.mjs    خادم معاينة محاكٍ لـ GitHub Pages (PORT الافتراضي 4000)
scripts/verify-*.mjs        أدوات تحقق مساعدة (تفاعلات، هندسة) — ليست جزءًا من الموقع
scripts/verify-unit-1-pdfs.py  فحص ملفات PDF الخاصة بدفتر الطالب (PyMuPDF)
tests/                      اختبارات Playwright (القائمة في الأعلى)
```

---

## كيف يُضاف المحتوى لاحقًا

المرجع الملزم لهذا القسم هو **[معيار الدروس `docs/lesson-standard.md`](docs/lesson-standard.md)** —
يقرأه أي منشئ/مراجع درس قبل العمل، ويشمل المراحل التسع ومتطلباتها، دفتر الطالب،
تحويل تمارين الكتاب إلى أنشطة تفاعلية، قواعد الرسوم، الوصول، والتحقق المصدري والتقني.
الخلاصة العملية:

### 1) فهرس الوحدات والدروس

كل شيء في `src/content/curriculum.ts` (ومعه محتوى الدروس المنشورة في `src/content/lessons/`). **لا دروس تجريبية**؛ الفهرس مستخرج من صورة «الفهرس» في الكتاب (ص 2). الدروس 1–6 من الوحدة الأولى `published`؛ وبقية الدروس `indexed` (عناوين بلا محتوى) إلى أن تُرسل صور صفحاتها.

```ts
export const CURRICULUM: Curriculum = [
  {
    id: "unit-1",
    number: 1,
    title: "الوحدة الأولى",
    lessons: [
      {
        id: "lesson-1-1",           // يظهر في المسار /lessons/lesson-1-1/
        number: 1,
        title: "عنوان الدرس كما في الفهرس",
        pageRange: "3-5",            // اختياري
        status: "indexed",           // لا محتوى بعد
      },
    ],
  },
];
```

الحالات المتاحة (`status`):

| الحالة      | المعنى                          |
| ----------- | ------------------------------- |
| `indexed`   | في الفهرس فقط، لم تُرسل صوره    |
| `received`  | تم إرسال صور صفحات الكتاب       |
| `drafting`  | قيد إعداد المحتوى               |
| `review`    | قيد المراجعة                    |
| `published` | مكتمل ومعتمد (يُعرض محتواه)     |

لا يُعرض محتوى درس إلا إذا كانت حالته `published` وله `content`.
إضافة صفحة درس جديدة لا تحتاج أي تعديل في الكود: يعمل `generateStaticParams` تلقائيًا.

### 2) محتوى الدرس

```ts
content: {
  sections: [
    {
      id: "intro",
      title: "عنوان القسم",
      blocks: [
        { type: "text", text: "شرح عربي، ويمكن تضمين $\\frac{3}{4}$ داخل النص." },
        { type: "formula", tex: "a^2 + b^2 = c^2", note: "ملاحظة" },
        { type: "example", title: "مثال محلول", steps: [
          { text: "نكتب المعطيات." },
          { tex: "x = 5" },
        ]},
        { type: "table", headers: ["اليوم", "الأحد", "الاثنين"], rows: [["درجة الحرارة", "15", "16"]] },
        { type: "figure", figureId: "fig-1", caption: "شكل توضيحي (يُسجَّل في FIGURE_REGISTRY)" },
        { type: "activity", activityId: "act-1", prompt: "جرّب القيم (يُسجَّل في ACTIVITY_REGISTRY)" },
        { type: "exercise", exerciseId: "ex-1" },
        { type: "bookPractice", source: "book", mode: "numberLine", /* … */ hint: "…", explanation: "…" },
        { type: "summary", points: [
          { text: "خلاصة من نص الدرس", source: "book" },
          { text: "إضافة تعليمية من المنصة", source: "extra" },
        ] },
      ],
    },
  ],
  notebook: {
    title: "دفتر الطالب — عنوان الدرس",
    intro: "…",
    groups: [
      {
        heading: "1) …",
        lines: [{ text: "…", source: "book" }, { tex: "a^2+b^2=c^2", source: "extra" }],
        figures: [{ figureId: "fig-1", caption: "عنوان الرسم القابل للطباعة", source: "book" }],
      },
    ],
  },
  quiz: {
    id: "quiz-1",
    questions: [
      {
        id: "q1",
        prompt: "نص السؤال، ويقبل $x^2$",
        choices: [
          { id: "a", text: "الخيار الأول" },
          { id: "b", text: "الخيار الثاني", tex: "\\frac{1}{2}" },
        ],
        correctChoiceId: "a",
        hint: "تلميح مفاهيمي لا يكشف الاختيار",
        explanation: "تفسير الإجابة.",
      },
    ],
  },
}
```

الاختبار يُصحَّح في المتصفح فقط، ويظهر في صفحة `/exams/` تلقائيًا لكل درس `published` له `quiz`.

ملاحظات تنفيذية:

- شارة `source: "book" | "extra"` تميّز «من الكتاب» عن «إثراء». في الملخص والدفتر لكل بند أو رسم مصدر صريح؛ لا توضع شارة «من الكتاب» على محتوى مختلط. اختبار الدرس من إعداد المنصة ويُوسم «إثراء».
- تُسجَّل معرّفات الرسوم والأنشطة والتمارين في `src/components/lesson/interactive/registry.tsx`. يَستخدم الدفتر رسوم SVG نفسها؛ يُطبع النص والرسوم معًا عند الضغط على «طباعة الدفتر»، دون باقي الدرس.
- النصوص تقبل `**عريض**` إضافةً إلى تعابير `$...$`.
- أمثلة جاهزة للبناء من helpers: `src/content/lessons/unit-1-helpers.ts` (دوال `lesson`/`section`/`text`/`figure`/`table`/`example`/`lab`/`question` + `QUESTION_HINTS`).
- مواضع نقاط رسم الطلاب وأمطار دمشق على صور الكتاب موثقة في [جدول التدقيق](docs/lesson-1-1-graph-verification.md).

### 3) نظام مراحل عرض الدرس (Step-based Lesson UI)

كل درس منشور يُعرض بنظام مراحل موحّد — وليس سرديًا متصلًا:

1. التهيئة 2. اكتشاف المفهوم 3. الشرح المفصل 4. النشاط / المختبر 5. تحقق من فهمك
6. التطبيق 7. اختبار الدرس 8. الملخص 9. دفتر الطالب (الأخير دائمًا، مع الطباعة)

- `src/content/lesson-stages.ts` يعرّف المراحل التسع (الاسم، الترتيب، الأيقونة). هذا كل ما هو مشترك بين الدروس.
- `src/components/lesson/LessonContent.tsx` يبني مصفوفة الخطوات من محتوى الدرس (القسم المعروف بالترتيب المعتمد + «اختبار الدرس» مرحلة مستقلة قبل الملخص + «دفتر الطالب» أخيرًا) ويمررها إلى `LessonSteps`.
- `src/components/lesson/LessonSteps.tsx` (client) يعرض محتوى المرحلة المحددة فقط في المساحة الرئيسية. على الشاشات الكبيرة قائمة مراحل جانبية ثابتة بجانب المحتوى؛ وعلى الهاتف شريط مراحل أفقي قابل للتمرير بدلًا منها (مع «المرحلة X من 9» وشريط تقدّم). زرّا «السابق/التالي» أسفل المحتوى، وزر «إنهاء الدرس» في المرحلة الأخيرة يعيد إلى فهرس الوحدة.
- كل اللوحات تبقى مُركّبة واللوحات غير النشطة تُخفى فقط — فتُحفظ حالة التفاعلات (الرسوم، الاختبارات، النماذج) عند التنقل.
- **«الإنجاز» فعل صريح**: فتح المرحلة وحده لا يُعدّ إتمامًا؛ يضغط الطالب زر «إتمام المرحلة» أسفل أي مرحلة، فتظهر ✓ خضراء على المرحلة مكتملة، وشريط التقدّم (`أتممت X من 9 مراحل`) يعكس ذلك. لا يُخلط بين الزيارة والإتمام.
- موضع المرحلة الحالية والإتمامات تُحفظ في `localStorage` تحت المفتاح `lesson-steps:<lessonId>` بشكل `{ v: 2, current, completed }`. التخزين القديم (v1: `visited`) يُرحّل بأمان: تُستعاد المرحلة المحفوظة ويبدأ عدّ الإتمامات من صفر.
- لا تُكتب أي قيمة في التخزين قبل اكتمال تهيئة الاسترجاع (بوابة `hydrated`)، فلا تُمحى التقدّمات المحفوظة بكتابة القيم الابتدائية.
- الرابط المباشر لمرحلة معينة يعمل عبر البصمة: `/lessons/lesson-1-1/#quiz` (أو `#notebook`…)، وزرّا المتصفح «السابق/التالي» يتنقّلان بين المراحل.
- دفتر الطالب يبقى قابلًا للطباعة كما كان: `@media print` يكشف لوحة الدفتر فقط مهما كانت المرحلة المعروضة ويخفي كل التنقل.
- التفاعلات تعمل داخل المتصفح بلا شبكة: الاختبارات (`LocalQuiz`) بتصحيح فوري وتلميح وإعادة محاولة؛ تمارين الكتاب عبر كتل `bookPractice` و`activity` و`exercise` المسجّلة في `registry.tsx`؛ الرسوم SVG دقيقة (`LineChart` والرسوم الهندسية في `UnitOneFigures`/`GeometryBookPractice`)؛ كلها تعمل باللمس ولوحة المفاتيح.
- لا حاجة لأي تعديل في الدروس القادمة: انشر المحتوى بالبنية نفسها (أقسام بمعرّفات `taheya…summary` + `quiz` + `notebook`) ويلتقط نظام المراحل المراحل تلقائيًا؛ أي قسم بمعرّف غير معروف يُعرض كما هو بعد المراحل المعروفة ولا يُستبعد.

---

## التوثيق في `docs/`

| الملف | الغرض |
| --- | --- |
| `docs/lesson-standard.md` | **المعيار الملزم** لإنشاء وتطوير أي درس (المراحل، الدفتر، التفاعلات، الرسوم، RTL، الوصول، التحقق) |
| `docs/unit-1-pages-3-23-audit.md` | جرد مصدري لصفحات الوحدة الأولى (3–23) |
| `docs/unit-1-lessons-2-6-source-review.md` | خريطة مصادر الدروس 2–6 وقيود التنفيذ المعتمدة |
| `docs/unit-1-lessons-2-6-verification.md` | تقرير التحقق (الأوامر والنتائج والدروس 2–6) |
| `docs/lesson-1-1-graph-verification.md` | توثيق مواضع نقاط الرسوم على صور الكتاب للدرس الأول |
| `docs/pr-4-geometry-revision.md` | تقرير مراجعة الهندسة |
| `docs/pr-ci-gate-verification.md` | تقرير تنفيذ بوابة CI (PR #6) والتحقق منها |

---

## القرارات التقنية

- **Static Export**: `output: "export"` + `trailingSlash: true` + `basePath: "/Maths_6_Grade"` + `images.unoptimized` — متوافق مع GitHub Pages بلا خادم.
- **لا خادم**: لا PostgreSQL ولا Drizzle ولا جلسات ولا Server Actions ولا API Routes؛ كل التفاعل والتصحيح داخل المتصفح.
- **الخطوط**: IBM Plex Sans Arabic عبر `@fontsource` (محزومة محليًا، لا تعتمد على CDN).
- **الرياضيات**: KaTeX حقيقي (`htmlAndMathml`) مع عزل LTR لكل تعبير داخل نص RTL.
- **RTL**: `<html lang="ar" dir="rtl">` وخصائص منطقية (`ps/pe/ms`) في التنسيق؛ والرسوم LTR داخليًا مع `dir` صريح.
- **النشر**: عبر GitHub Pages فقط، من الفرع `main`، بعد نجاح بوابة CI (`.github/workflows/ci.yml`)؛ `public/.nojekyll` يمنع حذف مجلد `_next`.

> ملاحظة على `scripts/serve-static.mjs`: خادم المعاينة يخدم الملفات الثابتة فقط،
> ولا يُنشر مع الموقع (المجلد `scripts/` ليس جزءًا من `out/`).
