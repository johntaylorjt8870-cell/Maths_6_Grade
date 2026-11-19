export const SITE = {
  name: "الرياضيات الممتعة",
  subject: "الرياضيات",
  grade: "الصف السادس",
  curriculum: "المنهاج السوري",
  motivation: "كل مسألة تحلّها اليوم تقرّبك خطوة من التميّز — ابدأ بثقة وواصل بشغف.",
};

/** هوية المهندس — مصدر واحد للاسم والرقم والرابط. */
export const ENGINEER = {
  name: "المهندس سومر شاهين",
  localPhone: "0930215022",
  message: "مرحبًا مهندس سومر، أرغب بالاستفسار عن المنصة التعليمية",
};

/** الرقم الدولي: رمز سوريا 963 + الرقم المحلي بعد حذف الصفر الأول. */
export const ENGINEER_INTL_PHONE = `963${ENGINEER.localPhone.replace(/^0/, "")}`;

export const WHATSAPP_URL = `https://wa.me/${ENGINEER_INTL_PHONE}?text=${encodeURIComponent(
  ENGINEER.message,
)}`;

export const LESSON_STATUS = {
  indexed: { label: "في الفهرس — لم تُرسل صوره بعد", short: "في الفهرس", tone: "slate" },
  received: { label: "تم إرسال صوره", short: "تم الاستلام", tone: "sky" },
  drafting: { label: "قيد إعداد المحتوى", short: "قيد الإعداد", tone: "amber" },
  review: { label: "قيد المراجعة", short: "قيد المراجعة", tone: "violet" },
  published: { label: "مكتمل ومعتمد", short: "مكتمل", tone: "emerald" },
} as const;

export type LessonStatus = keyof typeof LESSON_STATUS;

export function isLessonStatus(value: string): value is LessonStatus {
  return value in LESSON_STATUS;
}
