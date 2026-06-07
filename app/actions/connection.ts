"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { expressInterest } from "@/lib/matching";

/**
 * Express interest from whichever side the current user is on, towards the
 * given counterparty. The matching service handles block enforcement and
 * mutual-match creation.
 */
export async function expressInterestAction(formData: FormData) {
  const user = await requireUser();

  if (user.role === "CANDIDATE") {
    const candidate = await prisma.candidate.findUniqueOrThrow({
      where: { userId: user.id },
    });
    const employerId = String(formData.get("employerId") ?? "");
    if (!employerId) return;
    await expressInterest(candidate.id, employerId, "CANDIDATE");
    revalidatePath("/candidate/browse");
    revalidatePath("/candidate/matches");
  } else {
    const employer = await prisma.employer.findUniqueOrThrow({
      where: { userId: user.id },
    });
    const candidateId = String(formData.get("candidateId") ?? "");
    if (!candidateId) return;
    await expressInterest(candidateId, employer.id, "EMPLOYER");
    revalidatePath("/employer/browse");
    revalidatePath("/employer/matches");
  }
}

/** Verify the current user is a participant in the given match. */
async function authoriseMatch(matchId: string, user: { id: string; role: string }) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return null;

  if (user.role === "CANDIDATE") {
    const candidate = await prisma.candidate.findUnique({
      where: { userId: user.id },
    });
    if (!candidate || candidate.id !== match.candidateId) return null;
  } else {
    const employer = await prisma.employer.findUnique({
      where: { userId: user.id },
    });
    if (!employer || employer.id !== match.employerId) return null;
  }
  return match;
}

export async function sendMessage(formData: FormData) {
  const user = await requireUser();
  const matchId = String(formData.get("matchId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!matchId || !body) return;

  const match = await authoriseMatch(matchId, user);
  if (!match) return;

  await prisma.message.create({
    data: { matchId, senderRole: user.role, body },
  });

  const base = user.role === "CANDIDATE" ? "/candidate" : "/employer";
  revalidatePath(`${base}/matches/${matchId}`);
}

export async function requestInterview(formData: FormData) {
  const user = await requireUser();
  const matchId = String(formData.get("matchId") ?? "");
  if (!matchId) return;

  const match = await authoriseMatch(matchId, user);
  if (!match || match.interviewRequestedAt) return;

  await prisma.match.update({
    where: { id: matchId },
    data: {
      interviewRequestedBy: user.role,
      interviewRequestedAt: new Date(),
    },
  });

  const base = user.role === "CANDIDATE" ? "/candidate" : "/employer";
  revalidatePath(`${base}/matches/${matchId}`);
}
