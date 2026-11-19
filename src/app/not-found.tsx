import type { Metadata } from "next";
import { NotFoundContent } from "@/components/layout/NotFoundContent";

export const metadata: Metadata = {
  title: "الصفحة غير موجودة",
  robots: { index: false, follow: false },
};

/**
 * صفحة غير موجودة — تُصدَّر أيضًا إلى out/404.html ليستخدمها GitHub Pages
 * عند فتح رابط غير صالح، فتبقى الهوية العربية واضحة بدل صفحة المتصفح الافتراضية.
 */
export default function NotFound() {
  return <NotFoundContent />;
}
