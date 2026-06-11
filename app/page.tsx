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
            <a href="#safer-recruitment" className="hidden px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 sm:block">
              Safer recruitment
            </a>
            <a href="#sourcing" className="hidden px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 sm:block">
              Sourcing
            </a>
            <a href="#how" className="hidden px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 sm:block">
              How it works
            </a>
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
          Safer recruitment for children&apos;s residential care
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
          Hire for children&apos;s homes with the{" "}
          <span className="text-brand-600">checks built in</span>.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-stone-600">
          Keni matches candidates and homes on mutual interest, then runs every
          pre-employment check — references, DBS, identity, right to work,
          employment gaps and qualifications — to an Ofsted-ready standard.
          The system chases, flags and summarises; a named manager always makes
          the final decision.
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
          <Stat figure="RED · AMBER · GREEN" label="Live compliance status on every candidate" />
          <Stat figure="Schedule 2" label="Built around the Children's Homes Regulations & Ofsted guidance" />
          <Stat figure="Human sign-off" label="The system never clears anyone automatically" />
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
              <Bullet>Source &amp; auto-shortlist candidates against your criteria</Bullet>
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

      {/* Safer Recruitment OS */}
      <section id="safer-recruitment" className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          The Safer Recruitment OS
        </p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-stone-900">
          Every Schedule 2 check, in one place.
        </h2>
        <p className="mt-3 max-w-2xl text-stone-600">
          A rule-based engine handles the legwork and surfaces a single
          traffic-light status with the next best action. It is advisory only —
          it never makes the suitability decision.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Feature title="References" body="Secure one-time mobile forms for referees, a rule-based analyser that flags vague, open or concerning references, and automatic chasers." />
          <Feature title="DBS & barred list" body="Record certificate number, level, workforce, checker and outcome — with risk-review flags and retention prompts." />
          <Feature title="Identity & right to work" body="Document, photo and likeness checks, share-code workflow and follow-ups for time-limited permission." />
          <Feature title="Employment history & gaps" body="Parses the history, flags gaps over 28 days and inconsistencies, and asks for written explanations." />
          <Feature title="Qualifications & training" body="Track required qualifications, mandatory training and registrations — evidenced and verified." />
          <Feature title="Self-declaration" body="Confidential criminal self-disclosure, routed to a named manager for review before progressing." />
          <Feature title="Exceptional start" body="Risk assessment, supervision plan and named RM/RI approval — with hard controls: no sole charge, no unsupervised work." />
          <Feature title="Single Central Record" body="An Ofsted-ready staff-file index across every candidate — print or export to CSV in a click." />
          <Feature title="Audit trail" body="An append-only record of who did what and when — every decision has a human owner." />
        </div>
      </section>

      {/* Sourcing */}
      <section id="sourcing" className="border-y border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            Sourcing &amp; shortlisting
          </p>
          <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-stone-900">
            Shortlist hundreds of CVs in minutes.
          </h2>
          <p className="mt-3 max-w-2xl text-stone-600">
            Import a candidate list from your own licensed search — paste a
            CV-Library alert email or a CSV export — and Keni ranks everyone
            against your role, region, skills and experience, with the reasons
            spelled out. You only open the profiles worth your time.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            <Feature title="Import, don't scrape" body="Paste or forward your licensed CV-Library lists and emails. Keni never scrapes third-party sites." />
            <Feature title="Auto-shortlist" body="A weighted score (skills, experience, location, role, education) ranks candidates and explains every match." />
            <Feature title="Data-minimised" body="Names and a profile link only — no contact details stored. You open the full profile under your own account." />
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
          <Step n={2} title="Open a case" body="Pre-employment checks begin. Keni requests references, ID, DBS and a full history." />
          <Step n={3} title="Chase & analyse" body="The system sends mobile reference forms, chases on schedule and flags concerns." />
          <Step n={4} title="See the status" body="Each candidate rolls up to RED / AMBER / GREEN with the outstanding blockers and next action." />
          <Step n={5} title="Human sign-off" body="A named manager makes the suitability decision — clear, conditional, exceptional or not cleared." />
          <Step n={6} title="Ofsted-ready file" body="The Single Central Record, missing-evidence list and audit trail are ready for inspection." />
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
            <Pillar title="Regulation-led" body="Built around Children's Homes Regulations 32 & 33, Schedule 2 and Ofsted guidance." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">
          Recruit safely, and prove it.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-stone-600">
          Join the homes and candidates using Keni to hire for children&apos;s
          residential care — with the checks, the chasing and the audit trail
          built in.
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
