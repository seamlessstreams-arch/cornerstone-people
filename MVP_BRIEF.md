# Keni — MVP Build Brief

**A regional, supply-first matching app for children's-home recruitment.**
Candidates and homes connect only when interest is mutual. A matched candidate
arrives with verified references already in hand.

This brief covers the MVP only. Everything not listed here is deferred until the
core mechanic is validated.

---

## 1. The core mechanic

Two sides build profiles. Either side can express interest. Identity and a
conversation unlock **only when interest is mutual**. Nothing reaches a home
until the home (or the candidate) has signalled interest first — this removes
the spam-application problem and reframes the profile as the thing that gets
you *seen and chosen*, not a form submitted into a void.

## 2. Roles and the three flows

### Flow A — Candidate
- Sign up, create and edit **their own profile only**.
- Complete **reference verification once** (candidate-side only — see §5).
- Browse employer profiles and open positions.
- Express interest in a position / employer ("interested" / "not for me").
- Manage a **block-list** of employers who must never see them (see §4).
- On a mutual match: full profiles unlock and a message thread opens, with one
  next step — "request to interview." The platform's MVP job ends here.

### Flow B — Employer
- Sign up, create and edit a **company profile**: selling points, ethos, type of
  children/young people supported, the placement picture, shift pattern, support
  offered, compensation.
- Browse **anonymised candidate cards** (minus anyone who has blocked them).
- Browse other **positions** in the market (allowed — helps them pitch).
- Express interest in a candidate.
- On a mutual match: full candidate profile (incl. verified references) and a
  message thread unlock.

### Flow C — The connection
- Mutual interest → message thread + a single "request to interview" action.
- No pipeline stages, no offer management, no DBS workflow in the MVP.

## 3. Visibility model (permissions table)

| | Own profile | Other candidates | Employer profiles & positions | Candidate profiles |
|---|---|---|---|---|
| **Candidate** | Create / edit | Never visible | Browse fully | — |
| **Employer** | Create / edit | — | Positions visible; NOT each other's candidate activity | Browse anonymised cards, minus blockers |

Core rules:
- A candidate can **never** see another candidate.
- An employer can **never** see another employer's candidate conversations, or
  who a candidate is also talking to.
- An employer **can** see other open positions (market visibility).

## 4. Candidate protection — four layers

**Layer 0 — Candidate-controlled visibility mode.** The candidate chooses how much
shows up front, before any mutual interest:
- **Open mode** — full profile (name, photo, history) visible to non-blocked
  employers. For candidates openly looking who want to be found fast.
- **Anonymous mode** — the anonymised card only; identity unlocks on mutual interest.
  For candidates quietly testing the water.

Design rules that keep this honest:
- **Default to Anonymous** — safer by default; exposure is a deliberate opt-in.
- **No penalty for Anonymous** — anonymised cards rank and match identically to full
  profiles. The only difference is *when* identity reveals, never pool visibility or
  match quality. Otherwise the privacy-conscious are punished and the protection is
  theoretical.
- The block-list (Layer 1) applies in **both** modes — even in Open mode, blocked
  employers see nothing. So the candidate has two independent dials: *who* can see me
  (block-list) and *how much* they see (mode).

**Layer 1 — Block-list.** Candidate names specific employers (current employer,
competitors) who cannot see them at all. A blocked employer gets no card and no
"no result" — the candidate is simply absent from their pool.
- Employers must be **searchable by name** so candidates can find and block them.
- Blocking is **silent and undetectable** from the employer side. An employer
  must never be told, or be able to infer (e.g. from pool-size changes), that
  they have been blocked.

**Layer 2 — Anonymity (Anonymous mode).** A non-blocked employer sees only an
**anonymised card** until mutual interest: experience, what-matters-to-me,
region, shift availability, type of young people they want to support. No name,
no photo, no current/past employer names.
- **Re-identification guard:** the sector is small, so free text can identify a
  person even without a name. Pre-mutual cards are built from **structured fields
  only** (dropdowns, tags). All free-text / narrative fields stay sealed until
  the full profile unlocks.

**Layer 3 — Mutual interest unlocks identity.** Full profile (name, photo,
history, verified references) reveals only when **both** sides have expressed
interest. Either side may express interest first.

## 5. Trust infrastructure (the differentiator)

Keep candidate-side **reference verification** in the MVP — a candidate whose
references are pre-verified is the "verified profile" badge, valuable to a home
on day one.

**Hard constraint:** verify the *candidate's* references only. Do **NOT** build
the cross-employer "reference bank" that stores reliability ratings / suitability
comments about third-party referees. That is a GDPR + defamation exposure
(third parties who never consented) and is not needed to prove the mechanic.
It requires a DPIA and legal sign-off before any real data is loaded.

## 6. Explicitly out of scope (deferred until validated)

Matching sophistication beyond a basic fit score; readiness scoring;
**retention scoring (drop permanently** — indirect-discrimination risk); the
cross-employer reference bank; DBS workflow; employment-gap checker; agency bank;
exceptional-start; admin taxonomy tooling; AI agents; most reporting; pipeline
stages; offer management.

If the mechanic works, these become later paid layers — starting with the full
safer-recruitment OS as the second paid product.

## 7. Profile fields (keep candidate side short — 6–8 fields)

**Candidate "what matters to me" (structured, pre-mutual safe):**
region, shift availability, type of young people they want to support,
experience level, therapeutic approach / values tags, role type sought.
*(In **Anonymous mode**, sealed until mutual: name, photo, employment history,
narrative, references. In **Open mode**, these are visible to non-blocked
employers up front — the candidate's choice per Layer 0.)*

**Employer company profile:**
selling points, ethos, type of children supported, placement picture,
shift pattern, support offered, compensation.

## 8. Cold-start plan (forced by the mechanic)

The mutual-interest gate only feels good if one side feels abundant.
1. Pick **one region** (go local and dense, not national and thin).
2. Recruit the **supply side first** — a few hundred candidates with verified
   references in that region, *before* any home logs in.
3. Onboard homes into a pool that already feels stocked, so their first session
   shows real, fit, pre-verified people — never an empty feed.

## 9. Success metrics

- **Profile completion rate** (candidate) — does the profile framing beat
  form-abandonment?
- **Mutual-match rate** — do interests actually overlap?
- **Match-to-interview conversion** — does a match lead to a real conversation,
  or stall? (If it stalls, fix the connection design, not the matching.)

## 10. Business-model guardrail

Borrow dating-app **interaction design**, reject its **incentive model**.
No boosts, no pay-to-be-seen, no engagement loops — the product wins when a match
**leaves hired**, not when they keep swiping. Charge **homes** a subscription
(stepping up to the full safer-recruitment OS later). **Candidates never pay.**
