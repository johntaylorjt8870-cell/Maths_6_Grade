import Link from "next/link";

/**
 * محتوى صفحة "غير موجود" — يُستخدم في app/not-found.tsx وفي مسار الدرس
 * عندما لا يكون المعرّف موجودًا في الفهرس، فلا تظهر صفحة فارغة أبدًا.
 */
export function NotFoundContent({
  title = "الصفحة غير موجودة",
  description = "قد يكون الرابط قديمًا أو غير صحيح. يمكنك العودة إلى الصفحة الرئيسية أو تصفّح فهرس المنهاج.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <main className="mx-auto grid max-w-[760px] place-items-center px-6 py-24 text-center">
      <p className="text-[4rem] font-bold leading-none text-brand tabular-nums">404</p>
      <h1 className="mt-4 text-[1.9rem] font-bold">{title}</h1>
      <p className="mx-auto mt-3 max-w-[34rem] text-[1.05rem] text-ink-soft">{description}</p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn btn-primary px-6 py-3">
          الصفحة الرئيسية
        </Link>
        <Link href="/curriculum" className="btn btn-ghost px-6 py-3">
          فهرس المنهاج
        </Link>
      </div>
    </main>
  );
}
