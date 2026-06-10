import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { analyseReference } from "../lib/safer-recruitment";

const prisma = new PrismaClient();

// Cold-start plan (brief §8): one dense region, supply side seeded first, so a
// home's first session shows real, fit, pre-verified people — never an empty feed.
const REGION = "Greater Manchester";

const FIRST_NAMES = [
  "Alex", "Sam", "Jordan", "Priya", "Chris", "Morgan", "Dani", "Tom",
  "Aisha", "Leah", "Ben", "Nadia", "Kofi", "Ella", "Ryan", "Maya",
  "Owen", "Sara", "Liam", "Grace",
];
const LAST_NAMES = [
  "Morgan", "Patel", "Khan", "Walsh", "Okafor", "Bennett", "Hughes",
  "Ahmed", "Clarke", "Reid",
];

const SHIFTS = ["Days only", "Nights only", "Mixed days & nights", "Sleep-ins", "Flexible / bank"];
const YOUNG = ["EBD / SEMH", "Trauma & attachment", "Learning disabilities", "Solo placements", "Sibling groups"];
const EXP = ["1–2 years", "3–5 years", "5+ years", "Senior / management"];
const ROLES = ["Residential Support Worker", "Senior Support Worker", "Team Leader", "Deputy Manager", "Waking Night Worker"];
const VALUES = ["Trauma-informed", "Therapeutic parenting", "PACE", "Restorative practice", "Strengths-based", "Child-centred", "Co-regulation"];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}
function pickN<T>(arr: T[], n: number, offset: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(arr[(offset + i * 3) % arr.length]);
  return Array.from(new Set(out));
}

