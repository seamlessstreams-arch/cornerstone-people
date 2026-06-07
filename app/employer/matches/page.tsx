import Link from "next/link";
import { requireEmployer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isCandidateVerified } from "@/lib/matching";
import { PageHeader, EmptyState, VerifiedBadge } from "@/components/ui";

export default async function EmployerMatchesPage() {
  const { employer } = await requireEmployer();
  const matches = await prisma.match.findMany({
    where: { employerId: employer.id },
    include: {
      candidate: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = await Promise.all(
    matches.map(async (m) => ({
      match: m,
      verified: await isCandidateVerified(m.candidateId),
    }))
  );

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Matches"
        subtitle="Mutual matches. The candidate's full profile and verified references are unlocked inside."
      />
      {rows.length === 0 ? (
        <EmptyState title="No matches yet">
          Express interest in candidates — when they&apos;re interested back,
          they appear here.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {rows.map(({ match: m, verified }) => (
            <li key={m.id}>
              <Link
                href={`/employer/matches/${m.id}`}
                className="card flex items-center justify-between transition hover:border-brand-300"
              >
                <div>
                  <p className="flex items-center gap-2 font-medium text-stone-900">
                    {m.candidate.fullName ?? "Candidate"}
                    {verified ? <VerifiedBadge /> : null}
                  </p>
                  <p className="text-sm text-stone-500">
                    {m.messages[0]
                      ? m.messages[0].body.slice(0, 80)
                      : "Start the conversation."}
                  </p>
                </div>
                {m.interviewRequestedAt ? (
                  <span className="chip">Interview requested</span>
                ) : (
                  <span className="text-sm text-brand-700">Open →</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
