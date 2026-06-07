// Pure visibility logic — no DB, no server-only — so it can be unit-tested
// directly. This is the most security-critical code in the app: it decides what
// an employer is allowed to see about a candidate before interest is mutual.

import type { Candidate, Employer } from "@prisma/client";

export type CandidateCard = {
  candidateId: string;
  verified: boolean;
  // Structured, pre-mutual-safe fields only:
  region: string | null;
  shiftPattern: string | null;
  youngPeopleType: string | null;
  experienceLevel: string | null;
  roleType: string | null;
  valuesTags: string[];
  // Identity — populated ONLY when allowed (open mode to non-blocked employers,
  // or after a mutual match).
  identityRevealed: boolean;
  fullName: string | null;
  photoUrl: string | null;
  employmentHistory: string | null;
  narrative: string | null;
};

export function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Build the card an employer is allowed to see for a candidate.
 *
 * Identity (name, photo, history) is revealed when:
 *   - there is a mutual match, OR
 *   - the candidate is in OPEN mode (name/photo/history up front).
 * Narrative free text is only ever revealed on a match, even in OPEN mode,
 * because free text is the re-identification risk this guard exists to contain.
 */
export function buildCandidateCard(
  candidate: Candidate,
  opts: { matched: boolean; verified: boolean }
): CandidateCard {
  const openMode = candidate.visibilityMode === "OPEN";
  const revealIdentity = opts.matched || openMode;
  const revealNarrative = opts.matched; // free text only on mutual match

  return {
    candidateId: candidate.id,
    verified: opts.verified,
    region: candidate.region,
    shiftPattern: candidate.shiftPattern,
    youngPeopleType: candidate.youngPeopleType,
    experienceLevel: candidate.experienceLevel,
    roleType: candidate.roleType,
    valuesTags: parseTags(candidate.valuesTags),
    identityRevealed: revealIdentity,
    fullName: revealIdentity ? candidate.fullName : null,
    photoUrl: revealIdentity ? candidate.photoUrl : null,
    employmentHistory: revealIdentity ? candidate.employmentHistory : null,
    narrative: revealNarrative ? candidate.narrative : null,
  };
}

export type EmployerCard = {
  employerId: string;
  companyName: string;
  region: string | null;
  sellingPoints: string | null;
  ethos: string | null;
  childrenSupported: string | null;
  placementPicture: string | null;
  shiftPattern: string | null;
  supportOffered: string | null;
  compensation: string | null;
};

export function buildEmployerCard(e: Employer): EmployerCard {
  return {
    employerId: e.id,
    companyName: e.companyName,
    region: e.region,
    sellingPoints: e.sellingPoints,
    ethos: e.ethos,
    childrenSupported: e.childrenSupported,
    placementPicture: e.placementPicture,
    shiftPattern: e.shiftPattern,
    supportOffered: e.supportOffered,
    compensation: e.compensation,
  };
}
