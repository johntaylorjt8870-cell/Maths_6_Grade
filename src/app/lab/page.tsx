import type { Metadata } from "next";

export const metadata: Metadata = { title: "المختبر التفاعلي" };

export default function LabPage() {
  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10">
      <h1 className="text-[2.2rem] font-bold">المختبر التفاعلي</h1>
      <p className="mt-2 text-[1.05rem] text-ink-soft">
        هنا تجد الأنشطة والمحاكاة المرتبطة بدروس الكتاب: غيّر القيم، لاحظ النتيجة، ثم فسّر ما حدث.
      </p>
      <div className="card mt-8 p-10 text-center">
        <p className="text-[1.25rem] font-bold">لا توجد أنشطة منشورة بعد</p>
        <p className="mx-auto mt-2 max-w-[34rem] text-ink-soft">
          يُبنى كل نشاط ضمن درسه بعد اعتماد محتوى الدرس، ولا تُضاف محاكاة مستقلة عن دروس الكتاب.
        </p>
      </div>
    </main>
  );
}
