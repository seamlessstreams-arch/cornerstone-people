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

Candidate-side **reference verification only** (`Reference`,
`app/verify-reference/[token]`). We deliberately do **not** build the
cross-employer reference bank (GDPR + defamation exposure) — no ratings or
comments about referees are ever stored.

## Deploying to Vercel (with Neon Postgres)

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
                               browse, market, matches)
  actions/                     server actions (auth, candidate, employer,
                               connection, reference)
lib/
  constants.ts                 controlled vocabularies + enum-like values
  db.ts                        Prisma client
  session.ts                   cookie session helpers
  auth.ts                      route guards (requireCandidate / requireEmployer)
  matching.ts                  the core: interest, matches, anonymised cards
components/                    shared UI
prisma/
  schema.prisma                data model
  seed.ts                      cold-start demo data
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
