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
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight text-brand-700">
            Keni
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <a href="#story" className="hidden px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 sm:block">
              Our story
            </a>
            <a href="#what-we-do" className="hidden px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 sm:block">
              What we do
            </a>
            <a href="#faq" className="hidden px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 sm:block">
              FAQ
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
      <section className="relative overflow-hidden border-b border-stone-200 bg-gradient-to-b from-brand-50 via-white to-white">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <span className="chip">For children&apos;s homes &amp; the people who care for them</span>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-stone-900 sm:text-6xl">
            Hiring for your home,{" "}
            <span className="text-brand-600">made human</span> — at a fraction of
            the agency bill.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-stone-600 sm:text-xl">
            Keni matches you with people who genuinely fit your home, then quietly
            takes on the chasing, the follow-ups and the paperwork behind a safe
            hire. You spend your time on people — a named manager always makes the
            final call.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup?role=EMPLOYER" className="btn-primary px-6 py-3 text-base">
              Talk to Keni — book a 15-min demo
            </Link>
            <Link href="/signup?role=CANDIDATE" className="btn-secondary px-6 py-3 text-base">
              I&apos;m looking for a role
            </Link>
          </div>
          <p className="mt-6 text-sm text-stone-500">
            Candidates never pay · A named manager always signs off · No long
            contracts
          </p>
        </div>
      </section>

      {/* Numbers — the hook */}
      <section className="bg-brand-700">
        <div className="mx-auto max-w-6xl px-6 py-14 text-white">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-100">
            It started with an £8,000 invoice
          </p>
          <div className="mt-7 grid gap-8 sm:grid-cols-3">
            <BigStat figure="£5k–£9k" label="Typical agency fee to hire one registered manager" />
            <BigStat figure="10–15%" label="Of salary — what agencies charge, per hire" />
            <BigStat figure="£1,495" label="A Keni Safer Hire — and you keep the difference" highlight />
          </div>
        </div>
      </section>

      {/* Story */}
      <section id="story" className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Our story
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-stone-900">
          Why we built Keni
        </h2>
        <div className="mt-6 space-y-5 border-l-4 border-brand-200 pl-6 text-lg leading-relaxed text-stone-700">
          <p>
            Over drinks one Friday, a friend — a director of a children&apos;s
            home — mentioned he&apos;d just paid <strong>£8,000 in agency fees</strong>{" "}
            to hire one registered manager. For a few phone calls and an
            introduction.
          </p>
          <p>
            It turns out that&apos;s normal. New homes routinely pour{" "}
            <strong>10–15% of a salary</strong> into agency fees for every hire —
            often before they&apos;ve opened their doors or earned a penny. Money
            that should be going into the home, the young people and the team.
          </p>
          <p>
            We thought there had to be a kinder, smarter way. The matching, the
            chasing, the safer-hiring paperwork — all of it could be done more
            warmly, more quickly, and for a fraction of the cost. So we built one.
          </p>
          <p className="font-medium text-stone-900">
            That&apos;s Keni. Come and talk to it.
          </p>
        </div>
        <p className="mt-6 text-sm text-stone-400">
          — The team at Pain Point Resolutions Ltd
        </p>
      </section>

      {/* What Keni does */}
      <section id="what-we-do" className="border-y border-stone-200 bg-stone-50 py-20">
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
            <Feature emoji="📨" title="We chase, so you don't have to" body="Keni sends the requests, follows up on time and keeps everything moving — no more living in your sent folder waiting on replies." />
            <Feature emoji="🧭" title="Everything in one calm place" body="Each person has a clear, up-to-date picture and a simple next step — so nothing slips and no one is left waiting." />
            <Feature emoji="📂" title="Ready when Ofsted knocks" body="Your records stay tidy and complete in the background, so an inspection is a click away — not a late-night scramble." />
          </div>
        </div>
      </section>

      {/* Matching */}
      <section id="matching" className="mx-auto max-w-6xl px-6 py-20">
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
          applications, and no one put on the open market against their will.
        </p>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Step n={1} title="Build a profile" body="Candidates show experience, shift availability and what matters to them; homes show their ethos, placement picture and culture." />
          <Step n={2} title="Express interest" body="Browse and signal interest either way. Candidates stay anonymous, and can quietly block their current employer." />
          <Step n={3} title="Match unlocks" body="When interest is mutual, full profiles and a message thread open, with a single next step: request to interview." />
          <Step n={4} title="Arrive ready" body="A matched candidate comes with verified references already in hand — and flows straight into a calm, warm hiring process." />
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup?role=CANDIDATE" className="btn-secondary px-5 py-2.5 text-sm">
            Create a candidate profile
          </Link>
          <Link href="/signup?role=EMPLOYER" className="btn-primary px-5 py-2.5 text-sm">
            List your home
          </Link>
        </div>
      </section>

      {/* Why Keni */}
      <section className="border-y border-stone-200 bg-stone-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            Why Keni
          </p>
          <h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-stone-900">
            A job board lists jobs. Keni understands children&apos;s homes.
          </h2>
          <p className="mt-3 max-w-2xl text-stone-600">
            Generic job boards hand you a stack of CVs and leave the hard part to
            you. Keni is built for this sector — and carries that weight with you.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Feature emoji="🛟" title="The hard parts, handled" body="We carry the suitability and safer-hiring legwork with you — not a stack of CVs you vet from scratch." />
            <Feature emoji="🏠" title="Built for this sector" body="Designed around residential childcare — the roles, the realities and the rota, not a generic tool bent to fit." />
            <Feature emoji="💛" title="Values-based matching" body="Therapeutic culture, warmth and what matters to a candidate — matched on far more than keywords." />
            <Feature emoji="🌙" title="Rota & shift reality" body="Shift patterns, sleep-ins and the realities of residential cover are first-class, not an afterthought." />
            <Feature emoji="🤝" title="A kind candidate experience" body="People can see why a role fits them, and stay anonymous until interest is mutual — recruitment that respects them." />
            <Feature emoji="✅" title="A person always decides" body="Keni does the legwork and lays it out clearly; your named manager makes every hiring decision." />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          How it works
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-stone-900">
          From hello to a confident hire.
        </h2>
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Step n={1} title="Match" body="A candidate and a home both express interest. Identity unlocks only when it's mutual." />
          <Step n={2} title="Keni gets to work" body="References, ID and history requests go out — Keni gathers what's needed and keeps it in one place." />
          <Step n={3} title="We chase & flag" body="Keni follows up on time, reads the replies, and quietly flags anything that needs a human eye." />
          <Step n={4} title="You always know where you are" body="A clear, plain-English picture of each person, with the one next step — never a guessing game." />
          <Step n={5} title="A person signs off" body="A named manager makes the call. Keni teed it all up, but the decision is always yours." />
          <Step n={6} title="Ready for inspection" body="The full record stays tidy and complete in the background, so Ofsted is a click away." />
        </ol>
      </section>

      {/* Reassurance */}
      <section className="border-t border-stone-200 bg-brand-700">
        <div className="mx-auto max-w-6xl px-6 py-16 text-white">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-100">
            Safe, and kind, by design
          </p>
          <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight">
            Careful with people. Careful with their data.
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Pillar title="A human decides" body="Keni does the workflow and the evidence; a named manager always makes the call." />
            <Pillar title="Private by default" body="Data minimisation, role-based access, and sensitive information seen only by the right people." />
            <Pillar title="Nothing hidden" body="A complete, tamper-evident record of who did what and when — for your peace of mind." />
            <Pillar title="Grounded in the rules" body="Built around the Children's Homes Regulations and what Ofsted expects — without the jargon." />
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Simple pricing
        </p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-stone-900">
          Candidates are free. Homes pay only for a successful hire.
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="card">
            <h3 className="text-lg font-semibold text-stone-900">Candidates</h3>
            <p className="mt-1 text-3xl font-bold text-brand-700">Free</p>
            <p className="mt-2 text-sm text-stone-600">
              Always free — build a profile, match with homes and verify your
              references at no cost, ever.
            </p>
          </div>
          <div className="card ring-2 ring-brand-300">
            <h3 className="text-lg font-semibold text-stone-900">Children&apos;s homes</h3>
            <p className="mt-1 text-3xl font-bold text-brand-700">
              £1,495 <span className="text-base font-normal text-stone-400">per successful hire</span>
            </p>
            <p className="mt-2 text-sm text-stone-600">
              No setup fees, no long contracts — a fraction of an agency fee, with
              everything handled and an inspection-ready record for every hire.
            </p>
            <Link href="/pricing" className="btn-primary mt-5 inline-block px-4 py-2 text-sm">
              See full pricing
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-y border-stone-200 bg-stone-50 py-20">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            Questions
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-stone-900">
            The things people ask us.
          </h2>
          <dl className="mt-8 divide-y divide-stone-200">
            <Faq q="Do candidates pay anything?" a="Never. Candidates use Keni completely free — to build a profile, match with homes and verify their references." />
            <Faq q="Is it really cheaper than an agency?" a="Yes — a successful hire is £1,495, versus the £5,000–£9,000 homes typically pay an agency for a single manager. You keep the difference." />
            <Faq q="Does a human still make the decision?" a="Always. Keni does the legwork and lays everything out clearly, but your named registered manager makes every hiring decision." />
            <Faq q="Will it stand up to an Ofsted inspection?" a="Yes. Every hire leaves a complete, tidy, inspection-ready record — built in the background as you go, not cobbled together at the last minute." />
            <Faq q="What about all the checks and paperwork?" a="Keni handles the chasing, organises the evidence and keeps it all in order; statutory checks are arranged at cost and tracked for you, so nothing gets missed." />
            <Faq q="How do I get started?" a="Book a 15-minute demo and we'll show you candidates near you, and exactly how Keni would work for your home." />
          </dl>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Come and talk to Keni.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-stone-600">
          Fifteen minutes, no hard sell — see real candidates near you and how
          much warmer (and cheaper) hiring for your home can be.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/signup?role=EMPLOYER" className="btn-primary px-6 py-3 text-base">
            Book a 15-minute demo
          </Link>
          <Link href="/signup?role=CANDIDATE" className="btn-secondary px-6 py-3 text-base">
            Create a candidate profile
          </Link>
        </div>
      </section>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-stone-500 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <div className="text-base font-bold text-brand-700">Keni</div>
            <p className="mt-2 text-stone-500">
              Warm, safer recruitment for children&apos;s residential care.
              Candidates never pay.
            </p>
            <p className="mt-2 text-xs text-stone-400">
              Keni is a trading name of Pain Point Resolutions Ltd.
            </p>
          </div>
          <div className="flex gap-8">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">Product</span>
              <a href="#what-we-do" className="hover:text-stone-800">What we do</a>
              <a href="#how" className="hover:text-stone-800">How it works</a>
              <Link href="/pricing" className="hover:text-stone-800">Pricing</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">Get started</span>
              <Link href="/signup?role=EMPLOYER" className="hover:text-stone-800">For homes</Link>
              <Link href="/signup?role=CANDIDATE" className="hover:text-stone-800">For candidates</Link>
              <Link href="/login" className="hover:text-stone-800">Log in</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Feature({ emoji, title, body }: { emoji?: string; title: string; body: string }) {
  return (
    <div className="card transition hover:shadow-md">
      {emoji ? <div className="text-2xl" aria-hidden>{emoji}</div> : null}
      <h3 className="mt-2 font-semibold text-stone-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">{body}</p>
    </div>
  );
}

function BigStat({ figure, label, highlight }: { figure: string; label: string; highlight?: boolean }) {
  return (
    <div>
      <div className={`text-4xl font-bold tracking-tight sm:text-5xl ${highlight ? "text-white" : "text-brand-100"}`}>
        {figure}
      </div>
      <div className="mt-2 text-sm text-brand-100">{label}</div>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="card">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
        {n}
      </div>
      <h3 className="mt-3 font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-stone-600">{body}</p>
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

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="py-5">
      <dt className="font-semibold text-stone-900">{q}</dt>
      <dd className="mt-1.5 text-sm leading-relaxed text-stone-600">{a}</dd>
    </div>
  );
}
