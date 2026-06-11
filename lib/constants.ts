// Controlled vocabularies and enum-like values.
//
// Pre-mutual anonymised cards are built from STRUCTURED fields only (dropdowns /
// tags), never free text — the re-identification guard from brief §4 Layer 2.
// Keeping the option lists here makes that guarantee easy to audit.

export const ROLES = ["CANDIDATE", "EMPLOYER"] as const;
export type Role = (typeof ROLES)[number];

export const VISIBILITY_MODES = ["ANONYMOUS", "OPEN"] as const;
export type VisibilityMode = (typeof VISIBILITY_MODES)[number];

// The MVP launches in a single, dense region (brief §8 cold-start plan).
export const REGIONS = [
  // England, county / metropolitan-area level (children's residential care is
  // England-regulated). Alphabetical for an easy dropdown.
  "Bedfordshire",
  "Berkshire",
  "Bristol",
  "Buckinghamshire",
  "Cambridgeshire",
  "Cheshire",
  "Cornwall",
  "County Durham",
  "Cumbria",
  "Derbyshire",
  "Devon",
  "Dorset",
  "East Riding of Yorkshire",
  "East Sussex",
  "Essex",
  "Gloucestershire",
  "Greater London",
  "Greater Manchester",
  "Hampshire",
  "Herefordshire",
  "Hertfordshire",
  "Isle of Wight",
  "Kent",
  "Lancashire",
  "Leicestershire",
  "Lincolnshire",
  "Merseyside",
  "Norfolk",
  "Northamptonshire",
  "Northumberland",
  "North Yorkshire",
  "Nottinghamshire",
  "Oxfordshire",
  "Rutland",
  "Shropshire",
  "Somerset",
  "South Yorkshire",
  "Staffordshire",
  "Suffolk",
  "Surrey",
  "Tees Valley",
  "Tyne and Wear",
  "Warwickshire",
  "West Midlands",
  "West Sussex",
  "West Yorkshire",
  "Wiltshire",
  "Worcestershire",
] as const;

export const SHIFT_PATTERNS = [
  "Days only",
  "Nights only",
  "Mixed days & nights",
  "Sleep-ins",
  "Flexible / bank",
] as const;

export const YOUNG_PEOPLE_TYPES = [
  "EBD / SEMH",
  "Trauma & attachment",
  "Learning disabilities",
  "Solo placements",
  "Sibling groups",
  "Unaccompanied minors (UASC)",
  "Step-down from secure",
] as const;

export const EXPERIENCE_LEVELS = [
  "New to sector",
  "1–2 years",
  "3–5 years",
  "5+ years",
  "Senior / management",
] as const;

export const ROLE_TYPES = [
  "Residential Support Worker",
  "Senior Support Worker",
  "Team Leader",
  "Deputy Manager",
  "Registered Manager",
  "Operations Manager",
  "Responsible Individual",
  "Waking Night Worker",
] as const;

export const VALUES_TAGS = [
  "Trauma-informed",
  "Therapeutic parenting",
  "PACE",
  "Restorative practice",
  "Dyadic Developmental Psychotherapy",
  "Strengths-based",
  "Child-centred",
  "Co-regulation",
] as const;

// A candidate earns the "verified" badge once this many references are verified.
export const REQUIRED_VERIFIED_REFERENCES = 2;

// Candidate profile is "complete" once all of these structured fields are set.
export const REQUIRED_CANDIDATE_FIELDS = [
  "region",
  "shiftPattern",
  "youngPeopleType",
  "experienceLevel",
  "roleType",
  "valuesTags",
] as const;

// ---------------------------------------------------------------------------
// Safer Recruitment OS vocabularies
//
// The safer-recruitment workflow only begins AFTER a mutual match (identity is
// unlocked), so a case always belongs to a Match. These ordered stages drive
// the employer pipeline board. The two "start" outcomes are deliberately
// distinct: nothing AI- or rule-based ever sets them — a human must.
// ---------------------------------------------------------------------------

export const SR_STAGES = [
  "APPLICATION_RECEIVED",
  "PHONE_SCREEN",
  "INTERVIEW_BOOKED",
  "INTERVIEWED",
  "CONDITIONAL_OFFER",
  "CHECKS_IN_PROGRESS",
  "REFERENCE_HOLD",
  "DBS_HOLD",
  "EMPLOYMENT_GAP_HOLD",
  "RM_REVIEW_REQUIRED",
  "CLEARED_TO_START",
  "EXCEPTIONAL_SUPERVISED_START",
  "REJECTED",
  "WITHDRAWN",
  "TALENT_BANK",
] as const;
export type SrStage = (typeof SR_STAGES)[number];

