import { renderTex } from "@/components/math/Math";
import { ENGINEER, WHATSAPP_URL } from "@/lib/site";

/** علامة المهندس: الأحرف SR بخط KaTeX الحقيقي داخل ختم دائري. */
export function EngineerMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      dir="ltr"
      className={`eng-mark eng-mark-${size}`}
      dangerouslySetInnerHTML={{ __html: renderTex("\\boldsymbol{SR}") }}
    />
  );
}

export function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

/**
 * سطر المهندس: [SR] المهندس سومر شاهين · أيقونة واتساب + الرقم.
 * الرابط كاملًا يفتح محادثة واتساب (wa.me).
 */
export function EngineerLink({
  variant = "header",
}: {
  variant?: "header" | "footer" | "strip";
}) {
  const dark = variant === "footer";
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${ENGINEER.name} — مراسلة عبر واتساب على الرقم ${ENGINEER.localPhone}`}
      className={`group inline-flex items-center gap-3 rounded-full border transition-colors ${
        variant === "header"
          ? "border-ink/10 bg-white py-1 pe-3 ps-1 hover:border-emerald-500/60"
          : variant === "strip"
            ? "border-ink/10 bg-white/70 py-1 pe-3 ps-1 hover:border-emerald-500/60"
            : "border-white/15 bg-white/5 py-1.5 pe-4 ps-1.5 hover:border-emerald-400/70 hover:bg-white/10"
      }`}
    >
      <EngineerMark size={variant === "footer" ? "md" : "sm"} />
      <span
        className={`text-[0.95rem] font-semibold ${dark ? "text-white" : "text-ink"}`}
      >
        {ENGINEER.name}
      </span>
      <span
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.85rem] font-medium ${
          dark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-700"
        }`}
      >
        <WhatsAppIcon className="h-4 w-4" />
        <span dir="ltr" className="tabular-nums tracking-wide">
          {ENGINEER.localPhone}
        </span>
      </span>
    </a>
  );
}
