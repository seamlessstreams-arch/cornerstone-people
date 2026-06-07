import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { prisma } from "../lib/db";
import {
  expressInterest,
  getMatch,
  isCandidateVerified,
  browsableCandidatesForEmployer,
} from "../lib/matching";

// These tests run against a throwaway Postgres database (see the `test` npm
// script / TEST_DATABASE_URL, which is force-reset before the tests run).

async function makeCandidate(complete = true) {
  const suffix = randomBytes(6).toString("hex");
  return prisma.candidate.create({
    data: {
      visibilityMode: "ANONYMOUS",
      ...(complete
        ? {
            region: "Greater Manchester",
            shiftPattern: "Days only",
            youngPeopleType: "EBD / SEMH",
            experienceLevel: "3–5 years",
            roleType: "Senior Support Worker",
            valuesTags: "Trauma-informed",
            fullName: "Test Candidate",
          }
        : {}),
      user: {
        create: {
          email: `cand_${suffix}@example.com`,
          passwordHash: "x",
          role: "CANDIDATE",
        },
      },
    },
  });
}

async function makeEmployer() {
  const suffix = randomBytes(6).toString("hex");
  return prisma.employer.create({
    data: {
      companyName: `Home ${suffix}`,
      user: {
        create: {
          email: `emp_${suffix}@example.com`,
          passwordHash: "x",
          role: "EMPLOYER",
        },
      },
    },
  });
}

async function clearAll() {
  await prisma.message.deleteMany();
  await prisma.match.deleteMany();
  await prisma.interest.deleteMany();
  await prisma.block.deleteMany();
  await prisma.reference.deleteMany();
  await prisma.position.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.employer.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
}

before(clearAll);
beforeEach(clearAll);

test("one-sided interest does not create a match", async () => {
  const c = await makeCandidate();
  const e = await makeEmployer();

  const r = await expressInterest(c.id, e.id, "EMPLOYER");
  assert.equal(r.matched, false);
  assert.equal(await getMatch(c.id, e.id), null);
});

test("mutual interest creates exactly one match", async () => {
  const c = await makeCandidate();
  const e = await makeEmployer();

  const first = await expressInterest(c.id, e.id, "EMPLOYER");
  assert.equal(first.matched, false);

  const second = await expressInterest(c.id, e.id, "CANDIDATE");
  assert.equal(second.matched, true);

  assert.notEqual(await getMatch(c.id, e.id), null);

  // Re-expressing interest must not create a duplicate match or re-fire.
  const again = await expressInterest(c.id, e.id, "CANDIDATE");
  assert.equal(again.matched, false);
  assert.equal(await prisma.match.count(), 1);
});

test("a block prevents any match, even with prior mutual interest", async () => {
  const c = await makeCandidate();
  const e = await makeEmployer();

  // Employer expresses interest first.
  await expressInterest(c.id, e.id, "EMPLOYER");
  // Candidate then blocks the employer.
  await prisma.block.create({ data: { candidateId: c.id, employerId: e.id } });

  // Candidate interest must now be a silent no-op — no match forms.
  const r = await expressInterest(c.id, e.id, "CANDIDATE");
  assert.equal(r.matched, false);
  assert.equal(await getMatch(c.id, e.id), null);
});

test("browsable pool hides blocked, incomplete and matched candidates", async () => {
  const e = await makeEmployer();

  const visible = await makeCandidate(true);
  const blocked = await makeCandidate(true);
  const incomplete = await makeCandidate(false);
  const matched = await makeCandidate(true);

  await prisma.block.create({
    data: { candidateId: blocked.id, employerId: e.id },
  });

  // Form a mutual match with `matched`.
  await expressInterest(matched.id, e.id, "EMPLOYER");
  await expressInterest(matched.id, e.id, "CANDIDATE");

  const pool = await browsableCandidatesForEmployer(e.id);
  const ids = pool.map((card) => card.candidateId);

  assert.ok(ids.includes(visible.id), "complete, non-blocked candidate visible");
  assert.ok(!ids.includes(blocked.id), "blocked candidate hidden");
  assert.ok(!ids.includes(incomplete.id), "incomplete profile hidden");
  assert.ok(!ids.includes(matched.id), "already-matched candidate hidden");

  // And the visible card never leaks identity pre-match.
  const card = pool.find((p) => p.candidateId === visible.id)!;
  assert.equal(card.identityRevealed, false);
  assert.equal(card.fullName, null);
});

test("verified badge requires the configured number of verified references", async () => {
  const c = await makeCandidate();

  assert.equal(await isCandidateVerified(c.id), false);

  // One verified reference is not enough (threshold is 2).
  await prisma.reference.create({
    data: {
      candidateId: c.id,
      refereeName: "A",
      refereeEmail: "a@example.com",
      relationship: "Manager",
      status: "VERIFIED",
      verifiedAt: new Date(),
      token: randomBytes(8).toString("hex"),
    },
  });
  assert.equal(await isCandidateVerified(c.id), false);

  // A pending reference still doesn't count.
  await prisma.reference.create({
    data: {
      candidateId: c.id,
      refereeName: "B",
      refereeEmail: "b@example.com",
      relationship: "Manager",
      status: "PENDING",
      token: randomBytes(8).toString("hex"),
    },
  });
  assert.equal(await isCandidateVerified(c.id), false);

  // A second verified reference earns the badge.
  await prisma.reference.create({
    data: {
      candidateId: c.id,
      refereeName: "C",
      refereeEmail: "c@example.com",
      relationship: "Manager",
      status: "VERIFIED",
      verifiedAt: new Date(),
      token: randomBytes(8).toString("hex"),
    },
  });
  assert.equal(await isCandidateVerified(c.id), true);
});
