"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

// PUBLIC action — no auth; the one-time token is the authorisation. A candidate
// completes a role-related fitness declaration after a conditional offer. The
// answers are sensitive health data, shown only to the employer on their own
// case; a named manager records the fitness decision.

function yesNo(fd: FormData, k: string): boolean | null {
  const v = String(fd.get(k) ?? "");
  return v === "yes" ? true : v === "no" ? false : null;
}
function s(fd: FormData, k: string): string | null {
  const v = String(fd.get(k) ?? "").trim();
  return v === "" ? null : v;
}

export async function submitHealthDeclaration(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!token) return;

  const hd = await prisma.healthDeclaration.findUnique({
    where: { publicToken: token },
  });
  if (!hd) return;
  if (hd.tokenExpiresAt && hd.tokenExpiresAt < new Date()) return;
  if (hd.status !== "PENDING") return;
  if (formData.get("declaration") !== "on") return;

  const conditionsAffectingRole = yesNo(formData, "conditionsAffectingRole");
  const reasonableAdjustmentsNeeded = yesNo(formData, "reasonableAdjustmentsNeeded");

  const h = headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
  const ua = h.get("user-agent");

  await prisma.healthDeclaration.update({
    where: { id: hd.id },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      submittedIp: ip,
      submittedUserAgent: ua,
      fitForRole: yesNo(formData, "fitForRole"),
      conditionsAffectingRole,
      conditionsDetail: s(formData, "conditionsDetail"),
      reasonableAdjustmentsNeeded,
      adjustmentsDetail: s(formData, "adjustmentsDetail"),
      declaredTruthful: true,
    },
  });

  await logAudit({
    actor: null,
    action: "HEALTH_DECLARATION_SUBMITTED",
    entityType: "HealthDeclaration",
    entityId: hd.id,
    // Never record health details in the audit summary — only that it was done.
    summary:
      conditionsAffectingRole || reasonableAdjustmentsNeeded
        ? "Health declaration submitted — manager to consider fitness/adjustments"
        : "Health declaration submitted, no issues raised",
    meta: { viaPublicForm: true },
  });

  revalidatePath(`/employer/safer-recruitment/${hd.caseId}`);
  revalidatePath(`/health-declaration/${token}`);
}
