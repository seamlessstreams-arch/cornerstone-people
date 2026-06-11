import { requireAdminEmployer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui";
import {
  addProspect,
  setProspectStage,
  deleteProspect,
  importSourcedCandidates,
} from "@/app/actions/talent";
import { scoreCandidate, type MatchResult } from "@/lib/sourcing";

export const dynamic = "force-dynamic";

const STAGES = ["NEW", "REVIEWING", "INVITED", "ARCHIVED"] as const;

const BAND_CLASS: Record<string, string> = {
  STRONG: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  POSSIBLE: "bg-amber-50 text-amber-700 ring-amber-200",
  WEAK: "bg-stone-100 text-stone-500 ring-stone-200",
};

export default async function TalentPipelinePage({
  searchParams,
}: {
  searchParams?: {
    role?: string;
    region?: string;
    kw?: string;
    minExp?: string;
    maxExp?: string;
    edu?: string;
  };
}) {
  const { employer } = await requireAdminEmployer();
  const prospects = await prisma.talentProspect.findMany({
    where: { employerId: employer.id },
    orderBy: [{ stage: "asc" }, { createdAt: "desc" }],
  });

  const role = (searchParams?.role ?? "").trim();
  const region = (searchParams?.region ?? "").trim();
  const kw = (searchParams?.kw ?? "").trim();
  const minExp = (searchParams?.minExp ?? "").trim();
  const maxExp = (searchParams?.maxExp ?? "").trim();
  const edu = (searchParams?.edu ?? "").trim();
  const matching = Boolean(role || region || kw || minExp || maxExp || edu);
  const keywords = kw ? kw.split(",").map((k) => k.trim()).filter(Boolean) : [];
  const education = edu ? edu.split(",").map((e) => e.trim()).filter(Boolean) : [];
  const minExperience = minExp && !Number.isNaN(Number(minExp)) ? Number(minExp) : null;
  const maxExperience = maxExp && !Number.isNaN(Number(maxExp)) ? Number(maxExp) : null;

  // Score + rank when criteria are present.
  let rows = prospects.map((p) => ({ p, match: null as MatchResult | null }));
  if (matching) {
    rows = prospects
      .map((p) => ({
        p,
        match: scoreCandidate(p, {
          roleSought: role,
          region,
          keywords,
          minExperience,
          maxExperience,
          education,
        }),
      }))
      .sort((a, b) => b.match!.score - a.match!.score);
  }

  return (
    <div>
      <PageHeader
        title="Talent pipeline"
        subtitle="Sourced candidates from your own licensed searches — names, role, region and a profile link, but never contact details. Import a list and let Kenny auto-shortlist it against your criteria, so you only open the profiles worth your time."
      />

      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        <strong>Lawful use:</strong> import only candidates you have a lawful basis
        to process — e.g. results from your own licensed CV-Library account. Keni
        never scrapes or auto-pulls from third parties and stores no contact
        details; profile links open under your own licensed account, where the
        candidate&apos;s details remain.
      </div>

      {/* Auto-shortlist criteria */}
      <form method="get" className="mb-4 rounded-xl border border-stone-200 bg-white p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          Auto-shortlist against
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-4">
          <input name="role" defaultValue={role} placeholder="Role (e.g. Support Worker)" className="input" />
          <input name="region" defaultValue={region} placeholder="Region" className="input" />
          <input name="kw" defaultValue={kw} placeholder="Must-have skills, comma-separated" className="input sm:col-span-2" />
          <input name="minExp" type="number" min="0" defaultValue={minExp} placeholder="Min years" className="input" />
          <input name="maxExp" type="number" min="0" defaultValue={maxExp} placeholder="Max years" className="input" />
          <input name="edu" defaultValue={edu} placeholder="Education / quals, comma-separated" className="input sm:col-span-2" />
        </div>
        <div className="mt-2 flex gap-2">
          <button className="btn-primary px-4 py-1.5 text-sm">Rank candidates</button>
          {matching ? (
            <a href="/employer/talent-pipeline" className="btn-secondary px-4 py-1.5 text-sm">
              Clear
            </a>
          ) : null}
        </div>
      </form>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {prospects.length === 0 ? (
            <EmptyState title="No candidates yet">
              Import a CSV on the right, or add a name, to start your pipeline.
            </EmptyState>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-400">
                  <tr>
                    {matching ? <th className="px-4 py-2 font-medium">Match</th> : null}
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Role / region</th>
                    <th className="px-4 py-2 font-medium">Stage</th>
                    <th className="px-4 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {rows.map(({ p, match }) => (
                    <tr key={p.id} className="align-top hover:bg-stone-50">
                      {matching ? (
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${BAND_CLASS[match!.band]}`}
                          >
                            {match!.score} · {match!.band.toLowerCase()}
                          </span>
                          <div className="mt-1 text-[10px] text-stone-400">
                            {match!.breakdown
                              .map((b) => `${b.dimension.slice(0, 4)} ${b.score}`)
                              .join(" · ")}
                          </div>
                          {match!.reasons.length ? (
                            <div className="mt-1 text-[11px] text-emerald-700">{match!.reasons.join("; ")}</div>
                          ) : null}
                          {match!.gaps.length ? (
                            <div className="text-[11px] text-stone-400">{match!.gaps.join("; ")}</div>
                          ) : null}
                        </td>
                      ) : null}
                      <td className="px-4 py-3">
                        <div className="font-medium text-stone-900">{p.name}</div>
                        {p.profileUrl ? (
                          <a
                            href={p.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-brand-700 hover:underline"
                          >
                            Open profile ↗
                          </a>
                        ) : null}
                        {p.summary ? (
                          <div className="text-xs text-stone-400">{p.summary}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        <div>{p.roleSought ?? "—"}</div>
                        <div className="text-xs text-stone-400">{p.region ?? ""}</div>
                      </td>
                      <td className="px-4 py-3">
                        <form action={setProspectStage} className="flex items-center gap-2">
                          <input type="hidden" name="prospectId" value={p.id} />
                          <select name="stage" defaultValue={p.stage} className="input py-1 text-xs">
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

        <div className="space-y-6">
          {/* Bulk import */}
          <div className="card">
            <h2 className="font-semibold text-stone-900">Import candidates</h2>
            <p className="mt-1 text-xs text-stone-400">
              Paste a <strong>CV-Library alert email</strong> (Kenny reads the
              names, role, location and skills automatically) — or a CSV from your
              licensed export, one per line:
              <br />
              <code className="text-[11px]">Name, Profile URL, Region, Role, Experience, Skills, Summary</code>
              <br />
              Only name is required. Contact details are stripped on import.
            </p>
            <form action={importSourcedCandidates} className="mt-3 space-y-2">
              <input name="source" defaultValue="CV-Library" placeholder="Source" className="input text-sm" />
              <textarea
                name="csv"
                rows={6}
                placeholder={'Jane Doe, https://…, Greater Manchester, Support Worker, 3 years, "EBD, trauma", Experienced RSW'}
                className="input font-mono text-xs"
              />
              <button className="btn-primary w-full px-4 py-2 text-sm">Import candidates</button>
            </form>
          </div>

          {/* Single add */}
          <div className="card">
            <h2 className="font-semibold text-stone-900">Add one</h2>
            <p className="mt-1 text-xs text-stone-400">Name only — no email or phone.</p>
            <form action={addProspect} className="mt-3 space-y-2">
              <input name="name" required placeholder="Full name" className="input" />
              <input name="source" placeholder="Source (e.g. CV-Library)" className="input" />
              <input name="profileUrl" type="url" placeholder="Profile link" className="input" />
              <textarea name="note" rows={2} placeholder="Note (optional)" className="input" />
              <button className="btn-primary w-full px-4 py-2 text-sm">Add to pipeline</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
