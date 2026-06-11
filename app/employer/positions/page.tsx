import Link from "next/link";
import { requireEmployer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  createPosition,
  deletePosition,
  togglePosition,
} from "@/app/actions/employer";
import { PageHeader, EmptyState, Select } from "@/components/ui";
import { REGIONS, SHIFT_PATTERNS } from "@/lib/constants";

export default async function PositionsPage() {
  const { employer } = await requireEmployer();
  const positions = await prisma.position.findMany({
    where: { employerId: employer.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Positions"
        subtitle="Open roles. These are visible in the shared market so other homes can see what's live (and you can see theirs)."
      />

      <section className="card mb-6">
        <h2 className="font-semibold text-stone-900">Add a position</h2>
        <form action={createPosition} className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Title</label>
            <input
              name="title"
              required
              className="input"
              placeholder="e.g. Residential Support Worker"
            />
          </div>
          <div>
            <label className="label">Region</label>
            <Select name="region" options={REGIONS} />
          </div>
          <div>
            <label className="label">Shift pattern</label>
            <Select name="shiftPattern" options={SHIFT_PATTERNS} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea
              name="description"
              rows={3}
              className="input"
              placeholder="The role, the team, what you're looking for…"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" className="btn-primary">
              Add position
            </button>
          </div>
        </form>
      </section>

      {positions.length === 0 ? (
        <EmptyState title="No positions yet">
          Add your first open role above.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {positions.map((p) => (
            <li key={p.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-stone-900">
                    {p.title}{" "}
                    {!p.active ? (
                      <span className="ml-1 text-xs text-stone-400">
                        (closed)
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-stone-500">
                    {[p.region, p.shiftPattern].filter(Boolean).join(" · ")}
                  </p>
                  {p.description ? (
                    <p className="mt-2 text-sm text-stone-600">
                      {p.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/employer/positions/${p.id}/vacancy-pack`}
                    className="btn-secondary px-3 py-1.5"
                  >
                    Vacancy pack
                  </Link>
                  <form action={togglePosition}>
                    <input type="hidden" name="positionId" value={p.id} />
                    <button type="submit" className="btn-secondary px-3 py-1.5">
                      {p.active ? "Close" : "Reopen"}
                    </button>
                  </form>
                  <form action={deletePosition}>
                    <input type="hidden" name="positionId" value={p.id} />
                    <button type="submit" className="btn-danger px-3 py-1.5">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
