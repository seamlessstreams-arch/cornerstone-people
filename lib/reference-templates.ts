// Reference request / chaser / consent templates.
//
// Pure string builders — no email integration here. If a Resend key is present,
// app/actions can hand these to the sender; otherwise the UI shows a
// "copy email text" button. AI may LATER refine tone, but these professional,
// safeguarding-aware defaults always work with no API key.

import type { ReferenceType } from "./constants";

export type TemplateContext = {
  refereeName?: string | null;
  candidateName: string;
  employerName: string;
  senderName?: string | null;
  roleTitle?: string | null;
  claimedDates?: string | null;
  referenceType: ReferenceType;
  portalLink?: string | null;
};

export type TemplateKind =
  | "standard_employment"
  | "childrens_workforce"
  | "current_employer"
  | "agency_worker"
  | "character"
  | "chaser"
  | "urgent_chaser"
  | "verbal_verification"
  | "clarification"
  | "candidate_consent";

export const TEMPLATE_LABELS: Record<TemplateKind, string> = {
  standard_employment: "Standard employment reference",
  childrens_workforce: "Children's workforce safer recruitment reference",
  current_employer: "Current / most recent employer reference",
  agency_worker: "Agency worker reference",
  character: "Character reference",
  chaser: "Reference chaser",
  urgent_chaser: "Urgent reference chaser",
  verbal_verification: "Verbal verification call script",
  clarification: "Reference clarification request",
  candidate_consent: "Candidate consent request",
};

function greet(ctx: TemplateContext) {
  return `Dear ${ctx.refereeName?.trim() || "Sir or Madam"},`;
}

function signoff(ctx: TemplateContext) {
  return `Kind regards,\n${ctx.senderName?.trim() || ctx.employerName}\n${ctx.employerName}`;
}

const SAFER_QUESTIONS = [
  "Dates of employment and job title held",
  "Reason for leaving",
  "Conduct, reliability and attendance",
  "Any disciplinary or capability proceedings (current or concluded)",
  "Any safeguarding or child-protection concerns, allegations or referrals",
  "Their suitability to work with children and vulnerable young people",
  "Whether you would re-employ them, and if not, why",
];

function saferBlock(): string {
  return SAFER_QUESTIONS.map((q, i) => `  ${i + 1}. ${q}`).join("\n");
}

export function buildTemplate(
  kind: TemplateKind,
  ctx: TemplateContext
): { subject: string; body: string } {
  const c = ctx.candidateName;
  const role = ctx.roleTitle ? ` for the role of ${ctx.roleTitle}` : "";

  switch (kind) {
    case "childrens_workforce":
      return {
        subject: `Safer recruitment reference request — ${c}`,
        body: `${greet(ctx)}

${c} has applied to work with us in a children's residential care setting${role}, and has given consent for us to approach you for a reference. We work to safer recruitment standards (Keeping Children Safe in Education / Working Together principles), so we must ask you to comment specifically on:

${saferBlock()}

If your organisation can only provide a factual reference, please confirm that in writing and we will follow up by telephone to verify suitability. We are responsible for our own safer-recruitment decision; your honest factual account helps us make it safely.

A response within 5 working days would be very much appreciated.

${signoff(ctx)}`,
      };

    case "current_employer":
      return {
        subject: `Reference request (current/most recent employer) — ${c}`,
        body: `${greet(ctx)}

${c} has applied to join us${role} and has consented to us contacting their current/most recent employer. Please could you confirm:

${saferBlock()}

If there is anything you are not able to put in writing, please indicate that and we will arrange a confidential call.

${signoff(ctx)}`,
      };

    case "agency_worker":
      return {
        subject: `Agency worker reference request — ${c}`,
        body: `${greet(ctx)}

${c} has worked through your agency and has applied to join us${role}. As the supplying agency, please confirm: the assignments and dates worked, that pre-engagement checks (identity, DBS/barred list where applicable, references) were completed, any conduct or safeguarding matters, and whether you would place them again.

${signoff(ctx)}`,
      };

    case "character":
      return {
        subject: `Character reference request — ${c}`,
        body: `${greet(ctx)}

${c} has given your name as a personal/character referee${role}. Please could you tell us how long and in what capacity you have known them, and comment on their honesty, reliability and suitability to work with children and vulnerable young people. Please note this is a character reference and does not replace an employment reference.

${signoff(ctx)}`,
      };

    case "chaser":
      return {
        subject: `Reminder: reference request for ${c}`,
        body: `${greet(ctx)}

We recently requested a reference for ${c}${role} and have not yet received your reply. We understand you are busy — a short response covering the points in our original request would be a great help, and lets us progress safely.

Thank you for your time.

${signoff(ctx)}`,
      };

    case "urgent_chaser":
      return {
        subject: `Urgent reminder: reference outstanding for ${c}`,
        body: `${greet(ctx)}

This is a final reminder regarding our outstanding reference request for ${c}${role}. This reference is currently the only check holding up a safer-recruitment decision. If we do not hear from you, we may need to verify suitability by telephone or seek an alternative referee. A reply at your earliest convenience would be appreciated.

${signoff(ctx)}`,
      };

    case "verbal_verification":
      return {
        subject: `Verbal reference verification — call script for ${c}`,
        body: `Verbal verification call script — ${c}

Before the call: confirm you are speaking to ${
          ctx.refereeName?.trim() || "the named referee"
        } and note the date/time and who you spoke to.

Ask and record:
${saferBlock()}

Close by confirming you may record the conversation as part of a safer-recruitment file, and that ${
          ctx.employerName
        } remains responsible for the appointment decision.

Recorded by: ____________________   Date: ____________`,
      };

    case "clarification":
      return {
        subject: `Clarification on your reference for ${c}`,
        body: `${greet(ctx)}

Thank you for your reference for ${c}. To complete our safer-recruitment file we need to clarify a couple of points. Could you please confirm: [insert specific points — e.g. exact dates / reason for leaving / whether you would re-employ]. We appreciate your help.

${signoff(ctx)}`,
      };

    case "candidate_consent":
      return {
        subject: `Consent to request references — ${c}`,
        body: `Reference consent — ${c}

I, ${c}, consent to ${
          ctx.employerName
        } contacting the referees I have provided, including my current/most recent employer where stated, to obtain employment and safer-recruitment references in connection with my application${role}.

I understand:
  • references will be used solely to assess my suitability for the role;
  • ${ctx.employerName} is responsible for its own recruitment decision;
  • I may withdraw consent in writing, though this may affect my application.

Signed: ____________________   Date: ____________`,
      };

    case "standard_employment":
    default:
      return {
        subject: `Reference request — ${c}`,
        body: `${greet(ctx)}

${c} has applied to join us${role} and has consented to us approaching you for a reference. Please could you confirm:

${saferBlock()}

A reply within 5 working days would be appreciated.

${signoff(ctx)}`,
      };
  }
}

// Map a stored ReferenceType to the most appropriate default template.
export function defaultTemplateFor(type: ReferenceType): TemplateKind {
  switch (type) {
    case "Children's workforce reference":
      return "childrens_workforce";
    case "Current employer":
      return "current_employer";
    case "Agency reference":
      return "agency_worker";
    case "Character reference":
      return "character";
    case "Education / training reference":
      return "standard_employment";
    case "Previous employer":
    default:
      return "standard_employment";
  }
}
