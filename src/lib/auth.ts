import "server-only";
import { cookies, headers } from "next/headers";
import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings, students } from "@/db/schema";

/* ───────────── تجزئة كلمات المرور (scrypt + salt) ───────────── */

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/* ───────────── الإعدادات الخادمية ───────────── */

async function getSetting(key: string): Promise<string | null> {
  const rows = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return rows[0]?.value ?? null;
}

async function setSetting(key: string, value: string) {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}

let cachedSecret: string | null = null;

async function getSecret(): Promise<string> {
  if (cachedSecret) return cachedSecret;
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 16) {
    cachedSecret = fromEnv;
    return fromEnv;
  }
  await db
    .insert(settings)
    .values({ key: "session_secret", value: randomBytes(32).toString("hex") })
    .onConflictDoNothing();
  cachedSecret = (await getSetting("session_secret")) as string;
  return cachedSecret;
}

/* ───────────── الجلسات الموقّعة ───────────── */

type Role = "student" | "teacher";
type Payload = { id: number; exp: number; v?: string };

const COOKIE: Record<Role, string> = { student: "sr_student", teacher: "sr_teacher" };
const MAX_AGE: Record<Role, number> = { student: 60 * 60 * 24 * 30, teacher: 60 * 60 * 8 };

function sign(body: string, secret: string) {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

async function issue(role: Role, id: number, v?: string) {
  const secret = await getSecret();
  const payload: Payload = { id, exp: Date.now() + MAX_AGE[role] * 1000, v };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const store = await cookies();
  const secure = (await headers()).get("x-forwarded-proto") === "https";
  store.set(COOKIE[role], `${body}.${sign(body, secret)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: MAX_AGE[role],
  });
}

async function read(role: Role): Promise<Payload | null> {
  const raw = (await cookies()).get(COOKIE[role])?.value;
  if (!raw) return null;
  const [body, sig] = raw.split(".");
  if (!body || !sig) return null;
  const secret = await getSecret();
  const expected = sign(body, secret);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as Payload;
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

export async function destroySession(role: Role) {
  (await cookies()).delete(COOKIE[role]);
}

/* ───────────── الطالب ───────────── */

export async function startStudentSession(studentId: number) {
  await issue("student", studentId);
}

export async function getStudent() {
  const session = await read("student");
  if (!session) return null;
  const rows = await db
    .select({
      id: students.id,
      username: students.username,
      displayName: students.displayName,
    })
    .from(students)
    .where(eq(students.id, session.id))
    .limit(1);
  return rows[0] ?? null;
}

/* ───────────── المعلم ───────────── */

function versionOf(hash: string) {
  return createHash("sha256").update(hash).digest("hex").slice(0, 16);
}

export async function isTeacherConfigured(): Promise<boolean> {
  return Boolean(process.env.TEACHER_PASSWORD) || Boolean(await getSetting("teacher_password_hash"));
}

/** يتحقق من كلمة المرور؛ عند أول دخول تُجزَّأ كلمة المرور الأولية من البيئة وتُخزَّن مجزأة. */
export async function loginTeacher(password: string): Promise<boolean> {
  let stored = await getSetting("teacher_password_hash");
  if (!stored) {
    const initial = process.env.TEACHER_PASSWORD;
    if (!initial || !safeEqual(password, initial)) return false;
    stored = hashPassword(initial);
    await setSetting("teacher_password_hash", stored);
    await issue("teacher", 0, versionOf(stored));
    return true;
  }
  if (!verifyPassword(password, stored)) return false;
  await issue("teacher", 0, versionOf(stored));
  return true;
}

export async function isTeacher(): Promise<boolean> {
  const session = await read("teacher");
  if (!session || !session.v) return false;
  const stored = await getSetting("teacher_password_hash");
  return Boolean(stored) && versionOf(stored as string) === session.v;
}

export async function changeTeacherPassword(current: string, next: string): Promise<boolean> {
  const stored = await getSetting("teacher_password_hash");
  if (!stored || !verifyPassword(current, stored)) return false;
  const hash = hashPassword(next);
  await setSetting("teacher_password_hash", hash);
  await issue("teacher", 0, versionOf(hash));
  return true;
}
