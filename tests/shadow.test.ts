import { test } from "node:test";
import assert from "node:assert/strict";
import { assessShadowShift } from "../lib/shadow";

const full = {
  supervisorName: "A. Staff", shiftDate: "2026-07-01", riskAssessed: true,
  supervisedAtAllTimes: true, notCountedInStaffing: true, noAccessToChildInfo: true,
};

test("assessShadowShift: ready only when risk-assessed, supervised and controlled", () => {
  assert.equal(assessShadowShift(full).readyToAuthorise, true);
});

test("assessShadowShift: a missing hard control blocks authorisation", () => {
  const r = assessShadowShift({ ...full, noAccessToChildInfo: false });
  assert.equal(r.readyToAuthorise, false);
  assert.ok(r.requirements.some((x) => /detailed information/i.test(x)));
});

test("assessShadowShift: empty plan lists every requirement", () => {
  const r = assessShadowShift({
    supervisorName: null, shiftDate: null, riskAssessed: false,
    supervisedAtAllTimes: false, notCountedInStaffing: false, noAccessToChildInfo: false,
  });
  assert.equal(r.readyToAuthorise, false);
  assert.ok(r.requirements.length >= 5);
});