async function main() {
  console.log("Resetting demo data…");
  // Order matters for FK constraints.
  await prisma.message.deleteMany();
  await prisma.referenceRequest.deleteMany();
  await prisma.employmentGapReview.deleteMany();
  await prisma.dbsCheck.deleteMany();
  await prisma.saferRecruitmentCase.deleteMany();
  await prisma.referenceBankEntry.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.match.deleteMany();
  await prisma.interest.deleteMany();
  await prisma.block.deleteMany();
  await prisma.reference.deleteMany();
  await prisma.position.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.employer.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // --- Supply side first: 20 candidates, most with verified references -----
  console.log("Seeding candidates (supply side)…");
  const candidates: { id: string; fullName: string; roleType: string }[] = [];
  for (let i = 0; i < 20; i++) {
    const first = pick(FIRST_NAMES, i);
    const last = pick(LAST_NAMES, i * 7);
    const email = `candidate${i + 1}@example.com`;
    // Most candidates are anonymous (the default); a few choose Open mode.
    const mode = i % 4 === 0 ? "OPEN" : "ANONYMOUS";

    const candidate = await prisma.candidate.create({
      data: {
        visibilityMode: mode,
        region: REGION,
        shiftPattern: pick(SHIFTS, i),
        youngPeopleType: pick(YOUNG, i * 2),
        experienceLevel: pick(EXP, i),
        roleType: pick(ROLES, i),
        valuesTags: pickN(VALUES, 3, i).join(", "),
        fullName: `${first} ${last}`,
        employmentHistory: `${pick(EXP, i)} in residential childcare across two homes in the North West.`,
        narrative:
          "I came into this work because I had a key worker who changed things for me. I lead with patience and consistency.",
        user: {
          create: { email, passwordHash, role: "CANDIDATE" },
        },
      },
    });
    candidates.push({
      id: candidate.id,
      fullName: `${first} ${last}`,
      roleType: pick(ROLES, i),
    });

    // 16 of 20 candidates are fully verified (2 references); a few are mid-way.
    const verifiedRefs = i < 16 ? 2 : i < 18 ? 1 : 0;
    for (let r = 0; r < 2; r++) {
      await prisma.reference.create({
        data: {
          candidateId: candidate.id,
          refereeName: `Referee ${r + 1} for ${first}`,
          refereeEmail: `referee${i + 1}_${r + 1}@example.com`,
          relationship: r === 0 ? "Former line manager" : "Registered manager",
          status: r < verifiedRefs ? "VERIFIED" : "PENDING",
          verifiedAt: r < verifiedRefs ? new Date() : null,
          token: randomBytes(24).toString("hex"),
        },
      });
    }
  }

  // --- Then a couple of homes onboard into a stocked pool ------------------
  console.log("Seeding homes (demand side)…");
  const homes = [
    {
      email: "home1@example.com",
      companyName: "Oakfield Children's Home",
      ethos: "Therapeutic, trauma-informed care in a family-style setting.",
      childrenSupported: "EBD / SEMH, ages 8–17, solo and dual placements.",
      placementPicture: "Two homes, 3–4 beds each, low staff turnover.",
      shiftPattern: "Mixed days & nights",
      supportOffered: "Full induction, clinical supervision, Level 3/4 funded.",
      compensation: "£26k–£30k + £60/sleep-in. Enhanced bank rates.",
      sellingPoints: "Ofsted Good. Genuine progression to senior in 18 months.",
    },
    {
      email: "home2@example.com",
      companyName: "Brookhaven Care",
      ethos: "PACE-led, restorative practice at the core of everything.",
      childrenSupported: "Trauma & attachment, sibling groups.",
      placementPicture: "Single 4-bed home, embedded therapist on site.",
      shiftPattern: "Sleep-ins",
      supportOffered: "Weekly reflective practice, DDP training pathway.",
      compensation: "£27k–£31k. Wellbeing days and a 4-on/4-off pattern.",
      sellingPoints: "On-site therapist. Truly small, truly stable team.",
    },
  ];

  const employers: { id: string; companyName: string }[] = [];
  for (const h of homes) {
    const employer = await prisma.employer.create({
      data: {
        companyName: h.companyName,
        region: REGION,
        ethos: h.ethos,
        childrenSupported: h.childrenSupported,
        placementPicture: h.placementPicture,
        shiftPattern: h.shiftPattern,
        supportOffered: h.supportOffered,
        compensation: h.compensation,
        sellingPoints: h.sellingPoints,
        user: { create: { email: h.email, passwordHash, role: "EMPLOYER" } },
      },
    });
    employers.push({ id: employer.id, companyName: employer.companyName });
    await prisma.position.create({
      data: {
        employerId: employer.id,
        title: "Residential Support Worker",
        region: REGION,
        shiftPattern: h.shiftPattern,
        description:
          "Join a settled team supporting young people with complex needs. Experience welcome but values matter most.",
      },
    });
  }

  // --- Safer Recruitment OS demo data --------------------------------------
  // A few candidates match with home1 and progress into pre-employment checks.
  console.log("Seeding safer-recruitment cases…");
  const home1 = employers[0];

  // Reference bank: reusable referee directory for home1.
  const bankSeed = [
    {
      organisationName: "Riverside Children's Services",
      organisationType: "Local authority",
      hrEmail: "references@riverside.gov.uk",
      preferredMethod: "Reference portal",
      portalLink: "https://riverside.gov.uk/references",
      factualOnly: true,
      providesSafeguardingComment: false,
      chasePattern: "7 / 14 / 21 days",
      notes: "Factual only — always follow up by phone for suitability.",
    },
    {
      organisationName: "Brightway Residential",
      organisationType: "Children's home provider",
      hrEmail: "hr@brightway.co.uk",
      refereeName: "Dawn Phillips",
      refereeRole: "Registered Manager",
      preferredMethod: "Email",
      providesSafeguardingComment: true,
      chasePattern: "7 / 14 days",
    },
    {
      organisationName: "St Aidan's College",
      organisationType: "Education / training",
      hrEmail: "registry@staidans.ac.uk",
      preferredMethod: "Email",
      consentFormRequired: true,
    },
    {
      organisationName: "FlexiCare Staffing",
      organisationType: "Agency",
      hrEmail: "compliance@flexicare.co.uk",
      refereeName: "Compliance Team",
      preferredMethod: "Email",
      providesSafeguardingComment: true,
      chasePattern: "3 / 7 days",
    },
    {
      organisationName: "Meadow View Care",
      organisationType: "Children's home provider",
      hrEmail: "people@meadowview.co.uk",
      refereeName: "Imran Saleh",
      refereeRole: "Deputy Manager",
      preferredMethod: "Phone",
      phoneVerificationAccepted: true,
    },
    {
      organisationName: "Northgate Youth Project",
      organisationType: "Youth work",
      hrEmail: "admin@northgateyouth.org",
      preferredMethod: "Email",
      notes: "Character/voluntary referee — not an employment reference.",
    },
  ];
  for (const b of bankSeed) {
    await prisma.referenceBankEntry.create({
      data: { ...b, employerId: home1.id, createdBy: "home1@example.com", updatedBy: "home1@example.com" },
    });
  }

  const now = Date.now();
  const day = 86400000;
  // Three cases at different stages.
  const caseSpecs: {
    candIndex: number;
    stage: string;
    refs: {
      type: string;
      name: string;
      status: string;
      sentDaysAgo?: number;
      receivedDaysAgo?: number;
      responseText?: string;
    }[];
    gapStatus?: string;
    dbsSeen?: boolean;
    riskReview?: boolean;
  }[] = [
    {
      candIndex: 0,
      stage: "REFERENCE_HOLD",
      refs: [
        {
          type: "Current employer",
          name: "Dawn Phillips (Brightway)",
          status: "RECEIVED",
          sentDaysAgo: 12,
          receivedDaysAgo: 4,
          responseText:
            "I confirm she was employed as a Senior Support Worker from March 2019 to date. Conduct and professional integrity excellent; attendance reliable; no safeguarding or child protection concerns; no disciplinary or capability proceedings. Suitable to work with children and vulnerable young people. I would re-employ her.",
        },
        { type: "Previous employer", name: "Riverside Children's Services", status: "SENT", sentDaysAgo: 10 },
      ],
      gapStatus: "ACCEPTED",
      dbsSeen: true,
    },
    {
      candIndex: 1,
      stage: "RM_REVIEW_REQUIRED",
      refs: [
        {
          type: "Previous employer",
          name: "Meadow View Care",
          status: "RECEIVED",
          sentDaysAgo: 20,
          receivedDaysAgo: 9,
          responseText:
            "Employed 2021–2022 as support worker. There was a safeguarding concern raised and the matter was investigated. We would not re-employ.",
        },
      ],
      gapStatus: "CONCERN",
      dbsSeen: false,
      riskReview: true,
    },
    {
      candIndex: 4,
      stage: "CHECKS_IN_PROGRESS",
      refs: [
        { type: "Children's workforce reference", name: "Brightway Residential", status: "DRAFT" },
      ],
      gapStatus: "NEEDS_EXPLANATION",
      dbsSeen: false,
    },
  ];

  for (const spec of caseSpecs) {
    const cand = candidates[spec.candIndex];
    // Form a mutual match first (both directions of interest).
    await prisma.interest.create({
      data: { candidateId: cand.id, employerId: home1.id, direction: "CANDIDATE" },
    });
    await prisma.interest.create({
      data: { candidateId: cand.id, employerId: home1.id, direction: "EMPLOYER" },
    });
    const match = await prisma.match.create({
      data: { candidateId: cand.id, employerId: home1.id },
    });

    const srCase = await prisma.saferRecruitmentCase.create({
      data: {
        matchId: match.id,
        employerId: home1.id,
        candidateId: cand.id,
        stage: spec.stage,
        createdBy: "home1@example.com",
      },
    });

    for (const r of spec.refs) {
      let quality: string | null = null;
      let qualityNotes: string | null = null;
      let concern = false;
      if (r.responseText) {
        const a = analyseReference(r.responseText, { jobTitle: cand.roleType });
        quality = a.status;
        qualityNotes = a.explanation;
        concern = a.concernDetected || a.contradiction;
      }
      await prisma.referenceRequest.create({
        data: {
          caseId: srCase.id,
          referenceType: r.type,
          refereeName: r.name,
          status: r.status,
          sentAt: r.sentDaysAgo ? new Date(now - r.sentDaysAgo * day) : null,
          chaser1At: r.sentDaysAgo ? new Date(now - (r.sentDaysAgo - 7) * day) : null,
          receivedAt: r.receivedDaysAgo ? new Date(now - r.receivedDaysAgo * day) : null,
          responseText: r.responseText ?? null,
          qualityStatus: quality,
          qualityNotes,
          concernFlag: concern,
          createdBy: "home1@example.com",
        },
      });
    }

    if (spec.gapStatus) {
      await prisma.employmentGapReview.create({
        data: {
          caseId: srCase.id,
          status: spec.gapStatus,
          reviewedBy: "home1@example.com",
        },
      });
    }
    await prisma.dbsCheck.create({
      data: {
        caseId: srCase.id,
        status: spec.dbsSeen ? "Clear" : "Pending",
        certificateSeen: !!spec.dbsSeen,
        barredListChecked: !!spec.dbsSeen,
        riskReviewRequired: !!spec.riskReview,
        checkedBy: "home1@example.com",
      },
    });

    await prisma.auditLog.create({
      data: {
        actorEmail: "home1@example.com",
        actorRole: "EMPLOYER",
        action: "SR_CASE_OPENED",
        entityType: "SaferRecruitmentCase",
        entityId: srCase.id,
        summary: `Seeded case for ${cand.fullName} at stage ${spec.stage}`,
      },
    });
  }

  console.log("\nSeed complete.");
  console.log("Demo logins (password: password123):");
  console.log("  Candidate: candidate1@example.com");
  console.log("  Home:      home1@example.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
