import Link from "next/link";
import { prisma } from "@/lib/db";
import { submitPublicReference } from "@/app/actions/public-reference";

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
          Your answers are recorded securely for safer-recruitment purposes.
        </p>
      </div>
    </main>
  );
}

export default async function PublicReferencePage({
  params,
}: {
  params: { token: string };
}) {
  const req = await prisma.referenceRequest.findUnique({
    where: { publicToken: params.token },
    include: { case: { include: { candidate: true, employer: true } } },
  });

  if (!req) {
    return (
      <Shell>
        <h1 className="text-xl font-semibold text-stone-900">Link not found</h1>
        <p className="mt-2 text-sm text-stone-600">
          This reference link is invalid. Please check with the person who sent it.
        </p>
      </Shell>
    );
  }

  const expired = req.tokenExpiresAt ? req.tokenExpiresAt < new Date() : false;
  if (expired && req.status !== "RECEIVED" && req.status !== "VERIFIED") {
    return (
      <Shell>
        <h1 className="text-xl font-semibold text-stone-900">Link expired</h1>
        <p className="mt-2 text-sm text-stone-600">
          This reference link has expired. Please ask {req.case.employer.companyName}
          {" "}to send you a new one.
        </p>
      </Shell>
    );
  }

  if (req.status === "RECEIVED" || req.status === "VERIFIED") {
    return (
      <Shell>
        <h1 className="text-xl font-semibold text-emerald-700">Reference received ✓</h1>
        <p className="mt-2 text-sm text-stone-600">
          Thank you, {req.refereeName}. Your reference has been submitted — nothing
          more is needed.
        </p>
      </Shell>
    );
  }

  const candidateName = req.case.candidate.fullName ?? "the candidate";

  return (
    <Shell>
      <h1 className="text-xl font-semibold text-stone-900">
        Safer recruitment reference
      </h1>
      <p className="mt-2 text-sm text-stone-600">
        {req.case.employer.companyName} has asked you to provide a reference for{" "}
        <strong>{candidateName}</strong>, for a role working with children. Please
        answer honestly and factually. This form should be completed by a senior
        person with the authority to give a reference.
      </p>

      <form action={submitPublicReference} className="mt-5 space-y-4">
        <input type="hidden" name="token" value={req.publicToken!} />

        <div>
          <label className="label">Your job title</label>
          <input name="refereeJobTitle" className="input" />
        </div>
        <label className="flex items-start gap-2 text-sm text-stone-700">
          <input type="checkbox" name="authorised" className="mt-1" />
          I am authorised to provide this reference on behalf of my organisation.
        </label>

        <div>
          <label className="label">Did {candidateName} work for your organisation, and when?</label>
          <input name="employmentDates" placeholder="e.g. Jan 2020 – Mar 2023" className="input" />
        </div>
        <div>
          <label className="label">What role did they hold?</label>
          <input name="roleHeld" className="input" />
        </div>
        <div>
          <label className="label">Did the role involve working with children or vulnerable adults?</label>
          <select name="workedWithChildren" defaultValue="" className="input">
            <option value="">Please choose…</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div>
          <label className="label">What was their reason for leaving?</label>
          <textarea name="reasonForLeaving" rows={2} className="input" />
        </div>
        <div>
          <label className="label">Were there any disciplinary concerns?</label>
          <textarea name="disciplinary" rows={2} className="input" />
        </div>
        <div>
          <label className="label">
            Were there any substantiated safeguarding concerns or allegations?
          </label>
          <textarea name="safeguarding" rows={2} className="input" />
        </div>
        <div>
          <label className="label">
            Any concerns about professional boundaries, honesty, conduct, reliability or recording?
          </label>
          <textarea name="conduct" rows={2} className="input" />
        </div>
        <div>
          <label className="label">Do you consider them suitable to work with children?</label>
          <textarea name="suitability" rows={2} className="input" />
        </div>
        <div>
          <label className="label">Would you re-employ this person?</label>
          <select name="wouldReEmploy" defaultValue="" className="input">
            <option value="">Please choose…</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div>
          <label className="label">Anything else relevant to safer recruitment?</label>
          <textarea name="other" rows={2} className="input" />
        </div>

        <label className="flex items-start gap-2 text-sm text-stone-700">
          <input type="checkbox" name="declaration" required className="mt-1" />
          I confirm the information provided is true and accurate to the best of my
          knowledge.
        </label>

        <button type="submit" className="btn-primary w-full">
          Submit reference
        </button>
      </form>
    </Shell>
  );
}
