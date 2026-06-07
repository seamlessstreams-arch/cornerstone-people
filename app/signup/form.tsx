"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { signup } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Creating account…" : "Create account"}
    </button>
  );
}

export function SignupForm({
  initialRole,
}: {
  initialRole: "CANDIDATE" | "EMPLOYER";
}) {
  const [state, formAction] = useFormState(signup, { error: "" });
  const [role, setRole] = useState<"CANDIDATE" | "EMPLOYER">(initialRole);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="role" value={role} />

      <div>
        <span className="label">I am a…</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRole("CANDIDATE")}
            className={
              role === "CANDIDATE"
                ? "btn-primary justify-center"
                : "btn-secondary justify-center"
            }
          >
            Candidate
          </button>
          <button
            type="button"
            onClick={() => setRole("EMPLOYER")}
            className={
              role === "EMPLOYER"
                ? "btn-primary justify-center"
                : "btn-secondary justify-center"
            }
          >
            Children&apos;s home
          </button>
        </div>
      </div>

      {role === "EMPLOYER" ? (
        <div>
          <label className="label" htmlFor="companyName">
            Home / company name
          </label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            required
            className="input"
            placeholder="e.g. Oakfield Children's Home"
          />
          <p className="mt-1 text-xs text-stone-400">
            Candidates can search this name to block you, so use your real
            trading name.
          </p>
        </div>
      ) : null}

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
      <div>
        <label className="label" htmlFor="password">
          Password
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

      {state?.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
