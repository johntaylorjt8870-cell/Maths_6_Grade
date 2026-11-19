"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lessons, students, units } from "@/db/schema";
import {
  changeTeacherPassword,
  destroySession,
  hashPassword,
  isTeacher,
  isTeacherConfigured,
  loginTeacher,
  startStudentSession,
  verifyPassword,
} from "@/lib/auth";
import { isLessonStatus } from "@/lib/site";

export type FormState = { error?: string; ok?: string } | undefined;

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ───────────── الطالب ───────────── */

export async function registerStudent(_: FormState, fd: FormData): Promise<FormState> {
  const displayName = str(fd, "displayName");
  const username = str(fd, "username").toLowerCase();
  const password = String(fd.get("password") ?? "");

  if (displayName.length < 2 || displayName.length > 60) return { error: "اكتب اسمك (من حرفين إلى 60 حرفًا)." };
  if (!/^[a-z0-9_.]{3,30}$/.test(username))
    return { error: "اسم المستخدم: من 3 إلى 30 حرفًا لاتينيًا أو أرقامًا أو _ أو ." };
  if (password.length < 6) return { error: "كلمة المرور يجب ألا تقل عن 6 أحرف." };

  const existing = await db.select({ id: students.id }).from(students).where(eq(students.username, username)).limit(1);
  if (existing.length) return { error: "اسم المستخدم مستخدم من قبل، اختر اسمًا آخر." };

  const [created] = await db
    .insert(students)
    .values({ displayName, username, passwordHash: hashPassword(password) })
    .returning({ id: students.id });
  await startStudentSession(created.id);
  redirect("/student");
}

export async function loginStudent(_: FormState, fd: FormData): Promise<FormState> {
  const username = str(fd, "username").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const rows = await db.select().from(students).where(eq(students.username, username)).limit(1);
  const row = rows[0];
  if (!row || !verifyPassword(password, row.passwordHash)) {
    await delay(700);
    return { error: "اسم المستخدم أو كلمة المرور غير صحيحة." };
  }
  await startStudentSession(row.id);
  redirect("/student");
}

export async function logoutStudent() {
  await destroySession("student");
  redirect("/student");
}

/* ───────────── المعلم ───────────── */

export async function loginTeacherAction(_: FormState, fd: FormData): Promise<FormState> {
  if (!(await isTeacherConfigured())) {
    return { error: "لم تُهيَّأ كلمة مرور المعلم بعد. اضبط المتغير TEACHER_PASSWORD في إعدادات الخادم." };
  }
  const ok = await loginTeacher(String(fd.get("password") ?? ""));
  if (!ok) {
    await delay(900);
    return { error: "كلمة المرور غير صحيحة." };
  }
  redirect("/teacher");
}

export async function logoutTeacher() {
  await destroySession("teacher");
  redirect("/teacher");
}

export async function changePasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  if (!(await isTeacher())) return { error: "غير مصرح." };
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (next.length < 8) return { error: "كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف." };
  const ok = await changeTeacherPassword(current, next);
  if (!ok) {
    await delay(900);
    return { error: "كلمة المرور الحالية غير صحيحة." };
  }
  return { ok: "تم تغيير كلمة المرور بنجاح." };
}

/* ───────────── هيكل المنهاج (للمعلم فقط) ───────────── */

async function requireTeacher() {
  if (!(await isTeacher())) throw new Error("Unauthorized");
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function addUnit(_: FormState, fd: FormData): Promise<FormState> {
  await requireTeacher();
  const number = Number(fd.get("number"));
  const title = str(fd, "title");
  if (!Number.isInteger(number) || number < 1) return { error: "رقم الوحدة غير صالح." };
  if (title.length < 2) return { error: "اكتب عنوان الوحدة كما ورد في الفهرس." };
  await db.insert(units).values({ number, title });
  refresh();
  return { ok: "تمت إضافة الوحدة." };
}

export async function addLesson(_: FormState, fd: FormData): Promise<FormState> {
  await requireTeacher();
  const unitId = Number(fd.get("unitId"));
  const number = Number(fd.get("number"));
  const title = str(fd, "title");
  const pageRange = str(fd, "pageRange") || null;
  if (!Number.isInteger(unitId)) return { error: "اختر الوحدة." };
  if (!Number.isInteger(number) || number < 1) return { error: "رقم الدرس غير صالح." };
  if (title.length < 2) return { error: "اكتب عنوان الدرس كما ورد في الفهرس." };
  await db.insert(lessons).values({ unitId, number, title, pageRange });
  refresh();
  return { ok: "تمت إضافة الدرس إلى الفهرس (بحالة: في الفهرس)." };
}

export async function setLessonStatus(fd: FormData) {
  await requireTeacher();
  const id = Number(fd.get("id"));
  const status = str(fd, "status");
  if (!Number.isInteger(id) || !isLessonStatus(status)) return;
  await db.update(lessons).set({ status }).where(eq(lessons.id, id));
  refresh();
}

export async function deleteLesson(fd: FormData) {
  await requireTeacher();
  const id = Number(fd.get("id"));
  if (Number.isInteger(id)) await db.delete(lessons).where(eq(lessons.id, id));
  refresh();
}

export async function deleteUnit(fd: FormData) {
  await requireTeacher();
  const id = Number(fd.get("id"));
  if (Number.isInteger(id)) await db.delete(units).where(eq(units.id, id));
  refresh();
}

