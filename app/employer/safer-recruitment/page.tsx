import Link from "next/link";
import { requireEmployer } from "@/lib/auth";
import { dashboardStats } from "@/lib/safer-recruitment-data";
import { PageHeader, StatCard, StatusBadge, EmptyState } from "@/components/ui";
import { SR_STAGE_LABELS, type SrStage } from "@/lib/constants";

export const dynamic = "force-dynamic";

const START_ELIGIBILITY_LABELS: Record<string, string> = {
  NOT_ELIGIBLE: "Not eligible",
  CONDITIONAL: "Conditional",
  EXCEPTIONAL_SUPERVISED_ONLY: "Exceptional — supervised",
  CLEARED: "Cleared",
};

export default async function SaferRecruitmentDashboard({
  searchParams,
}: {
  searchParams?: { rag?: string; q?: string };
}) {
  const { employer } = await requireEmployer();
  const s = await dashboardStats(employer.id);

  const ragParam = (searchParams?.rag ?? "").toUpperCase();
  const activeRag = ["RED", "AMBER", "GREEN"].includes(ragParam) ? ragParam : "";
  const q = (searchParams?.q ?? "").trim();

  const filtered = s.cases.filter((c) => {
    if (activeRag && c.compliance.rag !== activeRag) return false;
    if (q && !(c.candidate.fullName ?? "").toLowerCase().includes(q.toLowerCase()))
      return false;
    return true;
  });

  // Build a dashboard URL, preserving the param that isn't being changed.
  const hrefWith = (next: { rag?: string; q?: string }) => {
    const params = new URLSearchParams();
    const r = next.rag !== undefined ? next.rag : activeRag;
    const query = next.q !== undefined ? next.q : q;
    if (r) params.set("rag", r);
    if (query) params.set("q", query);
    const qs = params.toString();
    return `/employer/safer-recruitment${qs ? `?${qs}` : ""}`;
  };

  const ragFilters: { label: string; value: string }[] = [
    { label: "All", value: "" },
    { label: "Red", value: "RED" },
    { label: "Amber", value: "AMBER" },
    { label: "Green", value: "GREEN" },
  ];

  return (
    <div>
      <PageHeader
        title="Safer recruitment"
        subtitle="Track every matched candidate through pre-employment checks. The system chases, flags and summarises — a named human always makes the decision."
        action={
          <Link href="/employer/safer-recruitment/record" className="btn-secondary">
            Single Central Record
          </Link>
        }
      />

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
        Compliance status
      </h2>
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Red — not eligible" value={s.red} tone={s.red ? "danger" : "default"} />
        <StatCard label="Amber — in progress" value={s.amber} tone={s.amber ? "warn" : "default"} />
        <StatCard label="Green — cleared" value={s.green} tone="good" />
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-stone-500">
        Checks at a glance
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Active cases" value={s.activeCount} />
        <StatCard label="Reference hold" value={s.referenceHold} tone={s.referenceHold ? "warn" : "default"} />
        <StatCard label="DBS hold" value={s.dbsHold} tone={s.dbsHold ? "warn" : "default"} />
        <StatCard label="Gap hold" value={s.gapHold} tone={s.gapHold ? "warn" : "default"} />
        <StatCard label="RM/RI review" value={s.rmReview} tone={s.rmReview ? "danger" : "default"} />
        <StatCard label="Risk alerts" value={s.riskAlerts} tone={s.riskAlerts ? "danger" : "default"} />
        <StatCard label="Overdue chasers" value={s.overdueChasers} tone={s.overdueChasers ? "warn" : "default"} />
        <StatCard label="Cleared to start" value={s.cleared} tone="good" />
        <StatCard
          label="Avg days to reference"
          value={s.avgDaysToReference ?? "—"}
          hint="from request sent to received"
        />
        <StatCard label="Exceptional starts" value={s.exceptional} tone={s.exceptional ? "warn" : "default"} />
      </div>

      <div className="mb-3 mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Cases{filtered.length !== s.cases.length ? ` (${filtered.length}/${s.cases.length})` : ""}
        </h2>
        {s.cases.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1">
              {ragFilters.map((f) => (
                <Link
                  key={f.label}
                  href={hrefWith({ rag: f.value })}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                    activeRag === f.value
                      ? "bg-brand-600 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {f.label}
                </Link>
              ))}
            </div>
            <form method="get" className="flex gap-1">
              {activeRag ? <input type="hidden" name="rag" value={activeRag} /> : null}
              <input
                name="q"
                defaultValue={q}
                placeholder="Search name…"
                className="input px-2.5 py-1 text-xs"
              />
              <button className="btn-secondary px-2.5 py-1 text-xs">Search</button>
            </form>
          </div>
        ) : null}
      </div>

      {s.cases.length === 0 ? (
        <EmptyState title="No safer-recruitment cases yet">
          Open a case from a match to begin pre-employment checks. Cases only
          start once you and a candidate have matched and their identity is
          unlocked.
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState title="No cases match the filter">
          <Link href="/employer/safer-recruitment" className="text-brand-700 hover:underline">
            Clear filters
          </Link>
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-400">
              <tr>
                <th className="px-4 py-2 font-medium">Candidate</th>
                <th className="px-4 py-2 font-medium">Compliance</th>
                <th className="px-4 py-2 font-medium">Start eligibility</th>
                <th className="px-4 py-2 font-medium">Stage</th>
                <th className="px-4 py-2 font-medium">Refs</th>
                <th className="px-4 py-2 font-medium">DBS</th>
                <th className="px-4 py-2 font-medium">Next action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((c) => {
                const received = c.references.filter(
                  (r) => r.status === "RECEIVED" || r.status === "VERIFIED"
                ).length;
                return (
                  <tr key={c.id} className="align-top hover:bg-stone-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/employer/safer-recruitment/${c.id}`}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {c.candidate.fullName ?? "Candidate"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={c.compliance.rag}
                        label={c.compliance.rag.toLowerCase()}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={c.compliance.startEligibility}
                        label={START_ELIGIBILITY_LABELS[c.compliance.startEligibility]}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={c.stage}
                        label={SR_STAGE_LABELS[c.stage as SrStage]}
                      />
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {received}/{c.references.length}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {c.dbsCheck?.certificateSeen ? "Seen" : "—"}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-stone-600">
                      {c.compliance.nextAction}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
