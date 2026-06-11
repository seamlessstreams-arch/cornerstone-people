import Link from "next/link";
import { prisma } from "@/lib/db";
import { ResetPasswordForm } from "./form";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  params,
}: {
  params: { token: string };
}) {
  const row = await prisma.passwordResetToken.findUnique({
    where: { token: params.token },
  });
  const valid = row && !row.usedAt && row.expiresAt > new Date();

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-brand-700"
        >
          Keni
        </Link>
        <h1 className="mt-6 text-2xl font-semibold text-stone-900">
          Set a new password
        </h1>

        {valid ? (
          <>
            <p className="mt-1 text-sm text-stone-500">
              Choose a new password for your account.
            </p>
            <div className="mt-6 card">
              <ResetPasswordForm token={params.token} />
            </div>
          </>
        ) : (
          <div className="mt-6 card">
            <p className="text-sm text-stone-700">
              This reset link is invalid or has expired.
            </p>
            <Link
              href="/forgot-password"
              className="mt-3 inline-block font-medium text-brand-700 hover:underline"
            >
              Request a new link →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
