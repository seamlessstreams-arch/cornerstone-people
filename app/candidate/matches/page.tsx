import Link from "next/link";
import { requireCandidate } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui";

export default async function CandidateMatchesPage() {
  const { candidate } = await requireCandidate();
  const matches = await prisma.match.findMany({
    where: { candidateId: candidate.id },
    include: {
      employer: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Matches"
        subtitle="A mutual match unlocks the home's full profile and a conversation."
      />
      {matches.length === 0 ? (
        <EmptyState title="No matches yet">
          When a home you&apos;re interested in is interested back, they appear
          here.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {matches.map((m) => (
            <li key={m.id}>
              <Link
                href={`/candidate/matches/${m.id}`}
                className="card flex items-center justify-between transition hover:border-brand-300"
              >
                <div>
                  <p className="font-medium text-stone-900">
                    {m.employer.companyName}
                  </p>
                  <p className="text-sm text-stone-500">
                    {m.messages[0]
                      ? m.messages[0].body.slice(0, 80)
                      : "Say hello to start the conversation."}
                  </p>
                </div>
                <div className="text-right">
                  {m.interviewRequestedAt ? (
                    <span className="chip">Interview requested</span>
                  ) : (
                    <span className="text-sm text-brand-700">Open →</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
