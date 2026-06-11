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
      exceptionalStart: true,
      qualifications: { orderBy: { createdAt: "asc" } },
      selfDeclaration: true,
      healthDeclaration: true,
      shadowShift: true,
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
  qualifications?: { required: boolean; certificateSeen: boolean }[];
  selfDeclaration?: { disclosureFlagged: boolean; reviewedAt: Date | null } | null;
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
    requiredQualificationOutstanding: (c.qualifications ?? []).some(
      (q) => q.required && !q.certificateSeen
    ),
    unreviewedDisclosure:
      !!c.selfDeclaration?.disclosureFlagged && !c.selfDeclaration?.reviewedAt,
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
      qualifications: true,
      selfDeclaration: true,
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

// Due reminders / escalations across an employer's active cases. The system
// tracks chaser dates and review periods; this surfaces what is now due so a
// manager can act (and is the basis an email/cron dispatcher can sit on top of).
export type Reminder = {
  caseId: string;
  name: string;
  severity: "OVERDUE" | "DUE" | "ACTION";
  message: string;
};

export async function dueReminders(employerId: string): Promise<Reminder[]> {
  const cases = await prisma.saferRecruitmentCase.findMany({
    where: {
      employerId,
      stage: { notIn: ["REJECTED", "WITHDRAWN", "TALENT_BANK", "CLEARED_TO_START"] },
    },
    include: {
      candidate: true,
      references: true,
      selfDeclaration: true,
      exceptionalStart: true,
    },
  });

  const now = new Date();
  const out: Reminder[] = [];

  for (const c of cases) {
    const name = c.candidate.fullName ?? "Candidate";

    // Overdue reference chasers — pick the most advanced chaser that is due.
    for (const r of c.references) {
      if (r.receivedAt || r.status === "RECEIVED" || r.status === "VERIFIED") continue;
      const due = [
        { at: r.finalChaserAt, label: "Final chaser", sev: "OVERDUE" as const },
        { at: r.chaser2At, label: "2nd chaser", sev: "DUE" as const },
        { at: r.chaser1At, label: "1st chaser", sev: "DUE" as const },
      ].find((d) => d.at && d.at < now);
      if (due && due.at) {
        const days = Math.max(0, Math.round((now.getTime() - due.at.getTime()) / 86400000));
        out.push({
          caseId: c.id,
          name,
          severity: due.sev,
          message: `${due.label} due for reference from ${r.refereeName}${days ? ` (${days}d overdue)` : ""}`,
        });
      }
      if (r.concernFlag) {
        out.push({ caseId: c.id, name, severity: "ACTION", message: `Reference from ${r.refereeName} flagged as concerning` });
      }
    }

    // Exceptional start: awaiting approval, or past its review period.
    const ex = c.exceptionalStart;
    if (ex) {
      if (ex.status !== "APPROVED") {
        out.push({ caseId: c.id, name, severity: "ACTION", message: "Exceptional start awaiting RM/RI approval" });
      } else if (ex.reviewDate && ex.reviewDate < now) {
        out.push({ caseId: c.id, name, severity: "OVERDUE", message: "Exceptional-start review period exceeded — checks still outstanding" });
      }
    }

    // Self-declaration disclosure awaiting a confidential manager review.
    if (c.selfDeclaration?.disclosureFlagged && !c.selfDeclaration.reviewedAt) {
      out.push({ caseId: c.id, name, severity: "ACTION", message: "Self-declaration disclosure awaiting manager review" });
    }
  }

  const rank = { OVERDUE: 0, DUE: 1, ACTION: 2 } as const;
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

// Single Central Record — the Ofsted-ready staff-file index. One row per case
// with the state of each mandatory pre-employment check, the RAG roll-up, and
// the outstanding/missing evidence. Derived entirely from existing data.
export type StaffFileCheck = { ok: boolean; detail: string | null };
export type StaffFileRow = {
  caseId: string;
  name: string;
  stage: string;
  identity: StaffFileCheck;
  rightToWork: StaffFileCheck;
  dbs: StaffFileCheck;
  barredList: StaffFileCheck;
  references: StaffFileCheck;
  employmentGaps: StaffFileCheck;
  qualifications: StaffFileCheck;
  compliance: RagReport;
  missing: string[];
};

function ymd(d: Date | null | undefined): string | null {
  return d ? new Date(d).toISOString().slice(0, 10) : null;
}

// Audit trail for a single case — the append-only history of who did what,
// surfaced on the case page so the record is inspection-ready.
export type AuditEntry = {
  id: string;
  action: string;
  summary: string | null;
  actor: string | null;
  at: Date;
};

export async function caseAuditTrail(
  employerId: string,
  caseId: string,
): Promise<AuditEntry[]> {
  // Confirm the case belongs to this employer before exposing its history.
  const owns = await prisma.saferRecruitmentCase.findFirst({
    where: { id: caseId, employerId },
    select: { id: true },
  });
  if (!owns) return [];

  const rows = await prisma.auditLog.findMany({
    where: { entityType: "SaferRecruitmentCase", entityId: caseId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    summary: r.summary,
    actor: r.actorEmail ?? r.actorRole ?? null,
    at: r.createdAt,
  }));
}

export async function staffFileIndex(employerId: string): Promise<StaffFileRow[]> {
  const cases = await prisma.saferRecruitmentCase.findMany({
    where: {
      employerId,
      stage: { notIn: ["REJECTED", "WITHDRAWN", "TALENT_BANK"] },
    },
    include: {
      candidate: true,
      references: true,
      gapReview: true,
      dbsCheck: true,
      identityCheck: true,
      qualifications: true,
      selfDeclaration: true,
    },
    orderBy: { candidate: { fullName: "asc" } },
  });

  return cases.map((c) => {
    const compliance = caseCompliance(c);
    const received = c.references.filter(
      (r) => r.status === "RECEIVED" || r.status === "VERIFIED"
    ).length;
    const idc = c.identityCheck;
    const dbs = c.dbsCheck;

    return {
      caseId: c.id,
      name: c.candidate.fullName ?? "Candidate",
      stage: c.stage,
      identity: {
        ok: !!idc?.identityDocumentSeen && !!idc?.likenessConfirmed,
        detail: idc?.identityDocumentType ?? (ymd(idc?.checkedAt) && `Seen ${ymd(idc?.checkedAt)}`) ?? null,
      },
      rightToWork: {
        ok: !!idc?.rightToWorkVerified,
        detail: idc?.rightToWorkMethod ?? null,
      },
      dbs: {
        ok: !!dbs?.certificateSeen && !dbs?.riskReviewRequired,
        detail:
          dbs?.level ??
          (dbs?.certificateSeen ? `Seen ${ymd(dbs?.certificateDate)}` : null),
      },
      barredList: {
        ok: !!dbs?.barredListChecked,
        detail: dbs?.workforceType ?? null,
      },
      references: {
        ok: received >= REQUIRED_VERIFIED_REFERENCES,
        detail: `${received}/${REQUIRED_VERIFIED_REFERENCES} received`,
      },
      employmentGaps: {
        ok: !!c.gapReview && c.gapReview.status !== "NEEDS_EXPLANATION",
        detail: c.gapReview?.status ?? null,
      },
      qualifications: (() => {
        const quals = c.qualifications;
        const seen = quals.filter((q) => q.certificateSeen).length;
        const requiredOutstanding = quals.some(
          (q) => q.required && !q.certificateSeen
        );
        return {
          ok: quals.length > 0 && !requiredOutstanding,
          detail: quals.length ? `${seen}/${quals.length} evidenced` : "none recorded",
        };
      })(),
      compliance,
      missing: [...compliance.blockers, ...compliance.outstanding],
    };
  });
}
