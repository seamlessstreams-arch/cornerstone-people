import { requireEmployer } from "@/lib/auth";
import { staffFileIndex, type StaffFileCheck } from "@/lib/safer-recruitment-data";
import { SR_STAGE_LABELS, type SrStage } from "@/lib/constants";

export const dynamic = "force-dynamic";

const ELIGIBILITY_LABELS: Record<string, string> = {
  NOT_ELIGIBLE: "Not eligible",
  CONDITIONAL: "Conditional",
  EXCEPTIONAL_SUPERVISED_ONLY: "Exceptional — supervised",
  CLEARED: "Cleared",
};

function csvCell(v: string): string {
  const s = v ?? "";
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function check(c: StaffFileCheck): string {
  return `${c.ok ? "Yes" : "No"}${c.detail ? ` (${c.detail})` : ""}`;
}

// CSV export of the Single Central Record, scoped to the signed-in employer.
export async function GET() {
  const { employer } = await requireEmployer();
  const rows = await staffFileIndex(employer.id);

  const header = [
    "Candidate",
    "Stage",
    "Compliance",
    "Start eligibility",
    "Identity",
    "Right to work",
    "DBS",
    "Barred list",
    "References",
    "Employment gaps",
    "Qualifications",
    "Self-declaration",
    "Health",
    "Outstanding",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.name,
        SR_STAGE_LABELS[r.stage as SrStage] ?? r.stage,
        r.compliance.rag,
        ELIGIBILITY_LABELS[r.compliance.startEligibility] ?? r.compliance.startEligibility,
        check(r.identity),
        check(r.rightToWork),
        check(r.dbs),
        check(r.barredList),
        check(r.references),
        check(r.employmentGaps),
        check(r.qualifications),
        check(r.selfDeclaration),
        check(r.health),
        r.missing.join("; "),
      ]
        .map((x) => csvCell(String(x)))
        .join(",")
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="single-central-record-${today}.csv"`,
    },
  });
}
