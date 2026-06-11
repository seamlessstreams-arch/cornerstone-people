// Shadow-shift authorisation gate (rule-based).
//
// A shadow shift may only be authorised once it has been risk-assessed, a
// supervising staff member is allocated, and the hard controls are in place:
// supervised at all times, not counted in staffing numbers, and no access to
// children's detailed personal information. Advisory only — a named manager
// makes and records the authorisation.

export type ShadowShiftInputs = {
  supervisorName?: string | null;
  shiftDate?: string | Date | null;
  riskAssessed: boolean;
  supervisedAtAllTimes: boolean;
  notCountedInStaffing: boolean;
  noAccessToChildInfo: boolean;
};

export type ShadowShiftReport = {
  requirements: string[];
  readyToAuthorise: boolean;
};

export function assessShadowShift(i: ShadowShiftInputs): ShadowShiftReport {
  const requirements: string[] = [];

  if (!i.shiftDate) requirements.push("Set the shift date");
  if (!i.supervisorName?.trim())
    requirements.push("Allocate a supervising staff member");
  if (!i.riskAssessed) requirements.push("Complete the risk assessment");
  if (!i.supervisedAtAllTimes)
    requirements.push("Confirm: supervised at all times");
  if (!i.notCountedInStaffing)
    requirements.push("Confirm: not counted in staffing numbers");
  if (!i.noAccessToChildInfo)
    requirements.push("Confirm: no access to children's detailed information");

  return { requirements, readyToAuthorise: requirements.length === 0 };
}
