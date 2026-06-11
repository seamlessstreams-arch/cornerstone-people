"use server";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";
import { sendEmail, emailConfigured, appUrl } from "@/lib/email";
import { logAudit } from "@/lib/audit";

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

// ---------------------------------------------------------------------------
// Forgot / reset password
// ---------------------------------------------------------------------------

const RESET_TTL_MS = 1000 * 60 * 60; // 1 hour

/**
 * Step 1: the user submits their email. We always return the same neutral
 * message regardless of whether the account exists (no user enumeration).
 * If it exists, we mint a single-use token and email a reset link.
 *
 * In development with NO email provider configured, we return the link in the
 * response so the flow is testable; in production we never reveal it.
 */
export async function requestPasswordReset(_prev: unknown, formData: FormData) {
  const email = normaliseEmail(String(formData.get("email") ?? ""));
  const neutral = {
    ok: true,
    message:
      "If an account exists for that email, we've sent a link to reset your password. The link expires in 1 hour.",
    devLink: undefined as string | undefined,
  };
  if (!email || !email.includes("@")) {
    return { ok: false, message: "Please enter a valid email address.", devLink: undefined };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return neutral; // don't reveal non-existence

  // Invalidate any outstanding tokens, then mint a fresh one.
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt: new Date(Date.now() + RESET_TTL_MS) },
  });

  const link = `${appUrl()}/reset-password/${token}`;
  const subject = "Reset your Keni password";
  const text = `We received a request to reset the password for your Keni account.\n\nReset it here (expires in 1 hour):\n${link}\n\nIf you didn't request this, you can safely ignore this email — your password won't change.`;

  await logAudit({
    actor: { id: user.id, email: user.email, role: user.role as never },
    action: "PASSWORD_RESET_REQUESTED",
    entityType: "User",
    entityId: user.id,
    summary: `Password reset requested for ${email}`,
  });

  if (emailConfigured()) {
    const result = await sendEmail({ to: email, subject, text });
    if (!result.sent && process.env.NODE_ENV === "production") {
      // Don't leak the link in production even if email failed.
      return neutral;
    }
    if (!result.sent && process.env.NODE_ENV !== "production") {
      return { ...neutral, devLink: link };
    }
    return neutral;
  }

  // No email provider: dev-only convenience so the flow can be exercised.
  if (process.env.NODE_ENV !== "production") {
    return { ...neutral, devLink: link };
  }
  return neutral;
}

/** Step 2: the user opens the link and sets a new password. */
export async function resetPassword(_prev: unknown, formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const row = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired. Please request a new one." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: row.userId }, data: { passwordHash } });
  await prisma.passwordResetToken.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  });
  // Revoke all existing sessions — a reset should log other devices out.
  await prisma.session.deleteMany({ where: { userId: row.userId } });

  await logAudit({
    actor: { id: row.userId, email: row.user.email, role: row.user.role as never },
    action: "PASSWORD_RESET_COMPLETED",
    entityType: "User",
    entityId: row.userId,
    summary: `Password reset completed for ${row.user.email}`,
  });

  // Log them straight in.
  await createSession(row.userId);
  redirect(row.user.role === "CANDIDATE" ? "/candidate" : "/employer");
}
