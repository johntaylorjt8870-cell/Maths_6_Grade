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
    curriculum/page.tsx     فهرس المنهاج
    lessons/[id]/page.tsx   صفحة درس (تُولَّد لكل درس في الفهرس)
    exams/page.tsx          الاختبارات
    lab/page.tsx            المختبر التفاعلي
    math-engine/page.tsx    معاينة محرك KaTeX
    not-found.tsx           صفحة 404 بالعربية (تُصدَّر إلى out/404.html)
  components/
    layout/                 Header, Footer, NavLinks, PlatformLogo
    identity/Engineer.tsx   هوية المهندس سومر شاهين (SR + واتساب)
    math/Math.tsx           KaTeX: M, MathBlock, Q, SvgMath, renderTex
    math/RichText.tsx       نص عربي يضم تعابير $...$
    lesson/LessonContent.tsx عارض كتل الدرس
    lesson/LocalQuiz.tsx    اختبار محلي بالتصحيح الفوري (client)
    ui/StatusBadge.tsx      شارة حالة الدرس
  content/                  ← بيانات المنهاج (المصدر الوحيد)
    types.ts                أنواع الوحدات والدروس والكتل
    curriculum.ts           الفهرس الفعلي (فارغ الآن)
    index.ts                دوال القراءة و generateStaticParams
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

كل شيء في `src/content/curriculum.ts`. الملف فارغ الآن عن قصد: **لا دروس تجريبية**.

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
        { type: "figure", figureId: "fig-1", caption: "شكل توضيحي" },
        { type: "activity", activityId: "act-1", prompt: "جرّب القيم" },
        { type: "exercise", exerciseId: "ex-1" },
        { type: "summary", points: ["خلاصة أولى", "خلاصة ثانية"] },
      ],
    },
  ],
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

---

## القرارات التقنية

- **Static Export**: `output: "export"` + `trailingSlash: true` + `basePath: "/Maths_6_Grade"` + `images.unoptimized`.
- **لا خادم**: أُزيلت PostgreSQL وDrizzle والجلسات وServer Actions وAPI Routes و`next/headers` تمامًا.
- **الخطوط**: IBM Plex Sans Arabic عبر `@fontsource` (محزومة محليًا، لا تعتمد على CDN).
- **الرياضيات**: KaTeX حقيقي (`htmlAndMathml`) مع عزل LTR لكل تعبير داخل نص RTL.
- **RTL**: `<html lang="ar" dir="rtl">` وخصائص منطقية (`ps/pe/ms`) في التنسيق.

> ملاحظة على `scripts/serve-static.mjs`: خادم المعاينة يخدم الملفات الثابتة فقط،
> ولا يُنشر مع الموقع (المجلد `scripts/` ليس جزءًا من `out/`).
