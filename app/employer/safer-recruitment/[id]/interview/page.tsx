import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEmployer } from "@/lib/auth";
import { loadCase } from "@/lib/safer-recruitment-data";
import { interviewPack } from "@/lib/interview";
import { PageHeader } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function InterviewPackPage({
  params,
}: {
  params: { id: string };
}) {
  const { employer } = await requireEmployer();
  const c = await loadCase(employer.id, params.id);
  if (!c) notFound();

  const candidateName = c.candidate.fullName ?? "Candidate";
  const pack = interviewPack({ roleType: c.candidate.roleType });

  return (
    <div>
      <PageHeader
        title="Interview pack"
        subtitle={`${candidateName} • ${c.candidate.roleType ?? "role"} — safeguarding & values-based questions with a scoring sheet. The panel records scores and the decision.`}
        action={
          <div className="flex gap-2">
            <Link href={`/employer/safer-recruitment/${c.id}`} className="btn-secondary">
              ← Case
            </Link>
            <PrintButton label="Print pack" />
          </div>
        }
      />

      <div className="mb-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 text-sm sm:grid-cols-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-stone-400">Candidate</div>
          <div className="text-stone-800">{candidateName}</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-stone-400">Panel members</div>
          <div className="text-stone-400">________________________</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-stone-400">Date</div>
          <div className="text-stone-400">________________________</div>
        </div>
      </div>

      <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        At least one panel member should hold safer-recruitment training. Score
        each area 1–5 and record evidence. The decision and rationale are the
        panel&apos;s — recorded against named people.
      </p>

      <div className="space-y-5">
        {pack.map((area, i) => (
          <section key={area.area} className="rounded-xl border border-stone-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-stone-900">
                  {i + 1}. {area.area}
                </h2>
                <p className="mt-0.5 text-xs text-stone-400">{area.intent}</p>
              </div>
              <div className="flex flex-none items-center gap-1 text-xs text-stone-400">
                Score
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className="flex h-5 w-5 items-center justify-center rounded border border-stone-300">
                    {n}
                  </span>
                ))}
              </div>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-stone-700">
              {area.questions.map((q) => (
                <li key={q} className="flex gap-2">
                  <span className="text-brand-600">•</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 border-t border-dashed border-stone-200 pt-3">
              <div className="text-xs font-medium uppercase tracking-wide text-stone-400">
                Evidence / notes
              </div>
              <div className="mt-2 space-y-3">
                <div className="border-b border-stone-200" />
                <div className="border-b border-stone-200" />
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="font-semibold text-stone-900">Panel decision</h2>
        <p className="mt-1 text-xs text-stone-400">
          Recommendation, rationale and any concerns to probe in references.
        </p>
        <div className="mt-3 space-y-4">
          <div className="border-b border-stone-200" />
          <div className="border-b border-stone-200" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              Signed (Chair): <span className="text-stone-400">__________________</span>
            </div>
            <div>
              Date: <span className="text-stone-400">__________________</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
