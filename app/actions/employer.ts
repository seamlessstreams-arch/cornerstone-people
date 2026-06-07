"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireEmployer } from "@/lib/auth";

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v === "" ? null : v;
}

export async function updateEmployerProfile(formData: FormData) {
  const { employer } = await requireEmployer();
  const companyName = str(formData, "companyName");
  if (!companyName) return;

  await prisma.employer.update({
    where: { id: employer.id },
    data: {
      companyName,
      region: str(formData, "region"),
      sellingPoints: str(formData, "sellingPoints"),
      ethos: str(formData, "ethos"),
      childrenSupported: str(formData, "childrenSupported"),
      placementPicture: str(formData, "placementPicture"),
      shiftPattern: str(formData, "shiftPattern"),
      supportOffered: str(formData, "supportOffered"),
      compensation: str(formData, "compensation"),
    },
  });
  revalidatePath("/employer/profile");
  revalidatePath("/employer");
}

export async function createPosition(formData: FormData) {
  const { employer } = await requireEmployer();
  const title = str(formData, "title");
  if (!title) return;

  await prisma.position.create({
    data: {
      employerId: employer.id,
      title,
      region: str(formData, "region"),
      shiftPattern: str(formData, "shiftPattern"),
      description: str(formData, "description"),
    },
  });
  revalidatePath("/employer/positions");
  revalidatePath("/employer/market");
}

export async function togglePosition(formData: FormData) {
  const { employer } = await requireEmployer();
  const id = String(formData.get("positionId") ?? "");
  const position = await prisma.position.findFirst({
    where: { id, employerId: employer.id },
  });
  if (!position) return;
  await prisma.position.update({
    where: { id },
    data: { active: !position.active },
  });
  revalidatePath("/employer/positions");
  revalidatePath("/employer/market");
}

export async function deletePosition(formData: FormData) {
  const { employer } = await requireEmployer();
  const id = String(formData.get("positionId") ?? "");
  await prisma.position.deleteMany({
    where: { id, employerId: employer.id },
  });
  revalidatePath("/employer/positions");
  revalidatePath("/employer/market");
}
