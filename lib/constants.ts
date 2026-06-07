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
  "Greater Manchester",
  "Lancashire",
  "Merseyside",
  "Cheshire",
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
