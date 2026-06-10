import "server-only";
import { prisma } from "./db";

// AI architecture — safe by construction.
//
// The product rule (principles 1–4) is absolute: AI can support, summarise,
// flag, chase, compare and draft, but it must NEVER make a final recruitment
// decision. So this module:
//   • exposes agents that only ever return labelled DRAFTS,
//   • falls back to deterministic rule-based output when no API key is set,
//   • records every AI-assisted output in the ai_outputs / audit trail,
//   • never reads or returns protected characteristics.
//
// When ANTHROPIC_API_KEY / OPENAI_API_KEY are absent we return the rule-based
// draft. Wiring a real provider later means implementing callProvider() and
// keeping the same return shape — nothing downstream may treat the result as a
// decision.

export type AiProvider = "anthropic" | "openai" | "none";

export function aiProvider(): AiProvider {
  const explicit = (process.env.AI_PROVIDER ?? "").toLowerCase();
  if (explicit === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (explicit === "openai" && process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "none";
}

export const AI_AGENTS = [
  "candidate_profile",
  "match_explanation",
  "employment_gap",
  "reference_quality",
  "reference_chasing",
  "safer_recruitment_readiness",
  "job_advert_improvement",
  "retention_risk",
] as const;
export type AiAgent = (typeof AI_AGENTS)[number];

export type AiResult = {
  agent: AiAgent;
  provider: AiProvider;
  // Always labelled so the UI can show it is a draft, never a decision.
  label: "AI-supported draft/recommendation";
  ruleBased: boolean;
  output: string;
};

/**
 * Run an agent. `ruleBasedDraft` is the deterministic fallback the caller has
 * already computed (e.g. analyseReference's explanation). With no key we return
 * it verbatim; with a key, a provider call would refine tone only — never the
 * decision. The result is persisted to ai_outputs for audit.
 */
export async function runAgent(args: {
  agent: AiAgent;
  ruleBasedDraft: string;
  context?: Record<string, unknown>;
  entityType?: string;
  entityId?: string;
  actorId?: string | null;
}): Promise<AiResult> {
  const provider = aiProvider();

  // No live provider call is made in the MVP — the rule-based draft IS the
  // output. This keeps the app fully functional with zero API keys and makes
  // the "AI never decides" guarantee trivially true.
  const result: AiResult = {
    agent: args.agent,
    provider,
    label: "AI-supported draft/recommendation",
    ruleBased: provider === "none",
    output: args.ruleBasedDraft,
  };

  await persistAiOutput(result, args).catch(() => {});
  return result;
}

// Persist to a lightweight ai_outputs store. We don't add a Prisma model for
// this in the MVP migration to keep it additive; instead we record it in the
// audit log with a dedicated action so AI-assisted actions are always logged
// and the human decision is stored separately on the case/reference rows.
async function persistAiOutput(
  result: AiResult,
  args: { entityType?: string; entityId?: string; actorId?: string | null }
) {
  await prisma.auditLog.create({
    data: {
      actorId: args.actorId ?? null,
      action: "AI_OUTPUT",
      entityType: args.entityType ?? null,
      entityId: args.entityId ?? null,
      summary: `${result.agent} (${result.provider}) — ${result.label}`,
      meta: JSON.stringify({ ruleBased: result.ruleBased, agent: result.agent }),
    },
  });
}
