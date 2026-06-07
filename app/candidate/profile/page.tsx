import { requireCandidate } from "@/lib/auth";
import {
  setVisibilityMode,
  updateCandidateProfile,
} from "@/app/actions/candidate";
import { PageHeader, Select } from "@/components/ui";
import {
  EXPERIENCE_LEVELS,
  REGIONS,
  ROLE_TYPES,
  SHIFT_PATTERNS,
  VALUES_TAGS,
  YOUNG_PEOPLE_TYPES,
} from "@/lib/constants";

export default async function CandidateProfilePage() {
  const { candidate } = await requireCandidate();
  const selectedTags = (candidate.valuesTags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="My profile"
        subtitle="The structured section builds your anonymised card. The sealed section stays private until interest is mutual."
      />

      {/* Visibility mode -------------------------------------------------- */}
      <section id="visibility" className="card mb-6">
        <h2 className="font-semibold text-stone-900">Visibility mode</h2>
        <p className="mt-1 text-sm text-stone-500">
          Two independent dials: <strong>who</strong> can see you (your
          block-list) and <strong>how much</strong> they see (this mode).
          Anonymous cards rank and match identically — there is no penalty for
          staying private.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ModeOption
            mode="ANONYMOUS"
            current={candidate.visibilityMode}
            title="Anonymous (default)"
            body="Homes see only your anonymised card. Name, photo and history unlock on a mutual match. For quietly testing the water."
          />
          <ModeOption
            mode="OPEN"
            current={candidate.visibilityMode}
            title="Open"
            body="Non-blocked homes see your name, photo and history up front. Your narrative still unlocks only on a match. For being found fast."
          />
        </div>
      </section>

      <form action={updateCandidateProfile} className="space-y-6">
        {/* Structured fields --------------------------------------------- */}
        <section className="card">
          <h2 className="font-semibold text-stone-900">
            What matters to me{" "}
            <span className="ml-1 chip align-middle">Shown on your card</span>
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Structured fields only — safe to show before interest is mutual.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Region</label>
              <Select
                name="region"
                defaultValue={candidate.region}
                options={REGIONS}
              />
            </div>
            <div>
              <label className="label">Shift availability</label>
              <Select
                name="shiftPattern"
                defaultValue={candidate.shiftPattern}
                options={SHIFT_PATTERNS}
              />
            </div>
            <div>
              <label className="label">
                Type of young people I want to support
              </label>
              <Select
                name="youngPeopleType"
                defaultValue={candidate.youngPeopleType}
                options={YOUNG_PEOPLE_TYPES}
              />
            </div>
            <div>
              <label className="label">Experience level</label>
              <Select
                name="experienceLevel"
                defaultValue={candidate.experienceLevel}
                options={EXPERIENCE_LEVELS}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Role type sought</label>
              <Select
                name="roleType"
                defaultValue={candidate.roleType}
                options={ROLE_TYPES}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Therapeutic approach / values</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {VALUES_TAGS.map((tag) => (
                  <label
                    key={tag}
                    className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="valuesTags"
                      value={tag}
                      defaultChecked={selectedTags.includes(tag)}
                      className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                    />
                    {tag}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Sealed fields ------------------------------------------------- */}
        <section className="card">
          <h2 className="font-semibold text-stone-900">
            Sealed details{" "}
            <span className="ml-1 inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200 align-middle">
              Hidden until mutual interest
            </span>
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Name, photo and history reveal on a match (or up front in Open
            mode). Your free-text narrative only ever reveals on a match.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Full name</label>
              <input
                name="fullName"
                defaultValue={candidate.fullName ?? ""}
                className="input"
                placeholder="e.g. Alex Morgan"
              />
            </div>
            <div>
              <label className="label">Photo URL (optional)</label>
              <input
                name="photoUrl"
                defaultValue={candidate.photoUrl ?? ""}
                className="input"
                placeholder="https://…"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Employment history</label>
              <textarea
                name="employmentHistory"
                defaultValue={candidate.employmentHistory ?? ""}
                rows={4}
                className="input"
                placeholder="Roles, dates, settings…"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">
                Narrative — &ldquo;what matters to me&rdquo; in my words
              </label>
              <textarea
                name="narrative"
                defaultValue={candidate.narrative ?? ""}
                rows={4}
                className="input"
                placeholder="What drew you to this work, your approach…"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary px-6">
            Save profile
          </button>
        </div>
      </form>
    </div>
  );
}

function ModeOption({
  mode,
  current,
  title,
  body,
}: {
  mode: "ANONYMOUS" | "OPEN";
  current: string;
  title: string;
  body: string;
}) {
  const active = current === mode;
  return (
    <form action={setVisibilityMode}>
      <input type="hidden" name="visibilityMode" value={mode} />
      <button
        type="submit"
        className={`block w-full rounded-xl border p-4 text-left transition ${
          active
            ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
            : "border-stone-200 bg-white hover:border-stone-300"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-stone-900">{title}</span>
          {active ? (
            <span className="chip">Active</span>
          ) : (
            <span className="text-xs text-stone-400">Switch</span>
          )}
        </div>
        <p className="mt-1 text-sm text-stone-600">{body}</p>
      </button>
    </form>
  );
}
