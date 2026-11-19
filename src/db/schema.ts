import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

/** الوحدات الدراسية — عناصر تنظيمية مأخوذة من فهرس المنهاج فقط. */
export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * الدروس — الحالة تحدد ما إذا كان للدرس محتوى فعلي:
 * indexed | received | drafting | review | published
 */
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  unitId: integer("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  pageRange: text("page_range"),
  status: text("status").notNull().default("indexed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    lessonId: integer("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    completed: boolean("completed").notNull().default(false),
    lastStage: text("last_stage"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [unique("lesson_progress_student_lesson").on(t.studentId, t.lessonId)],
);

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  lessonId: integer("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  total: integer("total").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** إعدادات خادمية: تجزئة كلمة مرور المعلم، سر توقيع الجلسات. */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
