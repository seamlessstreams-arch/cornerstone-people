import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

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
