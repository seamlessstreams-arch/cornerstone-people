import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { SignupForm } from "./form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "CANDIDATE" ? "/candidate" : "/employer");

  const initialRole =
    searchParams.role === "EMPLOYER" ? "EMPLOYER" : "CANDIDATE";

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-brand-700"
        >
          Cornerstone People
        </Link>
        <h1 className="mt-6 text-2xl font-semibold text-stone-900">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Candidates never pay. Homes subscribe.
        </p>

        <div className="mt-6 card">
          <SignupForm initialRole={initialRole} />
        </div>

        <p className="mt-4 text-center text-sm text-stone-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-700">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
