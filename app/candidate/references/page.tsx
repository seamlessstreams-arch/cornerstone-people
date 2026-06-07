import { requireCandidate } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addReference, deleteReference } from "@/app/actions/candidate";
import { PageHeader, EmptyState, VerifiedBadge } from "@/components/ui";
import { REQUIRED_VERIFIED_REFERENCES } from "@/lib/constants";

export default async function ReferencesPage() {
  const { candidate } = await requireCandidate();
  const references = await prisma.reference.findMany({
    where: { candidateId: candidate.id },
    orderBy: { createdAt: "asc" },
  });
  const verifiedCount = references.filter((r) => r.status === "VERIFIED").length;
  const verified = verifiedCount >= REQUIRED_VERIFIED_REFERENCES;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="References"
        subtitle="Verify your references once. A pre-verified candidate is valuable to a home on day one."
      />

      <div className="card mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-stone-600">
            {verifiedCount} of {REQUIRED_VERIFIED_REFERENCES} required references
            verified.
          </p>
        </div>
        {verified ? (
          <VerifiedBadge />
        ) : (
          <span className="text-sm text-stone-400">Badge locked</span>
        )}
      </div>

      <section className="card mb-6">
        <h2 className="font-semibold text-stone-900">Add a referee</h2>
        <p className="mt-1 text-sm text-stone-500">
          We email your referee a secure link to confirm. We only verify{" "}
          <em>your</em> references — we never store ratings or comments about the
          referees themselves.
        </p>
        <form
          action={addReference}
          className="mt-4 grid gap-4 sm:grid-cols-3"
        >
          <div>
            <label className="label">Referee name</label>
            <input name="refereeName" required className="input" />
          </div>
          <div>
            <label className="label">Referee email</label>
            <input
              name="refereeEmail"
              type="email"
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">Relationship</label>
            <input
              name="relationship"
              required
              className="input"
              placeholder="e.g. Former manager"
            />
          </div>
          <div className="sm:col-span-3 flex justify-end">
            <button type="submit" className="btn-primary">
              Add referee
            </button>
          </div>
        </form>
      </section>

      <h2 className="mb-3 font-semibold text-stone-900">Your referees</h2>
      {references.length === 0 ? (
        <EmptyState title="No referees added yet">
          Add at least {REQUIRED_VERIFIED_REFERENCES} to earn your verified
          badge.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {references.map((r) => (
            <li
              key={r.id}
              className="card flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <p className="font-medium text-stone-900">{r.refereeName}</p>
                <p className="text-sm text-stone-500">
                  {r.relationship} · {r.refereeEmail}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {r.status === "VERIFIED" ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                    Awaiting verification
                  </span>
                )}
                {r.status !== "VERIFIED" ? (
                  <a
                    href={`/verify-reference/${r.token}`}
                    target="_blank"
                    className="text-xs font-medium text-brand-700 underline"
                    title="In production this link is emailed to the referee. Shown here for the demo."
                  >
                    Verification link
                  </a>
                ) : null}
                <form action={deleteReference}>
                  <input type="hidden" name="referenceId" value={r.id} />
                  <button type="submit" className="btn-danger px-3 py-1.5">
                    Remove
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
