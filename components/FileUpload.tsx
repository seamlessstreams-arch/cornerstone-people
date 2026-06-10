"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useRef, useEffect } from "react";
import type { UploadActionState } from "@/app/actions/documents";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary px-3 py-1.5 text-sm disabled:opacity-50">
      {pending ? "Uploading…" : label}
    </button>
  );
}

// Generic upload form bound to a server action with (state, formData) signature.
// Accepts hidden fields (e.g. kind, caseId) passed as `hidden`.
export function FileUpload({
  action,
  hidden = {},
  label = "Upload",
  accept = ".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp",
  note,
}: {
  action: (prev: UploadActionState, formData: FormData) => Promise<UploadActionState>;
  hidden?: Record<string, string>;
  label?: string;
  accept?: string;
  note?: string;
}) {
  const [state, formAction] = useFormState(action, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={formAction} className="space-y-2">
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          name="file"
          accept={accept}
          required
          className="block text-sm text-stone-600 file:mr-3 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-stone-700 hover:file:bg-stone-200"
        />
        <SubmitButton label={label} />
      </div>
      {note ? <p className="text-xs text-stone-400">{note}</p> : null}
      {state.error ? (
        <p className="text-xs font-medium text-rose-600">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-xs font-medium text-emerald-600">Uploaded.</p>
      ) : null}
    </form>
  );
}
