"use client";

import { useFormState, useFormStatus } from "react-dom";
import { resetPassword } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Saving…" : "Set new password"}
    </button>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useFormState(resetPassword, { error: "" });

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="label" htmlFor="password">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="input"
        />
        <p className="mt-1 text-xs text-stone-400">At least 8 characters.</p>
      </div>
      <div>
        <label className="label" htmlFor="confirm">
          Confirm new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="input"
        />
      </div>
      {state?.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
