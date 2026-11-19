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

/** نص شرح عربي، مع إمكانية تضمين تعابير رياضية داخلية بين $...$. */
export interface TextBlock {
  type: "text";
  text: string;
}

/** معادلة مستقلة في سطرها. */
export interface FormulaBlock {
  type: "formula";
  tex: Tex;
  /** شرح مختصر للمعادلة (اختياري). */
  note?: string;
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
}

/** رسم أو مخطط SVG يُسجَّل بمعرّف في سجل الرسوم. */
export interface FigureBlock {
  type: "figure";
  figureId: string;
  caption?: string;
}

/** نشاط أو محاكاة تفاعلية تُسجَّل بمعرّف في سجل الأنشطة (تعمل في المتصفح). */
export interface ActivityBlock {
  type: "activity";
  activityId: string;
  prompt?: string;
}

/** تمرين مع تصحيح فوري في المتصفح (مُعرَّف في سجل الاختبارات المحلية). */
export interface ExerciseBlock {
  type: "exercise";
  exerciseId: string;
}

/** ملخص الدرس أو عنصر من دفتر الطالب. */
export interface SummaryBlock {
  type: "summary";
  points: string[];
}

export type LessonBlock =
  | TextBlock
  | FormulaBlock
  | ExampleBlock
  | FigureBlock
  | ActivityBlock
  | ExerciseBlock
  | SummaryBlock;

/** قسم داخل الدرس: عنوان + كتل مرتّبة. */
export interface LessonSection {
  id: string;
  title: string;
  blocks: LessonBlock[];
}

/**
 * محتوى الدرس الكامل.
 * يُترك غائبًا (undefined) حتى تُعتمد صور صفحات الكتاب ويُبنى المحتوى منها.
 */
export interface LessonContent {
  sections: LessonSection[];
  /** اختبار الدرس المحلي — يعمل ويُصحَّح داخل المتصفح وحده. */
  quiz?: Quiz;
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
  /** الدروس بترتيبها داخل الوحدة. */
  lessons: Lesson[];
}

/** المنهاج كاملًا: مصفوفة وحدات مرتّبة. */
export type Curriculum = Unit[];
