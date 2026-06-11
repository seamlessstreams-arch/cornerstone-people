import "server-only";
import { prisma } from "./db";
import { REQUIRED_VERIFIED_REFERENCES } from "./constants";
import {
  assessClearance,
  computeRag,
  type ClearanceReport,
  type RagReport,
} from "./safer-recruitment";

// Server-side data access for the Safer Recruitment OS. Every query here is
// scoped to a single employer — an employer can only ever see safer-recruitment
// data for their own organisation (RLS-equivalent enforced in application code,
// the same pattern the rest of this app uses).

export type CaseWithRelations = NonNullable<
  Awaited<ReturnType<typeof loadCase>>
>;

export async function loadCase(employerId: string, caseId: string) {
  const c = await prisma.saferRecruitmentCase.findFirst({
    where: { id: caseId, employerId },
    include: {
      candidate: true,
      match: true,
      references: { orderBy: { createdAt: "asc" }, include: { bankEntry: true } },
      gapReview: true,
      dbsCheck: true,
      identityCheck: true,
    },
  });
  return c;
}

export function clearanceForCase(c: CaseWithRelations): ClearanceReport {
  const received = c.references.filter(
    (r) => r.status === "RECEIVED" || r.status === "VERIFIED"
  ).length;
  const anyConcern = c.references.some(
    (r) => r.concernFlag || r.qualityStatus === "CONCERNING" || r.qualityStatus === "CONTRADICTORY"
  );

  return assessClearance({
    referencesReceived: received,
    referencesRequired: REQUIRED_VERIFIED_REFERENCES,
    anyReferenceConcern: anyConcern,
    dbsCertificateSeen: c.dbsCheck?.certificateSeen ?? false,
    dbsRiskReviewRequired: c.dbsCheck?.riskReviewRequired ?? false,
    rightToWorkVerified: false, // tracked within DBS/RTW workflow; default false
    employmentGapsReviewed: !!c.gapReview && c.gapReview.status !== "NEEDS_EXPLANATION",
    employmentGapStatus: c.gapReview?.status ?? null,
  });
}

// Roll a case up into a single RED/AMBER/GREEN status + start-eligibility +
// next action for the Command Centre. Structurally typed so it works with both
// the list query and the full case load.
type CaseForCompliance = {
  stage: string;
  clearedToStartBy: string | null;
  references: {
    status: string;
    concernFlag: boolean;
    qualityStatus: string | null;
    disposition: string | null;
    receivedAt: Date | null;
  }[];
  dbsCheck: { certificateSeen: boolean; riskReviewRequired: boolean } | null;
  identityCheck: {
    identityDocumentSeen: boolean;
    likenessConfirmed: boolean;
    rightToWorkVerified: boolean;
  } | null;
  gapReview: { status: string } | null;
};

