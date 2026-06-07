import { requireEmployer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui";

export default async function MarketPage() {
  const { employer } = await requireEmployer();
  const positions = await prisma.position.findMany({
    where: { active: true },
    include: { employer: { select: { companyName: true, region: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Market"
        subtitle="Open positions across the region. Market visibility helps you benchmark and pitch — but you can never see other homes' candidate activity."
      />

      {positions.length === 0 ? (
        <EmptyState title="No open positions in the market yet" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {positions.map((p) => {
            const mine = p.employerId === employer.id;
            return (
              <div key={p.id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-stone-900">{p.title}</p>
                    <p className="text-sm text-stone-500">
                      {p.employer.companyName}
                      {mine ? " (you)" : ""}
                    </p>
                  </div>
                  <span className="text-xs text-stone-400">
                    {[p.region ?? p.employer.region, p.shiftPattern]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                {p.description ? (
                  <p className="mt-2 text-sm text-stone-600">{p.description}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
