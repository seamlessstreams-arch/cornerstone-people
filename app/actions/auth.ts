"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";

function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function signup(_prev: unknown, formData: FormData) {
  const email = normaliseEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "");
  const companyName = String(formData.get("companyName") ?? "").trim();

  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (role !== "CANDIDATE" && role !== "EMPLOYER") {
    return { error: "Please choose whether you are a candidate or a home." };
  }
  if (role === "EMPLOYER" && !companyName) {
    return { error: "Please enter your home / company name." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  if (role === "CANDIDATE") {
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        candidate: { create: {} },
      },
    });
  } else {
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        employer: { create: { companyName } },
      },
    });
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  await createSession(user.id);
  redirect(role === "CANDIDATE" ? "/candidate" : "/employer");
}

export async function login(_prev: unknown, formData: FormData) {
  const email = normaliseEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Incorrect email or password." };
  }

  await createSession(user.id);
  redirect(user.role === "CANDIDATE" ? "/candidate" : "/employer");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
