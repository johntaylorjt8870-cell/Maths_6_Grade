import { LESSON_STATUS, isLessonStatus } from "@/lib/site";

const TONES: Record<string, string> = {
  slate: "bg-slate-100 text-slate-700 ring-slate-300",
  sky: "bg-sky-50 text-sky-800 ring-sky-300",
  amber: "bg-amber-50 text-amber-800 ring-amber-300",
  violet: "bg-violet-50 text-violet-800 ring-violet-300",
  emerald: "bg-emerald-50 text-emerald-800 ring-emerald-300",
};

export function StatusBadge({ status, long = false }: { status: string; long?: boolean }) {
  const info = isLessonStatus(status) ? LESSON_STATUS[status] : LESSON_STATUS.indexed;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-0.5 text-[0.82rem] font-semibold ring-1 ring-inset ${TONES[info.tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {long ? info.label : info.short}
    </span>
  );
}