export function caseCompliance(c: CaseForCompliance): RagReport {
  const received = c.references.filter(
    (r) => r.status === "RECEIVED" || r.status === "VERIFIED"
  ).length;
  const anyConcern = c.references.some(
    (r) =>
      r.concernFlag ||
      r.qualityStatus === "CONCERNING" ||
      r.qualityStatus === "CONTRADICTORY"
  );
  const referenceAwaitingResponse = c.references.some(
    (r) => (r.status === "SENT" || r.status === "CHASED") && !r.receivedAt
  );
  const referenceNeedsClarification = c.references.some(
    (r) =>
      r.status === "RECEIVED" &&
      r.disposition !== "ACCEPTED" &&
      (r.disposition === "MORE_INFORMATION_REQUIRED" ||
        r.qualityStatus === "REQUIRES_HUMAN_REVIEW" ||
        r.qualityStatus === "INCOMPLETE" ||
        r.qualityStatus === "BASIC")
  );

  const signedOff = !!c.clearedToStartBy;
  // Identity is verified once a document has been seen and the likeness
  // confirmed; right-to-work once its own check passes. A cleared sign-off
  // also implies both were satisfied as part of the human decision.
  const identityVerified =
    (!!c.identityCheck?.identityDocumentSeen &&
      !!c.identityCheck?.likenessConfirmed) ||
    signedOff;
  const rightToWorkVerified =
    (c.identityCheck?.rightToWorkVerified ?? false) || signedOff;

  return computeRag({
    stage: c.stage,
    humanSignedOff: signedOff,
    referencesReceived: received,
    referencesRequired: REQUIRED_VERIFIED_REFERENCES,
    anyReferenceConcern: anyConcern,
    referenceAwaitingResponse,
    referenceNeedsClarification,
    dbsCertificateSeen: c.dbsCheck?.certificateSeen ?? false,
    dbsRiskReviewRequired: c.dbsCheck?.riskReviewRequired ?? false,
    identityVerified,
    rightToWorkVerified,
    employmentGapsReviewed:
      !!c.gapReview && c.gapReview.status !== "NEEDS_EXPLANATION",
    employmentGapConcern:
      c.gapReview?.status === "CONCERN" || c.gapReview?.status === "ESCALATED",
  });
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// Aggregate stats for the safer-recruitment dashboard.
export async function dashboardStats(employerId: string) {
  const cases = await prisma.saferRecruitmentCase.findMany({
    where: { employerId },
    include: {
      candidate: true,
      references: true,
      gapReview: true,
      dbsCheck: true,
      identityCheck: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const casesWithCompliance = cases.map((c) => ({
    ...c,
    compliance: caseCompliance(c),
  }));

  const active = casesWithCompliance.filter(
    (c) => !["REJECTED", "WITHDRAWN", "TALENT_BANK"].includes(c.stage)
  );

  const red = active.filter((c) => c.compliance.rag === "RED").length;
  const amber = active.filter((c) => c.compliance.rag === "AMBER").length;
  const green = active.filter((c) => c.compliance.rag === "GREEN").length;

  const referenceHold = cases.filter((c) => c.stage === "REFERENCE_HOLD").length;
  const dbsHold = cases.filter((c) => c.stage === "DBS_HOLD").length;
  const gapHold = cases.filter((c) => c.stage === "EMPLOYMENT_GAP_HOLD").length;
  const rmReview = cases.filter((c) => c.stage === "RM_REVIEW_REQUIRED").length;
  const cleared = cases.filter((c) => c.stage === "CLEARED_TO_START").length;
  const exceptional = cases.filter(
    (c) => c.stage === "EXCEPTIONAL_SUPERVISED_START"
  ).length;

  // Average days to reference received (sentAt -> receivedAt).
  const turnarounds: number[] = [];
  const now = new Date();
  let overdueChasers = 0;
  for (const c of cases) {
    for (const r of c.references) {
      if (r.sentAt && r.receivedAt) {
        turnarounds.push(daysBetween(r.sentAt, r.receivedAt));
      }
      // Overdue: a scheduled chaser date is in the past and not yet received.
      const due = [r.chaser1At, r.chaser2At, r.finalChaserAt].filter(
        (d): d is Date => !!d
      );
      if (!r.receivedAt && due.some((d) => d < now)) overdueChasers++;
    }
  }
  const avgDaysToReference = turnarounds.length
    ? Math.round(turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length)
    : null;

  const riskAlerts = cases.filter((c) =>
    c.references.some(
      (r) => r.concernFlag || r.qualityStatus === "CONCERNING" || r.qualityStatus === "CONTRADICTORY"
    ) || c.dbsCheck?.riskReviewRequired || c.gapReview?.status === "CONCERN" || c.gapReview?.status === "ESCALATED"
  ).length;

  return {
    cases: casesWithCompliance,
    total: cases.length,
    activeCount: active.length,
    red,
    amber,
    green,
    referenceHold,
    dbsHold,
    gapHold,
    rmReview,
    cleared,
    exceptional,
    overdueChasers,
    avgDaysToReference,
    riskAlerts,
  };
}
