// Safer Recruitment OS — pure logic.
//
// No DB, no server-only, no AI calls — so this is unit-testable and so the
// "rule-based first, AI-ready later" guarantee from the brief is auditable in
// one place. The AI agents (when keys are present) may LATER produce a richer
// draft, but they must run through these same shapes and can never set a
// human-sign-off outcome.

import type { ReferenceQuality } from "./constants";

// ---------------------------------------------------------------------------
// Reference quality analyser (rule-based)
//
// Scans free-text reference content for the safer-recruitment signals an
// employer must satisfy themselves on, and returns a status + explanation.
// It NEVER returns "accepted/rejected" — that is a human disposition stored
// separately. The worst it says is "concerning / requires human review".
// ---------------------------------------------------------------------------

export type ReferenceSignal =
  | "employmentDates"
  | "jobTitle"
  | "reasonForLeaving"
  | "conduct"
  | "attendance"
  | "safeguarding"
  | "disciplinary"
  | "capability"
  | "suitabilityWithChildren"
  | "wouldReEmploy";

// Patterns use a leading word boundary plus a stem (no trailing \b) so common
// inflections match — e.g. "disciplinar" matches "disciplinary".
const SIGNAL_PATTERNS: Record<ReferenceSignal, RegExp> = {
  employmentDates: /\b(from|since|between)?\s*((19|20)\d{2})\b|\b\d{1,2}[\/.-]\d{4}\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(19|20)\d{2}/i,
  jobTitle: /\b(job title|role|position|worked as|employed as|post of|capacity of)/i,
  reasonForLeaving: /\b(reason for leaving|left (to|because|for)|resign|redundan|end of contract|moved on|why.*left)/i,
  conduct: /\b(conduct|behaviour|behavior|professional|integrity|trustworth|honest|reliable in character)/i,
  attendance: /\b(attendance|punctual|timekeeping|reliab|sickness|absence)/i,
  safeguarding: /\b(safeguard|child protection|welfare|no concerns? .*child)/i,
  disciplinary: /\b(disciplinar|warning|investigat|allegation|grievance|misconduct)/i,
  capability: /\b(capabilit|competen|performance|skill|able to perform|carried out (their|his|her) duties)/i,
  suitabilityWithChildren: /\b(suitab\w* to work with (children|young people|vulnerable)|suitability for|fit to work with)/i,
  wouldReEmploy: /\b(re-?employ|re-?engage|would (we )?(happily |gladly )?(re-?)?employ|employ (them|him|her) again)/i,
};

// Phrases that mark a reference as basic/factual-only (no opinion volunteered).
const FACTUAL_ONLY =
  /\b(only (provide|give) (factual|basic) references?|policy.*factual|confirm (dates|employment) only|unable to comment|cannot provide an opinion)\b/i;

// Phrases that should always pull a human in, regardless of completeness.
const CONCERN_TERMS =
  /\b(dismissed|gross misconduct|terminated for|safeguarding concern|allegation upheld|not suitable|would not re-?employ|do not recommend|capability dismissal|under investigation)\b/i;

export type ReferenceAnalysis = {
  status: ReferenceQuality;
  present: ReferenceSignal[];
  missing: ReferenceSignal[];
  factualOnly: boolean;
  concernDetected: boolean;
  contradiction: boolean;
  explanation: string;
};

const SIGNAL_LABELS: Record<ReferenceSignal, string> = {
  employmentDates: "employment dates",
  jobTitle: "job title",
  reasonForLeaving: "reason for leaving",
  conduct: "conduct",
  attendance: "attendance / reliability",
  safeguarding: "safeguarding",
  disciplinary: "disciplinary history",
  capability: "capability",
  suitabilityWithChildren: "suitability to work with children",
  wouldReEmploy: "would re-employ",
};

const ALL_SIGNALS = Object.keys(SIGNAL_PATTERNS) as ReferenceSignal[];

