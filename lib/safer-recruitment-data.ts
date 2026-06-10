import "server-only";
import { prisma } from "./db";
import { REQUIRED_VERIFIED_REFERENCES } from "./constants";
import { assessClearance, type ClearanceReport } from "./safer-recruitment";

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
    },
    orderBy: { updatedAt: "desc" },
  });

  const active = cases.filter(
    (c) => !["REJECTED", "WITHDRAWN", "TALENT_BANK"].includes(c.stage)
  );

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
    cases,
    total: cases.length,
    activeCount: active.length,
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
