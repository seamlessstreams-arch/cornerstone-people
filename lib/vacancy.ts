// Vacancy-setup generator (rule-based, no AI required).
//
// From a position + the home's profile, produces the Stage 1 outputs: a
// safeguarding-aware advert, a job description, a person specification and a
// safer-recruitment checklist. Templates a human reviews and adapts — it does
// not post anything or make decisions.

export type VacancyInputs = {
  title: string;
  region?: string | null;
  shiftPattern?: string | null;
  companyName: string;
  ethos?: string | null;
  childrenSupported?: string | null;
};

export type VacancyPack = {
  advert: string;
  safeguardingStatement: string;
  jobDescription: { summary: string; responsibilities: string[] };
  personSpec: { essential: string[]; desirable: string[] };
  checklist: string[];
};

export function vacancyPack(i: VacancyInputs): VacancyPack {
  const title = i.title.trim() || "Residential Support Worker";
  const where = i.region ? ` in ${i.region}` : "";
  const shift = i.shiftPattern ? ` (${i.shiftPattern})` : "";
  const ethos = i.ethos?.trim();
  const children = i.childrenSupported?.trim();

  const safeguardingStatement =
    `${i.companyName} is committed to safeguarding and promoting the welfare of ` +
    `children and young people, and expects all staff and volunteers to share ` +
    `this commitment. This post is exempt from the Rehabilitation of Offenders ` +
    `Act 1974 and is subject to an enhanced DBS check with a children's barred ` +
    `list check, satisfactory references and full pre-employment checks. We ` +
    `follow safer-recruitment practices and an online search may form part of ` +
    `our due diligence.`;

  const advert = [
    `${title}${where}${shift}`,
    `${i.companyName} is looking for a ${title} to join our children's home${where}.`,
    children ? `You'll support ${children}.` : null,
    ethos ? `Our approach: ${ethos}` : null,
    `You'll help create a safe, nurturing, therapeutic home where young people ` +
      `can thrive — building trusting relationships, supporting daily routines, ` +
      `education and health, and keeping them safe.`,
    `We welcome people new to the sector who share our values, as well as ` +
      `experienced practitioners. Full induction and training (including a Level ` +
      `3 Diploma route) are provided.`,
    safeguardingStatement,
  ]
    .filter(Boolean)
    .join("\n\n");

  const jobDescription = {
    summary:
      `To provide safe, consistent, therapeutic care to children and young ` +
      `people living in the home, promoting their welfare, development and ` +
      `safety in line with their care plans and the home's ethos.`,
    responsibilities: [
      "Build trusting, professional relationships with young people.",
      "Provide day-to-day care, routines and support with education and health.",
      "Keep children safe: recognise, record and escalate safeguarding concerns.",
      "Follow individual care plans, risk assessments and behaviour-support plans.",
      "Manage challenging behaviour safely and relationally; support de-escalation.",
      "Support young people who go missing and on their return.",
      "Maintain accurate, timely records and contribute to reviews.",
      "Work shift patterns including evenings, weekends and sleep-ins.",
      "Work within policies, professional boundaries and statutory guidance.",
    ],
  };

  const personSpec = {
    essential: [
      "A genuine commitment to safeguarding and the welfare of children.",
      "Warmth, resilience and emotional maturity; able to stay calm under pressure.",
      "Good communication and the ability to keep clear records.",
      "Willingness to work shifts, including sleep-ins.",
      "Willingness to complete the Level 3 Diploma for Residential Childcare.",
      "Eligibility for an enhanced DBS check and the right to work in the UK.",
    ],
    desirable: [
      "Experience supporting children with trauma, attachment or EBD/SEMH needs.",
      "Level 3 Diploma for Residential Childcare (or equivalent).",
      "A full UK driving licence.",
      "Understanding of trauma-informed practice and PACE.",
    ],
  };

  const checklist = [
    "Advert carries a safeguarding statement.",
    "Job description and person specification define suitability.",
    "Confirm the role is regulated activity (enhanced DBS + barred list).",
    "Confirm the required qualification level (Level 3 route).",
    "Agree the interview panel.",
    "At least one panel member has safer-recruitment training.",
    "Prepare the interview scoring matrix and safeguarding questions.",
  ];

  return { advert, safeguardingStatement, jobDescription, personSpec, checklist };
}
