// Auto-shortlisting for externally sourced candidates.
//
// Pure, rule-based scoring so a recruiter can rank a large licensed candidate
// list against a role's criteria instead of reading every CV. Like the rest of
// the safer-recruitment logic this is advisory only: it ranks and explains, it
// never rejects or hires anyone — a human always decides who to take forward.

export type SourcingCriteria = {
  roleSought?: string | null;
  region?: string | null;
  /** Must-have skills/keywords — exact match scores full, partial scores half. */
  keywords?: string[];
  minExperience?: number | null;
  maxExperience?: number | null;
  /** Education / qualification keywords to look for. */
  education?: string[];
  /** Optional per-dimension weight overrides. */
  weights?: Partial<DimensionWeights>;
};

export type SourcedAttributes = {
  roleSought?: string | null;
  region?: string | null;
  skills?: string | null; // comma-separated
  summary?: string | null;
  experienceLevel?: string | null;
};

export type DimensionWeights = {
  role: number;
  location: number;
  skills: number;
  experience: number;
  education: number;
};

export const DEFAULT_WEIGHTS: DimensionWeights = {
  role: 0.25,
  location: 0.2,
  skills: 0.25,
  experience: 0.2,
  education: 0.1,
};

export type MatchBand = "STRONG" | "POSSIBLE" | "WEAK";

export type DimensionScore = {
  dimension: keyof DimensionWeights;
  score: number;
  weight: number;
};

export type MatchResult = {
  score: number; // 0–100
  band: MatchBand;
  reasons: string[];
  gaps: string[];
  breakdown: DimensionScore[];
};

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

// First integer found in free text like "3 years" / "5+ yrs".
export function parseYears(s: string | null | undefined): number | null {
  const m = /(\d+)/.exec(s ?? "");
  return m ? Number(m[1]) : null;
}

type Dim = { score: number; reason?: string; gap?: string };

function roleDim(c: SourcedAttributes, criteria: SourcingCriteria, haystack: string): Dim {
  const want = norm(criteria.roleSought);
  if (!want) return { score: 100 };
  const candRole = norm(c.roleSought);
  if (candRole && (candRole.includes(want) || want.includes(candRole)))
    return { score: 100, reason: `Role matches "${criteria.roleSought}"` };
  if (haystack.includes(want))
    return { score: 60, reason: `Mentions "${criteria.roleSought}"` };
  return { score: 0, gap: `No clear match for role "${criteria.roleSought}"` };
}

function locationDim(c: SourcedAttributes, criteria: SourcingCriteria): Dim {
  const want = norm(criteria.region);
  if (!want) return { score: 100 };
  const cand = norm(c.region);
  if (cand && (cand.includes(want) || want.includes(cand)))
    return { score: 100, reason: `In ${criteria.region}` };
  const wantParts = want.split(/[,\s]+/).filter(Boolean);
  const candParts = cand.split(/[,\s]+/).filter(Boolean);
  const common = wantParts.filter((p) => candParts.some((cp) => cp.includes(p)));
  if (common.length)
    return {
      score: Math.round((common.length / wantParts.length) * 80),
      reason: `Partly in ${criteria.region}`,
    };
  return { score: 20, gap: `Not in ${criteria.region}` };
}

function skillsDim(c: SourcedAttributes, criteria: SourcingCriteria, haystack: string): Dim {
  const req = (criteria.keywords ?? []).map(norm).filter(Boolean);
  if (!req.length) return { score: 100 };
  const candSkills = norm(c.skills)
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  let pts = 0;
  const has: string[] = [];
  const missing: string[] = [];
  for (const k of req) {
    if (candSkills.includes(k)) {
      pts += 1; // exact
      has.push(k);
    } else if (haystack.includes(k) || candSkills.some((s) => s.includes(k) || k.includes(s))) {
      pts += 0.5; // partial
      has.push(k);
    } else {
      missing.push(k);
    }
  }
  return {
    score: Math.round((100 * pts) / req.length),
    reason: has.length ? `Has: ${has.join(", ")}` : undefined,
    gap: missing.length ? `Missing: ${missing.join(", ")}` : undefined,
  };
}

function experienceDim(c: SourcedAttributes, criteria: SourcingCriteria): Dim {
  const hasMin = typeof criteria.minExperience === "number";
  const hasMax = typeof criteria.maxExperience === "number";
  if (!hasMin && !hasMax) return { score: 100 };
  const years = parseYears(c.experienceLevel);
  if (years === null) return { score: 50, gap: "Experience not stated" };
  const lo = hasMin ? (criteria.minExperience as number) : 0;
  const hi = hasMax ? (criteria.maxExperience as number) : 99;
  if (years >= lo && years <= hi)
    return { score: 100, reason: `${years}y experience fits the brief` };
  if (years < lo)
    return {
      score: Math.max(0, 100 - (lo - years) * 15),
      gap: `${years}y — under the ${lo}y minimum`,
    };
  return {
    score: Math.max(70, 100 - (years - hi) * 5),
    reason: `${years}y (above the ${hi}y target)`,
  };
}

function educationDim(criteria: SourcingCriteria, haystack: string): Dim {
  const edu = (criteria.education ?? []).map(norm).filter(Boolean);
  if (!edu.length) return { score: 100 };
  const matches = edu.filter((e) => haystack.includes(e));
  if (!matches.length) return { score: 50, gap: "No education/qualification match" };
  return {
    score: Math.round((100 * matches.length) / edu.length),
    reason: `Education: ${matches.join(", ")}`,
  };
}

