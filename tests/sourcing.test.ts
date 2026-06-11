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
