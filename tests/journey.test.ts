import { test, before } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";
import {
  expressInterest,
  getMatch,
  browsableCandidatesForEmployer,
} from "../lib/matching";
import { buildCandidateCard } from "../lib/visibility";
import { analyseReference, assessClearance } from "../lib/safer-recruitment";

// End-to-end acceptance journey (brief acceptance criteria 1–6):
//   1. a candidate signs up and builds a profile,
//   2. an employer exists and can browse the candidate,
//   3. mutual interest forms a match (identity unlocks),
//   4. the employer opens a safer-recruitment case,
//   5. the employer requests a reference; the analyser runs (rule-based),
//   6. clearance is computed but never auto-clears.
//
// This exercises the same library functions the server actions wrap, against a
// throwaway Postgres database (see the `test` npm script).

const suffix = () => randomBytes(6).toString("hex");

before(async () => {
  // Clean slate for FK-safe inserts is handled by the test harness reset.
});

test("acceptance: candidate signs up, builds a profile, and is browsable", async () => {
  const email = `cand_${suffix()}@example.com`;
  const passwordHash = await bcrypt.hash("password123", 10);

  // (1) sign up — mirrors app/actions/auth.ts signup for a CANDIDATE
  const user = await prisma.user.create({
    data: { email, passwordHash, role: "CANDIDATE", candidate: { create: {} } },
  });
  const candidate = await prisma.candidate.findUniqueOrThrow({
    where: { userId: user.id },
  });

  // (1b) build a profile — mirrors updateCandidateProfile
  await prisma.candidate.update({
    where: { id: candidate.id },
    data: {
      region: "Greater Manchester",
      shiftPattern: "Mixed days & nights",
      youngPeopleType: "EBD / SEMH",
      experienceLevel: "3–5 years",
      roleType: "Senior Support Worker",
      valuesTags: "Trauma-informed, PACE",
      fullName: "Journey Candidate",
      employmentHistory: "3–5 years residential childcare.",
      narrative: "Consistency and patience.",
    },
  });

  // (2) an employer can browse the (complete) candidate, but identity is sealed
  const employer = await prisma.employer.create({
    data: {
      companyName: `Home ${suffix()}`,
      user: {
        create: {
          email: `emp_${suffix()}@example.com`,
          passwordHash,
          role: "EMPLOYER",
        },
      },
    },
  });

  const pool = await browsableCandidatesForEmployer(employer.id);
  const card = pool.find((c) => c.candidateId === candidate.id);
  assert.ok(card, "candidate with a complete profile should be browsable");
  assert.equal(card!.identityRevealed, false, "identity sealed pre-match");
  assert.equal(card!.fullName, null);
  assert.equal(card!.roleType, "Senior Support Worker", "structured fields visible");
});

test("acceptance: mutual interest forms a match and unlocks identity", async () => {
  const passwordHash = await bcrypt.hash("password123", 10);
  const user = await prisma.user.create({
    data: {
      email: `cand_${suffix()}@example.com`,
      passwordHash,
      role: "CANDIDATE",
      candidate: {
        create: {
          region: "Greater Manchester",
          shiftPattern: "Sleep-ins",
          youngPeopleType: "Trauma & attachment",
          experienceLevel: "5+ years",
          roleType: "Deputy Manager",
          valuesTags: "PACE",
          fullName: "Match Candidate",
        },
      },
    },
    include: { candidate: true },
  });
  const candidateId = user.candidate!.id;
  const employer = await prisma.employer.create({
    data: {
      companyName: `Home ${suffix()}`,
      user: { create: { email: `emp_${suffix()}@example.com`, passwordHash, role: "EMPLOYER" } },
    },
  });

  // candidate expresses interest first — no match yet
  let r = await expressInterest(candidateId, employer.id, "CANDIDATE");
  assert.equal(r.matched, false);
  assert.equal(await getMatch(candidateId, employer.id), null);

  // employer reciprocates — match forms
  r = await expressInterest(candidateId, employer.id, "EMPLOYER");
  assert.equal(r.matched, true);
  const match = await getMatch(candidateId, employer.id);
  assert.ok(match, "a match should exist after mutual interest");

  // identity now unlocks on the card
  const candidate = await prisma.candidate.findUniqueOrThrow({ where: { id: candidateId } });
  const card = buildCandidateCard(candidate, { matched: true, verified: false });
  assert.equal(card.identityRevealed, true);
  assert.equal(card.fullName, "Match Candidate");

  // (4) employer opens a safer-recruitment case from the match
  const srCase = await prisma.saferRecruitmentCase.create({
    data: {
      matchId: match!.id,
      employerId: employer.id,
      candidateId,
      stage: "APPLICATION_RECEIVED",
    },
  });

  // (5) request a reference and record a response — analyser runs
  const text =
    "Employed as Deputy Manager from 2018 to 2023. Reason for leaving: progression. Conduct, attendance and reliability excellent. No disciplinary or capability matters. No safeguarding concerns. Suitable to work with children. Would re-employ.";
  const analysis = analyseReference(text, { jobTitle: "Deputy Manager" });
  await prisma.referenceRequest.create({
    data: {
      caseId: srCase.id,
      referenceType: "Previous employer",
      refereeName: "A Referee",
      status: "RECEIVED",
      receivedAt: new Date(),
      responseText: text,
      qualityStatus: analysis.status,
    },
  });
  assert.ok(
    ["STRONG", "ADEQUATE", "REQUIRES_HUMAN_REVIEW"].includes(analysis.status),
    `analyser returns a labelled status (got ${analysis.status})`
  );
  // The analyser must never auto-clear.
  assert.ok(!["ACCEPTED", "CLEARED"].includes(analysis.status as string));

  // (6) clearance gate: one reference received, DBS not seen → not ready, no auto-clear
  const report = assessClearance({
    referencesReceived: 1,
    referencesRequired: 2,
    anyReferenceConcern: false,
    dbsCertificateSeen: false,
    dbsRiskReviewRequired: false,
    rightToWorkVerified: false,
    employmentGapsReviewed: false,
  });
  assert.equal(report.readyForHumanDecision, false, "must not be ready while checks outstanding");
  assert.ok(report.outstanding.length > 0);
});
