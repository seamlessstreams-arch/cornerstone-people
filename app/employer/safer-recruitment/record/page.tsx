import Link from "next/link";
import { requireEmployer } from "@/lib/auth";
import { staffFileIndex, type StaffFileCheck } from "@/lib/safer-recruitment-data";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";
import { SR_STAGE_LABELS, type SrStage } from "@/lib/constants";

export const dynamic = "force-dynamic";

const START_ELIGIBILITY_LABELS: Record<string, string> = {
  NOT_ELIGIBLE: "Not eligible",
  CONDITIONAL: "Conditional",
  EXCEPTIONAL_SUPERVISED_ONLY: "Exceptional — supervised",
  CLEARED: "Cleared",
};

function Cell({ check }: { check: StaffFileCheck }) {
  return (
    <td className="px-3 py-2 align-top">
      <span className={check.ok ? "font-medium text-emerald-700" : "text-rose-600"}>
        {check.ok ? "✓" : "✗"}
      </span>
      {check.detail ? (
        <span className="ml-1 text-xs text-stone-500">{check.detail}</span>
      ) : null}
    </td>
  );
}

export default async function SingleCentralRecord() {
  const { employer } = await requireEmployer();
  const rows = await staffFileIndex(employer.id);

  return (
    <div>
      <PageHeader
        title="Single Central Record"
        subtitle="Ofsted-ready staff-file index. One row per candidate showing every mandatory pre-employment check, the compliance status and any outstanding evidence. Computed live — print or save as PDF for an inspection."
        action={
          <div className="flex gap-2">
            <Link href="/employer/safer-recruitment" className="btn-secondary">
              ← Dashboard
            </Link>
            <PrintButton />
          </div>
        }
      />

      <div className="mb-4 text-xs text-stone-500 print:block">
        {employer.companyName} • generated {new Date().toLocaleDateString("en-GB")}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No active cases">
          The record fills in as candidates move through pre-employment checks.
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-400">
              <tr>
                <th className="px-3 py-2 font-medium">Candidate</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Eligibility</th>
                <th className="px-3 py-2 font-medium">Identity</th>
                <th className="px-3 py-2 font-medium">Right to work</th>
                <th className="px-3 py-2 font-medium">DBS</th>
                <th className="px-3 py-2 font-medium">Barred list</th>
                <th className="px-3 py-2 font-medium">References</th>
                <th className="px-3 py-2 font-medium">Emp. gaps</th>
                <th className="px-3 py-2 font-medium">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((r) => (
                <tr key={r.caseId} className="align-top hover:bg-stone-50">
                  <td className="px-3 py-2">
                    <Link
                      href={`/employer/safer-recruitment/${r.caseId}`}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      {r.name}
                    </Link>
                    <div className="text-xs text-stone-400">
                      {SR_STAGE_LABELS[r.stage as SrStage]}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={r.compliance.rag} label={r.compliance.rag.toLowerCase()} />
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge
                      status={r.compliance.startEligibility}
                      label={START_ELIGIBILITY_LABELS[r.compliance.startEligibility]}
                    />
                  </td>
                  <Cell check={r.identity} />
                  <Cell check={r.rightToWork} />
                  <Cell check={r.dbs} />
                  <Cell check={r.barredList} />
                  <Cell check={r.references} />
                  <Cell check={r.employmentGaps} />
                  <td className="max-w-xs px-3 py-2 text-xs text-stone-600">
                    {r.missing.length ? r.missing.join("; ") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-stone-400">
        ✓ = recorded as in place. ✗ = outstanding. This record reflects evidence
        captured in the system; a named person remains responsible for every
        suitability decision.
      </p>
    </div>
  );
}
