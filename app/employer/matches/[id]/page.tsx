import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEmployer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isCandidateVerified } from "@/lib/matching";
import { Field, PageHeader, Tags, VerifiedBadge } from "@/components/ui";
import { MatchThread } from "@/components/MatchThread";
import { openCase } from "@/app/actions/safer-recruitment";

export default async function EmployerMatchDetail({
  params,
}: {
  params: { id: string };
}) {
  const { employer } = await requireEmployer();
  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      candidate: { include: { references: true } },
      messages: { orderBy: { createdAt: "asc" } },
      saferCase: true,
    },
  });

  if (!match || match.employerId !== employer.id) notFound();
  const c = match.candidate;
  const verified = await isCandidateVerified(c.id);
  const verifiedRefs = c.references.filter((r) => r.status === "VERIFIED");
  const tags = (c.valuesTags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <div>
      <PageHeader
        title={c.fullName ?? "Candidate"}
        subtitle="You matched — the full profile and verified references are unlocked."
        action={
          <div className="flex items-center gap-2">
            {match.saferCase ? (
              <Link
                href={`/employer/safer-recruitment/${match.saferCase.id}`}
                className="btn-primary"
              >
                Open safer-recruitment case →
              </Link>
            ) : (
              <form action={openCase}>
                <input type="hidden" name="matchId" value={match.id} />
                <button type="submit" className="btn-primary">
                  Start safer recruitment
                </button>
              </form>
            )}
            <Link href="/employer/matches" className="btn-secondary">
              ← All matches
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-stone-900">Full profile</h2>
              {verified ? <VerifiedBadge /> : null}
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-4">
              <Field label="Role sought" value={c.roleType} />
              <Field label="Experience" value={c.experienceLevel} />
              <Field label="Region" value={c.region} />
              <Field label="Shift availability" value={c.shiftPattern} />
              <div className="col-span-2">
                <Field label="Wants to support" value={c.youngPeopleType} />
              </div>
              <div className="col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-stone-400">
                  Values
                </dt>
                <dd className="mt-1">
                  <Tags tags={tags} />
                </dd>
              </div>
              <div className="col-span-2">
                <Field label="Employment history" value={c.employmentHistory} />
              </div>
              <div className="col-span-2">
                <Field
                  label="What matters to them"
                  value={c.narrative}
                />
              </div>
            </dl>
          </div>

          <div className="card">
            <h2 className="font-semibold text-stone-900">
              Verified references ({verifiedRefs.length})
            </h2>
            {verifiedRefs.length === 0 ? (
              <p className="mt-2 text-sm text-stone-500">
                No verified references yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {verifiedRefs.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  >
                    <span>
                      <span className="font-medium text-stone-900">
                        {r.refereeName}
                      </span>{" "}
                      — {r.relationship}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700">
                      Verified
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <MatchThread
          matchId={match.id}
          viewerRole="EMPLOYER"
          messages={match.messages}
          interviewRequestedBy={match.interviewRequestedBy}
          interviewRequestedAt={match.interviewRequestedAt}
        />
      </div>
    </div>
  );
}
