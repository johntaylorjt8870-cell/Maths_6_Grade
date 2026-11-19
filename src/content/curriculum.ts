import type { Curriculum } from "./types";

/**
 * فهرس المنهاج — المصدر الوحيد لبيانات الوحدات والدروس.
 *
 * ⚠️ هذا الملف فارغ عن قصد: لم تُضف بعد أي وحدة أو درس إلى المنصة.
 * عند إضافة المحتوى لاحقًا يُكتب هنا نقلًا عن فهرس الكتاب وصور صفحاته:
 *
 *   export const CURRICULUM: Curriculum = [
 *     { id: "...", number: 1, title: "عنوان الوحدة كما في الفهرس", lessons: [
 *       { id: "...", number: 1, title: "عنوان الدرس كما في الفهرس",
 *         pageRange: "...", status: "indexed" },
 *     ] },
 *   ];
 *
 * الحالة `indexed` تعني: العنوان مُدرج في الفهرس فقط، بلا محتوى.
 * لا يُنشر شرح أي درس قبل اعتماده (status: "published").
 */
export const CURRICULUM: Curriculum = [];
