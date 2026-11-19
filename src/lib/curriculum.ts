import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { lessons, units } from "@/db/schema";

export type LessonRow = typeof lessons.$inferSelect;
export type UnitWithLessons = typeof units.$inferSelect & { lessons: LessonRow[] };

export async function getCurriculum(): Promise<UnitWithLessons[]> {
  const [unitRows, lessonRows] = await Promise.all([
    db.select().from(units).orderBy(asc(units.number), asc(units.id)),
    db.select().from(lessons).orderBy(asc(lessons.number), asc(lessons.id)),
  ]);
  return unitRows.map((u) => ({
    ...u,
    lessons: lessonRows.filter((l) => l.unitId === u.id),
  }));
}

export function curriculumStats(data: UnitWithLessons[]) {
  const all = data.flatMap((u) => u.lessons);
  return {
    units: data.length,
    lessons: all.length,
    published: all.filter((l) => l.status === "published").length,
  };
}
