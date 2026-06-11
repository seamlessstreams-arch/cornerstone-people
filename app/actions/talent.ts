"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireEmployer } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { parseSourcedList } from "@/lib/sourcing";

const STAGES = ["NEW", "REVIEWING", "INVITED", "ARCHIVED"] as const;

// Cap a single import so a paste can't create an unbounded number of rows.
const MAX_IMPORT = 2000;

// Bulk import a licensed candidate list (e.g. a CSV exported from the
// employer's own CV-Library account). Stores structured attributes for
// auto-shortlisting — and, by design, NEVER any contact details.
export async function importSourcedCandidates(formData: FormData) {
  const { employer, user } = await requireEmployer();
  const text = String(formData.get("csv") ?? "");
  const source = String(formData.get("source") ?? "").trim() || "CV-Library";

  const rows = parseSourcedList(text).slice(0, MAX_IMPORT);
  if (rows.length === 0) {
    revalidatePath("/employer/talent-pipeline");
    return;
  }

  await prisma.talentProspect.createMany({
    data: rows.map((r) => ({
      employerId: employer.id,
      name: r.name,
      source,
      profileUrl: r.profileUrl,
      region: r.region,
      roleSought: r.roleSought,
      experienceLevel: r.experienceLevel,
      skills: r.skills,
      summary: r.summary,
      createdBy: user.email,
    })),
  });
  await logAudit({
    actor: user,
    action: "TALENT_PROSPECTS_IMPORTED",
    entityType: "TalentProspect",
    entityId: employer.id,
    summary: `Imported ${rows.length} sourced candidates from ${source} (no contact details)`,
  });
  revalidatePath("/employer/talent-pipeline");
}

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
      profileUrl: str(formData, "profileUrl"),
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
