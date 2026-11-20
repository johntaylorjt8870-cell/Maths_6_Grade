# الرياضيات الممتعة — الصف السادس (المنهاج السوري)

منصة تعليمية **ثابتة بالكامل** (Static) تعمل على GitHub Pages بلا خادم ولا قاعدة بيانات ولا حسابات.
المستخدم الوحيد هو مالك المنصة، وكل التفاعلات (الاختبارات والتصحيح والأنشطة) تجري داخل المتصفح.

- الرابط المستهدف: `https://johntaylorjt8870-cell.github.io/Maths_6_Grade/`
- المسار الفرعي: `/Maths_6_Grade` (مضبوط في `next.config.ts` وفي `src/lib/base-path.ts`)

---

## تشغيل النسخة محليًا

```bash
npm ci

# التطوير
npm run dev          # http://localhost:3000/Maths_6_Grade/

# التحقق الكامل
npm run lint
npm run typecheck

# النسخة النهائية الثابتة (نفس مخرجات GitHub Pages)
npm run build        # يُنتج مجلد out/
npm run preview      # http://localhost:4000/Maths_6_Grade/
```

`npm run preview` يقدّم مجلد `out/` تحت المسار الفرعي نفسه الذي يستخدمه GitHub Pages،
لذلك يُظهر الروابط والخطوط والصور كما ستظهر بعد النشر.

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
    lesson/LessonContent.tsx عارض كتل الدرس + دفتر الطالب
    lesson/LocalQuiz.tsx    اختبار محلي بالتصحيح الفوري (client)
    lesson/SourceTag.tsx    شارة مصدر الكتلة: «من الكتاب» / «إثراء»
    lesson/PrintNotebookButton.tsx  طباعة دفتر الطالب فقط (window.print)
    lesson/interactive/     سجلّات الأنشطة/التمارين/الرسوم + مكوّنات المتصفح
      registry.tsx          يربط activityId/exerciseId/figureId بالمكوّنات
      datasets.ts           بيانات الكتاب المستعملة في الأنشطة (ص 3-5)
      CoordinateGridPlot.tsx   «انطلاقة (1)»: وضع النقاط على شبكة الإحداثيات
      FillTableCheck.tsx       «انطلاقة (2)»: قراءة تمثيل الطلاب وملء الجدول
      PlotPointsExercise.tsx   وضع النقاط ثم وصلها (مثال الكتاب و«تحقق» و«تدرّب»)
      GraphStudio.tsx          المختبر التفاعلي: بيانات الكتاب الثلاث + قراءة النقاط
      CheckAppleExercise.tsx   «تحقق من فهمك» (ب، ج)
      RainReadingExercise.tsx  «تدرّب (2)» أ–د: هطول الأمطار في دمشق
    ui/StatusBadge.tsx      شارة حالة الدرس
  content/                  ← بيانات المنهاج (المصدر الوحيد)
    types.ts                أنواع الوحدات والدروس والكتل والدفتر
    curriculum.ts           الفهرس الفعلي: 6 وحدات، 45 درسًا (الدرس 1 منشور)
    index.ts                دوال القراءة و generateStaticParams
    lessons/lesson-1-1.ts   محتوى الدرس الأول (منقول عن ص 3-5 موسومًا بالمصدر)
  lib/
    site.ts                 هوية المنصة والمهندس وحالات الدروس
    base-path.ts            المسار الفرعي لـ GitHub Pages
public/
  .nojekyll                 ضروري كي لا يحذف GitHub Pages مجلد _next
scripts/serve-static.mjs    خادم معاينة محاكٍ لـ GitHub Pages
```

---

## كيف يُضاف المحتوى لاحقًا

### 1) فهرس الوحدات والدروس

كل شيء في `src/content/curriculum.ts` (ومعه محتوى الدروس المنشورة في `src/content/lessons/`). **لا دروس تجريبية**؛ الفهرس الحالي مستخرج من صورة «الفهرس» في الكتاب (ص 2): 6 وحدات و45 درسًا. الدرس الأول (التمثيل البياني بالخطوط) منشور بمحتواه الكامل؛ وبقية الدروس `indexed` (عناوين بلا محتوى) إلى أن تُرسل صور صفحاتها.

```ts
export const CURRICULUM: Curriculum = [
  {
    id: "unit-1",
    number: 1,
    title: "عنوان الوحدة كما في الفهرس",
    lessons: [
      {
        id: "lesson-1-1",           // يظهر في المسار /lessons/lesson-1-1/
        number: 1,
        title: "عنوان الدرس كما في الفهرس",
        pageRange: "12-15",          // اختياري
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
- مواضع نقاط رسم الطلاب وأمطار دمشق على صور الكتاب موثّقة في [جدول التدقيق](docs/lesson-1-1-graph-verification.md).
- النصوص تقبل `**عريض**` إضافةً إلى تعابير `$...$`.

---

## القرارات التقنية

- **Static Export**: `output: "export"` + `trailingSlash: true` + `basePath: "/Maths_6_Grade"` + `images.unoptimized`.
- **لا خادم**: أُزيلت PostgreSQL وDrizzle والجلسات وServer Actions وAPI Routes و`next/headers` تمامًا.
- **الخطوط**: IBM Plex Sans Arabic عبر `@fontsource` (محزومة محليًا، لا تعتمد على CDN).
- **الرياضيات**: KaTeX حقيقي (`htmlAndMathml`) مع عزل LTR لكل تعبير داخل نص RTL.
- **RTL**: `<html lang="ar" dir="rtl">` وخصائص منطقية (`ps/pe/ms`) في التنسيق.

> ملاحظة على `scripts/serve-static.mjs`: خادم المعاينة يخدم الملفات الثابتة فقط،
> ولا يُنشر مع الموقع (المجلد `scripts/` ليس جزءًا من `out/`).
