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
- **Prisma** ORM over **SQLite** (zero external services for the MVP)
- **Tailwind CSS**
- Cookie-based sessions (httpOnly), passwords hashed with **bcrypt**

## Getting started

```bash
npm install
cp .env.example .env          # adjust SESSION_SECRET for anything real
npm run db:push               # create the SQLite schema
npm run db:seed               # seed the cold-start demo data
npm run dev                   # http://localhost:3000
```

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
| `npm run build`     | Production build (runs `prisma generate`)|
| `npm run start`     | Start production server                  |
| `npm run typecheck` | `tsc --noEmit`                           |
| `npm run db:push`   | Apply schema to SQLite                   |
| `npm run db:seed`   | Seed demo data                           |
| `npm run db:reset`  | Force-reset schema + reseed              |

## Business-model guardrail (§10)

Dating-app **interaction design**, not its incentive model: no boosts, no
pay-to-be-seen, no engagement loops. **Homes** subscribe; **candidates never
pay**.