// Advisory, weighted, rule-based scorer. Ranks and explains — never accepts or
// rejects. Each dimension scores 0–100; the overall is a weighted average, and
// a dimension with no criteria scores full marks (it doesn't drag the result).
export function scoreCandidate(
  c: SourcedAttributes,
  criteria: SourcingCriteria,
): MatchResult {
  const weights = { ...DEFAULT_WEIGHTS, ...(criteria.weights ?? {}) };
  const haystack = [c.roleSought, c.skills, c.summary, c.experienceLevel]
    .map(norm)
    .join(" • ");

  const dims: Record<keyof DimensionWeights, Dim> = {
    role: roleDim(c, criteria, haystack),
    location: locationDim(c, criteria),
    skills: skillsDim(c, criteria, haystack),
    experience: experienceDim(c, criteria),
    education: educationDim(criteria, haystack),
  };

  const reasons: string[] = [];
  const gaps: string[] = [];
  const breakdown: DimensionScore[] = [];
  let weighted = 0;
  let totalWeight = 0;
  for (const key of Object.keys(weights) as (keyof DimensionWeights)[]) {
    const d = dims[key];
    const w = weights[key];
    breakdown.push({ dimension: key, score: d.score, weight: w });
    weighted += d.score * w;
    totalWeight += w;
    if (d.reason) reasons.push(d.reason);
    if (d.gap) gaps.push(d.gap);
  }

  const score = Math.max(
    0,
    Math.min(100, Math.round(totalWeight ? weighted / totalWeight : 0)),
  );
  const band: MatchBand = score >= 70 ? "STRONG" : score >= 40 ? "POSSIBLE" : "WEAK";

  return { score, band, reasons, gaps, breakdown };
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

// ---------------------------------------------------------------------------
// CV-Library alert-email / listing parser
//
// CV-Library "matching candidate" alerts (and the saved listing the recruiter
// receives under their own licensed account) list each candidate as a labelled
// block: a name, a "NN% Match" line, then Location / Job Title / Desired Role /
// Skills / CV Keywords. We extract the non-contact fields only — names yes,
// contact details never.
// ---------------------------------------------------------------------------

const CVL_LABELS = new Set([
  "location",
  "willing to travel",
  "salary",
  "willing to relocate",
  "job title",
  "uk driving licence",
  "desired role",
  "job type",
  "date available",
  "view cv",
  "add note | select",
]);

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE_RE = /\b(?:0\d{9,10}|\+44\d{9,10})\b/g;

function stripContact(s: string): string {
  return s.replace(EMAIL_RE, "").replace(PHONE_RE, "").trim();
}

export function looksLikeCvLibrary(text: string): boolean {
  return (
    /\bview cv\b/i.test(text) ||
    /cv keywords\s*:/i.test(text) ||
    /\d{1,3}%\s*match/i.test(text)
  );
}

export function parseCvLibraryListing(text: string): ParsedSourcedCandidate[] {
  const lines = (text ?? "").split(/\r?\n/).map((l) => l.trim());
  // Anchor each record on its "NN% Match" line.
  const anchors: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^\d{1,3}%\s*match$/i.test(lines[i])) anchors.push(i);
  }

  const valueAfter = (block: string[], label: string): string => {
    for (let i = 0; i < block.length; i++) {
      if (block[i].toLowerCase() === label && i + 1 < block.length)
        return block[i + 1].trim();
    }
    return "";
  };
  const valueWithPrefix = (block: string[], pfx: RegExp): string => {
    for (const b of block) {
      const m = b.match(pfx);
      if (m) return b.slice(m[0].length).trim();
    }
    return "";
  };
  const cleanSummary = (s: string): string => {
    let out = stripContact(s);
    for (const marker of [
      "PROFESSIONAL SUMMARY",
      "PERSONAL STATEMENT",
      "PROFESSIONAL BACKGROUND",
      "Professional background",
      "Professional Summary",
      "Personal Statement",
    ]) {
      const idx = out.indexOf(marker);
      if (idx !== -1) {
        out = out.slice(idx + marker.length).replace(/^[\s:–-]+/, "");
        break;
      }
    }
    return out.replace(/\s+/g, " ").slice(0, 280).trim();
  };

  const out: ParsedSourcedCandidate[] = [];
  for (let a = 0; a < anchors.length; a++) {
    const idx = anchors[a];
    // Name = nearest preceding non-empty line that isn't a label.
    let name = "";
    for (let j = idx - 1; j >= 0; j--) {
      const L = lines[j];
      if (!L) continue;
      if (CVL_LABELS.has(L.toLowerCase())) continue;
      if (/^\d{1,3}%\s*match$/i.test(L)) break;
      if (/^profile\/cv last updated/i.test(L)) continue;
      name = L;
      break;
    }
    if (!name || EMAIL_RE.test(name)) continue;
    EMAIL_RE.lastIndex = 0;

    const end = a + 1 < anchors.length ? anchors[a + 1] : lines.length;
    // Trim the trailing name of the *next* record out of this block.
    const block = lines.slice(idx + 1, end);

    const loc = valueAfter(block, "location");
    const region = loc.includes(",") ? loc.split(",").pop()!.trim() : loc;
    const role =
      valueAfter(block, "job title") || valueAfter(block, "desired role");
    const skills = stripContact(valueWithPrefix(block, /skills\s*:/i));
    const summary = cleanSummary(valueWithPrefix(block, /cv keywords\s*:/i));

    out.push({
      name,
      profileUrl: null,
      region: region || null,
      roleSought: role || null,
      experienceLevel: null,
      skills: skills || null,
      summary: (loc ? `${loc} — ${summary}` : summary).slice(0, 300) || null,
    });
  }
  return out;
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
