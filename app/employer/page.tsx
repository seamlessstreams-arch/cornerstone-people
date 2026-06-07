import Link from "next/link";
import { requireEmployer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { browsableCandidatesForEmployer } from "@/lib/matching";
import { PageHeader } from "@/components/ui";

export default async function EmployerDashboard() {
  const { employer } = await requireEmployer();

  const positionsCount = await prisma.position.count({
    where: { employerId: employer.id, active: true },
  });
  const matchCount = await prisma.match.count({
    where: { employerId: employer.id },
  });
  const pool = await browsableCandidatesForEmployer(employer.id);
  const verifiedInPool = pool.filter((c) => c.verified).length;

  const profileComplete = Boolean(
    employer.ethos && employer.childrenSupported && employer.compensation
  );

  return (
    <div>
      <PageHeader
        title={employer.companyName}
        subtitle="Browse a pool of pre-verified candidates. You only unlock identities when interest is mutual."
      />

      {!profileComplete ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Your company profile is incomplete. A fuller profile helps candidates
          choose you.{" "}
          <Link href="/employer/profile" className="font-medium underline">
            Complete it now
          </Link>
          .
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Candidates in your pool"
          value={pool.length}
          href="/employer/browse"
          cta="Browse"
        />
        <Stat
          label="Verified candidates"
          value={verifiedInPool}
          href="/employer/browse"
          cta="Browse"
        />
        <Stat
          label="Active positions"
          value={positionsCount}
          href="/employer/positions"
          cta="Manage"
        />
        <Stat
          label="Mutual matches"
          value={matchCount}
          href="/employer/matches"
          cta="View"
        />
      </div>

      <div className="mt-6 card">
        <h3 className="font-semibold text-stone-900">How matching works</h3>
        <ol className="mt-3 space-y-2 text-sm text-stone-600">
          <li>
            1. Browse anonymised candidate cards. Candidates who&apos;ve blocked
            you simply never appear — you&apos;ll never know.
          </li>
          <li>
            2. Express interest in candidates that fit. Nothing is sent to them
            as spam.
          </li>
          <li>
            3. When a candidate is interested in you too, their full profile and
            verified references unlock, and a conversation opens.
          </li>
        </ol>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
  cta,
}: {
  label: string;
  value: number;
  href: string;
  cta: string;
}) {
  return (
    <div className="card">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-brand-700">{value}</p>
      <Link href={href} className="btn-secondary mt-3 w-full justify-center">
        {cta}
      </Link>
    </div>
  );
}
