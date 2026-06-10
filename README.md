# Cornerstone People

A regional, **supply-first** matching app for children's-home recruitment.
Candidates and homes connect **only when interest is mutual** — and a matched
candidate arrives with **verified references** already in hand.

This repository implements the MVP described in `MVP_BRIEF.md`: the core
mutual-interest mechanic and the four layers of candidate protection. Everything
beyond the core mechanic (DBS workflow, reference bank, retention scoring,
pipeline stages, etc.) is deliberately **out of scope** — see brief §6 / §10.

## The core mechanic

Two sides build profiles. Either side can express interest. **Identity and a
conversation unlock only when interest is mutual.** This removes spam
applications and reframes the profile as the thing that gets you *seen and
chosen*.

## Tech stack

- **Next.js 14** (App Router, TypeScript, React Server Components + Server Actions)
- **Prisma** ORM over **PostgreSQL**
- **Tailwind CSS**
- Cookie-based sessions (httpOnly), passwords hashed with **bcrypt**

## Getting started

You need a PostgreSQL database. Point `DATABASE_URL` / `DIRECT_URL` at it
(a local Postgres, or a hosted one such as Neon).

```bash
npm install
cp .env.example .env          # set DATABASE_URL / DIRECT_URL and SESSION_SECRET
npm run db:reset              # apply migrations + seed the cold-start demo data
npm run dev                   # http://localhost:3000
```

(`npm run db:reset` runs `prisma migrate reset`, which applies the migrations in
`prisma/migrations` and then runs the seed. Use `npx prisma migrate deploy` if
you only want to apply migrations without reseeding.)

### Demo logins (password: `password123`)

| Role      | Email                     |
| --------- | ------------------------- |
| Candidate | `candidate1@example.com`  |
| Home      | `home1@example.com`       |

The seed embodies the **cold-start plan** (brief §8): one dense region
(Greater Manchester), the supply side seeded *first* — 20 candidates, most with
pre-verified references — then two homes onboarding into a stocked pool.

## How the brief maps to the code

### Roles & flows (§2)

- **Candidate** — `app/candidate/*`: own profile only, reference verification,
  browse homes, express interest, block-list, matches + messaging.
- **Employer** — `app/employer/*`: company profile, positions, browse
  anonymised candidate cards, market view, matches + messaging.
- **The connection** — mutual interest → message thread + a single
  "request to interview" action (`components/MatchThread.tsx`). Nothing more.

### Visibility model (§3) — enforced server-side

- A candidate can **never** see another candidate (no route exists; the data
  layer never queries other candidates for a candidate).
- An employer can **never** see another employer's candidate activity — the
  market view (`app/employer/market`) exposes *positions only*.
- An employer **can** see other open positions (market visibility).

### Candidate protection — four layers (§4)

- **Layer 0 — visibility mode** (`Candidate.visibilityMode`): `ANONYMOUS`
  (default) vs `OPEN`. Anonymous cards rank/match identically — **no penalty**.
  Toggle on `app/candidate/profile`.
- **Layer 1 — block-list** (`Block`): search homes by name and block them.
  **Silent and undetectable** — a blocked employer simply never sees the
  candidate (`browsableCandidatesForEmployer` filters them out, and a block
  tears down any existing interest/match).
- **Layer 2 — anonymity** (`buildCandidateCard`): pre-mutual cards are built
  from **structured fields only** (`lib/constants.ts` vocabularies). All
  free-text / narrative stays sealed — the re-identification guard.
- **Layer 3 — mutual interest unlocks identity** (`expressInterest` →
  `Match`): full profile + verified references reveal only when both sides have
  expressed interest.

### Trust infrastructure (§5)

Candidate-side **reference verification** (`Reference`,
`app/verify-reference/[token]`) lets a candidate carry pre-verified references.

## Safer Recruitment OS

Once an employer and candidate **match** (identity unlocked), the employer can
open a **safer-recruitment case** and run pre-employment checks. This is the
sector-specific layer that makes the product an operating system, not a job
board.

