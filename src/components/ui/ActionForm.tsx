"use client";

import { useActionState, type ReactNode } from "react";
import type { FormState } from "@/app/actions";

export function ActionForm({
  action,
  submitLabel,
  children,
  className = "space-y-4",
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[0.95rem] font-medium text-coral">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-[0.95rem] font-medium text-emerald-700">
          {state.ok}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "لحظة…" : submitLabel}
      </button>
    </form>
  );
}
