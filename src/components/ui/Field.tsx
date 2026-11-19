export function Field({
  label,
  name,
  type = "text",
  hint,
  required = true,
  autoComplete,
  dir,
  min,
}: {
  label: string;
  name: string;
  type?: string;
  hint?: string;
  required?: boolean;
  autoComplete?: string;
  dir?: "ltr" | "rtl";
  min?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[0.95rem] font-semibold text-ink">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        dir={dir}
        min={min}
        className="field"
      />
      {hint && <span className="mt-1 block text-[0.85rem] text-ink-soft">{hint}</span>}
    </label>
  );
}
