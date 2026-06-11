import Link from "next/link";
import { prisma } from "@/lib/db";
import { confirmReference } from "@/app/actions/reference";

export default async function VerifyReferencePage({
  params,
}: {
  params: { token: string };
}) {
  const reference = await prisma.reference.findUnique({
    where: { token: params.token },
    include: { candidate: { include: { user: true } } },
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-brand-700"
        >
          Keni
        </Link>

        <div className="mt-6 card">
          {!reference ? (
            <>
              <h1 className="text-xl font-semibold text-stone-900">
                Link not found
              </h1>
              <p className="mt-2 text-sm text-stone-600">
                This verification link is invalid or has expired.
              </p>
            </>
          ) : reference.status === "VERIFIED" ? (
            <>
              <h1 className="text-xl font-semibold text-emerald-700">
                Reference confirmed ✓
              </h1>
              <p className="mt-2 text-sm text-stone-600">
                Thank you, {reference.refereeName}. You&apos;ve confirmed your
                reference. Nothing more is needed.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-stone-900">
                Confirm a reference
              </h1>
              <p className="mt-3 text-sm text-stone-600">
                Hello {reference.refereeName}, a candidate has listed you as a
                referee (relationship:{" "}
                <strong>{reference.relationship}</strong>) on Keni.
              </p>
              <p className="mt-3 text-sm text-stone-600">
                By confirming, you verify that you are willing to act as a
                reference for this candidate. We do not ask you for any rating or
                written comment.
              </p>
              <form action={confirmReference} className="mt-5">
                <input type="hidden" name="token" value={reference.token} />
                <button type="submit" className="btn-primary w-full">
                  I confirm I am willing to be a reference
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
