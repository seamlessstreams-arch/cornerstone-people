import { requireEmployer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui";
import {
  addAgencyWorker,
  updateAgencyWorker,
  deleteAgencyWorker,
} from "@/app/actions/agency";
import { assessAgencyWorker } from "@/lib/agency";

export const dynamic = "force-dynamic";

const CHECKS: { name: string; label: string }[] = [
  { name: "agencyChecksConfirmed", label: "Agency confirmed checks (written)" },
  { name: "identitySeenOnArrival", label: "Identity seen on arrival" },
  { name: "rightToWorkConfirmed", label: "Right to work confirmed" },
  { name: "dbsConfirmed", label: "DBS confirmed" },
  { name: "referencesConfirmed", label: "References confirmed" },
];

export default async function AgencyPage() {
  const { employer } = await requireEmployer();
  const workers = await prisma.agencyWorker.findMany({
    where: { employerId: employer.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Agency staff"
        subtitle="Agency and bank workers placed at your home. You don't run the full pack, but you must get written confirmation of checks, see identity on arrival, and never allow sole charge until a manager has approved it."
      />

      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        <strong>Hard rule:</strong> no agency worker may be left in sole charge of
        children until a named manager has reviewed the evidence and approved it.
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {workers.length === 0 ? (
            <EmptyState title="No agency workers yet">
              Add one on the right to start tracking their checks.
            </EmptyState>
          ) : (
            workers.map((w) => {
              const a = assessAgencyWorker(w);
              return (
                <div key={w.id} className="card">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-stone-900">{w.fullName}</div>
                      <div className="text-xs text-stone-400">
                        {w.agencyName ?? "—"}
                        {w.role ? ` • ${w.role}` : ""}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold ring-1 ring-inset ${
                          a.canWorkSupervised
                            ? "bg-amber-50 text-amber-700 ring-amber-200"
                            : "bg-rose-50 text-rose-700 ring-rose-200"
                        }`}
                      >
                        {a.canWorkSupervised ? "Supervised only" : "Not cleared"}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold ring-1 ring-inset ${
                          a.soleChargeAllowed
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-stone-100 text-stone-500 ring-stone-200"
                        }`}
                      >
                        {a.soleChargeAllowed ? "Sole charge approved" : "No sole charge"}
                      </span>
                    </div>
                  </div>

                  {a.outstanding.length ? (
                    <p className="mt-2 text-xs text-rose-600">
                      Outstanding: {a.outstanding.join("; ")}.
                    </p>
                  ) : null}

                  <form action={updateAgencyWorker} className="mt-3 space-y-2">
                    <input type="hidden" name="workerId" value={w.id} />
                    <div className="grid gap-1 sm:grid-cols-2">
                      {CHECKS.map((c) => (
                        <label key={c.name} className="flex items-center gap-2 text-xs text-stone-700">
                          <input type="checkbox" name={c.name} defaultChecked={Boolean(w[c.name as keyof typeof w])} />
                          {c.label}
                        </label>
                      ))}
                    </div>
                    <input
                      name="agencyConfirmationRef"
                      defaultValue={w.agencyConfirmationRef ?? ""}
                      placeholder="Agency confirmation ref"
                      className="input text-sm"
                    />
                    <label className="flex items-center gap-2 text-xs font-medium text-stone-800">
                      <input type="checkbox" name="soleChargeApproved" defaultChecked={w.soleChargeApproved} />
                      Sole charge approved by manager
                    </label>
                    <textarea name="notes" defaultValue={w.notes ?? ""} rows={2} placeholder="Notes" className="input text-sm" />
                    <button className="btn-primary px-3 py-1.5 text-sm">Save</button>
                  </form>
                  <form action={deleteAgencyWorker} className="mt-1">
                    <input type="hidden" name="workerId" value={w.id} />
                    <button className="text-xs text-stone-400 hover:text-rose-600">Remove</button>
                  </form>
                  {w.approvedBy ? (
                    <p className="mt-2 text-xs text-stone-400">
                      Sole charge approved by {w.approvedBy}.
                    </p>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        <div>
          <div className="card sticky top-4">
            <h2 className="font-semibold text-stone-900">Add agency worker</h2>
            <form action={addAgencyWorker} className="mt-3 space-y-2">
              <input name="fullName" required placeholder="Full name" className="input" />
              <input name="agencyName" placeholder="Agency" className="input" />
              <input name="role" placeholder="Role" className="input" />
              <button className="btn-primary w-full px-4 py-2 text-sm">Add</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
