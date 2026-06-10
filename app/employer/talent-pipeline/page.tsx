import { requireEmployer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui";
import { addProspect, setProspectStage, deleteProspect } from "@/app/actions/talent";

export const dynamic = "force-dynamic";

const STAGES = ["NEW", "REVIEWING", "INVITED", "ARCHIVED"] as const;

export default async function TalentPipelinePage() {
  const { employer } = await requireEmployer();
  const prospects = await prisma.talentProspect.findMany({
    where: { employerId: employer.id },
    orderBy: [{ stage: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <PageHeader
        title="Talent pipeline"
        subtitle="A private, name-only list of people you're already sourcing — no contact details stored. When you're ready, invite a prospect to create a full, consented profile."
      />

      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        <strong>Lawful use:</strong> only add people you have a legitimate basis
        to track (e.g. applicants you received). This list is private to your
        organisation, holds names only, and is never used to contact anyone — it
        exists to help you remember who to invite onto the platform. The platform
        does not import or scrape candidates from third parties.
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {prospects.length === 0 ? (
            <EmptyState title="No prospects yet">
              Add a name on the right to start your pipeline.
            </EmptyState>
          ) : (
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-400">
                  <tr>
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Source</th>
                    <th className="px-4 py-2 font-medium">Stage</th>
                    <th className="px-4 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {prospects.map((p) => (
                    <tr key={p.id} className="align-top hover:bg-stone-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-stone-900">{p.name}</div>
                        {p.note ? (
                          <div className="text-xs text-stone-400">{p.note}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-stone-600">{p.source ?? "—"}</td>
                      <td className="px-4 py-3">
                        <form action={setProspectStage} className="flex items-center gap-2">
                          <input type="hidden" name="prospectId" value={p.id} />
                          <select
                            name="stage"
                            defaultValue={p.stage}
                            className="input py-1 text-xs"
                          >
                            {STAGES.map((s) => (
                              <option key={s} value={s}>
                                {s.toLowerCase()}
                              </option>
                            ))}
                          </select>
                          <button className="btn-secondary px-2 py-1 text-xs">Set</button>
                        </form>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <form action={deleteProspect}>
                          <input type="hidden" name="prospectId" value={p.id} />
                          <button className="text-xs font-medium text-rose-600 hover:underline">
                            Remove
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <div className="card sticky top-4">
            <h2 className="font-semibold text-stone-900">Add prospect</h2>
            <p className="mt-1 text-xs text-stone-400">Name only — no email or phone.</p>
            <form action={addProspect} className="mt-3 space-y-2">
              <input name="name" required placeholder="Full name" className="input" />
              <input
                name="source"
                placeholder="Source (e.g. CV-Library application)"
                className="input"
              />
              <textarea name="note" rows={2} placeholder="Note (optional)" className="input" />
              <button className="btn-primary w-full px-4 py-2 text-sm">Add to pipeline</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
