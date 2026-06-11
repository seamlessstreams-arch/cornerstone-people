import { test } from "node:test";
import assert from "node:assert/strict";
import {
  analyseReference,
  checkEmploymentGaps,
  assessClearance,
  computeRag,
  assessExceptionalStart,
  type RagInputs,
} from "../lib/safer-recruitment";

// Pure-logic tests — no DB needed. These pin the safety-critical guarantees:
// the analysers never produce a final "accept/clear" decision, concerns always
// escalate, and clearance never auto-approves.

test("analyseReference: empty content is INCOMPLETE", () => {
  const r = analyseReference("");
  assert.equal(r.status, "INCOMPLETE");
  assert.equal(r.present.length, 0);
});

test("analyseReference: a full, positive reference reads as STRONG", () => {
  const text = `I confirm Jane Doe was employed as a Senior Support Worker from January 2019 to March 2023.
  Her reason for leaving was career progression. Her conduct and professional integrity were excellent,
  her attendance and timekeeping were reliable, and there were no safeguarding or child protection concerns.
  There were no disciplinary or capability proceedings. She is suitable to work with children and vulnerable
  young people, and I would happily re-employ her.`;
  const r = analyseReference(text, { jobTitle: "Senior Support Worker" });
  assert.equal(r.status, "STRONG");
  assert.ok(!r.concernDetected);
});

test("analyseReference: concern language always escalates to CONCERNING", () => {
  const text = `Employed 2020-2022 as support worker. There was a safeguarding concern and they were dismissed for gross misconduct.`;
  const r = analyseReference(text);
  assert.equal(r.status, "CONCERNING");
  assert.ok(r.concernDetected);
});

test("analyseReference: missing safeguarding comment forces human review", () => {
  // Covers many points but omits safeguarding + suitability — must escalate.
  const text = `Employed as Support Worker from 2019 to 2022. Reason for leaving: relocation.
  Conduct was professional, attendance reliable, no disciplinary issues, capable in role. Would re-employ.`;
  const r = analyseReference(text);
  assert.equal(r.status, "REQUIRES_HUMAN_REVIEW");
});

test("analyseReference: factual-only reference reads as BASIC", () => {
  const text = `Our policy is to provide factual references only. We confirm employment dates from 2018 to 2021.`;
  const r = analyseReference(text);
  assert.equal(r.status, "BASIC");
  assert.ok(r.factualOnly);
});

test("analyseReference: never returns an accept/clear status", () => {
  for (const sample of ["", "great worker would re-employ", "dismissed for misconduct"]) {
    const r = analyseReference(sample);
    assert.ok(
      !["ACCEPTED", "CLEARED", "APPROVED"].includes(r.status as string),
      `analyser must not auto-accept (got ${r.status})`
    );
  }
});

test("checkEmploymentGaps: detects a gap between two roles", () => {
  const { findings, totalGapMonths } = checkEmploymentGaps([
    { label: "Role A", start: "2018-01", end: "2019-01" },
    { label: "Role B", start: "2019-08", end: "2020-01" },
  ]);
  const gap = findings.find((f) => f.type === "GAP");
  assert.ok(gap, "expected a GAP finding");
  assert.equal(gap?.months, 7);
  assert.equal(totalGapMonths, 7);
});

test("checkEmploymentGaps: detects overlapping roles", () => {
  const { findings } = checkEmploymentGaps([
    { label: "Role A", start: "2018-01", end: "2019-06" },
    { label: "Role B", start: "2019-01", end: "2020-01" },
  ]);
  assert.ok(findings.some((f) => f.type === "OVERLAP"));
});

test("checkEmploymentGaps: flags short roles and missing reasons", () => {
  const { findings } = checkEmploymentGaps([
    { label: "Brief role", start: "2020-01", end: "2020-02" },
  ]);
  assert.ok(findings.some((f) => f.type === "SHORT_ROLE"));
  assert.ok(findings.some((f) => f.type === "MISSING_REASON"));
});

test("assessClearance: never ready while evidence outstanding", () => {
  const report = assessClearance({
    referencesReceived: 0,
    referencesRequired: 2,
    anyReferenceConcern: false,
    dbsCertificateSeen: false,
    dbsRiskReviewRequired: false,
    rightToWorkVerified: false,
    employmentGapsReviewed: false,
  });
  assert.equal(report.readyForHumanDecision, false);
  assert.ok(report.outstanding.length > 0);
});

test("assessClearance: concern is a blocker even when nothing outstanding", () => {
  const report = assessClearance({
    referencesReceived: 2,
    referencesRequired: 2,
    anyReferenceConcern: true,
    dbsCertificateSeen: true,
    dbsRiskReviewRequired: false,
    rightToWorkVerified: true,
    employmentGapsReviewed: true,
    employmentGapStatus: "ACCEPTED",
  });
  assert.ok(report.blockers.length > 0);
});

// ---------------------------------------------------------------------------
// computeRag — RAG compliance roll-up. Pins the safety guarantees: GREEN /
// CLEARED is unreachable without a human sign-off, and any concern forces RED.
// ---------------------------------------------------------------------------

