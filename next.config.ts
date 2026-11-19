import type { NextConfig } from "next";
import { BASE_PATH } from "./src/lib/base-path";

/**
 * إعدادات النشر على GitHub Pages.
 * الموقع يُصدَّر كملفات ثابتة بالكامل (Static Export) ويعمل تحت مسار فرعي.
 */
const nextConfig: NextConfig = {
  // تصدير ثابت: لا خادم Node.js وقت التشغيل.
  output: "export",
  // اسم مستودع GitHub Pages — كل الأصول والروابط الداخلية تُبنى تحته.
  basePath: BASE_PATH,
  // GitHub Pages يقدّم المجلدات عبر index.html، لذا نوحّد الشرطة الأخيرة.
  trailingSlash: true,
  images: {
    // لا يوجد محسّن صور على GitHub Pages.
    unoptimized: true,
  },
};

export default nextConfig;
