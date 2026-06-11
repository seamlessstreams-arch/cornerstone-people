"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

// PUBLIC action — no auth; the one-time token is the authorisation. A shortlisted
// candidate completes their self-declaration. Any disclosure is flagged for a
// named manager's confidential review; the answers are sensitive and only ever
// shown to the employer on their own case.

function yesNo(fd: FormData, k: string): boolean | null {
  const v = String(fd.get(k) ?? "");
  return v === "yes" ? true : v === "no" ? false : null;
}
function s(fd: FormData, k: string): string | null {
  const v = String(fd.get(k) ?? "").trim();
  return v === "" ? null : v;
}

export async function submitSelfDeclaration(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!token) return;

  const sd = await prisma.selfDeclaration.findUnique({
    where: { publicToken: token },
  });
  if (!sd) return;
  if (sd.tokenExpiresAt && sd.tokenExpiresAt < new Date()) return;
  if (sd.status !== "PENDING") return; // already submitted/reviewed
  if (formData.get("declaration") !== "on") return; // truthfulness is mandatory

  const hasUnspentConvictions = yesNo(formData, "hasUnspentConvictions");
  const hasCautionsOrPending = yesNo(formData, "hasCautionsOrPending");
  const isBarred = yesNo(formData, "isBarred");
  const isDisqualified = yesNo(formData, "isDisqualified");
  const livedOverseas = yesNo(formData, "livedOverseas");

  // Anything that warrants a confidential manager review.
  const disclosureFlagged = Boolean(
    hasUnspentConvictions || hasCautionsOrPending || isBarred || isDisqualified,
  );

  const h = headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
  const ua = h.get("user-agent");

  await prisma.selfDeclaration.update({
    where: { id: sd.id },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      submittedIp: ip,
      submittedUserAgent: ua,
      hasUnspentConvictions,
      hasCautionsOrPending,
      isBarred,
      isDisqualified,
      livedOverseas,
      disclosureDetails: s(formData, "disclosureDetails"),
      overseasDetails: s(formData, "overseasDetails"),
      declaredTruthful: true,
      disclosureFlagged,
    },
  });

  await logAudit({
    actor: null,
    action: "SELF_DECLARATION_SUBMITTED",
    entityType: "SelfDeclaration",
    entityId: sd.id,
    // Never record the disclosure content in the audit summary — only that one
    // exists and needs review.
    summary: disclosureFlagged
      ? "Self-declaration submitted with a disclosure — manager review required"
      : "Self-declaration submitted, no disclosures",
    meta: { viaPublicForm: true, disclosureFlagged },
  });

  revalidatePath(`/employer/safer-recruitment/${sd.caseId}`);
  revalidatePath(`/self-declaration/${token}`);
}
