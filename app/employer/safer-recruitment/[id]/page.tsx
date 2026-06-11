import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEmployer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase";
import { FileUpload } from "@/components/FileUpload";
import { DocumentList } from "@/components/DocumentList";
import {
  uploadCaseDocument,
  getCaseDocumentUrl,
} from "@/app/actions/documents";
import {
  loadCase,
  clearanceForCase,
  caseCompliance,
  caseAuditTrail,
} from "@/lib/safer-recruitment-data";
import { assessExceptionalStart } from "@/lib/safer-recruitment";
import { appUrl } from "@/lib/email";
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
  EXCEPTIONAL_START_STATUS_LABELS,
  EXCEPTIONAL_START_CONTROLS,
  RISK_LEVELS,
  QUALIFICATION_KINDS,
  SELF_DECLARATION_OUTCOMES,
  HEALTH_FITNESS_OUTCOMES,
  type SrStage,
  type ExceptionalStartStatus,
} from "@/lib/constants";
import {
  setStage,
  saveCaseNotes,
  createReferenceRequest,
  markReferenceSent,
  recordReferenceResponse,
  setReferenceDisposition,
  saveDbsCheck,
  saveIdentityRightToWork,
  saveExceptionalStart,
  approveExceptionalStart,
  addQualification,
  setQualificationStatus,
  deleteQualification,
  sendSelfDeclarationLink,
  reviewSelfDeclaration,
  sendHealthDeclarationLink,
  reviewHealthDeclaration,
  saveShadowShift,
  authoriseShadowShift,
} from "@/app/actions/safer-recruitment";
import { assessShadowShift } from "@/lib/shadow";

export const dynamic = "force-dynamic";

const START_ELIGIBILITY_LABELS: Record<string, string> = {
  NOT_ELIGIBLE: "Not eligible",
  CONDITIONAL: "Conditional",
  EXCEPTIONAL_SUPERVISED_ONLY: "Exceptional — supervised",
  CLEARED: "Cleared",
};

const RAG_BANNER: Record<string, string> = {
  RED: "border-rose-400 bg-rose-50",
  AMBER: "border-amber-400 bg-amber-50",
  GREEN: "border-emerald-400 bg-emerald-50",
};

function fmt(d: Date | null | undefined) {
  return d ? new Date(d).toLocaleDateString("en-GB") : "—";
}

function fmtDateTime(d: Date) {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function actionLabel(action: string) {
  return action
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (ch) => ch.toUpperCase());
}