- **Case pipeline** (`/employer/safer-recruitment`) — every matched candidate
  moves through ordered stages (application → checks → reference/DBS/gap holds →
  RM/RI review → cleared / exceptional supervised start / rejected). The
  dashboard surfaces holds, overdue chasers, risk alerts and average days to
  reference.
- **Reference requests & chasers** — create a request, mark it sent (auto-
  schedules 7/14/21-day chasers), record the response. Professional,
  safeguarding-aware **templates** (`lib/reference-templates.ts`) for ten
  scenarios; with no email key the UI offers **copy email text**.
- **Reference quality analyser** (`lib/safer-recruitment.ts`,
  `analyseReference`) — rule-based, returns
  strong/adequate/basic/incomplete/concerning/contradictory/requires-human-review.
  Concern language and missing safeguarding comments **always** escalate to a
  human. The analyser output is stored **separately** from the human
  disposition.
- **Employment gap checker** (`checkEmploymentGaps`) — flags gaps, overlaps,
  short roles, agency/self-employment/education periods and missing reasons.
- **DBS / right-to-work** workflow — evidence fields only (no live DBS API), with
  a "risk review required" gate.
- **Reference bank** (`/employer/reference-bank`) — an **employer-scoped**,
  reusable directory of referee organisations and how they handle requests
  (HR contact, portal link, preferred method, chase pattern, factual-only flag).
  This stores **factual process/contact data the employer maintains for
  itself** — never cross-employer opinions or ratings about candidates, which
  remain out of scope for GDPR/defamation reasons.
- **Human-in-the-loop by construction** — clear / reject / exceptional-start
  stages require a **named** sign-off and are never set automatically.
  `assessClearance` reports readiness but never clears anyone.
- **AI-ready, safe by default** (`lib/ai.ts`) — eight planned agents, all
  returning labelled *"AI-supported draft/recommendation"*. With no API key
  every agent falls back to the deterministic rule-based output. AI never
  decides, never uses protected characteristics, and every AI-assisted action is
  logged.
- **Audit trail** (`AuditLog`, `lib/audit.ts`) — every important action is
  recorded (append-only).

The pure logic (analyser, gap checker, clearance gate) is unit-tested in
`tests/safer-recruitment.test.ts`.

## Connecting to Supabase (Postgres + Storage)

Supabase is just Postgres plus Storage, so the existing Prisma app uses it with
no code changes — only configuration.

**1. Database.** In Supabase: *Project Settings → Database → Connection string →
Connection pooling*.

- `DATABASE_URL` = the **Transaction** pooler URL (port `6543`), with
  `?pgbouncer=true&connection_limit=1` appended.
- `DIRECT_URL` = the **Direct connection** URL (port `5432`). Migrations need a
  direct (non-pooled) connection.

Then create the tables:

```bash
npx prisma migrate deploy     # applies all migrations to the Supabase database
npm run db:seed               # optional demo data
```

**2. Storage.** In Supabase: *Project Settings → API*.

