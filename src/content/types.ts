import type { LessonStatus } from "@/lib/site";

/**
 * بنية محتوى المنهاج — ملفات ثابتة بالكامل، تعمل داخل المتصفح بلا خادم.
 *
 * قاعدة المحتوى: لا يُضاف عنوان درس أو شرح إلا نقلاً عن فهرس الكتاب المدرسي
 * وصور صفحاته المعتمدة. لا محتوى تجريبي في هذا المشروع.
 */

/** تعبير LaTeX يُمرَّر إلى KaTeX كما هو. */
export type Tex = string;

/* ───────────── كتل محتوى الدرس (هيكل جاهز، بلا محتوى الآن) ───────────── */

/**
 * مصدر الكتلة التعليمية:
 * - `book`: منقول حرفيًا أو بتصرّف أمين عن صفحات الكتاب المدرسي.
 * - `extra`: إثراء تعليمي مضاف من المنصة (شرح موسّع، أخطاء شائعة، مقارنات)
 *   لا يغيّر المعلومة العلمية، ويُميَّز بصريًا في العرض.
 */
export type ContentSource = "book" | "extra";

/** نص شرح عربي، مع إمكانية تضمين تعابير رياضية داخلية بين $...$. */
export interface TextBlock {
  type: "text";
  text: string;
  source?: ContentSource;
}

/** معادلة مستقلة في سطرها. */
export interface FormulaBlock {
  type: "formula";
  tex: Tex;
  /** شرح مختصر للمعادلة (اختياري). */
  note?: string;
  source?: ContentSource;
}

/** مثال محلول خطوة بخطوة. */
export interface ExampleBlock {
  type: "example";
  title: string;
  steps: {
    /** نص الخطوة (اختياري). */
    text?: string;
    /** معادلة الخطوة (اختياري). */
    tex?: Tex;
  }[];
  source?: ContentSource;
}

/** جدول بيانات (يُعرض كجدول HTML حقيقي، وليس صورة). */
export interface TableBlock {
  type: "table";
  /** رأس الجدول — الخلية الأولى غالبًا عنوان العمود الجانبي (مثل «اليوم»). */
  headers: string[];
  rows: string[][];
  caption?: string;
  source?: ContentSource;
}

/** رسم أو مخطط SVG يُسجَّل بمعرّف في سجل الرسوم. */
export interface FigureBlock {
  type: "figure";
  figureId: string;
  caption?: string;
  source?: ContentSource;
}

/** نشاط أو محاكاة تفاعلية تُسجَّل بمعرّف في سجل الأنشطة (تعمل في المتصفح). */
export interface ActivityBlock {
  type: "activity";
  activityId: string;
  prompt?: string;
  source?: ContentSource;
}

/** تمرين مع تصحيح فوري في المتصفح (مُعرَّف في سجل الاختبارات المحلية). */
export interface ExerciseBlock {
  type: "exercise";
  exerciseId: string;
  source?: ContentSource;
}

/** ملخص الدرس — يُنسب كل بند إلى مصدره، لا القائمة المختلطة ككل. */
export interface SummaryBlock {
  type: "summary";
  points: { text: string; source: ContentSource }[];
}

export type LessonBlock =
  | TextBlock
  | FormulaBlock
  | ExampleBlock
  | TableBlock
  | FigureBlock
  | ActivityBlock
  | ExerciseBlock
  | SummaryBlock;

/* ───────────── دفتر الطالب ───────────── */

/** عنصر واحد داخل فقرة دفتر الطالب: نص عربي (قد يضم $...$) أو معادلة LaTeX. */
export interface NotebookLine {
  text?: string;
  tex?: Tex;
  source: ContentSource;
}

/** فقرة في دفتر الطالب؛ لكل سطر ورسم شارة مصدر مستقلة. */
export interface NotebookGroup {
  heading: string;
  lines: NotebookLine[];
  /** كتل ثابتة لإدراج الجداول والأمثلة كاملة في الدفتر، دون تفاعلات. */
  blocks?: Exclude<LessonBlock, ActivityBlock | ExerciseBlock>[];
  figures?: { figureId: string; caption: string; source: ContentSource }[];
}

/**
 * دفتر الطالب — قسم أخير متكامل يضم كل ما يحتاجه الطالب لنقله إلى دفتره
 * المدرسي، بلا حاجة إلى الرجوع إلى الشرح الكامل.
 */
export interface LessonNotebook {
  title: string;
  intro?: string;
  groups: NotebookGroup[];
}

/** قسم داخل الدرس: عنوان + كتل مرتّبة. */
export interface LessonSection {
  id: string;
  title: string;
  blocks: LessonBlock[];
  /** مصدر القسم غالبًا — للعرض والتمييز. */
  source?: ContentSource;
}

/**
 * محتوى الدرس الكامل.
 * يُترك غائبًا (undefined) حتى تُعتمد صور صفحات الكتاب ويُبنى المحتوى منها.
 */
export interface LessonContent {
  sections: LessonSection[];
  /** اختبار الدرس المحلي — يعمل ويُصحَّح داخل المتصفح وحده. */
  quiz?: Quiz;
  /** دفتر الطالب — قسم أخير قابل للنقل والطباعة. */
  notebook?: LessonNotebook;
}

/* ───────────── الاختبارات المحلية (في المتصفح) ───────────── */

export interface QuizChoice {
  id: string;
  /** نص الخيار (عربي) — قد يحتوي تعبيرًا بين $...$. */
  text: string;
  /** تعبير رياضي كبديل/إضافة للخيار. */
  tex?: Tex;
}

export interface QuizQuestion {
  id: string;
  /** نص السؤال — قد يحتوي تعبيرًا بين $...$. */
  prompt: string;
  tex?: Tex;
  choices: QuizChoice[];
  /** معرّف الخيار الصحيح. */
  correctChoiceId: string;
  /** تفسير الإجابة بعد التصحيح. */
  explanation?: string;
  explanationTex?: Tex;
}

export interface Quiz {
  id: string;
  title?: string;
  questions: QuizQuestion[];
}

/* ───────────── الفهرس: الوحدات والدروس ───────────── */

export interface Lesson {
  /** معرّف ثابت يُستخدم في مسار الصفحة: /lessons/<id>/ */
  id: string;
  /** رقم الدرس داخل وحدته كما في الكتاب. */
  number: number;
  /** عنوان الدرس كما ورد في فهرس الكتاب حرفيًا. */
  title: string;
  /** نطاق صفحات الكتاب (اختياري)، مثل "12-15". */
  pageRange?: string;
  /** حالة تنظيمية: هل أُرسلت الصور؟ هل المحتوى جاهز؟ هل اعتُمد؟ */
  status: LessonStatus;
  /** ملخص قصير يظهر في الفهرس (اختياري). */
  summary?: string;
  /** محتوى الدرس — غائب حتى اعتماد المحتوى. */
  content?: LessonContent;
}

export interface Unit {
  /** معرّف ثابت للوحدة. */
  id: string;
  /** رقم الوحدة كما في الكتاب. */
  number: number;
  /** عنوان الوحدة كما ورد في فهرس الكتاب حرفيًا. */
  title: string;
  /** وصف تنظيمي اختياري. */
  summary?: string;
  /** لون التمييز البصري للبطاقات (هيكس) — اختياري. */
  accent?: string;
  /** تدرج فاتح مكمّل للون التمييز — اختياري. */
  tint?: string;
  /** الدروس بترتيبها داخل الوحدة. */
  lessons: Lesson[];
}

/** المنهاج كاملًا: مصفوفة وحدات مرتّبة. */
export type Curriculum = Unit[];
