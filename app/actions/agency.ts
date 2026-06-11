"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireEmployer } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v === "" ? null : v;
}
function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

export async function addAgencyWorker(formData: FormData) {
  const { employer, user } = await requireEmployer();
  const fullName = str(formData, "fullName");
  if (!fullName) return;
  const created = await prisma.agencyWorker.create({
    data: {
      employerId: employer.id,
      fullName,
      agencyName: str(formData, "agencyName"),
      role: str(formData, "role"),
    },
  });
  await logAudit({
    actor: user,
    action: "AGENCY_WORKER_ADDED",
    entityType: "AgencyWorker",
    entityId: created.id,
    summary: `Agency worker added: ${fullName}`,
  });
  revalidatePath("/employer/agency");
}

async function own(employerId: string, id: string | null) {
  if (!id) return null;
  return prisma.agencyWorker.findFirst({ where: { id, employerId } });
}

export async function updateAgencyWorker(formData: FormData) {
  const { employer, user } = await requireEmployer();
  const w = await own(employer.id, str(formData, "workerId"));
  if (!w) return;

  const soleChargeApproved = bool(formData, "soleChargeApproved");
  await prisma.agencyWorker.update({
    where: { id: w.id },
    data: {
      agencyChecksConfirmed: bool(formData, "agencyChecksConfirmed"),
      agencyConfirmationRef: str(formData, "agencyConfirmationRef"),
      identitySeenOnArrival: bool(formData, "identitySeenOnArrival"),
      dbsConfirmed: bool(formData, "dbsConfirmed"),
      referencesConfirmed: bool(formData, "referencesConfirmed"),
      rightToWorkConfirmed: bool(formData, "rightToWorkConfirmed"),
      soleChargeApproved,
      // Record who approved sole charge, when it's newly approved.
      approvedBy: soleChargeApproved ? user.email : null,
      approvedAt: soleChargeApproved ? w.approvedAt ?? new Date() : null,
      notes: str(formData, "notes"),
    },
  });
  await logAudit({
    actor: user,
    action: "AGENCY_WORKER_UPDATED",
    entityType: "AgencyWorker",
    entityId: w.id,
    summary: `Agency worker updated: ${w.fullName} (sole charge approved: ${soleChargeApproved})`,
  });
  revalidatePath("/employer/agency");
}

export async function deleteAgencyWorker(formData: FormData) {
  const { employer } = await requireEmployer();
  const w = await own(employer.id, str(formData, "workerId"));
  if (!w) return;
  await prisma.agencyWorker.delete({ where: { id: w.id } });
  revalidatePath("/employer/agency");
}