- `NEXT_PUBLIC_SUPABASE_URL` = Project URL (`https://<ref>.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the `anon` `public` key
- `SUPABASE_SERVICE_ROLE_KEY` = the `service_role` secret — **server-only, never
  exposed to the browser** (`lib/supabase.ts` is `server-only`)

Then create the buckets and verify the connection:

```bash
npm run storage:setup         # creates 5 PRIVATE buckets
npm run storage:check         # uploads/signs/fetches/deletes a test object
```

Buckets are private. Uploads and downloads only happen inside server actions
that authorize the caller first; downloads are short-lived **signed URLs**
(`lib/storage.ts`). The `anon` key never touches Storage. If the Supabase env
vars are absent, upload UI shows a graceful "storage not configured" notice and
the rest of the app is unaffected.

> RLS note: this app authenticates with its own cookie sessions and reaches
> Postgres through Prisma (the database owner role), so per-table Postgres RLS
> policies would not apply to that connection. Authorization is enforced in
> application code, scoped per candidate/employer — the same pattern throughout
> the app. Moving auth to Supabase Auth + anon-key access (to make Postgres RLS
> meaningful) is a deliberate, larger piece of future work.

## Deploying to Vercel (with Neon or Supabase Postgres)

The app is configured for Vercel. `vercel.json` sets the build command to
`prisma generate && prisma migrate deploy && next build`, so migrations are
applied automatically on every deploy.

1. **Import the repo** — in the Vercel dashboard, *Add New… → Project* and
   import `seamlessstreams-arch/cornerstone-people`. Framework preset:
   **Next.js** (auto-detected).
2. **Add a database** — in the project's *Storage* tab, add **Neon** (Postgres)
   from the Marketplace. This provisions a database and injects connection env
   vars (pooled + unpooled).
3. **Set the env vars** the app expects:
   - `DATABASE_URL` → the **pooled** Neon connection string
   - `DIRECT_URL` → the **unpooled / direct** Neon connection string
     (used by `prisma migrate deploy`)
   - `SESSION_SECRET` → a long random string
4. **Deploy.** The build runs the migrations against the Neon database and ships
   the app.
5. **Seed (optional, one-off)** — to populate the cold-start demo data, run
   `npm run db:seed` locally with `DATABASE_URL` pointed at the Neon database
   (or `DIRECT_URL`), or run it from a Vercel CLI shell.

> Note: Prisma migrations need a **direct** (non-pooled) connection. Always set
> `DIRECT_URL` to the unpooled string, or `migrate deploy` will fail against the
> pgbouncer pooler.

## Project layout

```
app/
  page.tsx                     landing
  login/  signup/              auth
  verify-reference/[token]/    referee confirmation (no login)
  candidate/                   candidate area (dashboard, profile, references,
                               browse, blocks, matches)
  employer/                    employer area (dashboard, profile, positions,
                               browse, market, matches, safer-recruitment,
                               reference-bank)
  actions/                     server actions (auth, candidate, employer,
                               connection, reference, safer-recruitment)
lib/
  constants.ts                 controlled vocabularies + enum-like values
  db.ts                        Prisma client
  session.ts                   cookie session helpers
  auth.ts                      route guards (requireCandidate / requireEmployer)
  matching.ts                  the core: interest, matches, anonymised cards
  safer-recruitment.ts         pure logic: reference analyser, gap checker,
                               clearance gate (unit-tested)
  safer-recruitment-data.ts    employer-scoped case queries + dashboard stats
  reference-templates.ts       ten professional reference/chaser/consent templates
  audit.ts                     append-only audit logging
  ai.ts                        AI agent architecture (rule-based fallback)
components/                    shared UI
prisma/
  schema.prisma                data model
  seed.ts                      cold-start demo data + safer-recruitment cases
```

## Scripts

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Dev server                               |
| `npm run build`     | Production build (`prisma generate` + `prisma migrate deploy` + `next build`) |
| `npm run start`     | Start production server                  |
| `npm run typecheck` | `tsc --noEmit`                           |
| `npm test`          | Run the test suite (visibility + matching) against a throwaway Postgres db |
| `npm run db:push`   | Push schema to the database (no migration history) |
| `npm run db:seed`   | Seed demo data                           |
| `npm run db:reset`  | `prisma migrate reset` — re-apply migrations + reseed |
| `npm run storage:setup` | Create the private Supabase Storage buckets |
| `npm run storage:check` | End-to-end Supabase Storage connectivity check |

## Tests

`npm test` runs a Node test-runner suite that locks in the security-critical
invariants:

- **`tests/visibility.test.ts`** — the anonymity guard (`buildCandidateCard`):
  Anonymous mode seals name/photo/history/narrative; Open mode reveals
  name/photo/history but keeps free-text narrative sealed; a mutual match
  unlocks everything.
- **`tests/matching.test.ts`** — the matching engine against a throwaway
  Postgres database (`TEST_DATABASE_URL`): one-sided interest never matches;
  mutual interest creates exactly
  one match; a block prevents any match even after prior interest; the browsable
  pool hides blocked, incomplete and already-matched candidates; the verified
  badge requires the configured number of verified references.

CI (`.github/workflows/ci.yml`) runs typecheck, tests and a production build on
every push and PR.

## Business-model guardrail (§10)

Dating-app **interaction design**, not its incentive model: no boosts, no
pay-to-be-seen, no engagement loops. **Homes** subscribe; **candidates never
pay**.