/**
 * Analyse a received reference.
 *
 * @param text             the reference body
 * @param applicationFacts optional facts the candidate stated, used to spot
 *                         contradictions (e.g. claimed job title not present).
 */
export function analyseReference(
  text: string | null | undefined,
  applicationFacts?: { jobTitle?: string | null; claimedDates?: string | null }
): ReferenceAnalysis {
  const body = (text ?? "").trim();

  if (!body) {
    return {
      status: "INCOMPLETE",
      present: [],
      missing: ALL_SIGNALS,
      factualOnly: false,
      concernDetected: false,
      contradiction: false,
      explanation: "No reference content recorded yet.",
    };
  }

  const present = ALL_SIGNALS.filter((s) => SIGNAL_PATTERNS[s].test(body));
  const missing = ALL_SIGNALS.filter((s) => !present.includes(s));
  const factualOnly = FACTUAL_ONLY.test(body);
  const concernDetected = CONCERN_TERMS.test(body);

  // Contradiction: candidate stated a job title that the reference contradicts.
  let contradiction = false;
  if (applicationFacts?.jobTitle) {
    const claimed = applicationFacts.jobTitle.toLowerCase().trim();
    const mentionsTitle = body.toLowerCase().includes(claimed);
    // Only flag when the reference DOES discuss role but not the claimed one.
    if (!mentionsTitle && present.includes("jobTitle")) contradiction = true;
  }

  let status: ReferenceQuality;
  if (concernDetected) status = "CONCERNING";
  else if (contradiction) status = "CONTRADICTORY";
  else if (factualOnly) status = "BASIC";
  else if (present.length >= 9) status = "STRONG";
  else if (present.length >= 6) status = "ADEQUATE";
  else if (present.length >= 3) status = "INCOMPLETE";
  else status = "REQUIRES_HUMAN_REVIEW";

  // Safeguarding-sensitive gaps always escalate even if otherwise "adequate".
  if (
    (status === "ADEQUATE" || status === "STRONG") &&
    (missing.includes("safeguarding") || missing.includes("suitabilityWithChildren"))
  ) {
    status = "REQUIRES_HUMAN_REVIEW";
  }

  const parts: string[] = [];
  parts.push(
    `Covers ${present.length}/${ALL_SIGNALS.length} expected points.`
  );
  if (missing.length) {
    parts.push(
      `Missing: ${missing.map((m) => SIGNAL_LABELS[m]).join(", ")}.`
    );
  }
  if (factualOnly) parts.push("Reads as a factual/basic reference only.");
  if (contradiction)
    parts.push("Possible contradiction with the candidate's stated job title.");
  if (concernDetected)
    parts.push("Concern language detected — must go to human review.");
  parts.push("AI/rule-based draft — a human must make the suitability decision.");

  return {
    status,
    present,
    missing,
    factualOnly,
    concernDetected,
    contradiction,
    explanation: parts.join(" "),
  };
}

// ---------------------------------------------------------------------------
// Employment gap checker (rule-based)
//
// Takes a list of roles (with start/end month) and flags gaps, overlaps and
// short stints. Output is advisory: it sets a default review status but a
// human decides the final EMPLOYMENT_GAP_STATUS.
// ---------------------------------------------------------------------------

export type WorkPeriod = {
  label: string;
  /** inclusive start, "YYYY-MM" */
  start: string;
  /** inclusive end, "YYYY-MM", or null for "present" */
  end: string | null;
  kind?: "employment" | "agency" | "self-employed" | "education" | "other";
  reasonForLeaving?: string | null;
};

export type GapFinding = {
  type:
    | "GAP"
    | "OVERLAP"
    | "SHORT_ROLE"
    | "UNCLEAR_AGENCY"
    | "SELF_EMPLOYMENT"
    | "EDUCATION"
    | "MISSING_REASON";
  detail: string;
  months?: number;
};

function toMonthIndex(ym: string): number | null {
  const m = /^(\d{4})-(\d{2})$/.exec(ym.trim());
  if (!m) return null;
  return Number(m[1]) * 12 + (Number(m[2]) - 1);
}

