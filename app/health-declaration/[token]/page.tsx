import Link from "next/link";
import { prisma } from "@/lib/db";
import { submitHealthDeclaration } from "@/app/actions/public-health";

export const dynamic = "force-dynamic";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-start justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link href="/" className="text-lg font-semibold tracking-tight text-brand-700">
          Keni
        </Link>
        <div className="mt-4 card">{children}</div>
        <p className="mt-4 text-center text-xs text-stone-400">
          Your answers are confidential and used only to confirm fitness for the role.
        </p>
      </div>
    </main>
  );
}

function YesNo({ name, label }: { name: string; label: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <select name={name} defaultValue="" required className="input">
        <option value="" disabled>
          Please choose…
        </option>
        <option value="no">No</option>
        <option value="yes">Yes</option>
      </select>
    </div>
  );
}

export default async function HealthDeclarationPage({
  params,
}: {
  params: { token: string };
}) {
  const hd = await prisma.healthDeclaration.findUnique({
    where: { publicToken: params.token },
    include: { case: { include: { employer: true } } },
  });

  if (!hd) {
    return (
      <Shell>
        <h1 className="text-xl font-semibold text-stone-900">Link not found</h1>
        <p className="mt-2 text-sm text-stone-600">
          This declaration link is invalid. Please check with the person who sent it.
        </p>
      </Shell>
    );
  }

  if (hd.status !== "PENDING") {
    return (
      <Shell>
        <h1 className="text-xl font-semibold text-emerald-700">Declaration received ✓</h1>
        <p className="mt-2 text-sm text-stone-600">
          Thank you. Your health declaration has been submitted — nothing more is needed.
        </p>
      </Shell>
    );
  }

  if (hd.tokenExpiresAt && hd.tokenExpiresAt < new Date()) {
    return (
      <Shell>
        <h1 className="text-xl font-semibold text-stone-900">Link expired</h1>
        <p className="mt-2 text-sm text-stone-600">
          This link has expired. Please ask {hd.case.employer.companyName} to send a new one.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-xl font-semibold text-stone-900">Health declaration</h1>
      <p className="mt-2 text-sm text-stone-600">
        {hd.case.employer.companyName} asks you to complete this confidential
        declaration about your fitness for the role you&apos;ve been offered. We
        ask only about your ability to carry out the role, and consider
        reasonable adjustments — a declaration does not automatically affect your
        offer.
      </p>

      <form action={submitHealthDeclaration} className="mt-5 space-y-4">
        <input type="hidden" name="token" value={hd.publicToken!} />

        <YesNo name="fitForRole" label="Do you consider yourself fit to carry out the duties of this role?" />
        <YesNo
          name="conditionsAffectingRole"
          label="Do you have any health condition that could affect your ability to do this role safely?"
        />
        <div>
          <label className="label">If yes, please give brief details.</label>
          <textarea name="conditionsDetail" rows={3} className="input" />
        </div>
        <YesNo
          name="reasonableAdjustmentsNeeded"
          label="Would any reasonable adjustments help you carry out the role?"
        />
        <div>
          <label className="label">If yes, what adjustments would help?</label>
          <textarea name="adjustmentsDetail" rows={3} className="input" />
        </div>

        <label className="flex items-start gap-2 text-sm text-stone-700">
          <input type="checkbox" name="declaration" required className="mt-1" />
          I confirm the information I have provided is true and complete to the best
          of my knowledge.
        </label>

        <button type="submit" className="btn-primary w-full">
          Submit declaration
        </button>
      </form>
    </Shell>
  );
}
