import { CURRICULUM } from "./curriculum";
import type { Curriculum, Lesson, Unit } from "./types";

/**
 * طبقة قراءة المحتوى الثابت — دوال متزامنة تعمل في المتصفح وفي التصدير الثابت.
 * لا اتصال بأي قاعدة بيانات ولا اعتماد على وقت التشغيل.
 */

/** الوحدات مرتّبة برقمها، والدروس مرتّبة داخل كل وحدة برقمها. */
export function getCurriculum(): Curriculum {
  return CURRICULUM.map((unit) => ({
    ...unit,
    lessons: sortLessons(unit.lessons),
  })).sort(byNumber);
}

function byNumber(a: { number: number }, b: { number: number }) {
  return a.number - b.number;
}

function sortLessons(lessons: Lesson[]): Lesson[] {
  return [...lessons].sort(byNumber);
}

/** كل الدروس مسطّحة بترتيب الفهرس، مع مرجع وحدتها. */
export function getAllLessons() {
  return getCurriculum().flatMap((unit) =>
    unit.lessons.map((lesson) => ({ unit, lesson })),
  );
}

/** درس واحد بمعرّفه مع وحدته، أو undefined إن لم يوجد. */
export function findLesson(id: string): { unit: Unit; lesson: Lesson } | undefined {
  return getAllLessons().find((entry) => entry.lesson.id === id);
}

/** كل معرّفات الدروس — تُستخدم في generateStaticParams للتصدير الثابت. */
export function getLessonIds(): string[] {
  return getAllLessons().map((entry) => entry.lesson.id);
}

/** الدرس السابق والتالي ضمن ترتيب الفهرس كاملًا. */
export function getLessonNeighbours(id: string) {
  const all = getAllLessons();
  const index = all.findIndex((entry) => entry.lesson.id === id);
  if (index === -1) return { prev: undefined, next: undefined };
  return { prev: all[index - 1], next: all[index + 1] };
}

export function curriculumStats(data: Curriculum = getCurriculum()) {
  const all = data.flatMap((u) => u.lessons);
  return {
    units: data.length,
    lessons: all.length,
    published: all.filter((l) => l.status === "published").length,
  };
}
