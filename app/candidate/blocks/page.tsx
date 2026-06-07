import { requireCandidate } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { blockEmployer, unblockEmployer } from "@/app/actions/candidate";
import { PageHeader, EmptyState } from "@/components/ui";

export default async function BlocksPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const { candidate } = await requireCandidate();
  const q = (searchParams.q ?? "").trim();

  const blocks = await prisma.block.findMany({
    where: { candidateId: candidate.id },
    include: { employer: true },
    orderBy: { createdAt: "desc" },
  });
  const blockedIds = new Set(blocks.map((b) => b.employerId));

  // SQLite's `contains` is case-insensitive for ASCII by default.
  const results = q
    ? await prisma.employer.findMany({
        where: { companyName: { contains: q } },
        orderBy: { companyName: "asc" },
        take: 20,
      })
    : [];

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Block-list"
        subtitle="Name homes that must never see you — your current employer, competitors. Blocking is silent: they're never told and can't infer it."
      />

      <section className="card mb-6">
        <h2 className="font-semibold text-stone-900">Find a home to block</h2>
        <form method="get" className="mt-3 flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by company name…"
            className="input"
          />
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>

        {q ? (
          results.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">
              No homes found matching &ldquo;{q}&rdquo;.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {results.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-stone-900">
                      {e.companyName}
                    </p>
                    {e.region ? (
                      <p className="text-xs text-stone-500">{e.region}</p>
                    ) : null}
                  </div>
                  {blockedIds.has(e.id) ? (
                    <span className="text-sm text-stone-400">Blocked</span>
                  ) : (
                    <form action={blockEmployer}>
                      <input type="hidden" name="employerId" value={e.id} />
                      <button
                        type="submit"
                        className="btn-danger px-3 py-1.5"
                      >
                        Block
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )
        ) : null}
      </section>

      <h2 className="mb-3 font-semibold text-stone-900">
        Blocked homes ({blocks.length})
      </h2>
      {blocks.length === 0 ? (
        <EmptyState title="You haven't blocked anyone">
          Search above to add a home to your block-list.
        </EmptyState>
      ) : (
        <ul className="space-y-2">
          {blocks.map((b) => (
            <li
              key={b.id}
              className="card flex items-center justify-between py-3"
            >
              <div>
                <p className="font-medium text-stone-900">
                  {b.employer.companyName}
                </p>
                {b.employer.region ? (
                  <p className="text-xs text-stone-500">{b.employer.region}</p>
                ) : null}
              </div>
              <form action={unblockEmployer}>
                <input type="hidden" name="employerId" value={b.employerId} />
                <button type="submit" className="btn-secondary px-3 py-1.5">
                  Unblock
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
