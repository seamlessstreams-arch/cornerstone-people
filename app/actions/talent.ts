"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireEmployer } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const STAGES = ["NEW", "REVIEWING", "INVITED", "ARCHIVED"] as const;

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v === "" ? null : v;
}

// Manual, name-only prospect entry. By design there are no contact-detail
// fields — this records a person an employer is already lawfully sourcing, to
// track until they're invited to create a consented profile.
export async function addProspect(formData: FormData) {
  const { employer, user } = await requireEmployer();
  const name = str(formData, "name");
  if (!name) return;

  const created = await prisma.talentProspect.create({
    data: {
      employerId: employer.id,
      name,
      source: str(formData, "source"),
      note: str(formData, "note"),
      createdBy: user.email,
    },
  });
  await logAudit({
    actor: user,
    action: "TALENT_PROSPECT_ADDED",
    entityType: "TalentProspect",
    entityId: created.id,
    summary: `Added prospect (name only): ${name}`,
  });
  revalidatePath("/employer/talent-pipeline");
}

export async function setProspectStage(formData: FormData) {
  const { employer } = await requireEmployer();
  const id = String(formData.get("prospectId") ?? "");
  const stage = String(formData.get("stage") ?? "");
  if (!STAGES.includes(stage as (typeof STAGES)[number])) return;
  const existing = await prisma.talentProspect.findFirst({
    where: { id, employerId: employer.id },
  });
  if (!existing) return;
  await prisma.talentProspect.update({ where: { id }, data: { stage } });
  revalidatePath("/employer/talent-pipeline");
}

export async function deleteProspect(formData: FormData) {
  const { employer, user } = await requireEmployer();
  const id = String(formData.get("prospectId") ?? "");
  const existing = await prisma.talentProspect.findFirst({
    where: { id, employerId: employer.id },
  });
  if (!existing) return;
  await prisma.talentProspect.delete({ where: { id } });
  await logAudit({
    actor: user,
    action: "TALENT_PROSPECT_DELETED",
    entityType: "TalentProspect",
    entityId: id,
    summary: `Removed prospect: ${existing.name}`,
  });
  revalidatePath("/employer/talent-pipeline");
}
