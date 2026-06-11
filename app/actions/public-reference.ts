"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { analyseReference } from "@/lib/safer-recruitment";
import { logAudit } from "@/lib/audit";

// PUBLIC action — no auth. The one-time token IS the authorisation. A referee
// completes the safer-recruitment reference on their phone; the same rule-based
// analyser runs on submission, and provenance (IP / user-agent / timestamp) is
// captured for the audit trail.

function s(fd: FormData, k: string): string | null {
  const v = String(fd.get(k) ?? "").trim();
  return v === "" ? null : v;
}
function yesNo(fd: FormData, k: string): boolean | null {
  const v = String(fd.get(k) ?? "");
  return v === "yes" ? true : v === "no" ? false : null;
}

export async function submitPublicReference(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!token) return;

  const req = await prisma.referenceRequest.findUnique({
    where: { publicToken: token },
    include: { case: { include: { candidate: true } } },
  });
  if (!req) return;
  // Expired, or already completed — do nothing (the page reflects the state).
  if (req.tokenExpiresAt && req.tokenExpiresAt < new Date()) return;
  if (req.status === "RECEIVED" || req.status === "VERIFIED") return;
  // The honesty declaration is mandatory.
  if (formData.get("declaration") !== "on") return;

  const workedWithChildren = yesNo(formData, "workedWithChildren");
  const wouldReEmploy = yesNo(formData, "wouldReEmploy");

  // Compose the free-text the rule-based analyser scans, from the structured
  // answers — so a mobile-submitted reference is analysed identically to a
  // pasted one.
  const composed = [
    s(formData, "employmentDates") && `Employment dates: ${s(formData, "employmentDates")}.`,
    s(formData, "roleHeld") && `Role held: ${s(formData, "roleHeld")}.`,
    workedWithChildren !== null &&
      `Worked with children or vulnerable people: ${workedWithChildren ? "yes" : "no"}.`,
    s(formData, "reasonForLeaving") && `Reason for leaving: ${s(formData, "reasonForLeaving")}.`,
    s(formData, "disciplinary") && `Disciplinary history: ${s(formData, "disciplinary")}.`,
    s(formData, "safeguarding") &&
      `Safeguarding concerns or allegations: ${s(formData, "safeguarding")}.`,
    s(formData, "conduct") &&
      `Conduct, professional boundaries, honesty and reliability: ${s(formData, "conduct")}.`,
    s(formData, "suitability") &&
      `Suitability to work with children: ${s(formData, "suitability")}.`,
    wouldReEmploy !== null && `Would re-employ: ${wouldReEmploy ? "yes" : "no"}.`,
    s(formData, "other") && `Other relevant information: ${s(formData, "other")}.`,
  ]
    .filter(Boolean)
    .join(" ");

  const analysis = analyseReference(composed, {
    jobTitle: req.case.candidate.roleType,
  });

  const h = headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
  const ua = h.get("user-agent");

  await prisma.referenceRequest.update({
    where: { id: req.id },
    data: {
      status: "RECEIVED",
      receivedAt: new Date(),
      responseText: composed,
      qualityStatus: analysis.status,
      qualityNotes: analysis.explanation,
      concernFlag: analysis.concernDetected || analysis.contradiction,
      refereeJobTitle: s(formData, "refereeJobTitle"),
      refereeAuthorisedConfirmed: formData.get("authorised") === "on",
      workedWithChildren,
      wouldReEmploy,
      submittedIp: ip,
      submittedUserAgent: ua,
    },
  });

  await logAudit({
    actor: null,
    action: "PUBLIC_REFERENCE_SUBMITTED",
    entityType: "ReferenceRequest",
    entityId: req.id,
    summary: `Reference submitted via mobile link by ${req.refereeName}; analyser: ${analysis.status}`,
    meta: { ip, viaPublicForm: true },
  });

  revalidatePath(`/employer/safer-recruitment/${req.caseId}`);
  revalidatePath(`/reference/${token}`);
}
