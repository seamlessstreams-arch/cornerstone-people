import Link from "next/link";
import { prisma } from "@/lib/db";
import { submitSelfDeclaration } from "@/app/actions/public-self-declaration";

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
          Your answers are confidential and used only for safer-recruitment checks.
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

export default async function SelfDeclarationPage({
  params,
}: {
  params: { token: string };
}) {
  const sd = await prisma.selfDeclaration.findUnique({
    where: { publicToken: params.token },
    include: { case: { include: { candidate: true, employer: true } } },
  });

  if (!sd) {
    return (
      <Shell>
        <h1 className="text-xl font-semibold text-stone-900">Link not found</h1>
        <p className="mt-2 text-sm text-stone-600">
          This declaration link is invalid. Please check with the person who sent it.
        </p>
      </Shell>
    );
  }

  const expired = sd.tokenExpiresAt ? sd.tokenExpiresAt < new Date() : false;

  if (sd.status !== "PENDING") {
    return (
      <Shell>
        <h1 className="text-xl font-semibold text-emerald-700">Declaration received ✓</h1>
        <p className="mt-2 text-sm text-stone-600">
          Thank you. Your self-declaration has been submitted — nothing more is needed.
        </p>
      </Shell>
    );
  }

  if (expired) {
    return (
      <Shell>
        <h1 className="text-xl font-semibold text-stone-900">Link expired</h1>
        <p className="mt-2 text-sm text-stone-600">
          This declaration link has expired. Please ask{" "}
          {sd.case.employer.companyName} to send you a new one.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-xl font-semibold text-stone-900">Self-declaration</h1>
      <p className="mt-2 text-sm text-stone-600">
        As part of safer recruitment for a role working with children,{" "}
        {sd.case.employer.companyName} asks you to complete this confidential
        declaration. Please answer honestly. A disclosure does not automatically
        prevent appointment — it is considered individually by a manager.
      </p>

      <form action={submitSelfDeclaration} className="mt-5 space-y-4">
        <input type="hidden" name="token" value={sd.publicToken!} />

        <YesNo name="hasUnspentConvictions" label="Do you have any unspent criminal convictions?" />
        <YesNo
          name="hasCautionsOrPending"
          label="Do you have any cautions, reprimands, or pending prosecutions to declare (subject to filtering rules)?"
        />
        <YesNo
          name="isBarred"
          label="Are you barred from working with children or vulnerable adults?"
        />
        <YesNo
          name="isDisqualified"
          label="Are you disqualified from working in a children's home, including by association?"
        />
        <div>
          <label className="label">
            If you answered yes to any of the above, please give details.
          </label>
          <textarea name="disclosureDetails" rows={3} className="input" />
        </div>

        <YesNo name="livedOverseas" label="Have you lived or worked outside the UK in the last 5 years?" />
        <div>
          <label className="label">If yes, where and when?</label>
          <input name="overseasDetails" className="input" />
        </div>

        <label className="flex items-start gap-2 text-sm text-stone-700">
          <input type="checkbox" name="declaration" required className="mt-1" />
          I confirm the information I have provided is true and complete to the best
          of my knowledge, and I understand that providing false information may
          result in withdrawal of an offer.
        </label>

        <button type="submit" className="btn-primary w-full">
          Submit declaration
        </button>
      </form>
    </Shell>
  );
}
