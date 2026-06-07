import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCandidate } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Field, PageHeader } from "@/components/ui";
import { MatchThread } from "@/components/MatchThread";

export default async function CandidateMatchDetail({
  params,
}: {
  params: { id: string };
}) {
  const { candidate } = await requireCandidate();
  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      employer: { include: { positions: { where: { active: true } } } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!match || match.candidateId !== candidate.id) notFound();
  const e = match.employer;

  return (
    <div>
      <PageHeader
        title={e.companyName}
        subtitle="You matched — here's their full profile and your conversation."
        action={
          <Link href="/candidate/matches" className="btn-secondary">
            ← All matches
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold text-stone-900">About this home</h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Region" value={e.region} />
            <Field label="Shift pattern" value={e.shiftPattern} />
            <Field label="Children supported" value={e.childrenSupported} />
            <Field label="Compensation" value={e.compensation} />
            <div className="sm:col-span-2">
              <Field label="Ethos" value={e.ethos} />
            </div>
            <div className="sm:col-span-2">
              <Field label="Selling points" value={e.sellingPoints} />
            </div>
            <div className="sm:col-span-2">
              <Field label="Support offered" value={e.supportOffered} />
            </div>
            <div className="sm:col-span-2">
              <Field label="Placement picture" value={e.placementPicture} />
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
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <MatchThread
          matchId={match.id}
          viewerRole="CANDIDATE"
          messages={match.messages}
          interviewRequestedBy={match.interviewRequestedBy}
          interviewRequestedAt={match.interviewRequestedAt}
        />
      </div>
    </div>
  );
}
