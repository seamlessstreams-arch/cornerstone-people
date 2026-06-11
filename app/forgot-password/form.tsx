"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { requestPasswordReset } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Sending…" : "Send reset link"}
    </button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useFormState(requestPasswordReset, {
    ok: false,
    message: "",
    devLink: undefined as string | undefined,
  });

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="input"
        />
      </div>

      {state?.message ? (
        <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"}>
          {state.message}
        </p>
      ) : null}

      {state?.devLink ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <p className="font-semibold">Development mode — no email provider set.</p>
          <p className="mt-1">Use this reset link directly:</p>
          <Link href={state.devLink} className="mt-1 block break-all font-medium text-amber-900 underline">
            {state.devLink}
          </Link>
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );
}
