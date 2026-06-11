import { test } from "node:test";
import assert from "node:assert/strict";
import { vacancyPack } from "../lib/vacancy";

test("vacancyPack: advert carries a safeguarding statement and the home name", () => {
  const p = vacancyPack({ title: "Residential Support Worker", region: "Cheshire", companyName: "Bright Horizons", childrenSupported: "young people with EBD" });
  assert.ok(/safeguarding/i.test(p.advert));
  assert.ok(/enhanced DBS/i.test(p.safeguardingStatement));
  assert.ok(p.advert.includes("Bright Horizons"));
  assert.ok(p.jobDescription.responsibilities.length > 0);
  assert.ok(p.personSpec.essential.length > 0 && p.personSpec.desirable.length > 0);
  assert.ok(p.checklist.some((c) => /safer-recruitment training/i.test(c)));
});
