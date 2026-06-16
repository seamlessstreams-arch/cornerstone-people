import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Pricing — Keni Safer Hire",
  description:
    "A safer, matched, Ofsted-ready hire for children's homes — £1,495 per successful hire.",
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const user = await getCurrentUser();
  const homeHref = user
    ? user.role === "CANDIDATE"
      ? "/candidate"
      : "/employer"
    : null;

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Header / nav */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight text-brand-700">
            Keni
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/pricing" className="hidden px-3 py-1.5 text-sm font-medium text-stone-900 sm:block">
              Pricing
            </Link>
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

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Pricing
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
          A safer, matched, inspection-ready hire.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-stone-600">
          A job board sells applications. An agency sells introductions. Keni
          sells a safer, matched, Ofsted-ready hire — for a fraction of an agency
          fee.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup?role=EMPLOYER" className="btn-primary px-5 py-3">
            Book a 15-minute demo
          </Link>
          <a href="#included" className="btn-secondary px-5 py-3">
            How it works
          </a>
        </div>
      </section>

      {/* Three-route comparison */}
      <section className="mx-auto max-w-5xl px-6 pb-4">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="card">
            <h2 className="font-semibold text-stone-900">DIY job advert</h2>
            <p className="mt-2 text-2xl font-bold text-stone-900">£600–£2,500+<span className="text-base font-normal text-stone-400"> incl. time</span></p>
            <p className="mt-3 text-sm text-stone-600">
              Applications only. You sift, match, check and chase. The compliance
              burden stays with you.
            </p>
          </div>
          <div className="card">
            <h2 className="font-semibold text-stone-900">Recruitment agency</h2>
            <p className="mt-2 text-2xl font-bold text-stone-900">£4,500–£7,500+</p>
            <p className="mt-3 text-sm text-stone-600">
              An introduction. You still build the full safer-recruitment file
              yourself.
            </p>
          </div>
          <div className="card border-2 border-brand-500">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-stone-900">Keni Safer Hire</h2>
              <span className="chip">Recommended</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-brand-700">£1,495<span className="text-base font-normal text-stone-400"> + checks</span></p>
            <p className="mt-3 text-sm text-stone-600">
              Sourcing, matching, shortlist, safer-recruitment workflow, reference
              tracking and an Ofsted-ready hire file.
            </p>
          </div>
        </div>
      </section>

      {/* Headline offer */}
      <section id="included" className="mx-auto max-w-5xl px-6 py-14">
        <div className="card">
          <div className="text-center">
            <p className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
              £1,495 <span className="text-2xl font-semibold text-stone-500">per successful hire</span>
            </p>
            <p className="mt-2 text-sm text-stone-500">
              plus statutory check costs, passed through at cost.
            </p>
          </div>

          <h3 className="mt-8 text-xs font-semibold uppercase tracking-wide text-stone-400">
            What&apos;s included
          </h3>
          <ul className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {[
              "Values-based candidate matching",
              "Advert & sourcing campaign",
              "Candidate profile review",
              "Availability & location match",
              "Experience & qualification match",
              "Initial suitability screening",
              "Interview question prompts",
              "Safer-recruitment checklist",
              "Reference request workflow",
              "Reference chase & verification log",
              "Employment history & gap tracker",
              "Right-to-work & ID tracking",
              "Final suitability summary",
              "Registered-manager sign-off page",
              "Ofsted-ready recruitment pack",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-stone-700">
                <span aria-hidden className="mt-0.5 font-semibold text-brand-600">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Overseas-history add-on */}
      <section className="mx-auto max-w-5xl px-6 pb-14">
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">
          Overseas-history add-on
        </h2>
        <p className="mt-2 max-w-2xl text-stone-600">
          Lived or worked abroad? Overseas checks add time and complexity. Keni
          manages the process and protects your audit trail.
        </p>
        <div className="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-400">
              <tr>
                <th className="px-4 py-2 font-medium">Overseas service</th>
                <th className="px-4 py-2 font-medium">From</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {[
                ["One country", "£199 + pass-through"],
                ["Two countries", "£349 + pass-through"],
                ["Complex (3+ countries / translation / non-issuing)", "£499–£799 + pass-through"],
                ["Overseas risk assessment only", "£149–£249"],
              ].map(([service, price]) => (
                <tr key={service}>
                  <td className="px-4 py-3 text-stone-700">{service}</td>
                  <td className="px-4 py-3 font-medium text-stone-900">{price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Subscription option */}
      <section className="mx-auto max-w-5xl px-6 pb-14">
        <div className="card">
          <h2 className="font-semibold text-stone-900">Recruiting regularly?</h2>
          <p className="mt-2 text-lg text-stone-700">
            <span className="font-bold text-brand-700">£399–£599 / month</span> +{" "}
            <span className="font-bold text-brand-700">£599–£999 per hire</span> — better
            value for homes and groups hiring often.
          </p>
        </div>
      </section>

      {/* Trust / compliance strip */}
      <section className="border-y border-stone-200 bg-brand-700">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 py-12 text-white sm:grid-cols-3">
          <div>
            <p className="text-sm text-brand-50">
              Candidates never pay — you only pay for a successful hire.
            </p>
          </div>
          <div>
            <p className="text-sm text-brand-50">
              Every hire ends with your registered manager&apos;s sign-off.
            </p>
          </div>
          <div>
            <p className="text-sm text-brand-50">
              Built around the Children&apos;s Homes Regulations, with an
              Ofsted-ready evidence trail.
            </p>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-5xl px-6 py-16 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">
          See candidates near you.
        </h2>
        <div className="mt-6 flex justify-center">
          <Link href="/signup?role=EMPLOYER" className="btn-primary px-5 py-3">
            Book a 15-minute demo and see candidates near you
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-stone-400">
          Keni — safer recruitment for children&apos;s residential care.
          <br />
          Candidates never pay. Keni is a trading name of Pain Point Resolutions
          Ltd.
          <br />
          <span className="mt-2 inline-block text-xs">
            Indicative pricing — statutory check costs vary and are passed through
            at cost.
          </span>
        </div>
      </footer>
    </main>
  );
}
