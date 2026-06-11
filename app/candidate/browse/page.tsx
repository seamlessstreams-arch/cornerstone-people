import Link from "next/link";
import { requireCandidate } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { expressInterestAction } from "@/app/actions/connection";
import { PageHeader, EmptyState, Field } from "@/components/ui";

export default async function CandidateBrowsePage({
  searchParams,
}: {
  searchParams: { region?: string };
}) {
  const { candidate } = await requireCandidate();
  const region = (searchParams.region ?? "").trim();

  // Candidates may NOT see employers they've blocked (they chose to hide).
  const blocks = await prisma.block.findMany({
    where: { candidateId: candidate.id },
    select: { employerId: true },
  });
  const blockedIds = blocks.map((b) => b.employerId);

  const employers = await prisma.employer.findMany({
    where: {
      id: { notIn: blockedIds },
      ...(region
        ? { region: { contains: region, mode: "insensitive" as const } }
        : {}),
    },
    include: { positions: { where: { active: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const myInterests = await prisma.interest.findMany({
    where: { candidateId: candidate.id, direction: "CANDIDATE" },
    select: { employerId: true },
  });
  const interestedIds = new Set(myInterests.map((i) => i.employerId));

  const matches = await prisma.match.findMany({
    where: { candidateId: candidate.id },
    select: { employerId: true, id: true },
  });
  const matchByEmployer = new Map(matches.map((m) => [m.employerId, m.id]));

  return (
    <div>
      <PageHeader
        title="Browse homes"
        subtitle="Express interest in homes that fit. You only unlock a conversation when they're interested too."
      />

      <form method="get" className="mb-5 flex flex-wrap items-end gap-3">
        <div className="min-w-[14rem] flex-1">
          <label htmlFor="region" className="label">
            Filter by region
          </label>
          <input
            id="region"
            type="text"
            name="region"
            defaultValue={region}
            placeholder="e.g. Greater Manchester"
            className="input"
          />
        </div>
        <button type="submit" className="btn-primary">
          Filter
        </button>
        {region ? (
          <Link href="/candidate/browse" className="btn-secondary">
            Clear
          </Link>
        ) : null}
      </form>

      {employers.length === 0 ? (
        <EmptyState title={region ? `No homes match “${region}”` : "No homes to show yet"}>
          {region
            ? "Try a broader region, or clear the filter to see every home."
            : "As homes join your region they’ll appear here."}
        </EmptyState>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {employers.map((e) => {
            const matchId = matchByEmployer.get(e.id);
            const interested = interestedIds.has(e.id);
            return (
              <div key={e.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900">
                      {e.companyName}
                    </h3>
                    {e.region ? (
                      <p className="text-sm text-stone-500">{e.region}</p>
                    ) : null}
                  </div>
                  {matchId ? (
                    <Link
                      href={`/candidate/matches/${matchId}`}
                      className="chip"
                    >
                      Matched
                    </Link>
                  ) : null}
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <Field label="Ethos" value={e.ethos} />
                  <Field label="Children supported" value={e.childrenSupported} />
                  <Field label="Shift pattern" value={e.shiftPattern} />
                  <Field label="Compensation" value={e.compensation} />
                  <div className="col-span-2">
                    <Field label="Selling points" value={e.sellingPoints} />
                  </div>
                  <div className="col-span-2">
                    <Field label="Support offered" value={e.supportOffered} />
                  </div>
                  <div className="col-span-2">
                    <Field
                      label="Placement picture"
                      value={e.placementPicture}
                    />
                  </div>
                </dl>

                {e.positions.length > 0 ? (
                  <div className="mt-4 border-t border-stone-100 pt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                      Open positions
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {e.positions.map((p) => (
                        <li key={p.id} className="text-sm text-stone-700">
                          <span className="font-medium">{p.title}</span>
                          {p.region ? ` · ${p.region}` : ""}
                          {p.shiftPattern ? ` · ${p.shiftPattern}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-5">
                  {matchId ? (
                    <Link
                      href={`/candidate/matches/${matchId}`}
                      className="btn-primary w-full justify-center"
                    >
                      Open conversation
                    </Link>
                  ) : interested ? (
                    <button
                      disabled
                      className="btn-secondary w-full justify-center"
                    >
                      Interest sent — waiting on them
                    </button>
                  ) : (
                    <form action={expressInterestAction}>
                      <input type="hidden" name="employerId" value={e.id} />
                      <button
                        type="submit"
                        className="btn-primary w-full justify-center"
                      >
                        I&apos;m interested
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
