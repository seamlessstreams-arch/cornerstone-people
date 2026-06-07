import Link from "next/link";
import { requireCandidate } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  countVerifiedReferences,
  isCandidateVerified,
} from "@/lib/matching";
import {
  REQUIRED_CANDIDATE_FIELDS,
  REQUIRED_VERIFIED_REFERENCES,
} from "@/lib/constants";
import { PageHeader, VerifiedBadge } from "@/components/ui";

export default async function CandidateDashboard() {
  const { candidate } = await requireCandidate();

  const filled = REQUIRED_CANDIDATE_FIELDS.filter(
    (f) => (candidate as Record<string, unknown>)[f]
  ).length;
  const completion = Math.round(
    (filled / REQUIRED_CANDIDATE_FIELDS.length) * 100
  );

  const verifiedRefs = await countVerifiedReferences(candidate.id);
  const verified = await isCandidateVerified(candidate.id);

  const matchCount = await prisma.match.count({
    where: { candidateId: candidate.id },
  });
  const interestFromEmployers = await prisma.interest.count({
    where: { candidateId: candidate.id, direction: "EMPLOYER" },
  });

  return (
    <div>
      <PageHeader
        title="Your dashboard"
        subtitle="Build a strong profile so homes can find and choose you."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-stone-900">Profile completion</h3>
            <span className="text-sm font-semibold text-brand-700">
              {completion}%
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
          <Link
            href="/candidate/profile"
            className="btn-secondary mt-4 w-full justify-center"
          >
            {completion === 100 ? "Edit profile" : "Complete your profile"}
          </Link>
        </div>

        <div className="card">
          <h3 className="font-semibold text-stone-900">References</h3>
          <div className="mt-2">
            {verified ? (
              <VerifiedBadge />
            ) : (
              <p className="text-sm text-stone-500">
                {verifiedRefs} of {REQUIRED_VERIFIED_REFERENCES} verified — get{" "}
                {Math.max(0, REQUIRED_VERIFIED_REFERENCES - verifiedRefs)} more
                to earn your badge.
              </p>
            )}
          </div>
          <Link
            href="/candidate/references"
            className="btn-secondary mt-4 w-full justify-center"
          >
            Manage references
          </Link>
        </div>

        <div className="card">
          <h3 className="font-semibold text-stone-900">Visibility</h3>
          <p className="mt-2 text-sm text-stone-600">
            You are in{" "}
            <strong>
              {candidate.visibilityMode === "OPEN"
                ? "Open mode"
                : "Anonymous mode"}
            </strong>
            .{" "}
            {candidate.visibilityMode === "OPEN"
              ? "Non-blocked homes see your name, photo and history up front."
              : "Homes see an anonymised card until interest is mutual."}
          </p>
          <Link
            href="/candidate/profile#visibility"
            className="btn-secondary mt-4 w-full justify-center"
          >
            Change visibility
          </Link>
        </div>

        <div className="card">
          <h3 className="font-semibold text-stone-900">Mutual matches</h3>
          <p className="mt-2 text-3xl font-semibold text-brand-700">
            {matchCount}
          </p>
          <Link
            href="/candidate/matches"
            className="btn-secondary mt-4 w-full justify-center"
          >
            View matches
          </Link>
        </div>

        <div className="card">
          <h3 className="font-semibold text-stone-900">Homes interested</h3>
          <p className="mt-2 text-sm text-stone-600">
            {interestFromEmployers > 0
              ? "Homes have shown interest. Express interest back to unlock a conversation — we never reveal who, to keep the choice yours."
              : "No interest yet. Browse homes and express interest to get things moving."}
          </p>
          <Link
            href="/candidate/browse"
            className="btn-primary mt-4 w-full justify-center"
          >
            Browse homes
          </Link>
        </div>
      </div>
    </div>
  );
}
