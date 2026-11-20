"use client";

import { LocalQuiz } from "@/components/lesson/LocalQuiz";
import type { Quiz } from "@/content/types";

/**
 * «تدرّب» (2) (الكتاب، ص 5) — أسئلة على التمثيل البياني لمعدل تساقط
 * الأمطار بالميليمتر في مدينة دمشق. التصحيح فوري داخل المتصفح.
 */

const QUIZ: Quiz = {
  id: "ex-rain-reading",
  title: "أسئلة «تدرّب» (2): معدل تساقط الأمطار في دمشق",
  questions: [
    {
      id: "rain-a",
      prompt: "أ) أي شهر كان فيه أكبر معدل لتساقط الأمطار؟ وما ذلك المعدل؟",
      choices: [
        { id: "a-nov", text: "كانون الأول — 38 مم" },
        { id: "a-jan", text: "كانون الثاني — 40 مم" },
        { id: "a-mar", text: "آذار — 38 مم" },
        { id: "a-feb", text: "شباط — 37 مم" },
      ],
      correctChoiceId: "a-jan",
      explanation: "أعلى نقطة على التمثيل تقابل شهر كانون الثاني بقيمة 40 مليمترًا.",
    },
    {
      id: "rain-b",
      prompt: "ب) أي شهر كان فيه أصغر معدل لتساقط الأمطار؟ وما ذلك المعدل؟",
      choices: [
        { id: "b-nov", text: "تشرين الثاني — 36 مم" },
        { id: "b-feb", text: "شباط — 37 مم" },
        { id: "b-apr", text: "نيسان — 35 مم" },
        { id: "b-dec", text: "كانون الأول — 38 مم" },
      ],
      correctChoiceId: "b-apr",
      explanation: "أدنى نقطة على التمثيل تقابل شهر نيسان بقيمة 35 مليمترًا.",
    },
    {
      id: "rain-c",
      prompt: "ج) ما الشهر الذي كان فيه المعدل 36 مم؟",
      choices: [
        { id: "c-nov", text: "تشرين الثاني" },
        { id: "c-feb", text: "شباط" },
        { id: "c-apr", text: "نيسان" },
        { id: "c-dec", text: "كانون الأول" },
      ],
      correctChoiceId: "c-nov",
      explanation: "النقطة الواقعة على خط التدريج 36 مم تقابل شهر تشرين الثاني.",
    },
    {
      id: "rain-d",
      prompt: "د) كم يزيد معدل تساقط الأمطار في شهر كانون الأول عن معدل تساقط الأمطار في شهر نيسان؟",
      choices: [
        { id: "d-3", text: "3 ملم" },
        { id: "d-2", text: "2 ملم" },
        { id: "d-5", text: "5 ملم" },
        { id: "d-4", text: "4 ملم" },
      ],
      correctChoiceId: "d-3",
      explanation: "كانون الأول = 38 مم، نيسان = 35 مم، والفرق: 38 − 35 = 3 ملم.",
    },
  ],
};

export function RainReadingExercise() {
  return <LocalQuiz quiz={QUIZ} />;
}
