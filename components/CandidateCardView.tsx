import type { CandidateCard } from "@/lib/matching";
import { expressInterestAction } from "@/app/actions/connection";
import { Field, Tags, VerifiedBadge } from "@/components/ui";

export function CandidateCardView({
  card,
  interestSent,
}: {
  card: CandidateCard;
  interestSent: boolean;
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-stone-900">
            {card.identityRevealed && card.fullName
              ? card.fullName
              : "Anonymous candidate"}
          </h3>
          <p className="text-sm text-stone-500">
            {[card.roleType, card.experienceLevel].filter(Boolean).join(" · ") ||
              "Candidate"}
          </p>
        </div>
        {card.verified ? <VerifiedBadge /> : null}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Region" value={card.region} />
        <Field label="Shift availability" value={card.shiftPattern} />
        <div className="col-span-2">
          <Field label="Wants to support" value={card.youngPeopleType} />
        </div>
        <div className="col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-stone-400">
            Values
          </dt>
          <dd className="mt-1">
            <Tags tags={card.valuesTags} />
          </dd>
        </div>
      </dl>

      {card.identityRevealed && card.employmentHistory ? (
        <div className="mt-3 border-t border-stone-100 pt-3">
          <Field label="Employment history" value={card.employmentHistory} />
        </div>
      ) : null}

      {!card.identityRevealed ? (
        <p className="mt-3 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">
          Name, photo and history are sealed. They unlock when interest is
          mutual.
        </p>
      ) : null}

      <div className="mt-5">
        {interestSent ? (
          <button disabled className="btn-secondary w-full justify-center">
            Interest sent — waiting on them
          </button>
        ) : (
          <form action={expressInterestAction}>
            <input type="hidden" name="candidateId" value={card.candidateId} />
            <button type="submit" className="btn-primary w-full justify-center">
              Express interest
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
