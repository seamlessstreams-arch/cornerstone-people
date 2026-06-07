import "server-only";
import { prisma } from "./db";
import { REQUIRED_VERIFIED_REFERENCES } from "./constants";
import { buildCandidateCard, type CandidateCard } from "./visibility";

// Re-export the pure visibility helpers so existing imports keep working.
export {
  buildCandidateCard,
  buildEmployerCard,
  parseTags,
} from "./visibility";
export type { CandidateCard, EmployerCard } from "./visibility";

// ---------------------------------------------------------------------------
// Verified badge
// ---------------------------------------------------------------------------

export async function countVerifiedReferences(candidateId: string) {
  return prisma.reference.count({
    where: { candidateId, status: "VERIFIED" },
  });
}

export async function isCandidateVerified(candidateId: string) {
  const n = await countVerifiedReferences(candidateId);
  return n >= REQUIRED_VERIFIED_REFERENCES;
}

// ---------------------------------------------------------------------------
// Match state
// ---------------------------------------------------------------------------

export async function getMatch(candidateId: string, employerId: string) {
  return prisma.match.findUnique({
    where: { candidateId_employerId: { candidateId, employerId } },
  });
}

export async function isMatched(candidateId: string, employerId: string) {
  return (await getMatch(candidateId, employerId)) !== null;
}

/**
 * Record a directional expression of interest, then create a Match if the other
 * side has already expressed interest. Blocks override everything: a blocked
 * employer can never form a match with the candidate who blocked them.
 *
 * Returns whether a NEW match was formed by this call.
 */
export async function expressInterest(
  candidateId: string,
  employerId: string,
  direction: "CANDIDATE" | "EMPLOYER"
): Promise<{ matched: boolean }> {
  // Layer 1: a block makes the candidate simply absent for that employer.
  const blocked = await prisma.block.findUnique({
    where: { candidateId_employerId: { candidateId, employerId } },
  });
  if (blocked) {
    // Silently no-op from the employer's side; from the candidate's side we
    // also do nothing, since interest in a blocked employer is contradictory.
    return { matched: false };
  }

  await prisma.interest.upsert({
    where: {
      candidateId_employerId_direction: { candidateId, employerId, direction },
    },
    create: { candidateId, employerId, direction },
    update: {},
  });

  const other = direction === "CANDIDATE" ? "EMPLOYER" : "CANDIDATE";
  const reciprocal = await prisma.interest.findUnique({
    where: {
      candidateId_employerId_direction: {
        candidateId,
        employerId,
        direction: other,
      },
    },
  });

  if (!reciprocal) return { matched: false };

  const existing = await getMatch(candidateId, employerId);
  if (existing) return { matched: false };

  await prisma.match.create({ data: { candidateId, employerId } });
  return { matched: true };
}

export async function hasExpressedInterest(
  candidateId: string,
  employerId: string,
  direction: "CANDIDATE" | "EMPLOYER"
) {
  const row = await prisma.interest.findUnique({
    where: {
      candidateId_employerId_direction: { candidateId, employerId, direction },
    },
  });
  return row !== null;
}

// ---------------------------------------------------------------------------
// Browsable pool (Layer 1 + Layer 2 enforcement)
// ---------------------------------------------------------------------------

/**
 * The pool of candidates an employer is allowed to browse:
 *   - excludes candidates who have blocked this employer (silently),
 *   - excludes incomplete profiles,
 *   - excludes candidates already matched (those appear under Matches).
 *
 * Anonymous and Open candidates rank identically — Anonymous is never penalised
 * (brief §4 Layer 0). The only difference is when identity reveals.
 */
export async function browsableCandidatesForEmployer(employerId: string) {
  const blocks = await prisma.block.findMany({
    where: { employerId },
    select: { candidateId: true },
  });
  const blockedIds = blocks.map((b) => b.candidateId);

  const matches = await prisma.match.findMany({
    where: { employerId },
    select: { candidateId: true },
  });
  const matchedIds = matches.map((m) => m.candidateId);

  const candidates = await prisma.candidate.findMany({
    where: {
      id: { notIn: [...blockedIds, ...matchedIds] },
      // require the structured fields to be present
      region: { not: null },
      shiftPattern: { not: null },
      youngPeopleType: { not: null },
      experienceLevel: { not: null },
      roleType: { not: null },
      valuesTags: { not: null },
    },
    orderBy: { updatedAt: "desc" },
  });

  const cards: CandidateCard[] = [];
  for (const c of candidates) {
    const verified = await isCandidateVerified(c.id);
    cards.push(buildCandidateCard(c, { matched: false, verified }));
  }
  return cards;
}
