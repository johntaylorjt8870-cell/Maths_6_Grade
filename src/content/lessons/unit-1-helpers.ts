import type { LessonBlock, LessonContent, LessonSection, QuizQuestion } from "../types";
export const text = (text: string): LessonBlock => ({ type: "text", source: "book", text });
export const extra = (text: string): LessonBlock => ({ type: "text", source: "extra", text });
export const formula = (tex: string): LessonBlock => ({ type: "formula", source: "book", tex });
export const figure = (figureId: string, caption: string): LessonBlock => ({ type: "figure", source: "book", figureId, caption });
export const table = (caption: string, headers: string[], rows: string[][]): LessonBlock => ({ type: "table", source: "book", caption, headers, rows });
export const example = (title: string, steps: string[]): LessonBlock => ({ type: "example", source: "book", title, steps: steps.map(text => ({ text })) });
export const section = (id: string, title: string, blocks: LessonBlock[]): LessonSection => ({ id, title, blocks });
export function question(id: string, prompt: string, answers: string[], correct: number, explanation: string): QuizQuestion {
  return { id, prompt, choices: answers.map((text, i) => ({ id: String(i), text })), correctChoiceId: String(correct), explanation };
}
export function lesson(number: number, title: string, sections: LessonSection[], questions: QuizQuestion[], points: string[]): LessonContent {
  const summary = section("summary", "الملخص", [{ type: "summary", points: points.map(text => ({ text, source: "book" })) }]);
  return {
    sections: [...sections, summary],
    quiz: { id: `quiz-1-${number}`, title: "إثراء — اختبار من إعداد المنصة", questions },
    notebook: {
      title,
      intro: "مرجع الدرس: المفاهيم والأمثلة والجداول والرسومات وأسئلة الكتاب. التفاعلات واختبار المنصة ليست جزءًا من نص الكتاب. تظهر مصادر الفقرات بجانبها.",
      groups: [...sections, summary].map(s => ({
        heading: s.title, lines: [],
        blocks: s.blocks.filter((b): b is Exclude<LessonBlock, { type: "activity" | "exercise" }> => b.type !== "activity" && b.type !== "exercise" && (s.id !== "lab" || ("source" in b && b.source === "book"))),
      })).filter(group => group.blocks.length > 0),
    },
  };
}
export const lab = (n: number): LessonSection => section("lab", "النشاط / المختبر", [
  extra("إثراء — من إعداد المنصة: جرّب القيم أو حرّك عناصر الرسم، ثم قدّم توقعك واضغط تحقق. لا تظهر النتيجة قبل المحاولة."),
  { type: "activity", source: "extra", activityId: `unit1-lab-${n}`, prompt: "مختبر الدرس — يعمل محليًا دون إرسال بيانات." },
]);
export const places = ["المليارات", "مئات الملايين", "عشرات الملايين", "الملايين", "مئات الألوف", "عشرات الألوف", "الألوف", "المئات", "العشرات", "الآحاد"];
export const placeTable = (n: string, caption: string): LessonBlock => table(caption, ["الخانة", "الرقم", "قيمة الرقم في الخانة"], places.map((p, i) => {
  const digit = n.padStart(10, "0")[i];
  return [p, digit, String(Number(digit) * 10 ** (9 - i))];
}));
