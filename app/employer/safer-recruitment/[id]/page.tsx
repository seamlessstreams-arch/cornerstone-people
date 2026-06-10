import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEmployer } from "@/lib/auth";
import { loadCase, clearanceForCase } from "@/lib/safer-recruitment-data";
import {
  PageHeader,
  StatusBadge,
  HumanReviewRequiredBanner,
  Field,
} from "@/components/ui";
import { GapChecker } from "@/components/GapChecker";
import { TemplatePreview } from "@/components/TemplatePreview";
import {
  SR_STAGES,
  SR_STAGE_LABELS,
  SR_HUMAN_SIGNOFF_STAGES,
  REFERENCE_TYPES,
  REFERENCE_REQUEST_METHODS,
  REFERENCE_DISPOSITIONS,
  DBS_LEVELS,
  DBS_WORKFORCE_TYPES,
  type SrStage,
} from "@/lib/constants";
import {
  setStage,
  saveCaseNotes,
  createReferenceRequest,
  markReferenceSent,
  recordReferenceResponse,
  setReferenceDisposition,
  saveDbsCheck,
} from "@/app/actions/safer-recruitment";

export const dynamic = "force-dynamic";

function fmt(d: Date | null | undefined) {
  return d ? new Date(d).toLocaleDateString("en-GB") : "—";
}

