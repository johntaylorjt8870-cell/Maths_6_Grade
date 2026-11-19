/**
 * المسار الفرعي الذي يُنشر تحته الموقع على GitHub Pages.
 * مصدر واحد يُستخدم في next.config.ts وفي مكوّنات التنقل (لتمييز الرابط النشط).
 */
export const BASE_PATH = "/Maths_6_Grade";

/** يزيل البادئة من مسار الصفحة الحالي الذي يعيده usePathname. */
export function stripBasePath(pathname: string): string {
  if (!BASE_PATH) return pathname;
  if (pathname === BASE_PATH) return "/";
  if (pathname.startsWith(`${BASE_PATH}/`)) {
    return pathname.slice(BASE_PATH.length);
  }
  return pathname;
}
