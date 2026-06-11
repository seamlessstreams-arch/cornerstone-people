import { test } from "node:test";
import assert from "node:assert/strict";
import { assessAgencyWorker } from "../lib/agency";

const none = {
  agencyChecksConfirmed: false, identitySeenOnArrival: false, dbsConfirmed: false,
  referencesConfirmed: false, rightToWorkConfirmed: false, soleChargeApproved: false,
};

test("assessAgencyWorker: nothing confirmed -> not cleared, no sole charge", () => {
  const a = assessAgencyWorker(none);
  assert.equal(a.canWorkSupervised, false);
  assert.equal(a.soleChargeAllowed, false);
  assert.ok(a.outstanding.length > 0);
});

test("assessAgencyWorker: agency + id + RTW -> supervised only, still no sole charge", () => {
  const a = assessAgencyWorker({ ...none, agencyChecksConfirmed: true, identitySeenOnArrival: true, rightToWorkConfirmed: true });
  assert.equal(a.canWorkSupervised, true);
  assert.equal(a.soleChargeAllowed, false);
  assert.ok(a.blockers.some((b) => /sole charge not approved/i.test(b)));
});

test("assessAgencyWorker: sole charge only with everything + manager approval", () => {
  const a = assessAgencyWorker({
    agencyChecksConfirmed: true, identitySeenOnArrival: true, dbsConfirmed: true,
    referencesConfirmed: true, rightToWorkConfirmed: true, soleChargeApproved: true,
  });
  assert.equal(a.soleChargeAllowed, true);
  assert.equal(a.blockers.length, 0);
});
