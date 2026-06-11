import { test } from "node:test";
import assert from "node:assert/strict";
import { interviewPack } from "../lib/interview";

test("interviewPack: covers the required safeguarding/values areas", () => {
  const pack = interviewPack({ roleType: "Residential Support Worker" });
  const areas = pack.map((a) => a.area.toLowerCase()).join(" | ");
  for (const needle of ["safeguarding", "boundaries", "missing", "trauma", "recording", "motivation"]) {
    assert.ok(areas.includes(needle), `expected an area covering "${needle}"`);
  }
  // every area has at least one question
  assert.ok(pack.every((a) => a.questions.length > 0));
  // role is woven in
  assert.ok(JSON.stringify(pack).includes("Residential Support Worker"));
});
