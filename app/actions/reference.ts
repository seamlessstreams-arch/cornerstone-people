"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

/**
 * Referee-facing confirmation. No login required — possession of the secret
 * token is the authorisation. Idempotent.
 */
export async function confirmReference(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!token) return;

  const reference = await prisma.reference.findUnique({ where: { token } });
  if (!reference || reference.status === "VERIFIED") return;

  await prisma.reference.update({
    where: { token },
    data: { status: "VERIFIED", verifiedAt: new Date() },
  });

  revalidatePath(`/verify-reference/${token}`);
}
