import { test } from "node:test";
import assert from "node:assert/strict";
import type { Candidate } from "@prisma/client";
import { buildCandidateCard, parseTags } from "../lib/visibility";

// A fully-populated candidate with identifying details, used to prove those
// details are *not* leaked unless the rules allow it.
function makeCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: "cand_1",
    userId: "user_1",
    visibilityMode: "ANONYMOUS",
    region: "Greater Manchester",
    shiftPattern: "Nights only",
    youngPeopleType: "EBD / SEMH",
    experienceLevel: "3–5 years",
    roleType: "Senior Support Worker",
    valuesTags: "Trauma-informed, PACE",
    fullName: "Jordan Patel",
    photoUrl: "https://example.com/jordan.jpg",
    employmentHistory: "Two homes in the North West, 2019–present.",
    narrative: "I came into this work because of a key worker who changed things.",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

test("parseTags splits, trims and drops empties", () => {
  assert.deepEqual(parseTags("a, b ,, c "), ["a", "b", "c"]);
  assert.deepEqual(parseTags(null), []);
  assert.deepEqual(parseTags(""), []);
});

test("ANONYMOUS + no match: identity and narrative are fully sealed", () => {
  const card = buildCandidateCard(makeCandidate(), {
    matched: false,
    verified: true,
  });

  assert.equal(card.identityRevealed, false);
  assert.equal(card.fullName, null);
  assert.equal(card.photoUrl, null);
  assert.equal(card.employmentHistory, null);
  assert.equal(card.narrative, null);

  // Structured, pre-mutual-safe fields are still present.
  assert.equal(card.region, "Greater Manchester");
  assert.equal(card.roleType, "Senior Support Worker");
  assert.deepEqual(card.valuesTags, ["Trauma-informed", "PACE"]);
  assert.equal(card.verified, true);
});

test("OPEN + no match: name/photo/history reveal, but narrative stays sealed", () => {
  const card = buildCandidateCard(makeCandidate({ visibilityMode: "OPEN" }), {
    matched: false,
    verified: false,
  });

  assert.equal(card.identityRevealed, true);
  assert.equal(card.fullName, "Jordan Patel");
  assert.equal(card.photoUrl, "https://example.com/jordan.jpg");
  assert.equal(card.employmentHistory, "Two homes in the North West, 2019–present.");
  // Free text is the re-identification risk — sealed even in OPEN mode.
  assert.equal(card.narrative, null);
});

test("matched: everything unlocks, in either visibility mode", () => {
  for (const mode of ["ANONYMOUS", "OPEN"]) {
    const card = buildCandidateCard(
      makeCandidate({ visibilityMode: mode }),
      { matched: true, verified: true }
    );
    assert.equal(card.identityRevealed, true, mode);
    assert.equal(card.fullName, "Jordan Patel", mode);
    assert.equal(
      card.narrative,
      "I came into this work because of a key worker who changed things.",
      mode
    );
  }
});
