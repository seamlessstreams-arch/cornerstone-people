import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "./form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "CANDIDATE" ? "/candidate" : "/employer");

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
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-stone-500">Log in to your account.</p>

        <div className="mt-6 card">
          <LoginForm />
        </div>

        <p className="mt-4 text-center text-sm text-stone-500">
          No account?{" "}
          <Link href="/signup" className="font-medium text-brand-700">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
