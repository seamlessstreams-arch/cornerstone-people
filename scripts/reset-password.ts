/**
 * Admin: reset a user's login password by email.
 *
 *   npx tsx scripts/reset-password.ts <email> [newPassword]
 *
 * If newPassword is omitted a strong random one is generated and printed once.
 * Runs against whatever DATABASE_URL is configured, so point it at the target
 * database (e.g. your Supabase/production connection string) before running.
 *
 * For safety it also deletes that user's existing sessions, forcing re-login.
 * This is an operator tool — there is no self-serve reset flow in the app.
 */
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function generatePassword(): string {
  // 18 url-safe chars — easy to copy, hard to guess.
  return randomBytes(13).toString("base64url").slice(0, 18);
}

async function main() {
  const email = (process.argv[2] ?? "").trim().toLowerCase();
  const provided = process.argv[3];
  if (!email) {
    console.error("Usage: npx tsx scripts/reset-password.ts <email> [newPassword]");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email "${email}".`);
    process.exit(1);
  }

  const newPassword = provided && provided.length > 0 ? provided : generatePassword();
  if (newPassword.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  const removed = await prisma.session.deleteMany({ where: { userId: user.id } });

  // Best-effort audit trail (table exists after the safer_recruitment migration).
  try {
    await prisma.auditLog.create({
      data: {
        action: "PASSWORD_RESET",
        actorEmail: "operator-script",
        entityType: "User",
        entityId: user.id,
        summary: `Password reset for ${email}; ${removed.count} session(s) revoked`,
      },
    });
  } catch {
    /* audit table not present — ignore */
  }

  console.log(`\n✓ Password reset for ${email} (role: ${user.role}).`);
  console.log(`  Revoked ${removed.count} active session(s).`);
  if (!provided) {
    console.log(`\n  New password: ${newPassword}`);
    console.log("  Share it securely and have them change it after logging in.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
