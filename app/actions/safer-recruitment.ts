"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireEmployer } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { analyseReference, assessExceptionalStart } from "@/lib/safer-recruitment";
import {
  SR_STAGES,
  SR_HUMAN_SIGNOFF_STAGES,
  type SrStage,
} from "@/lib/constants";

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v === "" ? null : v;
}
function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}
function date(formData: FormData, key: string): Date | null {
  const v = str(formData, key);
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

// Ensure the case belongs to this employer; returns it or throws redirect.
async function ownCase(employerId: string, caseId: string) {
  const c = await prisma.saferRecruitmentCase.findFirst({
    where: { id: caseId, employerId },
  });
  if (!c) redirect("/employer/safer-recruitment");
  return c;
}

// Open a safer-recruitment case from a match (only after identity is unlocked).
export async function openCase(formData: FormData) {
  const { employer, user } = await requireEmployer();
  const matchId = String(formData.get("matchId") ?? "");
  const match = await prisma.match.findFirst({
    where: { id: matchId, employerId: employer.id },
    include: { saferCase: true },
  });
  if (!match) redirect("/employer/matches");
  if (match.saferCase) redirect(`/employer/safer-recruitment/${match.saferCase.id}`);

  const created = await prisma.saferRecruitmentCase.create({
    data: {
      matchId: match.id,
      employerId: employer.id,
      candidateId: match.candidateId,
      stage: "APPLICATION_RECEIVED",
      createdBy: user.email,
    },
  });
  await logAudit({
    actor: user,
    action: "SR_CASE_OPENED",
    entityType: "SaferRecruitmentCase",
    entityId: created.id,
    summary: `Opened safer-recruitment case for candidate ${match.candidateId}`,
  });
  redirect(`/employer/safer-recruitment/${created.id}`);
}

export async function setStage(formData: FormData) {
  const { employer, user } = await requireEmployer();
  const caseId = String(formData.get("caseId") ?? "");
  const c = await ownCase(employer.id, caseId);
  const stage = String(formData.get("stage") ?? "") as SrStage;
  if (!SR_STAGES.includes(stage)) return;

  // Human sign-off stages capture WHO and WHEN, and require a typed name so the
  // record is a genuine human decision — never a default or an AI action.
  const data: Record<string, unknown> = { stage };
  if (SR_HUMAN_SIGNOFF_STAGES.includes(stage)) {
    const signoff = str(formData, "signoffName");
    if (!signoff) {
      // Refuse a sign-off stage without a named human.
      return;
    }
    data.decisionBy = signoff;
    data.decisionAt = new Date();
    if (stage === "CLEARED_TO_START") {
      data.clearedToStartBy = signoff;
      data.clearedToStartAt = new Date();
    }
  }

  await prisma.saferRecruitmentCase.update({ where: { id: c.id }, data });
  await logAudit({
    actor: user,
    action: "SR_STAGE_CHANGED",
    entityType: "SaferRecruitmentCase",
    entityId: c.id,
    summary: `Stage → ${stage}`,
    meta: { from: c.stage, to: stage, signoff: data.decisionBy ?? null },
  });
  revalidatePath(`/employer/safer-recruitment/${c.id}`);
  revalidatePath("/employer/safer-recruitment");
}

export async function saveCaseNotes(formData: FormData) {
  const { employer } = await requireEmployer();
  const caseId = String(formData.get("caseId") ?? "");
  const c = await ownCase(employer.id, caseId);
  await prisma.saferRecruitmentCase.update({
    where: { id: c.id },
    data: { notes: str(formData, "notes") },
  });
  revalidatePath(`/employer/safer-recruitment/${c.id}`);
}

// --- Reference requests --------------------------------------------------

export async function createReferenceRequest(formData: FormData) {
  const { employer, user } = await requireEmployer();
  const caseId = String(formData.get("caseId") ?? "");
  const c = await ownCase(employer.id, caseId);

  const refereeName = str(formData, "refereeName");
  const referenceType = str(formData, "referenceType");
  if (!refereeName || !referenceType) return;

  const created = await prisma.referenceRequest.create({
    data: {
      caseId: c.id,
      bankEntryId: str(formData, "bankEntryId") ?? undefined,
      referenceType,
      refereeName,
      refereeEmail: str(formData, "refereeEmail"),
      refereeOrg: str(formData, "refereeOrg"),
      method: str(formData, "method"),
      consentRecorded: bool(formData, "consentRecorded"),
      status: "DRAFT",
      createdBy: user.email,
    },
  });
  await logAudit({
    actor: user,
    action: "REFERENCE_REQUEST_CREATED",
    entityType: "ReferenceRequest",
    entityId: created.id,
    summary: `Created ${referenceType} reference request for ${refereeName}`,
  });
  revalidatePath(`/employer/safer-recruitment/${c.id}`);
}

export async function markReferenceSent(formData: FormData) {
  const { employer, user } = await requireEmployer();
  const id = String(formData.get("requestId") ?? "");
  const req = await prisma.referenceRequest.findFirst({
    where: { id, case: { employerId: employer.id } },
    include: { case: true },
  });
  if (!req) return;

  const now = new Date();
  // Auto-schedule chasers: +7, +14, +21 days, unless already set.
  const plus = (d: number) => new Date(now.getTime() + d * 86400000);
  await prisma.referenceRequest.update({
    where: { id },
    data: {
      status: "SENT",
      sentAt: now,
      chaser1At: req.chaser1At ?? plus(7),
      chaser2At: req.chaser2At ?? plus(14),
      finalChaserAt: req.finalChaserAt ?? plus(21),
    },
  });
  // Sending a request often means the case is now waiting on references.
  if (req.case.stage === "CHECKS_IN_PROGRESS" || req.case.stage === "CONDITIONAL_OFFER") {
    await prisma.saferRecruitmentCase.update({
      where: { id: req.caseId },
      data: { stage: "REFERENCE_HOLD" },
    });
  }
  await logAudit({
    actor: user,
    action: "REFERENCE_REQUEST_SENT",
    entityType: "ReferenceRequest",
    entityId: id,
    summary: `Reference request sent to ${req.refereeName}; chasers scheduled`,
  });
  revalidatePath(`/employer/safer-recruitment/${req.caseId}`);
}

export async function recordReferenceResponse(formData: FormData) {
  const { employer, user } = await requireEmployer();
  const id = String(formData.get("requestId") ?? "");
  const req = await prisma.referenceRequest.findFirst({
    where: { id, case: { employerId: employer.id } },
    include: { case: { include: { candidate: true } } },
  });
  if (!req) return;

  const responseText = str(formData, "responseText");
  // Rule-based analyser runs immediately; output is a DRAFT, stored separately
  // from the human disposition.
  const analysis = analyseReference(responseText, {
    jobTitle: req.case.candidate.roleType,
  });

  await prisma.referenceRequest.update({
    where: { id },
    data: {
      status: "RECEIVED",
      receivedAt: req.receivedAt ?? new Date(),
      responseText,
      qualityStatus: analysis.status,
      qualityNotes: analysis.explanation,
      concernFlag: analysis.concernDetected || analysis.contradiction,
    },
  });
  await logAudit({
    actor: user,
    action: "REFERENCE_RESPONSE_RECORDED",
    entityType: "ReferenceRequest",
    entityId: id,
    summary: `Reference received from ${req.refereeName}; analyser: ${analysis.status}`,
    meta: { ruleBased: true, status: analysis.status },
  });
  revalidatePath(`/employer/safer-recruitment/${req.caseId}`);
}

export async function setReferenceDisposition(formData: FormData) {
  const { employer, user } = await requireEmployer();
  const id = String(formData.get("requestId") ?? "");
  const req = await prisma.referenceRequest.findFirst({
    where: { id, case: { employerId: employer.id } },
  });
  if (!req) return;
  const disposition = str(formData, "disposition");
  await prisma.referenceRequest.update({
    where: { id },
    data: {
      disposition,
      rmReviewRequested: bool(formData, "rmReviewRequested"),
      verbalVerifiedBy: str(formData, "verbalVerifiedBy"),
      verbalVerifiedAt: str(formData, "verbalVerifiedBy") ? new Date() : req.verbalVerifiedAt,
    },
  });
  await logAudit({
    actor: user,
    action: "REFERENCE_DISPOSITION_SET",
    entityType: "ReferenceRequest",
    entityId: id,
    summary: `Human disposition: ${disposition}`,
  });
  revalidatePath(`/employer/safer-recruitment/${req.caseId}`);
}

// --- Employment gap review ----------------------------------------------

export async function saveGapReview(formData: FormData) {
  const { employer, user } = await requireEmployer();
  const caseId = String(formData.get("caseId") ?? "");
  const c = await ownCase(employer.id, caseId);
  const status = str(formData, "status") ?? "NEEDS_EXPLANATION";
  const findings = str(formData, "findings"); // JSON from the checker
  const managerNotes = str(formData, "managerNotes");

  await prisma.employmentGapReview.upsert({
    where: { caseId: c.id },
    create: {
      caseId: c.id,
      status,
      findings,
      managerNotes,
      reviewedBy: user.email,
    },
    update: { status, findings, managerNotes, reviewedBy: user.email },
  });
  await logAudit({
    actor: user,
    action: "EMPLOYMENT_GAP_REVIEWED",
    entityType: "SaferRecruitmentCase",
    entityId: c.id,
    summary: `Employment gap review: ${status}`,
  });
  revalidatePath(`/employer/safer-recruitment/${c.id}`);
}

// --- DBS / right-to-work ------------------------------------------------

export async function saveDbsCheck(formData: FormData) {
  const { employer, user } = await requireEmployer();
  const caseId = String(formData.get("caseId") ?? "");
  const c = await ownCase(employer.id, caseId);

  const payload = {
    status: str(formData, "status"),
    certificateDate: date(formData, "certificateDate"),
    level: str(formData, "level"),
    workforceType: str(formData, "workforceType"),
    barredListChecked: bool(formData, "barredListChecked"),
    updateService: bool(formData, "updateService"),
    updateServiceConsent: bool(formData, "updateServiceConsent"),
    dateChecked: date(formData, "dateChecked"),
    certificateSeen: bool(formData, "certificateSeen"),
    riskReviewRequired: bool(formData, "riskReviewRequired"),
    notes: str(formData, "notes"),
    checkedBy: user.email,
  };

  await prisma.dbsCheck.upsert({
    where: { caseId: c.id },
    create: { caseId: c.id, ...payload },
    update: payload,
  });
  await logAudit({
    actor: user,
    action: "DBS_CHECK_SAVED",
    entityType: "SaferRecruitmentCase",
    entityId: c.id,
    summary: `DBS/readiness updated (certificate seen: ${payload.certificateSeen})`,
  });
  revalidatePath(`/employer/safer-recruitment/${c.id}`);
}

export async function saveIdentityRightToWork(formData: FormData) {
  const { employer, user } = await requireEmployer();
  const caseId = String(formData.get("caseId") ?? "");
  const c = await ownCase(employer.id, caseId);

  const payload = {
    identityDocumentType: str(formData, "identityDocumentType"),
    identityDocumentSeen: bool(formData, "identityDocumentSeen"),
    photographSeen: bool(formData, "photographSeen"),
    likenessConfirmed: bool(formData, "likenessConfirmed"),
    nameDiscrepancyExplained: bool(formData, "nameDiscrepancyExplained"),
    rightToWorkVerified: bool(formData, "rightToWorkVerified"),
    rightToWorkMethod: str(formData, "rightToWorkMethod"),
    shareCode: str(formData, "shareCode"),
    timeLimited: bool(formData, "timeLimited"),
    followUpDate: date(formData, "followUpDate"),
    notes: str(formData, "notes"),
    checkedBy: user.email,
    checkedAt: new Date(),
  };

  await prisma.identityRightToWorkCheck.upsert({
    where: { caseId: c.id },
    create: { caseId: c.id, ...payload },
    update: payload,
  });
  await logAudit({
    actor: user,
    action: "IDENTITY_RTW_SAVED",
    entityType: "SaferRecruitmentCase",
    entityId: c.id,
    summary: `Identity/right-to-work updated (identity seen: ${payload.identityDocumentSeen}, RTW verified: ${payload.rightToWorkVerified})`,
  });
  revalidatePath(`/employer/safer-recruitment/${c.id}`);
}

// --- Exceptional / supervised start -------------------------------------

export async function saveExceptionalStart(formData: FormData) {
  const { employer, user } = await requireEmployer();
  const caseId = String(formData.get("caseId") ?? "");
  const c = await ownCase(employer.id, caseId);

  const payload = {
    businessReason: str(formData, "businessReason"),
    outstandingChecks: str(formData, "outstandingChecks"),
    riskLevel: str(formData, "riskLevel"),
    riskMitigation: str(formData, "riskMitigation"),
    supervisorName: str(formData, "supervisorName"),
    noSoleCharge: bool(formData, "noSoleCharge"),
    noUnsupervisedAccess: bool(formData, "noUnsupervisedAccess"),
    noIntimateCare: bool(formData, "noIntimateCare"),
    noOvernight: bool(formData, "noOvernight"),
    supervisionNotes: str(formData, "supervisionNotes"),
    reviewDate: date(formData, "reviewDate"),
  };

  await prisma.exceptionalStartAssessment.upsert({
    where: { caseId: c.id },
    // Saving the plan never approves it; a fresh plan is always a DRAFT.
    create: { caseId: c.id, status: "DRAFT", ...payload },
    update: payload,
  });
  await logAudit({
    actor: user,
    action: "EXCEPTIONAL_START_SAVED",
    entityType: "SaferRecruitmentCase",
    entityId: c.id,
    summary: `Exceptional-start plan updated (risk: ${payload.riskLevel ?? "—"})`,
  });
  revalidatePath(`/employer/safer-recruitment/${c.id}`);
}

// Record a named RM/RI approval. This is the human gate — it refuses to approve
// unless the risk assessment and every hard supervision control are in place.
export async function approveExceptionalStart(formData: FormData) {
  const { employer, user } = await requireEmployer();
  const caseId = String(formData.get("caseId") ?? "");
  const approverName = str(formData, "approverName");
  const c = await ownCase(employer.id, caseId);

  const existing = await prisma.exceptionalStartAssessment.findUnique({
    where: { caseId: c.id },
  });
  if (!existing || !approverName) {
    revalidatePath(`/employer/safer-recruitment/${c.id}`);
    return;
  }

  const readiness = assessExceptionalStart({
    businessReason: existing.businessReason,
    riskLevel: existing.riskLevel,
    riskMitigation: existing.riskMitigation,
    supervisorName: existing.supervisorName,
    noSoleCharge: existing.noSoleCharge,
    noUnsupervisedAccess: existing.noUnsupervisedAccess,
    noIntimateCare: existing.noIntimateCare,
    noOvernight: existing.noOvernight,
    reviewDate: existing.reviewDate,
  });
  if (!readiness.readyForApproval) {
    // Not ready — leave as pending and record the attempt, never approve.
    await prisma.exceptionalStartAssessment.update({
      where: { caseId: c.id },
      data: { status: "PENDING_APPROVAL" },
    });
    revalidatePath(`/employer/safer-recruitment/${c.id}`);
    return;
  }

  await prisma.exceptionalStartAssessment.update({
    where: { caseId: c.id },
    data: { status: "APPROVED", approvedBy: approverName, approvedAt: new Date() },
  });
  await logAudit({
    actor: user,
    action: "EXCEPTIONAL_START_APPROVED",
    entityType: "SaferRecruitmentCase",
    entityId: c.id,
    summary: `Exceptional supervised start approved by ${approverName}`,
  });
  revalidatePath(`/employer/safer-recruitment/${c.id}`);
}

// --- Reference bank ------------------------------------------------------

export async function saveReferenceBankEntry(formData: FormData) {
  const { employer, user } = await requireEmployer();
  const id = str(formData, "entryId");
  const organisationName = str(formData, "organisationName");
  if (!organisationName) return;

  const data = {
    organisationName,
    organisationType: str(formData, "organisationType"),
    hrEmail: str(formData, "hrEmail"),
    hrPhone: str(formData, "hrPhone"),
    portalLink: str(formData, "portalLink"),
    refereeName: str(formData, "refereeName"),
    refereeRole: str(formData, "refereeRole"),
    refereeEmail: str(formData, "refereeEmail"),
    refereePhone: str(formData, "refereePhone"),
    address: str(formData, "address"),
    preferredMethod: str(formData, "preferredMethod"),
    consentFormRequired: bool(formData, "consentFormRequired"),
    phoneVerificationAccepted: bool(formData, "phoneVerificationAccepted"),
    factualOnly: bool(formData, "factualOnly"),
    providesSafeguardingComment: bool(formData, "providesSafeguardingComment"),
    documentsRequired: str(formData, "documentsRequired"),
    chasePattern: str(formData, "chasePattern"),
    notes: str(formData, "notes"),
  };

  if (id) {
    const existing = await prisma.referenceBankEntry.findFirst({
      where: { id, employerId: employer.id },
    });
    if (!existing) return;
    await prisma.referenceBankEntry.update({
      where: { id },
      data: { ...data, updatedBy: user.email },
    });
  } else {
    await prisma.referenceBankEntry.create({
      data: { ...data, employerId: employer.id, createdBy: user.email, updatedBy: user.email },
    });
  }
  await logAudit({
    actor: user,
    action: id ? "REFERENCE_BANK_UPDATED" : "REFERENCE_BANK_CREATED",
    entityType: "ReferenceBankEntry",
    entityId: id ?? undefined,
    summary: `Reference bank entry ${organisationName}`,
  });
  revalidatePath("/employer/reference-bank");
}
