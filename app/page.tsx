import Link from "next/link";
import { getCurrentUser } from "@/lib/session";

export default async function HomePage() {
  const user = await getCurrentUser();
  const homeHref = user
    ? user.role === "CANDIDATE"
      ? "/candidate"
      : "/employer"
    : null;

  return (
    <main className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight text-brand-700">
            Cornerstone People
          </span>
          <nav className="flex items-center gap-2">
            {homeHref ? (
              <Link href={homeHref} className="btn-primary">
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn-secondary">
                  Log in
                </Link>
                <Link href="/signup" className="btn-primary">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Children&apos;s-home recruitment, done right
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
          You connect only when interest is{" "}
          <span className="text-brand-600">mutual</span>.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-stone-600">
          Candidates and homes both build a profile. Either side can express
          interest — but identity and a conversation unlock only when{" "}
          <strong>both</strong> sides are interested. No spam applications. A
          matched candidate arrives with verified references already in hand.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup?role=CANDIDATE" className="btn-primary px-5 py-3">
            I&apos;m looking for a role
          </Link>
          <Link href="/signup?role=EMPLOYER" className="btn-secondary px-5 py-3">
            I&apos;m a children&apos;s home
          </Link>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          <Feature
            title="Anonymous by default"
            body="Quietly test the water. Your card shows experience and what matters to you — never your name or current employer — until interest is mutual."
          />
          <Feature
            title="Block who you like"
            body="Name your current employer or competitors and they simply never see you. Silent and undetectable from their side."
          />
          <Feature
            title="Verified references"
            body="Get your references verified once. Homes see a candidate who's ready, not a form submitted into a void."
          />
        </div>
      </section>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-6 text-sm text-stone-400">
          Cornerstone People — MVP. Candidates never pay.
        </div>
      </footer>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-stone-900">{title}</h3>
      <p className="mt-2 text-sm text-stone-600">{body}</p>
    </div>
  );
}