export default async function CaseDetail({ params }: { params: { id: string } }) {
  const { employer } = await requireEmployer();
  const c = await loadCase(employer.id, params.id);
  if (!c) notFound();

  const clearance = clearanceForCase(c);
  const candidateName = c.candidate.fullName ?? "Candidate";

  const tplCtx = {
    candidateName,
    employerName: employer.companyName,
    roleTitle: c.candidate.roleType,
    referenceType: "Children's workforce reference" as const,
  };

  return (
    <div>
      <PageHeader
        title={candidateName}
        subtitle={`Safer-recruitment case • ${SR_STAGE_LABELS[c.stage as SrStage]}`}
        action={
          <Link href="/employer/safer-recruitment" className="btn-secondary">
            ← All cases
          </Link>
        }
      />

      {/* Stage + human sign-off */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-stone-900">Stage</h2>
          <StatusBadge status={c.stage} label={SR_STAGE_LABELS[c.stage as SrStage]} />
        </div>
        <form action={setStage} className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="caseId" value={c.id} />
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-400">
              Move to stage
            </label>
            <select name="stage" defaultValue={c.stage} className="input">
              {SR_STAGES.map((s) => (
                <option key={s} value={s}>
                  {SR_STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-400">
              Named sign-off (required for clear / reject / exceptional start)
            </label>
            <input
              name="signoffName"
              placeholder="Your name & role"
              className="input"
            />
          </div>
          <button type="submit" className="btn-primary px-4 py-2">
            Update stage
          </button>
        </form>
        <p className="mt-2 text-xs text-stone-400">
          Decisions to clear, reject or start exceptionally are recorded against
          the named person — these stages require a human and are never set
          automatically. Human sign-off stages:{" "}
          {SR_HUMAN_SIGNOFF_STAGES.map((s) => SR_STAGE_LABELS[s]).join(", ")}.
        </p>
        {c.decisionBy ? (
          <p className="mt-1 text-xs text-stone-500">
            Last decision recorded by <strong>{c.decisionBy}</strong> on{" "}
            {fmt(c.decisionAt)}.
          </p>
        ) : null}
      </div>

      {/* Clearance readiness */}
      <div className="card mb-6">
        <h2 className="font-semibold text-stone-900">Clearance readiness</h2>
        <HumanReviewRequiredBanner>
          This readiness summary is computed from the evidence below. It does not
          clear anyone — only a named person may set "Cleared to start".
        </HumanReviewRequiredBanner>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              Outstanding ({clearance.outstanding.length})
            </div>
            <ul className="mt-1 space-y-1 text-sm text-stone-700">
              {clearance.outstanding.length === 0 ? (
                <li className="text-emerald-700">Nothing outstanding.</li>
              ) : (
                clearance.outstanding.map((o) => <li key={o}>• {o}</li>)
              )}
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              Blockers ({clearance.blockers.length})
            </div>
            <ul className="mt-1 space-y-1 text-sm text-rose-700">
              {clearance.blockers.length === 0 ? (
                <li className="text-stone-500">No blockers.</li>
              ) : (
                clearance.blockers.map((b) => <li key={b}>• {b}</li>)
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* References */}
        <section className="card">
          <h2 className="font-semibold text-stone-900">References</h2>
          <div className="mt-3 space-y-3">
            {c.references.length === 0 ? (
              <p className="text-sm text-stone-500">No reference requests yet.</p>
            ) : (
              c.references.map((r) => (
                <div key={r.id} className="rounded-lg border border-stone-200 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-stone-900">
                      {r.refereeName}
                      <span className="ml-2 text-xs font-normal text-stone-400">
                        {r.referenceType}
                      </span>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="mt-1 text-xs text-stone-400">
                    Sent {fmt(r.sentAt)} • chasers {fmt(r.chaser1At)} /{" "}
                    {fmt(r.chaser2At)} / {fmt(r.finalChaserAt)} • received{" "}
                    {fmt(r.receivedAt)}
                  </div>

                  {r.qualityStatus ? (
                    <div className="mt-2 rounded-md bg-stone-50 p-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-500">
                          Analyser:
                        </span>
                        <StatusBadge status={r.qualityStatus} />
                      </div>
                      <p className="mt-1 text-stone-600">{r.qualityNotes}</p>
                    </div>
                  ) : null}

                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.status === "DRAFT" ? (
                      <form action={markReferenceSent}>
                        <input type="hidden" name="requestId" value={r.id} />
                        <button className="btn-secondary px-2.5 py-1 text-xs">
                          Mark sent & schedule chasers
                        </button>
                      </form>
                    ) : null}
                  </div>

                  {/* Record response */}
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-medium text-brand-700">
                      Record / view response
                    </summary>
                    <form action={recordReferenceResponse} className="mt-2 space-y-2">
                      <input type="hidden" name="requestId" value={r.id} />
                      <textarea
                        name="responseText"
                        defaultValue={r.responseText ?? ""}
                        rows={4}
                        placeholder="Paste the received reference text. The rule-based analyser will flag missing points and concerns."
                        className="input text-sm"
                      />
                      <button className="btn-primary px-3 py-1.5 text-xs">
                        Save & analyse
                      </button>
                    </form>
                    <form action={setReferenceDisposition} className="mt-2 flex flex-wrap items-end gap-2">
                      <input type="hidden" name="requestId" value={r.id} />
                      <select name="disposition" defaultValue={r.disposition ?? ""} className="input text-sm">
                        <option value="">Human disposition…</option>
                        {REFERENCE_DISPOSITIONS.map((d) => (
                          <option key={d} value={d}>
                            {d.replace(/_/g, " ").toLowerCase()}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1 text-xs text-stone-600">
                        <input type="checkbox" name="rmReviewRequested" defaultChecked={r.rmReviewRequested} />
                        RM/RI review
                      </label>
                      <input name="verbalVerifiedBy" placeholder="Verbal verified by" className="input text-sm" />
                      <button className="btn-secondary px-3 py-1.5 text-xs">Save</button>
                    </form>
                  </details>
                </div>
              ))
            )}
          </div>

          {/* New request */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-brand-700">
              + New reference request
            </summary>
            <form action={createReferenceRequest} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="caseId" value={c.id} />
              <input name="refereeName" placeholder="Referee name" required className="input col-span-2" />
              <input name="refereeEmail" placeholder="Referee email" className="input" />
              <input name="refereeOrg" placeholder="Organisation" className="input" />
              <select name="referenceType" required defaultValue="" className="input">
                <option value="" disabled>Reference type…</option>
                {REFERENCE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select name="method" defaultValue="" className="input">
                <option value="" disabled>Method…</option>
                {REFERENCE_REQUEST_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <label className="col-span-2 flex items-center gap-2 text-xs text-stone-600">
                <input type="checkbox" name="consentRecorded" />
                Candidate consent recorded for this referee
              </label>
              <button className="btn-primary col-span-2 px-3 py-2 text-sm">
                Create request
              </button>
            </form>
          </details>
        </section>

        {/* Templates */}
        <section className="card">
          <h2 className="font-semibold text-stone-900">Reference templates</h2>
          <p className="mt-1 text-xs text-stone-400">
            Professional, safeguarding-aware templates. No email key needed — copy
            the text and send from your own mailbox.
          </p>
          <div className="mt-3">
            <TemplatePreview ctx={tplCtx} />
          </div>
        </section>

        {/* Employment gaps */}
        <section className="card">
          <h2 className="font-semibold text-stone-900">Employment gap review</h2>
          <div className="mt-3">
            <GapChecker
              caseId={c.id}
              initialFindings={c.gapReview?.findings ?? null}
              initialStatus={c.gapReview?.status ?? "NEEDS_EXPLANATION"}
              initialNotes={c.gapReview?.managerNotes ?? null}
              employmentHistory={c.candidate.employmentHistory}
            />
            {c.gapReview ? (
              <p className="mt-2 text-xs text-stone-400">
                Last reviewed by {c.gapReview.reviewedBy ?? "—"} —{" "}
                <StatusBadge status={c.gapReview.status} />
              </p>
            ) : null}
          </div>
        </section>

        {/* DBS / readiness */}
        <section className="card">
          <h2 className="font-semibold text-stone-900">DBS &amp; right-to-work</h2>
          <p className="mt-1 text-xs text-stone-400">
            Evidence workflow only — no live DBS integration. Record what was seen
            and whether a risk review is required.
          </p>
          <form action={saveDbsCheck} className="mt-3 grid grid-cols-2 gap-2">
            <input type="hidden" name="caseId" value={c.id} />
            <input name="status" defaultValue={c.dbsCheck?.status ?? ""} placeholder="Status (e.g. Clear / Pending)" className="input col-span-2" />
            <select name="level" defaultValue={c.dbsCheck?.level ?? ""} className="input">
              <option value="">DBS level…</option>
              {DBS_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <select name="workforceType" defaultValue={c.dbsCheck?.workforceType ?? ""} className="input">
              <option value="">Workforce…</option>
              {DBS_WORKFORCE_TYPES.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
            <label className="flex items-center gap-2 text-xs text-stone-600">
              <input type="checkbox" name="certificateSeen" defaultChecked={c.dbsCheck?.certificateSeen} /> Certificate seen
            </label>
            <label className="flex items-center gap-2 text-xs text-stone-600">
              <input type="checkbox" name="barredListChecked" defaultChecked={c.dbsCheck?.barredListChecked} /> Barred list checked
            </label>
            <label className="flex items-center gap-2 text-xs text-stone-600">
              <input type="checkbox" name="updateService" defaultChecked={c.dbsCheck?.updateService} /> On Update Service
            </label>
            <label className="flex items-center gap-2 text-xs text-stone-600">
              <input type="checkbox" name="updateServiceConsent" defaultChecked={c.dbsCheck?.updateServiceConsent} /> Update Service consent
            </label>
            <label className="col-span-2 flex items-center gap-2 text-xs font-medium text-rose-700">
              <input type="checkbox" name="riskReviewRequired" defaultChecked={c.dbsCheck?.riskReviewRequired} /> Risk review required
            </label>
            <textarea name="notes" defaultValue={c.dbsCheck?.notes ?? ""} rows={2} placeholder="Notes" className="input col-span-2" />
            <button className="btn-primary col-span-2 px-3 py-2 text-sm">Save DBS / readiness</button>
          </form>
        </section>
      </div>

      {/* Case notes */}
      <section className="card mt-6">
        <h2 className="font-semibold text-stone-900">Case notes</h2>
        <form action={saveCaseNotes} className="mt-3 space-y-2">
          <input type="hidden" name="caseId" value={c.id} />
          <textarea name="notes" defaultValue={c.notes ?? ""} rows={3} className="input" />
          <button className="btn-secondary px-4 py-2 text-sm">Save notes</button>
        </form>
      </section>

      <div className="mt-6">
        <Field
          label="Candidate snapshot"
          value={`${c.candidate.roleType ?? "—"} • ${c.candidate.experienceLevel ?? "—"} • ${c.candidate.region ?? "—"}`}
        />
      </div>
    </div>
  );
}
