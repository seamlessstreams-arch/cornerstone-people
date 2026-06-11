import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Diagnostic endpoint: confirms the production runtime can reach and query the
// database. Returns the precise Prisma error (name/code/message) on failure so
// connection problems can be diagnosed without digging through runtime logs.
// It never echoes the connection string, password, or any secret.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function describe(e: unknown) {
  const err = e as { name?: string; code?: string; message?: string };
  return {
    name: err?.name ?? "Error",
    code: err?.code ?? null, // Prisma codes: P1000 auth, P1001 unreachable, P2021 missing table, ...
    message: String(err?.message ?? e).slice(0, 600),
  };
}

export async function GET() {
  // Stage 1: can we open a connection and run a trivial query?
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    return NextResponse.json(
      { ok: false, stage: "connection", error: describe(e) },
      { status: 500 },
    );
  }

  // Stage 2: does the schema exist (are migrations applied)?
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({ ok: true, connection: "ok", schema: "ok", userCount });
  } catch (e) {
    return NextResponse.json(
      { ok: false, stage: "schema", error: describe(e) },
      { status: 500 },
    );
  }
}
