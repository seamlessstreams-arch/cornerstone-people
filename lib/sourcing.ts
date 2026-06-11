// Auto-shortlisting for externally sourced candidates.
//
// Pure, rule-based scoring so a recruiter can rank a large licensed candidate
// list against a role's criteria instead of reading every CV. Like the rest of
// the safer-recruitment logic this is advisory only: it ranks and explains, it
// never rejects or hires anyone — a human always decides who to take forward.

export type SourcingCriteria = {
  roleSought?: string | null;
  region?: string | null;
  /** Must-have keywords/skills, lower-cased on input by the caller or here. */
  keywords?: string[];
};

export type SourcedAttributes = {
  roleSought?: string | null;
  region?: string | null;
  skills?: string | null; // comma-separated
  summary?: string | null;
  experienceLevel?: string | null;
};

export type MatchBand = "STRONG" | "POSSIBLE" | "WEAK";

export type MatchResult = {
  score: number; // 0–100
  band: MatchBand;
  reasons: string[];
  gaps: string[];
};

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

// Weightings — role and location dominate; keyword coverage fills the rest.
const W_ROLE = 40;
const W_REGION = 25;
const W_KEYWORDS = 35;

export function scoreCandidate(
  c: SourcedAttributes,
  criteria: SourcingCriteria,
): MatchResult {
  const reasons: string[] = [];
  const gaps: string[] = [];
  let score = 0;

  // The text we scan for keyword/role hits.
  const haystack = [c.roleSought, c.skills, c.summary, c.experienceLevel]
    .map(norm)
    .join(" • ");

  // Role
  const wantRole = norm(criteria.roleSought);
  if (wantRole) {
    const candRole = norm(c.roleSought);
    if (candRole && (candRole.includes(wantRole) || wantRole.includes(candRole))) {
      score += W_ROLE;
      reasons.push(`Role matches "${criteria.roleSought}"`);
    } else if (haystack.includes(wantRole)) {
      score += Math.round(W_ROLE * 0.6);
      reasons.push(`Mentions "${criteria.roleSought}"`);
    } else {
      gaps.push(`No clear match for role "${criteria.roleSought}"`);
    }
  } else {
    // No role filter → don't penalise; treat role weight as neutral credit.
    score += Math.round(W_ROLE * 0.5);
  }

  // Region
  const wantRegion = norm(criteria.region);
  if (wantRegion) {
    if (norm(c.region).includes(wantRegion) || wantRegion.includes(norm(c.region)) && norm(c.region) !== "") {
      score += W_REGION;
      reasons.push(`In ${criteria.region}`);
    } else {
      gaps.push(`Not in ${criteria.region}`);
    }
  } else {
    score += Math.round(W_REGION * 0.5);
  }

  // Keywords
  const keywords = (criteria.keywords ?? [])
    .map((k) => norm(k))
    .filter((k) => k.length > 0);
  if (keywords.length) {
    const hits = keywords.filter((k) => haystack.includes(k));
    const missed = keywords.filter((k) => !haystack.includes(k));
    score += Math.round((W_KEYWORDS * hits.length) / keywords.length);
    if (hits.length) reasons.push(`Has: ${hits.join(", ")}`);
    if (missed.length) gaps.push(`Missing: ${missed.join(", ")}`);
  } else {
    score += Math.round(W_KEYWORDS * 0.5);
  }

  score = Math.max(0, Math.min(100, score));
  const band: MatchBand = score >= 70 ? "STRONG" : score >= 40 ? "POSSIBLE" : "WEAK";

  return { score, band, reasons, gaps };
}

// Parse the pasted bulk list. One candidate per line, fields in this order:
//   Name, Profile URL, Region, Role, Experience, Skills, Summary
// Accepts standard CSV (commas, with "quoted" fields that may contain commas)
// or pipe-delimited. Only Name is required, and there is deliberately no field
// for contact details. A leading header row (first cell "name") is skipped.
export type ParsedSourcedCandidate = {
  name: string;
  profileUrl: string | null;
  region: string | null;
  roleSought: string | null;
  experienceLevel: string | null;
  skills: string | null;
  summary: string | null;
};

// Split a single CSV line into fields, honouring double-quoted values.
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(cur);
      cur = "";
    } else cur += ch;
  }
  fields.push(cur);
  return fields.map((f) => f.trim());
}

export function parseSourcedList(text: string): ParsedSourcedCandidate[] {
  const out: ParsedSourcedCandidate[] = [];
  for (const raw of (text ?? "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const f = line.includes("|")
      ? line.split("|").map((x) => x.trim())
      : splitCsvLine(line);
    const name = f[0] ?? "";
    if (!name) continue;
    // Skip a header row.
    if (name.toLowerCase() === "name") continue;
    const v = (i: number) => (f[i] && f[i].length ? f[i] : null);
    out.push({
      name,
      profileUrl: v(1),
      region: v(2),
      roleSought: v(3),
      experienceLevel: v(4),
      skills: v(5),
      summary: v(6),
    });
  }
  return out;
}
