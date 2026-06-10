"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCandidate, requireEmployer } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import {
  uploadFile,
  signedUrl,
  deleteFile,
  isValidationError,
  BUCKETS,
  type BucketName,
} from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/supabase";

export type UploadActionState = { error?: string; ok?: boolean };

// --- Candidate documents (CV / certificates) -----------------------------

export async function uploadCandidateDocument(
  _prev: UploadActionState,
  formData: FormData
): Promise<UploadActionState> {
  const { candidate, user } = await requireCandidate();
  if (!isSupabaseConfigured())
    return { error: "Document storage is not configured yet." };

  const kind = String(formData.get("kind") ?? "cv");
  const bucket: BucketName =
    kind === "certificate" ? BUCKETS.candidateCertificates : BUCKETS.candidateCvs;
  const file = formData.get("file") as File | null;
  if (!file) return { error: "Choose a file to upload." };

  const result = await uploadFile({ bucket, prefix: candidate.id, file });
  if (isValidationError(result)) return { error: result.error };

  await prisma.storedFile.create({
    data: {
      bucket: result.bucket,
      path: result.path,
      originalName: result.originalName,
      contentType: result.contentType,
      size: result.size,
      kind,
      candidateId: candidate.id,
      uploadedBy: user.email,
    },
  });
  await logAudit({
    actor: user,
    action: "CANDIDATE_DOCUMENT_UPLOADED",
    entityType: "Candidate",
    entityId: candidate.id,
    summary: `Uploaded ${kind}: ${result.originalName}`,
  });
  revalidatePath("/candidate/profile");
  return { ok: true };
}

export async function deleteCandidateDocument(formData: FormData) {
  const { candidate, user } = await requireCandidate();
  const id = String(formData.get("fileId") ?? "");
  const f = await prisma.storedFile.findFirst({
    where: { id, candidateId: candidate.id },
  });
  if (!f) return;
  await deleteFile(f.bucket as BucketName, f.path);
  await prisma.storedFile.delete({ where: { id: f.id } });
  await logAudit({
    actor: user,
    action: "CANDIDATE_DOCUMENT_DELETED",
    entityType: "Candidate",
    entityId: candidate.id,
    summary: `Deleted ${f.kind ?? "document"}: ${f.originalName}`,
  });
  revalidatePath("/candidate/profile");
}

// Mint a short-lived signed URL for a document the caller is allowed to see.
// Candidates may read their own; employers may read documents for candidates
// they have a safer-recruitment case with (i.e. matched + case opened).
export async function getCandidateDocumentUrl(fileId: string): Promise<string | null> {
  const f = await prisma.storedFile.findUnique({ where: { id: fileId } });
  if (!f) return null;

  const candidate = await requireCandidateOrEmployerCanRead(f.candidateId);
  if (!candidate) return null;
  return signedUrl(f.bucket as BucketName, f.path, 120);
}

async function requireCandidateOrEmployerCanRead(
  candidateId: string | null
): Promise<boolean> {
  if (!candidateId) return false;
  // Candidate reading their own?
  try {
    const { candidate } = await requireCandidate();
    return candidate.id === candidateId;
  } catch {
    // not a candidate — fall through to employer check
  }
  const { employer } = await requireEmployer();
  const sharedCase = await prisma.saferRecruitmentCase.findFirst({
    where: { employerId: employer.id, candidateId },
    select: { id: true },
  });
  return !!sharedCase;
}

// --- Safer-recruitment / reference documents (employer side) -------------

export async function uploadCaseDocument(
  _prev: UploadActionState,
  formData: FormData
): Promise<UploadActionState> {
  const { employer, user } = await requireEmployer();
  if (!isSupabaseConfigured())
    return { error: "Document storage is not configured yet." };

  const caseId = String(formData.get("caseId") ?? "");
  const kind = String(formData.get("kind") ?? "document");
  const srCase = await prisma.saferRecruitmentCase.findFirst({
    where: { id: caseId, employerId: employer.id },
  });
  if (!srCase) return { error: "Case not found." };

  const file = formData.get("file") as File | null;
  if (!file) return { error: "Choose a file to upload." };

  const bucket: BucketName =
    kind === "reference"
      ? BUCKETS.referenceDocuments
      : BUCKETS.saferRecruitmentDocuments;
  const result = await uploadFile({ bucket, prefix: srCase.id, file });
  if (isValidationError(result)) return { error: result.error };

  await prisma.storedFile.create({
    data: {
      bucket: result.bucket,
      path: result.path,
      originalName: result.originalName,
      contentType: result.contentType,
      size: result.size,
      kind,
      caseId: srCase.id,
      employerId: employer.id,
      uploadedBy: user.email,
    },
  });
  await logAudit({
    actor: user,
    action: "CASE_DOCUMENT_UPLOADED",
    entityType: "SaferRecruitmentCase",
    entityId: srCase.id,
    summary: `Uploaded ${kind}: ${result.originalName}`,
  });
  revalidatePath(`/employer/safer-recruitment/${srCase.id}`);
  return { ok: true };
}

export async function getCaseDocumentUrl(fileId: string): Promise<string | null> {
  const { employer } = await requireEmployer();
  const f = await prisma.storedFile.findFirst({
    where: { id: fileId, employerId: employer.id },
  });
  if (!f) return null;
  return signedUrl(f.bucket as BucketName, f.path, 120);
}
