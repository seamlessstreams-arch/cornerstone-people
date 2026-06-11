import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { KENI_SCHEMA_SQL } from "@/lib/db-schema-sql";

// One-time database provisioning endpoint (a deliberate workaround).
//
// When the normal migration path can't run at deploy time (e.g. DIRECT_URL is
// missing on the host), the production database ends up empty and every query —
// including login — fails. This endpoint lets you create the full schema using
// the app's *runtime* connection (DATABASE_URL), which is the one we know works
// once /api/health reports a connection.
//
// Safety:
//  - Disabled unless SETUP_TOKEN is set in the environment.
//  - Requires the caller to present that exact token.
//  - Only ever runs the bundled, idempotent schema (CREATE … ; never DROP).
//  - Re-running is safe: objects that already exist are skipped.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Postgres SQLSTATEs that mean "already there" — safe to skip on re-run.
const ALREADY_EXISTS = /already exists|duplicate|42P07|42710|42P06|42723/i;

function authorise(req: Request): boolean {
  const token = process.env.SETUP_TOKEN;
  if (!token) return false; // endpoint is off unless explicitly enabled
  const provided =
    new URL(req.url).searchParams.get("token") ??
    req.headers.get("x-setup-token") ??
    "";
  return provided.length > 0 && provided === token;
}

async function provision() {
  // Split the generated DDL into individual statements; strip comment lines so
  // each statement runs cleanly through $executeRawUnsafe (one statement each).
  const statements = KENI_SCHEMA_SQL.split(";")
    .map((s) =>
      s
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter((s) => s.length > 0);

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      created++;
    } catch (e) {
      const msg = String((e as { message?: string })?.message ?? e);
      if (ALREADY_EXISTS.test(msg)) skipped++;
      else errors.push(msg.slice(0, 200));
    }
  }

  return { created, skipped, statements: statements.length, errors };
}

export async function POST(req: Request) {
  if (!authorise(req)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          process.env.SETUP_TOKEN
            ? "Invalid or missing setup token."
            : "Provisioning is disabled. Set SETUP_TOKEN in the environment to enable it.",
      },
      { status: 401 },
    );
  }

  try {
    const result = await provision();
    return NextResponse.json(
      { ok: result.errors.length === 0, ...result },
      { status: result.errors.length === 0 ? 200 : 500 },
    );
  } catch (e) {
    // Most likely the runtime can't reach the database at all (check /api/health).
    return NextResponse.json(
      { ok: false, stage: "connection", error: String((e as Error)?.message ?? e).slice(0, 300) },
      { status: 500 },
    );
  }
}
