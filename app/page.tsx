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
    <main className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight text-brand-700">
            Keni
          </span>
          <nav className="flex items-center gap-2">
            <a href="#matching" className="hidden px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 sm:block">
              Matching
            </a>
            <a href="#what-we-do" className="hidden px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 sm:block">
              What we do
            </a>
            <a href="#how" className="hidden px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 sm:block">
              How it works
            </a>
            <Link href="/pricing" className="hidden px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 sm:block">
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
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          For children&apos;s homes &amp; the people who care for them
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
          Hiring for your home,{" "}
          <span className="text-brand-600">made human</span>.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-stone-600">
          Keni matches you with people who genuinely fit your home — then quietly
          takes on the chasing, the follow-ups and the paperwork behind a safe
          hire, so you can spend your time on people, not process. A named manager
          always makes the final call.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup?role=EMPLOYER" className="btn-primary px-5 py-3">
            I&apos;m a children&apos;s home
          </Link>
          <Link href="/signup?role=CANDIDATE" className="btn-secondary px-5 py-3">
            I&apos;m looking for a role
          </Link>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-3">
          <Stat figure="Matched on what matters" label="Values, culture and fit — not just a CV" />
          <Stat figure="We do the chasing" label="References and follow-ups handled for you" />
          <Stat figure="A person always signs off" label="Keni never clears anyone on its own" />
        </div>
      </section>

      {/* Two audiences */}
      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-14 md:grid-cols-2">
          <div className="card">
            <h2 className="text-lg font-semibold text-stone-900">For children&apos;s homes</h2>
            <p className="mt-2 text-sm text-stone-600">
              A command centre that tracks every matched candidate through
              pre-employment checks, flags risk early, and builds an
              inspection-ready staff file — so you always know who is safe to
              start, who is pending, and what to do next.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-stone-700">
              <Bullet>Match with candidates who arrive check-ready</Bullet>
              <Bullet>Chase references, analyse them, flag concerns</Bullet>
              <Bullet>Single Central Record &amp; audit trail, export-ready for Ofsted</Bullet>
            </ul>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold text-stone-900">For candidates</h2>
            <p className="mt-2 text-sm text-stone-600">
              Test the water without putting yourself on the open market. Your
              card shows your experience and what matters to you — never your
              name or current employer — until interest is mutual.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-stone-700">
              <Bullet>Anonymous by default; reveal only on a mutual match</Bullet>
              <Bullet>Block your current employer — silently and undetectably</Bullet>
              <Bullet>Verify your references once, then arrive ready</Bullet>
            </ul>
          </div>
        </div>
      </section>

      {/* Matching */}
      <section id="matching" className="border-y border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            Mutual matching
          </p>
          <h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-stone-900">
            Staff and homes, matched on mutual interest.
          </h2>
          <p className="mt-3 max-w-2xl text-stone-600">
            Candidates and children&apos;s homes both build a profile. Either side
            can express interest — but names, full profiles and a conversation
            unlock <strong>only when both sides are interested</strong>. No spam
            applications, and no candidate put on the open market against their
            will.
          </p>
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Step n={1} title="Build a profile" body="Candidates show experience, shift availability and what matters to them; homes show their ethos, placement picture and culture." />
            <Step n={2} title="Express interest" body="Browse and signal interest either way. Candidates stay anonymous, and can block their current employer — silently." />
            <Step n={3} title="Match unlocks" body="When interest is mutual, full profiles and a message thread open, with a single next step: request to interview." />
            <Step n={4} title="Arrive check-ready" body="A matched candidate comes with verified references already in hand — and flows straight into safer-recruitment checks." />
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup?role=CANDIDATE" className="btn-secondary px-5 py-2.5 text-sm">
              Create a candidate profile
            </Link>
            <Link href="/signup?role=EMPLOYER" className="btn-primary px-5 py-2.5 text-sm">
              List your home
            </Link>
          </div>
        </div>
      </section>

      {/* Why Keni */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Why Keni
        </p>
        <h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-stone-900">
          Generic job boards list jobs. Keni understands children&apos;s
          residential care.
        </h2>
        <p className="mt-3 max-w-2xl text-stone-600">
          Generic job boards and CV databases hand you a stack of CVs and leave
          the hard part — safer recruitment, suitability, culture and compliance
          — entirely to you. Keni is built for this sector and carries that
          weight with you.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Feature title="The hard parts, handled" body="We carry the suitability and safer-hiring legwork with you — not a stack of CVs you have to vet from scratch." />
          <Feature title="Children's-homes specific" body="Designed around residential childcare — the roles, the regulations and the realities, not a generic ATS bent to fit." />
          <Feature title="Values-based matching" body="Therapeutic culture, trauma-informed practice and what matters to a candidate — matched on more than keywords." />
          <Feature title="Rota & shift reality" body="Shift patterns, sleep-ins and the realities of residential cover are first-class, not an afterthought." />
          <Feature title="Candidate experience" body="A warm, values-led journey where candidates can see why a role fits — and stay anonymous until interest is mutual." />
          <Feature title="Compliance governance" body="Every check, every chase and every decision explainable, logged and inspection-ready." />
        </div>
      </section>

      {/* What Keni does */}
      <section id="what-we-do" className="border-t border-stone-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            What Keni does
          </p>
          <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-stone-900">
            We handle the hard parts, so you can focus on the people.
          </h2>
          <p className="mt-3 max-w-2xl text-stone-600">
            Hiring for a children&apos;s home is a lot — the calls, the
            follow-ups, the paperwork that has to be right. Keni carries that with
            you, quietly and in the background, and tells you the one thing to do
            next.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            <Feature title="We chase, so you don't have to" body="Keni sends the requests, follows up on time and keeps everything moving — no more living in your sent folder waiting on replies." />
            <Feature title="Everything in one calm place" body="Each person has a clear, up-to-date picture and a simple next step — so nothing slips and no one is left waiting." />
            <Feature title="Ready when Ofsted knocks" body="Your records stay tidy and complete in the background, so an inspection is a click away — not a late-night scramble." />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          How it works
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-stone-900">
          From match to a safe start.
        </h2>
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Step n={1} title="Match" body="A candidate and a home both express interest. Identity unlocks only when it's mutual." />
          <Step n={2} title="Keni gets to work" body="References, ID and history requests go out — Keni gathers what's needed and keeps it all in one place." />
          <Step n={3} title="We chase & flag" body="Keni follows up on time, reads the replies, and quietly flags anything that needs a human eye." />
          <Step n={4} title="You always know where you are" body="A clear, plain-English picture of each person, with the one next step — never a guessing game." />
          <Step n={5} title="A person signs off" body="A named manager makes the call — Keni teed it all up, but the decision is always yours." />
          <Step n={6} title="Ready for inspection" body="The full record is tidy and complete in the background, so Ofsted is a click away." />
        </ol>
      </section>

      {/* Compliance */}
      <section className="border-t border-stone-200 bg-brand-700">
        <div className="mx-auto max-w-6xl px-6 py-16 text-white">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-100">
            Built for compliance
          </p>
          <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight">
            Safe by design, not by reminder.
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Pillar title="Human decides" body="The agent automates workflow and evidence; a named manager always signs off." />
            <Pillar title="UK GDPR" body="Data minimisation, role-based access, manager-only access to sensitive disclosures." />
            <Pillar title="Full audit" body="An append-only log of every access and change — nothing is hidden or quietly altered." />
            <Pillar title="Grounded in the rules" body="Built around the Children's Homes Regulations and what Ofsted expects — without the jargon." />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Pricing
        </p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-stone-900">
          Candidates never pay. Homes pay only for what they use.
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="card">
            <h3 className="text-lg font-semibold text-stone-900">Candidates</h3>
            <p className="mt-1 text-3xl font-bold text-brand-700">Free</p>
            <p className="mt-2 text-sm text-stone-600">
              Always free — create a profile, match with homes and verify your
              references at no cost, ever.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-stone-700">
              <Bullet>Anonymous, blockable profile</Bullet>
              <Bullet>Mutual-match messaging</Bullet>
              <Bullet>Reference verification</Bullet>
            </ul>
          </div>
          <div className="card ring-2 ring-brand-200">
            <h3 className="text-lg font-semibold text-stone-900">Children&apos;s homes</h3>
            <p className="mt-1 text-3xl font-bold text-brand-700">
              Get a quote
            </p>
            <p className="mt-2 text-sm text-stone-600">
              Pay only for a successful hire — no setup fees, no long contracts.
              See the full breakdown, or talk to us and we&apos;ll size it to your
              home.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-stone-700">
              <Bullet>Unlimited candidates &amp; hires</Bullet>
              <Bullet>Sourcing, matching and the chasing, handled for you</Bullet>
              <Bullet>A tidy, inspection-ready record for every hire</Bullet>
            </ul>
            <Link href="/pricing" className="btn-primary mt-5 inline-block px-4 py-2 text-sm">
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">
          Let&apos;s find your next great hire.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-stone-600">
          Join the homes and people using Keni to hire well for children&apos;s
          residential care — with the chasing and the paperwork handled, so you
          can focus on what matters.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/signup?role=EMPLOYER" className="btn-primary px-5 py-3">
            Get started — children&apos;s home
          </Link>
          <Link href="/signup?role=CANDIDATE" className="btn-secondary px-5 py-3">
            Create a candidate profile
          </Link>
        </div>
      </section>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-stone-400 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Keni — safer recruitment for children&apos;s residential care.
            <br />
            Candidates never pay. Keni is a trading name of Pain Point
            Resolutions Ltd.
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-stone-700">Log in</Link>
            <Link href="/signup" className="hover:text-stone-700">Sign up</Link>
          </div>
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

function Stat({ figure, label }: { figure: string; label: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="text-sm font-semibold text-brand-700">{figure}</div>
      <div className="mt-1 text-sm text-stone-500">{label}</div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 text-brand-600">✓</span>
      <span>{children}</span>
    </li>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="card">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
        {n}
      </div>
      <h3 className="mt-3 font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm text-stone-600">{body}</p>
    </li>
  );
}

function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-brand-100">{body}</p>
    </div>
  );
}
