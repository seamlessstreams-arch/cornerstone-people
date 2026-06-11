import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreCandidate, parseSourcedList } from "../lib/sourcing";

// Pure-logic tests for the auto-shortlister. It ranks and explains; it never
// rejects or hires — a human decides who to take forward.

test("scoreCandidate: a strong match on role + region + keywords bands STRONG", () => {
  const r = scoreCandidate(
    {
      roleSought: "Residential Support Worker",
      region: "Greater Manchester",
      skills: "EBD, trauma-informed, safeguarding",
      summary: "Experienced RSW in children's homes",
    },
    { roleSought: "Support Worker", region: "Greater Manchester", keywords: ["trauma", "safeguarding"] },
  );
  assert.equal(r.band, "STRONG");
  assert.ok(r.score >= 70);
  assert.ok(r.reasons.length > 0);
});

test("scoreCandidate: wrong region + missing keywords drags the score down", () => {
  const r = scoreCandidate(
    { roleSought: "Support Worker", region: "Kent", skills: "retail" },
    { roleSought: "Support Worker", region: "Greater Manchester", keywords: ["trauma", "EBD"] },
  );
  assert.ok(r.gaps.some((g) => /not in/i.test(g)));
  assert.ok(r.gaps.some((g) => /missing/i.test(g)));
  assert.ok(r.score < 70);
});

test("scoreCandidate: no criteria gives a neutral mid score, no crash", () => {
  const r = scoreCandidate({ roleSought: "Nurse" }, { keywords: [] });
  assert.ok(r.score >= 0 && r.score <= 100);
});

test("scoreCandidate: never returns an accept/reject verdict — only bands", () => {
  const r = scoreCandidate({ roleSought: "x" }, { roleSought: "y", keywords: [] });
  assert.ok(["STRONG", "POSSIBLE", "WEAK"].includes(r.band));
});

test("parseSourcedList: parses CSV with quoted commas and skips header", () => {
  const csv = [
    "Name, Profile URL, Region, Role, Experience, Skills, Summary",
    'Jane Doe, https://ex.com/1, Greater Manchester, Support Worker, 3 years, "EBD, trauma", Experienced RSW',
    "John Smith, https://ex.com/2, Cheshire, Team Leader, 5 years, leadership, ",
  ].join("\n");
  const rows = parseSourcedList(csv);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].name, "Jane Doe");
  assert.equal(rows[0].region, "Greater Manchester");
  assert.equal(rows[0].skills, "EBD, trauma"); // quoted comma preserved
  assert.equal(rows[1].name, "John Smith");
  assert.equal(rows[1].summary, null);
});

test("parseSourcedList: supports pipe-delimited and ignores blank lines", () => {
  const rows = parseSourcedList("Pat Lee | https://ex.com/3 | Lancashire | RSW\n\n");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, "Pat Lee");
  assert.equal(rows[0].roleSought, "RSW");
});

test("scoreCandidate: experience window rewards a fit and penalises a shortfall", () => {
  const crit = { roleSought: "Support Worker", minExperience: 3, maxExperience: 8 };
  const fits = scoreCandidate({ roleSought: "Support Worker", experienceLevel: "5 years" }, crit);
  const short = scoreCandidate({ roleSought: "Support Worker", experienceLevel: "1 year" }, crit);
  assert.ok(fits.reasons.some((r) => /experience fits/i.test(r)));
  assert.ok(short.gaps.some((g) => /under the 3y minimum/i.test(g)));
  assert.ok(fits.score > short.score);
});

test("scoreCandidate: education requirement is matched against the candidate text", () => {
  const crit = { education: ["Level 3", "NVQ"] };
  const has = scoreCandidate({ summary: "Holds a Level 3 Diploma in residential childcare" }, crit);
  const lacks = scoreCandidate({ summary: "No formal qualifications listed" }, crit);
  assert.ok(has.reasons.some((r) => /education/i.test(r)));
  assert.ok(has.score >= lacks.score);
});

test("scoreCandidate: breakdown covers all five weighted dimensions", () => {
  const r = scoreCandidate({ roleSought: "x" }, { roleSought: "y", keywords: [] });
  const dims = r.breakdown.map((b) => b.dimension).sort();
  assert.deepEqual(dims, ["education", "experience", "location", "role", "skills"]);
});

import { parseCvLibraryListing, looksLikeCvLibrary } from "../lib/sourcing";

const CVL_SAMPLE = `View CV
Angel Thomas


99% Match
Profile/CV Last Updated: 22/04/2026 12:43
Add Note | Select
Location
Coventry, West Midlands
Willing to Travel
10 miles
Job Title
Health Care Assistant
Desired Role
N/A
Skills: Mental Health Patient Assessments Safeguarding Nursing
CV Keywords: 12 High St, contact me on 07700900123 or angel@example.com PROFESSIONAL SUMMARY Compassionate nurse with one year of experience.
View CV
Mariyah Begum


88% Match
Location
Sandwell, West Midlands
Job Title
Support Worker
Skills: Safeguarding Active Listening Empathy
CV Keywords: Residential Care Home experience`;

test("looksLikeCvLibrary: recognises a CV-Library alert", () => {
  assert.ok(looksLikeCvLibrary(CVL_SAMPLE));
  assert.ok(!looksLikeCvLibrary("Jane Doe, https://x, Kent, Nurse"));
});

test("parseCvLibraryListing: extracts name/region/role/skills, strips contact details", () => {
  const rows = parseCvLibraryListing(CVL_SAMPLE);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].name, "Angel Thomas");
  assert.equal(rows[0].region, "West Midlands");
  assert.equal(rows[0].roleSought, "Health Care Assistant");
  assert.ok(/safeguarding/i.test(rows[0].skills ?? ""));
  // contact details must never survive
  assert.ok(!/@example\.com/.test(JSON.stringify(rows[0])));
  assert.ok(!/07700900123/.test(JSON.stringify(rows[0])));
  // summary picks up after PROFESSIONAL SUMMARY
  assert.ok(/compassionate nurse/i.test(rows[0].summary ?? ""));
  assert.equal(rows[1].name, "Mariyah Begum");
});
