import type { LessonBlock, LessonContent, LessonSection, QuizQuestion } from "../types";
export const text = (text: string): LessonBlock => ({ type: "text", source: "book", text });
export const extra = (text: string): LessonBlock => ({ type: "text", source: "extra", text });
export const formula = (tex: string): LessonBlock => ({ type: "formula", source: "book", tex });
export const figure = (figureId: string, caption: string): LessonBlock => ({ type: "figure", source: "book", figureId, caption });
export const table = (caption: string, headers: string[], rows: string[][]): LessonBlock => ({ type: "table", source: "book", caption, headers, rows });
export const example = (title: string, steps: string[]): LessonBlock => ({ type: "example", source: "book", title, steps: steps.map(text => ({ text })) });
export const section = (id: string, title: string, blocks: LessonBlock[]): LessonSection => ({ id, title, blocks });
const QUESTION_HINTS: Record<string, string> = {
  u12q1: "تخيّل المجموعة قبل العدّ: هل يوجد فيها عنصر واحد أم لا يوجد أي عنصر؟",
  u12q2: "احسب قيمة كل تعبير أولًا، ثم تحقّق إن كانت القيمة عددًا صحيحًا غير سالب.",
  u12q3: "على مستقيم الأعداد، ما المسافة بين عدد طبيعي والذي يليه مباشرة؟",
  u12q4: "اكتب أربعة أعداد متتالية، ثم اختبر مجموعها دون تغيير ترتيبها.",
  u12q5: "العدد الزوجي يقبل القسمة على اثنين؛ افحص الأعداد الواقعة داخل الحدين فقط.",
  u12q6: "استخدم قاعدة مجموع الأرقام للقسمة على ثلاثة، ثم افحص كل مرشح.",
  u13q1: "حدّد موضع الرقم 6 في جدول الخانات، لا تكتفِ بقراءة الرقم منفردًا.",
  u13q2: "جزّئ العبارة إلى المليارات والملايين ثم اجمع القيمتين.",
  u13q3: "فكّك العدد إلى مراتب الآحاد والعشرات والمئات والآلاف، مع إهمال الخانات الصفرية.",
  u13q4: "اكتب سبعمئة ألف على صورة 7 يتبعها أصفار، ثم عدّ الأصفار.",
  u13q5: "اكتب كل حلقة في ثلاث خانات؛ أضف أصفارًا بادئة للحلقات الناقصة.",
  u13q6: "احسب قيمة ورقة واحدة مكررة مئة مرة باستخدام الضرب.",
  u14q1: "حدّد خانة الألوف، ثم انظر إلى خانة المئات لتقرر اتجاه التقريب.",
  u14q2: "في التقريب إلى مليون، افحص خانة مئات الألوف وقارنها بالخمسة.",
  u14q3: "انتبه إلى انتقال الحمل عند زيادة 999 ألفًا؛ ما العدد التالي بعده؟",
  u14q4: "قارن عدد الخانات أولًا؛ وإذا تساوت فقارن من اليسار.",
  u14q5: "رتّب القيم من الأصغر بمقارنة أول منزلة تختلف بين كل عددين.",
  u14q6: "للتقريب إلى مليون، العدد المقبول يقع ضمن نصف مليون حول قيمة التقريب.",
  u15q1: "فكّر في تحديد خط واحد يمر عبر نقطتين مختلفتين مهما كان اتجاههما.",
  u15q2: "في الترميز [BA)، الحرف الأول هو نقطة البداية، والثاني يحدد الاتجاه.",
  u15q3: "اسأل أي الأشكال الهندسية له نقطتا نهاية ثابتتان.",
  u15q4: "الرسم قد يُظهر جزءًا فقط؛ تخيّل تمديد الخطين في الاتجاهين.",
  u15q5: "كل من المستقيمين المذكورين يمر بالنقطة Q؛ تحقّق من النقطة المشتركة.",
  u15q6: "الاستقامة تعني أن النقاط تشترك في مسار خطي واحد.",
  u16q1: "اربط مفهوم التعامد بقياس الزاوية الناتجة عند التقاطع.",
  u16q2: "ارسم ذهنيًا مستقيمين يصنع كل منهما زاوية قائمة مع المستقيم نفسه.",
  u16q3: "قارن اتجاه المستقيمين اللذين يشتركان في موازيتهما للمستقيم الثالث.",
  u16q4: "استخدم خاصية وحدانية العمود المرسوم من نقطة إلى مستقيم معطى.",
  u16q5: "راجع حالة النقطة الواقعة على المستقيم، ومعنى التوازي في هذا الدرس.",
  u16q6: "حدّد المستقيمين اللذين يصنعان زاوية قائمة مع (AB)، ثم استنتج العلاقة بينهما.",
};
export function question(id: string, prompt: string, answers: string[], correct: number, explanation: string): QuizQuestion {
  return { id, prompt, hint: QUESTION_HINTS[id], choices: answers.map((text, i) => ({ id: String(i), text })), correctChoiceId: String(correct), explanation };
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
        blocks: s.blocks.filter((b): b is Exclude<LessonBlock, { type: "activity" | "exercise" | "bookPractice" }> => b.type !== "activity" && b.type !== "exercise" && b.type !== "bookPractice" && (s.id !== "lab" || ("source" in b && b.source === "book"))),
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