const baseRag: RagInputs = {
  stage: "CHECKS_IN_PROGRESS",
  humanSignedOff: false,
  referencesReceived: 0,
  referencesRequired: 2,
  anyReferenceConcern: false,
  referenceAwaitingResponse: false,
  referenceNeedsClarification: false,
  dbsCertificateSeen: false,
  dbsRiskReviewRequired: false,
  identityVerified: false,
  rightToWorkVerified: false,
  employmentGapsReviewed: false,
  employmentGapConcern: false,
};

test("computeRag: a fresh case with nothing done is RED / not eligible", () => {
  const r = computeRag(baseRag);
  assert.equal(r.rag, "RED");
  assert.equal(r.startEligibility, "NOT_ELIGIBLE");
});

test("computeRag: references in flight (DBS seen, gaps ok, ID/RTW ok) is AMBER", () => {
  const r = computeRag({
    ...baseRag,
    dbsCertificateSeen: true,
    identityVerified: true,
    rightToWorkVerified: true,
    employmentGapsReviewed: true,
    referencesReceived: 1,
    referenceAwaitingResponse: true,
  });
  assert.equal(r.rag, "AMBER");
  assert.equal(r.startEligibility, "CONDITIONAL");
});

test("computeRag: missing identity keeps a case RED / not eligible", () => {
  const r = computeRag({
    ...baseRag,
    dbsCertificateSeen: true,
    rightToWorkVerified: true,
    employmentGapsReviewed: true,
    referencesReceived: 2,
    identityVerified: false, // nothing in flight, a mandatory check missing
  });
  assert.equal(r.rag, "RED");
  assert.equal(r.startEligibility, "NOT_ELIGIBLE");
  assert.ok(r.outstanding.some((o) => /identity/i.test(o)));
});

test("computeRag: a reference concern forces RED even when otherwise complete", () => {
  const r = computeRag({
    ...baseRag,
    stage: "CLEARED_TO_START",
    humanSignedOff: true,
    dbsCertificateSeen: true,
    identityVerified: true,
    rightToWorkVerified: true,
    employmentGapsReviewed: true,
    referencesReceived: 2,
    anyReferenceConcern: true,
  });
  assert.equal(r.rag, "RED");
  assert.ok(r.blockers.length > 0);
});

test("computeRag: GREEN/CLEARED only with sign-off and nothing outstanding", () => {
  const cleared = computeRag({
    ...baseRag,
    stage: "CLEARED_TO_START",
    humanSignedOff: true,
    dbsCertificateSeen: true,
    identityVerified: true,
    rightToWorkVerified: true,
    employmentGapsReviewed: true,
    referencesReceived: 2,
  });
  assert.equal(cleared.rag, "GREEN");
  assert.equal(cleared.startEligibility, "CLEARED");

  // Same evidence but no human sign-off can never be GREEN.
  const notSignedOff = computeRag({
    ...baseRag,
    stage: "CHECKS_IN_PROGRESS",
    humanSignedOff: false,
    dbsCertificateSeen: true,
    identityVerified: true,
    rightToWorkVerified: true,
    employmentGapsReviewed: true,
    referencesReceived: 2,
  });
  assert.notEqual(notSignedOff.rag, "GREEN");
});

test("computeRag: exceptional supervised start is AMBER / supervised-only", () => {
  const r = computeRag({
    ...baseRag,
    stage: "EXCEPTIONAL_SUPERVISED_START",
    dbsCertificateSeen: true,
  });
  assert.equal(r.startEligibility, "EXCEPTIONAL_SUPERVISED_ONLY");
});

// ---------------------------------------------------------------------------
// assessExceptionalStart — the supervised-start approval gate. Pins that all
// hard controls are mandatory and the gate never self-approves.
// ---------------------------------------------------------------------------

const fullExceptional = {
  businessReason: "Urgent cover for a child's 1:1 place",
  riskLevel: "moderate",
  riskMitigation: "Paired with a DBS-cleared lead at all times",
  supervisorName: "A. Manager (Registered Manager)",
  noSoleCharge: true,
  noUnsupervisedAccess: true,
  noIntimateCare: true,
  noOvernight: true,
  reviewDate: "2026-07-01",
};

test("assessExceptionalStart: ready only when everything is in place", () => {
  const r = assessExceptionalStart(fullExceptional);
  assert.equal(r.readyForApproval, true);
  assert.equal(r.requirements.length, 0);
});

test("assessExceptionalStart: a missing hard control blocks approval", () => {
  const r = assessExceptionalStart({ ...fullExceptional, noSoleCharge: false });
  assert.equal(r.readyForApproval, false);
  assert.ok(r.requirements.some((x) => /sole charge/i.test(x)));
});

test("assessExceptionalStart: empty assessment lists every requirement", () => {
  const r = assessExceptionalStart({
    businessReason: null,
    riskLevel: null,
    riskMitigation: null,
    supervisorName: null,
    noSoleCharge: false,
    noUnsupervisedAccess: false,
    noIntimateCare: false,
    noOvernight: false,
    reviewDate: null,
  });
  assert.equal(r.readyForApproval, false);
  assert.ok(r.requirements.length >= 9);
});
