"use client";

import { LocalQuiz } from "@/components/lesson/LocalQuiz";
import type { Quiz } from "@/content/types";

/**
 * «تحقق من فهمك» (الكتاب، ص 5) — سؤالان عن جدول إنتاج التفاح.
 * التصحيح فوري داخل المتصفح.
 */

const QUIZ: Quiz = {
  id: "ex-apple-understanding",
  title: "أسئلة «تحقق من فهمك»",
  questions: [
    {
      id: "apple-b",
      prompt: "ب) أي سنة كان فيها إنتاج التفاح هو الأكبر؟",
      choices: [
        { id: "y2014", text: "2014 (4 أطنان)" },
        { id: "y2015", text: "2015 (5 أطنان)" },
        { id: "y2011", text: "2011 (4 أطنان)" },
        { id: "y2016", text: "2016 (3 أطنان)" },
      ],
      correctChoiceId: "y2015",
      explanation: "من الجدول: الإنتاج بالطن كان 2010: 2، 2011: 4، 2012: 3، 2013: 2، 2014: 4، 2015: 5، 2016: 3. الأكبر هو 5 أطنان في سنة 2015.",
    },
    {
      id: "apple-c",
      prompt: "ج) أي السنوات كان فيها إنتاج التفاح هو الأصغر؟",
      choices: [
        { id: "y2012", text: "2012 فقط (3 أطنان)" },
        { id: "y2014", text: "2014 فقط (4 أطنان)" },
        { id: "y2010s", text: "2010 و2013 (طنّان في كلٍّ منهما)" },
        { id: "y2016", text: "2016 فقط (3 أطنان)" },
      ],
      correctChoiceId: "y2010s",
      explanation: "أصغر قيمة في الجدول هي طنّان، وقد تكررت في سنتين: 2010 و2013.",
    },
  ],
};

export function CheckAppleExercise() {
  return <LocalQuiz quiz={QUIZ} />;
}
