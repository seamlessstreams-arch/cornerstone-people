// Agency-worker readiness (rule-based).
//
// An agency worker may only work once the agency has confirmed the required
// checks and identity has been seen on arrival — and may NEVER be in sole
// charge of children until a named manager has approved it on the evidence.
// Advisory only; the manager makes and records the decision.

export type AgencyInputs = {
  agencyChecksConfirmed: boolean;
  identitySeenOnArrival: boolean;
  dbsConfirmed: boolean;
  referencesConfirmed: boolean;
  rightToWorkConfirmed: boolean;
  soleChargeApproved: boolean;
};

export type AgencyReport = {
  /** May work, supervised, with no sole charge. */
  canWorkSupervised: boolean;
  /** May be left in sole charge of children. */
  soleChargeAllowed: boolean;
  outstanding: string[];
  blockers: string[];
};

export function assessAgencyWorker(i: AgencyInputs): AgencyReport {
  const outstanding: string[] = [];
  if (!i.agencyChecksConfirmed)
    outstanding.push("Written agency confirmation of checks");
  if (!i.identitySeenOnArrival) outstanding.push("Identity seen on arrival");
  if (!i.rightToWorkConfirmed) outstanding.push("Right to work confirmed");

  // Supervised work is allowed once the agency has confirmed checks, identity
  // is seen, and right to work is confirmed.
  const canWorkSupervised =
    i.agencyChecksConfirmed && i.identitySeenOnArrival && i.rightToWorkConfirmed;

  // Sole charge needs everything above plus DBS + references confirmed AND an
  // explicit manager approval. Anything missing is a hard blocker on sole charge.
  const blockers: string[] = [];
  if (!canWorkSupervised) blockers.push("Not yet cleared for supervised work");
  if (!i.dbsConfirmed) blockers.push("DBS not confirmed");
  if (!i.referencesConfirmed) blockers.push("References not confirmed");
  if (!i.soleChargeApproved) blockers.push("Sole charge not approved by a manager");

  const soleChargeAllowed = blockers.length === 0;

  return { canWorkSupervised, soleChargeAllowed, outstanding, blockers };
}
