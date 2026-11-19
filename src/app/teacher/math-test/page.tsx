import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isTeacher } from "@/lib/auth";
import { M, MathBlock, Q, SvgMath } from "@/components/math/Math";

export const metadata: Metadata = { title: "فحص محرك الرياضيات", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MathTestPage() {
  if (!(await isTeacher())) redirect("/teacher");

  return (
    <main className="mx-auto max-w-[1000px] px-6 py-10">
      <h1 className="text-[2rem] font-bold">فحص محرك الرياضيات (KaTeX)</h1>
      <p className="mt-2 text-ink-soft">
        صفحة فحص داخلية: إن ظهر أي أمر LaTeX نصًا حرفيًا هنا فهناك خلل في المحرك.
      </p>

      <div className="mt-6 space-y-5">
        <section className="card p-6">
          <h2 className="mb-2 text-lg font-bold">رموز داخل فقرة عربية</h2>
          <p>
            إذا كان طول الضلع <Q v="20" u="m" /> وقطعت نملة <Q v="5" u="m/s" /> خلال <Q v="10.2" u="s" /> وكانت
            الكتلة <Q v="3" u="kg" /> فإن التغيّر <M tex="\Delta x = x_2 - x_1" /> والمتجه <M tex="\vec{F}" /> والزاوية{" "}
            <M tex="\theta = 90^\circ" /> والمساحة <M tex="A = \pi r^{2}" />.
          </p>
        </section>

        <section className="card p-6">
          <h2 className="mb-2 text-lg font-bold">كسور عمودية ومعادلات</h2>
          <MathBlock tex="\frac{3}{4} + \frac{1}{4} = \frac{4}{4} = 1" />
          <MathBlock tex="\vec{F} = m\,\vec{a}, \qquad \alpha,\beta,\gamma,\lambda,\mu,\rho,\Omega,\Sigma,\Delta" />
          <MathBlock tex="\sqrt{49} = 7, \qquad \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}, \qquad \mathrm{H_2O},\; \mathrm{Na^+}" />
        </section>

        <section className="card p-6">
          <h2 className="mb-2 text-lg font-bold">معادلات داخل SVG</h2>
          <svg viewBox="0 0 520 170" className="w-full max-w-[520px]" role="img" aria-label="متجه القوة وتغيّر الموضع">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
                <path d="M0 0L10 4L0 8z" fill="#4338ca" />
              </marker>
            </defs>
            <line x1="40" y1="120" x2="400" y2="120" stroke="#4338ca" strokeWidth="3" markerEnd="url(#arrowhead)" />
            <circle cx="40" cy="120" r="5" fill="#16204a" />
            <SvgMath tex="\vec{F}" x={200} y={78} width={50} height={34} color="#4338ca" fontSize={22} />
            <SvgMath tex="\Delta x = 20\,\mathrm{m}" x={150} y={128} width={160} height={34} fontSize={18} />
            <SvgMath tex="\theta" x={50} y={92} width={30} height={26} fontSize={18} />
          </svg>
        </section>
      </div>
    </main>
  );
}
