/**
 * مراحل عرض الدرس — نظام «المراحل» الموحّد لجميع دروس المنصة.
 *
 * هذه البيانات (الأسماء، الترتيب، الأيقونات) ثابتة ومشتركة بين كل الدروس؛
 * آلية التنقل والعرض تعيش في `LessonSteps.tsx`، وربط المرحلة بمحتواها يتم
 * عند بناء خطوات الدرس من `LessonContent`. إضافة درس جديد لا تتطلب أي تعديل هنا:
 * يكفي أن تتبع أقسام محتواه المعرّفات المعتمدة (أو تُضاف أقسامها كما هي).
 *
 * المعرّفات الخاصة: «quiz» للاختبار و«notebook» لدفتر الطالب — يطابقان
 * مفتاحَي `content.quiz` و`content.notebook`.
 */

export type StageIcon =
  | "spark"
  | "search"
  | "book"
  | "flask"
  | "help"
  | "pencil"
  | "clipboard"
  | "list"
  | "notebook";

export interface LessonStageDef {
  /** معرّف ثابت يُطابق معرّف القسم في المحتوى (أو «quiz» / «notebook»). */
  id: string;
  /** اسم المرحلة كما يُعرض في شريط التنقل. */
  name: string;
  /** وصف قصير يظهر تحت الاسم في القائمة الجانبية. */
  hint: string;
  icon: StageIcon;
}

/** المراحل التسع بترتيبها التعليمي المعتمد. لا تُعاد كتابتها في الدروس. */
export const LESSON_STAGES: LessonStageDef[] = [
  { id: "taheya", name: "التهيئة", hint: "انطلاقة الدرس", icon: "spark" },
  { id: "discovery", name: "اكتشاف المفهوم", hint: "جرّب قبل الحل", icon: "search" },
  { id: "learn", name: "الشرح المفصل", hint: "الطريقة المعتمدة", icon: "book" },
  { id: "lab", name: "النشاط / المختبر", hint: "مختبر تفاعلي", icon: "flask" },
  { id: "check", name: "تحقق من فهمك", hint: "كما في الكتاب", icon: "help" },
  { id: "practice", name: "التطبيق", hint: "تدرّب على الكتاب", icon: "pencil" },
  { id: "quiz", name: "اختبار الدرس", hint: "قيّم نفسك", icon: "clipboard" },
  { id: "summary", name: "الملخص", hint: "أهم أفكار الدرس", icon: "list" },
  { id: "notebook", name: "دفتر الطالب", hint: "انقل إلى دفترك", icon: "notebook" },
];