function monthName(idx: number): string {
  const year = Math.floor(idx / 12);
  const month = (idx % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * @param now "YYYY-MM" treated as the present, for open-ended roles. Defaults
 *            to a fixed sentinel only used relatively, so tests are stable.
 */
export function checkEmploymentGaps(
  periods: WorkPeriod[],
  opts?: { now?: string; gapThresholdMonths?: number; shortRoleMonths?: number }
): { findings: GapFinding[]; totalGapMonths: number } {
  const gapThreshold = opts?.gapThresholdMonths ?? 1; // > 1 month is a gap
  const shortRole = opts?.shortRoleMonths ?? 3;
  const findings: GapFinding[] = [];

  const nowIdx = opts?.now ? toMonthIndex(opts.now) : null;

  // Normalise + sort by start.
  const rows = periods
    .map((p) => {
      const start = toMonthIndex(p.start);
      const end = p.end ? toMonthIndex(p.end) : nowIdx;
      return { ...p, startIdx: start, endIdx: end };
    })
    .filter((r): r is typeof r & { startIdx: number } => r.startIdx !== null)
    .sort((a, b) => a.startIdx - b.startIdx);

  let totalGapMonths = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const end = r.endIdx ?? r.startIdx;

    // Short role
    if (r.endIdx !== null && end - r.startIdx < shortRole) {
      findings.push({
        type: "SHORT_ROLE",
        detail: `${r.label} lasted under ${shortRole} months.`,
        months: Math.max(0, end - r.startIdx),
      });
    }

    if (r.kind === "agency") {
      findings.push({
        type: "UNCLEAR_AGENCY",
        detail: `${r.label} is an agency period — confirm placements and gaps within it.`,
      });
    }
    if (r.kind === "self-employed") {
      findings.push({
        type: "SELF_EMPLOYMENT",
        detail: `${r.label} is self-employment — needs independent verification.`,
      });
    }
    if (r.kind === "education") {
      findings.push({
        type: "EDUCATION",
        detail: `${r.label} is education/training — confirm with provider.`,
      });
    }
    if (r.kind !== "education" && !r.reasonForLeaving && r.endIdx !== null) {
      findings.push({
        type: "MISSING_REASON",
        detail: `${r.label} has no reason for leaving recorded.`,
      });
    }

    // Compare with next role for gaps/overlaps.
    const next = rows[i + 1];
    if (next) {
      const gap = next.startIdx - end;
      if (gap > gapThreshold) {
        totalGapMonths += gap;
        findings.push({
          type: "GAP",
          detail: `Unexplained gap of ${gap} months (${monthName(end)} → ${monthName(
            next.startIdx
          )}).`,
          months: gap,
        });
      } else if (gap < 0) {
        findings.push({
          type: "OVERLAP",
          detail: `${r.label} and ${next.label} overlap by ${Math.abs(gap)} months.`,
          months: Math.abs(gap),
        });
      }
    }
  }

  return { findings, totalGapMonths };
}

// ---------------------------------------------------------------------------
// Case readiness / clearance gate
//
// Computes which evidence is outstanding before a human may consider clearing
// a candidate to start. This NEVER clears anyone — it only reports readiness so
// the UI can require human sign-off and block premature "cleared to start".
// ---------------------------------------------------------------------------

export type ClearanceInputs = {
  referencesReceived: number;
  referencesRequired: number;
  anyReferenceConcern: boolean;
  dbsCertificateSeen: boolean;
  dbsRiskReviewRequired: boolean;
  rightToWorkVerified: boolean;
  employmentGapsReviewed: boolean;
  employmentGapStatus?: string | null;
};

export type ClearanceReport = {
  outstanding: string[];
  blockers: string[];
  readyForHumanDecision: boolean;
};

export function assessClearance(input: ClearanceInputs): ClearanceReport {
  const outstanding: string[] = [];
  const blockers: string[] = [];

  if (input.referencesReceived < input.referencesRequired) {
    outstanding.push(
      `${input.referencesReceived}/${input.referencesRequired} references received`
    );
  }
  if (input.anyReferenceConcern)
    blockers.push("A reference is flagged as concerning");
  if (!input.dbsCertificateSeen) outstanding.push("DBS certificate not yet seen");
  if (input.dbsRiskReviewRequired) blockers.push("DBS risk review required");
  if (!input.rightToWorkVerified) outstanding.push("Right to work not verified");
  if (!input.employmentGapsReviewed)
    outstanding.push("Employment gaps not reviewed");
  if (
    input.employmentGapStatus === "CONCERN" ||
    input.employmentGapStatus === "ESCALATED"
  ) {
    blockers.push("Employment gap review raised a concern");
  }

  return {
    outstanding,
    blockers,
    // A human may make a decision once nothing is outstanding. Blockers mean
    // the only safe routes are RM/RI review or an exceptional supervised start
    // — never an automatic clear.
    readyForHumanDecision: outstanding.length === 0,
  };
}

// ---------------------------------------------------------------------------
// RAG compliance status (rule-based)
//
// Rolls the per-check state of a case up into a single RED / AMBER / GREEN
// status plus a start-eligibility band and the single next action, for the
// Safer Recruitment Command Centre. Like everything else here it is advisory:
// GREEN / CLEARED is only ever reachable once a human has signed the case off
// — the function can never itself clear anyone.
// ---------------------------------------------------------------------------

export type Rag = "RED" | "AMBER" | "GREEN";

export type StartEligibility =
  | "NOT_ELIGIBLE"
  | "CONDITIONAL"
  | "EXCEPTIONAL_SUPERVISED_ONLY"
  | "CLEARED";

export type RagInputs = {
  stage: string;
  /** A manager has recorded a cleared-to-start sign-off. */
  humanSignedOff: boolean;
  referencesReceived: number;
  referencesRequired: number;
  anyReferenceConcern: boolean;
  /** At least one reference has been sent/chased but not yet returned. */
  referenceAwaitingResponse: boolean;
  /** A returned reference still needs clarification before it can be accepted. */
  referenceNeedsClarification: boolean;
  dbsCertificateSeen: boolean;
  dbsRiskReviewRequired: boolean;
  identityVerified: boolean;
  rightToWorkVerified: boolean;
  employmentGapsReviewed: boolean;
  employmentGapConcern: boolean;
  /** A qualification marked required for the post hasn't been evidenced yet. */
  requiredQualificationOutstanding?: boolean;
};

export type RagReport = {
  rag: Rag;
  startEligibility: StartEligibility;
  blockers: string[];
  outstanding: string[];
  nextAction: string;
};

export function computeRag(i: RagInputs): RagReport {
  const blockers: string[] = [];
  const outstanding: string[] = [];

  // Hard concerns — these always pull a human in (RED, never auto-cleared).
  if (i.anyReferenceConcern)
    blockers.push("Reference flagged as concerning — unresolved");
  if (i.dbsRiskReviewRequired)
    blockers.push("DBS disclosure needs a risk review");
  if (i.employmentGapConcern)
    blockers.push("Employment-gap review raised a concern");

  // Mandatory evidence still outstanding.
  if (!i.dbsCertificateSeen) outstanding.push("DBS certificate not yet seen");
  if (!i.identityVerified) outstanding.push("Identity not verified");
  if (!i.rightToWorkVerified) outstanding.push("Right to work not verified");
  if (!i.employmentGapsReviewed) outstanding.push("Employment gaps not reviewed");
  if (i.referencesReceived < i.referencesRequired) {
    outstanding.push(
      `${i.referencesReceived}/${i.referencesRequired} references received`,
    );
  } else if (i.referenceNeedsClarification) {
    outstanding.push("A reference needs clarification");
  }
  if (i.requiredQualificationOutstanding)
    outstanding.push("Required qualification not evidenced");

  let rag: Rag;
  let startEligibility: StartEligibility;
  let nextAction: string;

  if (i.stage === "EXCEPTIONAL_SUPERVISED_START") {
    rag = "AMBER";
    startEligibility = "EXCEPTIONAL_SUPERVISED_ONLY";
    nextAction = outstanding.length
      ? `Supervised start only — keep chasing: ${outstanding.join("; ")}.`
      : "Supervised start in effect — complete final manager sign-off.";
  } else if (blockers.length || i.stage === "RM_REVIEW_REQUIRED") {
    rag = "RED";
    startEligibility = "NOT_ELIGIBLE";
    nextAction = blockers.length
      ? `RM/RI review: ${blockers[0]}.`
      : "RM/RI to review and record a decision.";
  } else if (
    i.stage === "CLEARED_TO_START" &&
    i.humanSignedOff &&
    !outstanding.length
  ) {
    rag = "GREEN";
    startEligibility = "CLEARED";
    nextAction = "Cleared to start — staff file complete.";
  } else if (!outstanding.length) {
    // Everything gathered, no concerns — only the human gate remains.
    rag = "AMBER";
    startEligibility = "CONDITIONAL";
    nextAction = i.humanSignedOff
      ? "Move the case to cleared to start."
      : "Ready for manager sign-off.";
  } else {
    // Items still outstanding. References in flight are an AMBER "in progress";
    // a mandatory check missing with nothing moving is RED "not eligible".
    const referencesInFlight =
      i.referenceAwaitingResponse || i.referenceNeedsClarification;
    const mandatoryMissing =
      !i.dbsCertificateSeen ||
      !i.identityVerified ||
      !i.rightToWorkVerified ||
      !i.employmentGapsReviewed ||
      i.referencesReceived === 0;
    if (mandatoryMissing && !referencesInFlight) {
      rag = "RED";
      startEligibility = "NOT_ELIGIBLE";
    } else {
      rag = "AMBER";
      startEligibility = "CONDITIONAL";
    }
    nextAction = `Outstanding: ${outstanding.join("; ")}.`;
  }

  return { rag, startEligibility, blockers, outstanding, nextAction };
}

// ---------------------------------------------------------------------------
// Exceptional / supervised start readiness (rule-based)
//
// Reports whether an exceptional supervised start is ready for a named RM/RI to
// approve. It NEVER approves: it only lists what must be in place first. All
// hard supervision controls are mandatory — a supervised start with a gap in
// the controls is not a supervised start.
// ---------------------------------------------------------------------------

export type ExceptionalStartInputs = {
  businessReason?: string | null;
  riskLevel?: string | null;
  riskMitigation?: string | null;
  supervisorName?: string | null;
  noSoleCharge: boolean;
  noUnsupervisedAccess: boolean;
  noIntimateCare: boolean;
  noOvernight: boolean;
  reviewDate?: string | Date | null;
};

export type ExceptionalStartReport = {
  requirements: string[];
  readyForApproval: boolean;
};

export function assessExceptionalStart(
  i: ExceptionalStartInputs,
): ExceptionalStartReport {
  const requirements: string[] = [];

  if (!i.businessReason?.trim())
    requirements.push("Record the business reason for an early start");
  if (!i.riskLevel?.trim()) requirements.push("Assess the risk level");
  if (!i.riskMitigation?.trim())
    requirements.push("Describe how the risk is mitigated");
  if (!i.supervisorName?.trim())
    requirements.push("Name the responsible supervisor");
  if (!i.reviewDate) requirements.push("Set a review date");

  // Every hard control must be in place.
  if (!i.noSoleCharge) requirements.push("Confirm: never in sole charge");
  if (!i.noUnsupervisedAccess)
    requirements.push("Confirm: no unsupervised access");
  if (!i.noIntimateCare) requirements.push("Confirm: no intimate / personal care");
  if (!i.noOvernight)
    requirements.push("Confirm: no overnight or off-site responsibility");

  return { requirements, readyForApproval: requirements.length === 0 };
}
