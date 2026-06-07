import { requireEmployer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { browsableCandidatesForEmployer } from "@/lib/matching";
import { PageHeader, EmptyState } from "@/components/ui";
import { CandidateCardView } from "@/components/CandidateCardView";

export default async function EmployerBrowsePage() {
  const { employer } = await requireEmployer();

  const cards = await browsableCandidatesForEmployer(employer.id);

  const sent = await prisma.interest.findMany({
    where: { employerId: employer.id, direction: "EMPLOYER" },
    select: { candidateId: true },
  });
  const sentIds = new Set(sent.map((s) => s.candidateId));

  return (
    <div>
      <PageHeader
        title="Browse candidates"
        subtitle="Anonymised cards built from structured fields only. Express interest — identities unlock only when the candidate is interested too."
      />

      {cards.length === 0 ? (
        <EmptyState title="No candidates in your pool yet">
          As verified candidates join your region they&apos;ll appear here.
        </EmptyState>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <CandidateCardView
              key={card.candidateId}
              card={card}
              interestSent={sentIds.has(card.candidateId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
