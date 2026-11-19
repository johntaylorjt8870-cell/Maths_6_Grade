import Link from "next/link";
import { M } from "@/components/math/Math";
import { curriculumStats, getCurriculum } from "@/content";
import { SITE } from "@/lib/site";

const SYMBOLS = ["\\frac{a}{b}", "\\times", "\\div", "\\pi", "\\sqrt{x}", "+", "-", "="];

const AREAS = [
  {
    href: "/curriculum",
    title: "فهرس المنهاج",
    text: "الوحدات والدروس بترتيب الكتاب، مع حالة كل درس.",
    color: "bg-brand-soft text-brand",
  },
  {
    href: "/exams",
    title: "الاختبارات",
    text: "اختبر نفسك بعد كل درس واعرف ما تحتاج إلى مراجعته.",
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    href: "/lab",
    title: "المختبر التفاعلي",
    text: "جرّب الأفكار الرياضية بيدك: غيّر القيم وراقب النتيجة.",
    color: "bg-rose-50 text-rose-700",
  },
  {
    href: "/math-engine",
    title: "محرك الرياضيات",
    text: "كل رموز الكتاب وكسوره ومعادلاته تُعرض بدقة KaTeX داخل الصفحات.",
    color: "bg-violet-50 text-violet-700",
  },
];

export default function HomePage() {
  const stats = curriculumStats(getCurriculum());

  return (
    <main>
      <section className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-10 px-6 pb-6 pt-10 lg:grid-cols-[1.25fr_1fr] lg:pt-14">
        <div>
          <span className="inline-block rounded-full bg-gold-soft px-4 py-1 text-[0.9rem] font-semibold text-amber-800">
            {SITE.subject} · {SITE.grade} · {SITE.curriculum}
          </span>
          <h1 className="mt-5 text-[2.6rem] font-bold leading-[1.25] lg:text-[3.4rem] text-ink">{SITE.name}</h1>
          <p className="mt-5 max-w-[34rem] text-[1.35rem] font-medium leading-[1.9] text-brand">
            {SITE.motivation}
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link href="/curriculum" className="btn btn-primary px-6 py-3 text-[1.05rem]">
              تصفّح فهرس المنهاج
            </Link>
            <Link href="/lab" className="btn btn-ghost px-6 py-3 text-[1.05rem]">
              المختبر التفاعلي
            </Link>
          </div>
        </div>

        <div aria-hidden="true" className="grid grid-cols-4 gap-3 justify-self-center">
          {SYMBOLS.map((s, i) => (
            <div
              key={s}
              className={`card grid h-[5.2rem] w-[5.2rem] place-items-center text-[1.7rem] text-ink ${
                i % 3 === 0 ? "bg-brand text-white" : i % 3 === 1 ? "bg-gold-soft" : ""
              } ${i % 2 ? "translate-y-4" : ""}`}
            >
              <M tex={s} />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-10 grid max-w-[1280px] grid-cols-1 gap-5 px-6 sm:grid-cols-2 lg:grid-cols-4">
        {AREAS.map((a) => (
          <Link key={a.href} href={a.href} className="card group p-5 transition-transform hover:-translate-y-1">
            <span className={`inline-block rounded-lg px-3 py-1 text-[0.85rem] font-bold ${a.color}`}>
              {a.title}
            </span>
            <p className="mt-3 text-[1rem] leading-[1.8] text-ink-soft">{a.text}</p>
          </Link>
        ))}
      </section>

      <section className="mx-auto mt-10 max-w-[1280px] px-6">
        <div className="card flex flex-wrap items-center justify-between gap-8 p-6">
          <div>
            <h2 className="text-xl font-bold">حالة المنهاج على المنصة</h2>
            <p className="mt-1 text-[1rem] text-ink-soft">
              {stats.units === 0
                ? "لم يُضف فهرس المنهاج بعد. تظهر الوحدات والدروس هنا فور اعتماد الفهرس."
                : "الأرقام التالية تعكس ما أُضيف فعليًا إلى المنصة."}
            </p>
          </div>
          <dl className="flex items-center gap-8">
            {[
              ["الوحدات", stats.units],
              ["الدروس في الفهرس", stats.lessons],
              ["الدروس المكتملة", stats.published],
            ].map(([label, value]) => (
              <div key={label} className="text-center">
                <dd className="text-[2.2rem] font-bold leading-none text-brand tabular-nums">{value}</dd>
                <dt className="mt-1 text-[0.9rem] text-ink-soft">{label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </main>
  );
}