export const SR_STAGE_LABELS: Record<SrStage, string> = {
  APPLICATION_RECEIVED: "Application received",
  PHONE_SCREEN: "Phone screen",
  INTERVIEW_BOOKED: "Interview booked",
  INTERVIEWED: "Interviewed",
  CONDITIONAL_OFFER: "Conditional offer",
  CHECKS_IN_PROGRESS: "Checks in progress",
  REFERENCE_HOLD: "Reference hold",
  DBS_HOLD: "DBS hold",
  EMPLOYMENT_GAP_HOLD: "Employment gap hold",
  RM_REVIEW_REQUIRED: "RM/RI review required",
  CLEARED_TO_START: "Cleared to start",
  EXCEPTIONAL_SUPERVISED_START: "Exceptional supervised start",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  TALENT_BANK: "Talent bank",
};

// Stages a human must explicitly sign off (principle 3). Never auto-set.
export const SR_HUMAN_SIGNOFF_STAGES: SrStage[] = [
  "CLEARED_TO_START",
  "EXCEPTIONAL_SUPERVISED_START",
  "REJECTED",
];

export const REFERENCE_TYPES = [
  "Current employer",
  "Previous employer",
  "Children's workforce reference",
  "Character reference",
  "Agency reference",
  "Education / training reference",
] as const;
export type ReferenceType = (typeof REFERENCE_TYPES)[number];

export const REFERENCE_REQUEST_METHODS = [
  "Email",
  "Reference portal",
  "Phone",
  "Post",
] as const;

// Reference quality analyser outcomes (rule-based first, AI-ready later).
export const REFERENCE_QUALITY = [
  "STRONG",
  "ADEQUATE",
  "BASIC",
  "INCOMPLETE",
  "CONCERNING",
  "CONTRADICTORY",
  "REQUIRES_HUMAN_REVIEW",
] as const;
export type ReferenceQuality = (typeof REFERENCE_QUALITY)[number];

// Human disposition of a received reference. Separate from the analyser output.
export const REFERENCE_DISPOSITIONS = [
  "ACCEPTED",
  "INSUFFICIENT",
  "CONCERNING",
  "MORE_INFORMATION_REQUIRED",
] as const;

export const REFERENCE_REQUEST_STATUS = [
  "DRAFT",
  "SENT",
  "CHASED",
  "RECEIVED",
  "VERIFIED",
] as const;

export const EMPLOYMENT_GAP_STATUS = [
  "ACCEPTED",
  "NEEDS_EXPLANATION",
  "CONCERN",
  "ESCALATED",
] as const;

export const DBS_WORKFORCE_TYPES = [
  "Child workforce",
  "Adult workforce",
  "Child & adult workforce",
  "Other workforce",
] as const;

export const DBS_LEVELS = [
  "Enhanced with barred list",
  "Enhanced",
  "Standard",
  "Basic",
] as const;

// Exceptional / supervised start — used only when a candidate must start before
// every pre-employment check is complete. It is never automatic: it needs a
// risk assessment, a supervision plan with hard controls, and a named RM/RI
// approval.
export const EXCEPTIONAL_START_STATUS = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "DECLINED",
  "ENDED",
] as const;
export type ExceptionalStartStatus = (typeof EXCEPTIONAL_START_STATUS)[number];

export const EXCEPTIONAL_START_STATUS_LABELS: Record<
  ExceptionalStartStatus,
  string
> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending RM/RI approval",
  APPROVED: "Approved — supervised",
  DECLINED: "Declined",
  ENDED: "Ended",
};

export const RISK_LEVELS = ["low", "moderate", "high"] as const;

// Qualifications, mandatory training and professional registrations recorded on
// a staff file. "Required" ones must be evidenced before a start.
export const QUALIFICATION_KINDS = [
  "Qualification",
  "Mandatory training",
  "Professional registration",
  "Other",
] as const;
export type QualificationKind = (typeof QUALIFICATION_KINDS)[number];

// Candidate self-declaration (criminal self-disclosure) — requested at the
// shortlisted stage. Any disclosure is routed to a named manager for a
// confidential review before interview/offer.
export const SELF_DECLARATION_STATUS = [
  "PENDING",
  "SUBMITTED",
  "REVIEWED",
] as const;
export type SelfDeclarationStatus = (typeof SELF_DECLARATION_STATUS)[number];

export const SELF_DECLARATION_OUTCOMES = [
  "CLEAR",
  "DISCLOSURE_ACCEPTED",
  "ESCALATED",
] as const;

// The hard supervision controls that must all be in place before an
// exceptional supervised start can be approved.
export const EXCEPTIONAL_START_CONTROLS = [
  { key: "noSoleCharge", label: "Never in sole charge of children" },
  { key: "noUnsupervisedAccess", label: "No unsupervised access" },
  { key: "noIntimateCare", label: "No intimate / personal care" },
  { key: "noOvernight", label: "No overnight or off-site responsibility" },
] as const;