export default async function CaseDetail({ params }: { params: { id: string } }) {
  const { employer } = await requireEmployer();
  const c = await loadCase(employer.id, params.id);
  if (!c) notFound();

  const clearance = clearanceForCase(c);
  const compliance = caseCompliance(c);
  const ex = c.exceptionalStart;
  const sd = c.selfDeclaration;
  const hd = c.healthDeclaration;
  const shadow = c.shadowShift;
  const shadowReadiness = shadow
    ? assessShadowShift({
        supervisorName: shadow.supervisorName,
        shiftDate: shadow.shiftDate,
        riskAssessed: shadow.riskAssessed,
        supervisedAtAllTimes: shadow.supervisedAtAllTimes,
        notCountedInStaffing: shadow.notCountedInStaffing,
        noAccessToChildInfo: shadow.noAccessToChildInfo,
      })
    : null;
  const exReadiness = ex
    ? assessExceptionalStart({
        businessReason: ex.businessReason,
        riskLevel: ex.riskLevel,
        riskMitigation: ex.riskMitigation,
        supervisorName: ex.supervisorName,
        noSoleCharge: ex.noSoleCharge,
        noUnsupervisedAccess: ex.noUnsupervisedAccess,
        noIntimateCare: ex.noIntimateCare,
        noOvernight: ex.noOvernight,
        reviewDate: ex.reviewDate,
      })
    : null;
  const candidateName = c.candidate.fullName ?? "Candidate";

  const caseDocs = await prisma.storedFile.findMany({
    where: { caseId: c.id },
    orderBy: { createdAt: "desc" },
  });
  const caseDocItems = caseDocs.map((d) => ({
    id: d.id,
    originalName: d.originalName,
    kind: d.kind,
    createdAt: d.createdAt.toISOString(),
  }));
  const storageReady = isSupabaseConfigured();
  const auditTrail = await caseAuditTrail(employer.id, c.id);

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
          <div className="flex gap-2">
            <Link href={`/employer/safer-recruitment/${c.id}/interview`} className="btn-secondary">
              Interview pack
            </Link>
            <Link href="/employer/safer-recruitment" className="btn-secondary">
              ← All cases
            </Link>
          </div>
        }
      />

      {/* At-a-glance compliance status — the one-line answer a manager needs
          the moment they open a candidate. */}
      <div className={`mb-6 rounded-xl border-l-4 p-4 ${RAG_BANNER[compliance.rag]}`}>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={compliance.rag} label={compliance.rag.toLowerCase()} />
          <StatusBadge
            status={compliance.startEligibility}
            label={START_ELIGIBILITY_LABELS[compliance.startEligibility]}
          />
        </div>
        <p className="mt-2 text-sm font-medium text-stone-800">
          {compliance.nextAction}
        </p>
        {compliance.blockers.length ? (
          <p className="mt-1 text-xs font-medium text-rose-700">
            Blockers: {compliance.blockers.join("; ")}
          </p>
        ) : null}
      </div>

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

                  {r.publicToken && r.status !== "RECEIVED" && r.status !== "VERIFIED" ? (
                    <div className="mt-2 rounded-md border border-brand-100 bg-brand-50 p-2 text-xs">
                      <div className="font-semibold text-brand-700">
                        Mobile reference link
                      </div>
                      <div className="mt-1 break-all font-mono text-stone-600">
                        {appUrl()}/reference/{r.publicToken}
                      </div>
                      <div className="mt-1 text-stone-400">
                        Send this to the referee to complete on their phone. Expires{" "}
                        {fmt(r.tokenExpiresAt)}.
                      </div>
                    </div>
                  ) : null}

                  {r.submittedIp ? (
                    <div className="mt-1 text-xs text-stone-400">
                      Submitted via mobile link from {r.submittedIp}.
                    </div>
                  ) : null}

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

        {/* Identity & right to work */}
        <section className="card">
          <h2 className="font-semibold text-stone-900">Identity &amp; right to work</h2>
          <p className="mt-1 text-xs text-stone-400">
            Mandatory before a start. Record what a named person actually saw —
            documents, likeness, and the right-to-work check.
          </p>
          <form action={saveIdentityRightToWork} className="mt-3 grid grid-cols-2 gap-2">
            <input type="hidden" name="caseId" value={c.id} />
            <input
              name="identityDocumentType"
              defaultValue={c.identityCheck?.identityDocumentType ?? ""}
              placeholder="ID document (e.g. Passport)"
              className="input col-span-2"
            />
            <label className="flex items-center gap-2 text-xs text-stone-600">
              <input type="checkbox" name="identityDocumentSeen" defaultChecked={c.identityCheck?.identityDocumentSeen} /> ID document seen
            </label>
            <label className="flex items-center gap-2 text-xs text-stone-600">
              <input type="checkbox" name="photographSeen" defaultChecked={c.identityCheck?.photographSeen} /> Recent photograph seen
            </label>
            <label className="flex items-center gap-2 text-xs text-stone-600">
              <input type="checkbox" name="likenessConfirmed" defaultChecked={c.identityCheck?.likenessConfirmed} /> Likeness confirmed
            </label>
            <label className="flex items-center gap-2 text-xs text-stone-600">
              <input type="checkbox" name="nameDiscrepancyExplained" defaultChecked={c.identityCheck?.nameDiscrepancyExplained} /> Name differences explained
            </label>
            <label className="col-span-2 mt-1 flex items-center gap-2 text-xs font-medium text-stone-700">
              <input type="checkbox" name="rightToWorkVerified" defaultChecked={c.identityCheck?.rightToWorkVerified} /> Right to work verified
            </label>
            <input
              name="rightToWorkMethod"
              defaultValue={c.identityCheck?.rightToWorkMethod ?? ""}
              placeholder="RTW method (e.g. Online share code)"
              className="input"
            />
            <input
              name="shareCode"
              defaultValue={c.identityCheck?.shareCode ?? ""}
              placeholder="Share code (if applicable)"
              className="input"
            />
            <label className="flex items-center gap-2 text-xs text-stone-600">
              <input type="checkbox" name="timeLimited" defaultChecked={c.identityCheck?.timeLimited} /> Time-limited permission
            </label>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-400">
                Follow-up date
              </label>
              <input
                type="date"
                name="followUpDate"
                defaultValue={
                  c.identityCheck?.followUpDate
                    ? new Date(c.identityCheck.followUpDate).toISOString().slice(0, 10)
                    : ""
                }
                className="input"
              />
            </div>
            <textarea name="notes" defaultValue={c.identityCheck?.notes ?? ""} rows={2} placeholder="Notes" className="input col-span-2" />
            <button className="btn-primary col-span-2 px-3 py-2 text-sm">Save identity / right to work</button>
          </form>
          {c.identityCheck?.checkedBy ? (
            <p className="mt-2 text-xs text-stone-400">
              Last updated by {c.identityCheck.checkedBy} on {fmt(c.identityCheck.checkedAt)}.
            </p>
          ) : null}
        </section>

        {/* DBS / barred list */}
        <section className="card">
          <h2 className="font-semibold text-stone-900">DBS &amp; barred list</h2>
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

        {/* Qualifications & training */}
        <section className="card">
          <h2 className="font-semibold text-stone-900">Qualifications &amp; training</h2>
          <p className="mt-1 text-xs text-stone-400">
            Record qualifications, mandatory training and registrations. Anything
            marked <em>required</em> must be evidenced before a start.
          </p>

          <div className="mt-3 space-y-2">
            {c.qualifications.length === 0 ? (
              <p className="text-sm text-stone-500">Nothing recorded yet.</p>
            ) : (
              c.qualifications.map((q) => (
                <div key={q.id} className="rounded-lg border border-stone-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-medium text-stone-900">
                      {q.title}
                      {q.kind ? (
                        <span className="ml-2 text-xs font-normal text-stone-400">{q.kind}</span>
                      ) : null}
                      {q.required ? (
                        <span className="ml-2 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-stone-500">
                          required
                        </span>
                      ) : null}
                    </div>
                    <form action={deleteQualification}>
                      <input type="hidden" name="qualId" value={q.id} />
                      <button className="text-xs text-stone-400 hover:text-rose-600">Remove</button>
                    </form>
                  </div>
                  <div className="mt-1 text-xs text-stone-400">
                    {q.reference ? `Ref ${q.reference} • ` : ""}
                    awarded {fmt(q.awardedOn)} • expires {fmt(q.expiresOn)}
                  </div>
                  <form action={setQualificationStatus} className="mt-2 flex flex-wrap items-center gap-3">
                    <input type="hidden" name="qualId" value={q.id} />
                    <label className="flex items-center gap-1 text-xs text-stone-600">
                      <input type="checkbox" name="certificateSeen" defaultChecked={q.certificateSeen} /> Certificate seen
                    </label>
                    <label className="flex items-center gap-1 text-xs text-stone-600">
                      <input type="checkbox" name="verifiedWithIssuer" defaultChecked={q.verifiedWithIssuer} /> Verified with issuer
                    </label>
                    <button className="btn-secondary px-2.5 py-1 text-xs">Save</button>
                  </form>
                </div>
              ))
            )}
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium text-brand-700">
              + Add qualification / training
            </summary>
            <form action={addQualification} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="caseId" value={c.id} />
              <input name="title" placeholder="Title" required className="input col-span-2" />
              <select name="kind" defaultValue="" className="input">
                <option value="">Type…</option>
                {QUALIFICATION_KINDS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              <input name="reference" placeholder="Certificate no. / URN" className="input" />
              <div>
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-stone-400">Awarded</label>
                <input type="date" name="awardedOn" className="input" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-stone-400">Expires</label>
                <input type="date" name="expiresOn" className="input" />
              </div>
              <label className="flex items-center gap-2 text-xs text-stone-600">
                <input type="checkbox" name="required" /> Required for this post
              </label>
              <label className="flex items-center gap-2 text-xs text-stone-600">
                <input type="checkbox" name="certificateSeen" /> Certificate seen
              </label>
              <textarea name="notes" rows={2} placeholder="Notes" className="input col-span-2" />
              <button className="btn-primary col-span-2 px-3 py-2 text-sm">Add to staff file</button>
            </form>
          </details>
        </section>

        {/* Candidate self-declaration */}
        <section className="card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-stone-900">Self-declaration</h2>
            {sd ? (
              <StatusBadge
                status={
                  sd.disclosureFlagged && !sd.reviewedAt
                    ? "CONCERN"
                    : sd.status === "REVIEWED"
                    ? "ACCEPTED"
                    : sd.status
                }
                label={sd.status.toLowerCase()}
              />
            ) : null}
          </div>
          <p className="mt-1 text-xs text-stone-400">
            Confidential criminal self-disclosure, requested at shortlisting. Any
            disclosure is flagged for a named manager to review before progressing.
          </p>

          {/* Issue / re-issue the candidate link */}
          <form action={sendSelfDeclarationLink} className="mt-3">
            <input type="hidden" name="caseId" value={c.id} />
            <button className="btn-secondary px-3 py-1.5 text-xs">
              {sd ? "Re-issue candidate link" : "Send candidate link"}
            </button>
          </form>

          {sd?.publicToken && sd.status === "PENDING" ? (
            <div className="mt-2 rounded-md border border-brand-100 bg-brand-50 p-2 text-xs">
              <div className="font-semibold text-brand-700">Candidate link</div>
              <div className="mt-1 break-all font-mono text-stone-600">
                {appUrl()}/self-declaration/{sd.publicToken}
              </div>
              <div className="mt-1 text-stone-400">Expires {fmt(sd.tokenExpiresAt)}.</div>
            </div>
          ) : null}

          {sd && sd.status !== "PENDING" ? (
            <div className="mt-3 space-y-2 text-sm">
              {sd.disclosureFlagged ? (
                <p className="rounded-md bg-rose-50 p-2 text-xs font-medium text-rose-700">
                  Disclosure made — confidential manager review required.
                </p>
              ) : (
                <p className="rounded-md bg-emerald-50 p-2 text-xs font-medium text-emerald-700">
                  No disclosures declared.
                </p>
              )}
              <ul className="space-y-1 text-xs text-stone-600">
                <li>Unspent convictions: {sd.hasUnspentConvictions ? "Yes" : "No"}</li>
                <li>Cautions / pending: {sd.hasCautionsOrPending ? "Yes" : "No"}</li>
                <li>Barred: {sd.isBarred ? "Yes" : "No"}</li>
                <li>Disqualified (incl. by association): {sd.isDisqualified ? "Yes" : "No"}</li>
                <li>Lived/worked overseas (5y): {sd.livedOverseas ? "Yes" : "No"}</li>
              </ul>
              {sd.disclosureDetails ? (
                <p className="rounded bg-stone-50 p-2 text-xs text-stone-700">
                  <span className="font-semibold">Details:</span> {sd.disclosureDetails}
                </p>
              ) : null}
              {sd.overseasDetails ? (
                <p className="text-xs text-stone-500">Overseas: {sd.overseasDetails}</p>
              ) : null}

              {sd.reviewedAt ? (
                <p className="text-xs text-stone-500">
                  Reviewed by {sd.reviewedBy} on {fmt(sd.reviewedAt)} — outcome:{" "}
                  <strong>{sd.reviewOutcome ?? "—"}</strong>.
                  {sd.managerNotes ? ` ${sd.managerNotes}` : ""}
                </p>
              ) : (
                <form action={reviewSelfDeclaration} className="mt-1 space-y-2">
                  <input type="hidden" name="caseId" value={c.id} />
                  <select name="reviewOutcome" defaultValue="" required className="input text-sm">
                    <option value="" disabled>
                      Record manager review outcome…
                    </option>
                    {SELF_DECLARATION_OUTCOMES.map((o) => (
                      <option key={o} value={o}>
                        {o.replace(/_/g, " ").toLowerCase()}
                      </option>
                    ))}
                  </select>
                  <textarea name="managerNotes" rows={2} placeholder="Manager notes" className="input text-sm" />
                  <button className="btn-primary px-3 py-1.5 text-xs">Record review</button>
                </form>
              )}
            </div>
          ) : null}
        </section>

        {/* Health / fitness declaration */}
        <section className="card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-stone-900">Health declaration</h2>
            {hd ? (
              <StatusBadge
                status={hd.status === "REVIEWED" ? "ACCEPTED" : hd.status}
                label={hd.status.toLowerCase()}
              />
            ) : null}
          </div>
          <p className="mt-1 text-xs text-stone-400">
            Confidential fitness-for-role declaration, requested after a
            conditional offer. Role-related questions only; a named manager
            confirms fitness and considers reasonable adjustments.
          </p>

          <form action={sendHealthDeclarationLink} className="mt-3">
            <input type="hidden" name="caseId" value={c.id} />
            <button className="btn-secondary px-3 py-1.5 text-xs">
              {hd ? "Re-issue candidate link" : "Send candidate link"}
            </button>
          </form>

          {hd?.publicToken && hd.status === "PENDING" ? (
            <div className="mt-2 rounded-md border border-brand-100 bg-brand-50 p-2 text-xs">
              <div className="font-semibold text-brand-700">Candidate link</div>
              <div className="mt-1 break-all font-mono text-stone-600">
                {appUrl()}/health-declaration/{hd.publicToken}
              </div>
              <div className="mt-1 text-stone-400">Expires {fmt(hd.tokenExpiresAt)}.</div>
            </div>
          ) : null}

          {hd && hd.status !== "PENDING" ? (
            <div className="mt-3 space-y-2 text-sm">
              <ul className="space-y-1 text-xs text-stone-600">
                <li>Fit for role: {hd.fitForRole ? "Yes" : "No"}</li>
                <li>Condition affecting role: {hd.conditionsAffectingRole ? "Yes" : "No"}</li>
                <li>Adjustments would help: {hd.reasonableAdjustmentsNeeded ? "Yes" : "No"}</li>
              </ul>
              {hd.conditionsDetail ? (
                <p className="rounded bg-stone-50 p-2 text-xs text-stone-700">
                  <span className="font-semibold">Condition:</span> {hd.conditionsDetail}
                </p>
              ) : null}
              {hd.adjustmentsDetail ? (
                <p className="rounded bg-stone-50 p-2 text-xs text-stone-700">
                  <span className="font-semibold">Adjustments:</span> {hd.adjustmentsDetail}
                </p>
              ) : null}

              {hd.reviewedAt ? (
                <p className="text-xs text-stone-500">
                  Reviewed by {hd.reviewedBy} on {fmt(hd.reviewedAt)} — outcome:{" "}
                  <strong>{hd.fitnessOutcome ?? "—"}</strong>.
                  {hd.managerNotes ? ` ${hd.managerNotes}` : ""}
                </p>
              ) : (
                <form action={reviewHealthDeclaration} className="mt-1 space-y-2">
                  <input type="hidden" name="caseId" value={c.id} />
                  <select name="fitnessOutcome" defaultValue="" required className="input text-sm">
                    <option value="" disabled>
                      Record fitness decision…
                    </option>
                    {HEALTH_FITNESS_OUTCOMES.map((o) => (
                      <option key={o} value={o}>
                        {o.replace(/_/g, " ").toLowerCase()}
                      </option>
                    ))}
                  </select>
                  <textarea name="managerNotes" rows={2} placeholder="Manager notes" className="input text-sm" />
                  <button className="btn-primary px-3 py-1.5 text-xs">Record review</button>
                </form>
              )}
            </div>
          ) : null}
        </section>
      </div>

      {/* Exceptional / supervised start */}
      <section className="card mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-stone-900">
            Exceptional / supervised start
          </h2>
          {ex ? (
            <StatusBadge
              status={ex.status === "APPROVED" ? "EXCEPTIONAL_SUPERVISED_START" : ex.status}
              label={EXCEPTIONAL_START_STATUS_LABELS[ex.status as ExceptionalStartStatus]}
            />
          ) : null}
        </div>
        <HumanReviewRequiredBanner>
          Only for when a candidate must start before every check is complete.
          It is never automatic — it needs a risk assessment, every hard
          supervision control in place, and a named RM/RI approval.
        </HumanReviewRequiredBanner>

        <form action={saveExceptionalStart} className="mt-3 grid gap-2 sm:grid-cols-2">
          <input type="hidden" name="caseId" value={c.id} />
          <textarea
            name="businessReason"
            defaultValue={ex?.businessReason ?? ""}
            rows={2}
            placeholder="Business reason for an early start"
            className="input sm:col-span-2"
          />
          <select name="riskLevel" defaultValue={ex?.riskLevel ?? ""} className="input">
            <option value="">Risk level…</option>
            {RISK_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="reviewDate"
            defaultValue={
              ex?.reviewDate ? new Date(ex.reviewDate).toISOString().slice(0, 10) : ""
            }
            className="input"
          />
          <textarea
            name="riskMitigation"
            defaultValue={ex?.riskMitigation ?? ""}
            rows={2}
            placeholder="How is the risk mitigated?"
            className="input sm:col-span-2"
          />
          <input
            name="supervisorName"
            defaultValue={ex?.supervisorName ?? ""}
            placeholder="Responsible supervisor (name & role)"
            className="input sm:col-span-2"
          />
          <div className="sm:col-span-2">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">
              Hard controls — all required
            </div>
            <div className="grid gap-1 sm:grid-cols-2">
              {EXCEPTIONAL_START_CONTROLS.map((ctrl) => (
                <label key={ctrl.key} className="flex items-center gap-2 text-xs text-stone-700">
                  <input
                    type="checkbox"
                    name={ctrl.key}
                    defaultChecked={ex ? Boolean(ex[ctrl.key]) : false}
                  />
                  {ctrl.label}
                </label>
              ))}
            </div>
          </div>
          <textarea
            name="supervisionNotes"
            defaultValue={ex?.supervisionNotes ?? ""}
            rows={2}
            placeholder="Supervision notes"
            className="input sm:col-span-2"
          />
          <button className="btn-secondary px-4 py-2 text-sm sm:col-span-2">
            Save supervised-start plan
          </button>
        </form>

        {ex ? (
          exReadiness && !exReadiness.readyForApproval ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Required before approval ({exReadiness.requirements.length})
              </div>
              <ul className="mt-1 space-y-1 text-sm text-amber-800">
                {exReadiness.requirements.map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
            </div>
          ) : ex.status === "APPROVED" ? (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              Approved by <strong>{ex.approvedBy}</strong> on {fmt(ex.approvedAt)}.
              Supervised start is in effect — review by {fmt(ex.reviewDate)}.
            </p>
          ) : (
            <form
              action={approveExceptionalStart}
              className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3"
            >
              <input type="hidden" name="caseId" value={c.id} />
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">
                  RM/RI approval (named)
                </label>
                <input
                  name="approverName"
                  placeholder="Approver name & role"
                  className="input"
                  required
                />
              </div>
              <button className="btn-primary px-4 py-2 text-sm">
                Approve supervised start
              </button>
            </form>
          )
        ) : null}
      </section>

      {/* Shadow shift */}
      <section className="card mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-stone-900">Shadow shift</h2>
          {shadow ? (
            <StatusBadge
              status={shadow.status === "AUTHORISED" ? "ACCEPTED" : shadow.status}
              label={shadow.status.toLowerCase()}
            />
          ) : null}
        </div>
        <HumanReviewRequiredBanner>
          A supervised taster shift before a full start. It must be risk-assessed,
          supervised at all times, never counted in staffing numbers, and never
          given access to children&apos;s detailed personal information — and a
          named manager must authorise it.
        </HumanReviewRequiredBanner>

        <form action={saveShadowShift} className="mt-3 grid gap-2 sm:grid-cols-2">
          <input type="hidden" name="caseId" value={c.id} />
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-400">
              Shift date
            </label>
            <input
              type="date"
              name="shiftDate"
              defaultValue={
                shadow?.shiftDate
                  ? new Date(shadow.shiftDate).toISOString().slice(0, 10)
                  : ""
              }
              className="input"
            />
          </div>
          <input
            name="supervisorName"
            defaultValue={shadow?.supervisorName ?? ""}
            placeholder="Supervising staff member"
            className="input"
          />
          <div className="sm:col-span-2 grid gap-1 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-xs text-stone-700">
              <input type="checkbox" name="riskAssessed" defaultChecked={shadow?.riskAssessed} /> Risk assessment completed
            </label>
            <label className="flex items-center gap-2 text-xs text-stone-700">
              <input type="checkbox" name="supervisedAtAllTimes" defaultChecked={shadow?.supervisedAtAllTimes} /> Supervised at all times
            </label>
            <label className="flex items-center gap-2 text-xs text-stone-700">
              <input type="checkbox" name="notCountedInStaffing" defaultChecked={shadow?.notCountedInStaffing} /> Not counted in staffing numbers
            </label>
            <label className="flex items-center gap-2 text-xs text-stone-700">
              <input type="checkbox" name="noAccessToChildInfo" defaultChecked={shadow?.noAccessToChildInfo} /> No access to children&apos;s detailed information
            </label>
          </div>
          <textarea name="notes" defaultValue={shadow?.notes ?? ""} rows={2} placeholder="Risk / supervision notes" className="input sm:col-span-2" />
          <button className="btn-secondary px-4 py-2 text-sm sm:col-span-2">Save shadow-shift plan</button>
        </form>

        {shadow ? (
          shadow.authorisedBy ? (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              Authorised by <strong>{shadow.authorisedBy}</strong> on {fmt(shadow.authorisedAt)}
              {shadow.shiftDate ? ` for ${fmt(shadow.shiftDate)}` : ""}.
            </p>
          ) : shadowReadiness && !shadowReadiness.readyToAuthorise ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Required before authorisation ({shadowReadiness.requirements.length})
              </div>
              <ul className="mt-1 space-y-1 text-sm text-amber-800">
                {shadowReadiness.requirements.map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
            </div>
          ) : (
            <form
              action={authoriseShadowShift}
              className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3"
            >
              <input type="hidden" name="caseId" value={c.id} />
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">
                  Manager authorisation (named)
                </label>
                <input name="approverName" placeholder="Manager name & role" className="input" required />
              </div>
              <button className="btn-primary px-4 py-2 text-sm">Authorise shadow shift</button>
            </form>
          )
        ) : null}
      </section>

      {/* Evidence documents — private Supabase Storage */}
      <section className="card mt-6">
        <h2 className="font-semibold text-stone-900">Evidence documents</h2>
        <p className="mt-1 text-xs text-stone-400">
          Received references, ID and check evidence. Stored in private buckets;
          downloaded only via short-lived signed links.
        </p>
        {storageReady ? (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  Upload received reference
                </div>
                <div className="mt-1">
                  <FileUpload
                    action={uploadCaseDocument}
                    hidden={{ caseId: c.id, kind: "reference" }}
                    label="Upload reference"
                  />
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  Upload other evidence
                </div>
                <div className="mt-1">
                  <FileUpload
                    action={uploadCaseDocument}
                    hidden={{ caseId: c.id, kind: "document" }}
                    label="Upload document"
                  />
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                Case documents
              </div>
              <div className="mt-1">
                <DocumentList documents={caseDocItems} fetchUrl={getCaseDocumentUrl} />
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-3 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-3 text-sm text-stone-500">
            Document storage isn&apos;t configured. Set the Supabase env vars and
            run <code>npm run storage:setup</code>.
          </p>
        )}
      </section>

      {/* Case notes */}
      <section className="card mt-6">
        <h2 className="font-semibold text-stone-900">Case notes</h2>
        <form action={saveCaseNotes} className="mt-3 space-y-2">
          <input type="hidden" name="caseId" value={c.id} />
          <textarea name="notes" defaultValue={c.notes ?? ""} rows={3} className="input" />
          <button className="btn-secondary px-4 py-2 text-sm">Save notes</button>
        </form>
      </section>

      {/* Audit trail */}
      <section className="card mt-6">
        <h2 className="font-semibold text-stone-900">Audit trail</h2>
        <p className="mt-1 text-xs text-stone-400">
          Append-only history of actions on this case — who did what, and when.
        </p>
        {auditTrail.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">No recorded activity yet.</p>
        ) : (
          <ol className="mt-3 space-y-3">
            {auditTrail.map((a) => (
              <li key={a.id} className="flex gap-3">
                <div className="mt-1.5 h-2 w-2 flex-none rounded-full bg-stone-300" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-stone-800">
                    {actionLabel(a.action)}
                  </div>
                  {a.summary ? (
                    <div className="text-sm text-stone-600">{a.summary}</div>
                  ) : null}
                  <div className="text-xs text-stone-400">
                    {fmtDateTime(a.at)}
                    {a.actor ? ` • ${a.actor}` : ""}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
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
