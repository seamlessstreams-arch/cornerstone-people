import { requireEmployer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState, MetaBadge } from "@/components/ui";
import { saveReferenceBankEntry } from "@/app/actions/safer-recruitment";
import { REFERENCE_REQUEST_METHODS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ReferenceBank() {
  const { employer } = await requireEmployer();
  const entries = await prisma.referenceBankEntry.findMany({
    where: { employerId: employer.id },
    orderBy: { organisationName: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Reference bank"
        subtitle="Your reusable directory of referee organisations and how they handle reference requests — so chasing the same employer is fast next time. This stores factual process/contact data your organisation maintains, not cross-employer opinions about candidates."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {entries.length === 0 ? (
            <EmptyState title="No reference bank entries yet">
              Add a referee organisation to reuse its details across cases.
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {entries.map((e) => (
                <div key={e.id} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-stone-900">
                        {e.organisationName}
                      </div>
                      <div className="text-xs text-stone-400">
                        {e.organisationType ?? "—"}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {e.preferredMethod ? <MetaBadge>{e.preferredMethod}</MetaBadge> : null}
                      {e.factualOnly ? <MetaBadge>factual only</MetaBadge> : null}
                      {e.consentFormRequired ? <MetaBadge>consent form</MetaBadge> : null}
                      {e.providesSafeguardingComment ? (
                        <MetaBadge>safeguarding comment</MetaBadge>
                      ) : null}
                    </div>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div className="text-stone-500">HR email</div>
                    <div className="text-stone-800">{e.hrEmail ?? "—"}</div>
                    <div className="text-stone-500">Referee</div>
                    <div className="text-stone-800">
                      {e.refereeName ?? "—"}
                      {e.refereeRole ? ` (${e.refereeRole})` : ""}
                    </div>
                    <div className="text-stone-500">Portal</div>
                    <div className="truncate text-stone-800">{e.portalLink ?? "—"}</div>
                    <div className="text-stone-500">Chase pattern</div>
                    <div className="text-stone-800">{e.chasePattern ?? "—"}</div>
                  </dl>
                  {e.notes ? (
                    <p className="mt-2 text-xs text-stone-500">{e.notes}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="card sticky top-4">
            <h2 className="font-semibold text-stone-900">Add entry</h2>
            <form action={saveReferenceBankEntry} className="mt-3 space-y-2">
              <input name="organisationName" required placeholder="Organisation name" className="input" />
              <input name="organisationType" placeholder="Type (e.g. children's home, LA)" className="input" />
              <input name="hrEmail" type="email" placeholder="HR email" className="input" />
              <input name="hrPhone" placeholder="HR phone" className="input" />
              <input name="portalLink" placeholder="Reference portal link" className="input" />
              <input name="refereeName" placeholder="Named referee" className="input" />
              <input name="refereeRole" placeholder="Referee role" className="input" />
              <input name="refereeEmail" type="email" placeholder="Referee email" className="input" />
              <select name="preferredMethod" defaultValue="" className="input">
                <option value="">Preferred method…</option>
                {REFERENCE_REQUEST_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <input name="chasePattern" placeholder="Chase pattern (e.g. 7/14/21 days)" className="input" />
              <input name="documentsRequired" placeholder="Documents required" className="input" />
              <div className="grid grid-cols-1 gap-1 pt-1 text-xs text-stone-600">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="consentFormRequired" /> Consent form required
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="phoneVerificationAccepted" /> Phone verification accepted
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="factualOnly" /> Provides factual references only
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="providesSafeguardingComment" /> Provides safeguarding suitability comment
                </label>
              </div>
              <textarea name="notes" rows={2} placeholder="Notes" className="input" />
              <button className="btn-primary w-full px-4 py-2 text-sm">Save entry</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
