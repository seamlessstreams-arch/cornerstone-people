"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCandidate } from "@/lib/auth";
import { VISIBILITY_MODES } from "@/lib/constants";

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v === "" ? null : v;
}

export async function updateCandidateProfile(formData: FormData) {
  const { candidate } = await requireCandidate();

  // valuesTags arrives as multiple checkbox values
  const tags = formData.getAll("valuesTags").map((t) => String(t).trim());

  await prisma.candidate.update({
    where: { id: candidate.id },
    data: {
      // structured (pre-mutual safe)
      region: str(formData, "region"),
      shiftPattern: str(formData, "shiftPattern"),
      youngPeopleType: str(formData, "youngPeopleType"),
      experienceLevel: str(formData, "experienceLevel"),
      roleType: str(formData, "roleType"),
      valuesTags: tags.length ? tags.join(", ") : null,
      // sealed (narrative / identity)
      fullName: str(formData, "fullName"),
      photoUrl: str(formData, "photoUrl"),
      employmentHistory: str(formData, "employmentHistory"),
      narrative: str(formData, "narrative"),
    },
  });

  revalidatePath("/candidate/profile");
  revalidatePath("/candidate");
}

export async function setVisibilityMode(formData: FormData) {
  const { candidate } = await requireCandidate();
  const mode = String(formData.get("visibilityMode") ?? "");
  if (!VISIBILITY_MODES.includes(mode as (typeof VISIBILITY_MODES)[number])) {
    return;
  }
  await prisma.candidate.update({
    where: { id: candidate.id },
    data: { visibilityMode: mode },
  });
  revalidatePath("/candidate/profile");
  revalidatePath("/candidate");
}

export async function addReference(formData: FormData) {
  const { candidate } = await requireCandidate();
  const refereeName = str(formData, "refereeName");
  const refereeEmail = str(formData, "refereeEmail");
  const relationship = str(formData, "relationship");
  if (!refereeName || !refereeEmail || !relationship) return;

  await prisma.reference.create({
    data: {
      candidateId: candidate.id,
      refereeName,
      refereeEmail,
      relationship,
      token: randomBytes(24).toString("hex"),
    },
  });
  revalidatePath("/candidate/references");
  revalidatePath("/candidate");
}

export async function deleteReference(formData: FormData) {
  const { candidate } = await requireCandidate();
  const id = String(formData.get("referenceId") ?? "");
  // Only delete references belonging to this candidate.
  await prisma.reference.deleteMany({
    where: { id, candidateId: candidate.id },
  });
  revalidatePath("/candidate/references");
  revalidatePath("/candidate");
}

export async function blockEmployer(formData: FormData) {
  const { candidate } = await requireCandidate();
  const employerId = String(formData.get("employerId") ?? "");
  if (!employerId) return;

  await prisma.block.upsert({
    where: {
      candidateId_employerId: { candidateId: candidate.id, employerId },
    },
    create: { candidateId: candidate.id, employerId },
    update: {},
  });

  // A block must be absolute: also tear down any existing interest/match so the
  // candidate truly disappears for that employer.
  await prisma.interest.deleteMany({
    where: { candidateId: candidate.id, employerId },
  });
  await prisma.match.deleteMany({
    where: { candidateId: candidate.id, employerId },
  });

  revalidatePath("/candidate/blocks");
  revalidatePath("/candidate/browse");
}

export async function unblockEmployer(formData: FormData) {
  const { candidate } = await requireCandidate();
  const employerId = String(formData.get("employerId") ?? "");
  await prisma.block.deleteMany({
    where: { candidateId: candidate.id, employerId },
  });
  revalidatePath("/candidate/blocks");
  revalidatePath("/candidate/browse");
}
