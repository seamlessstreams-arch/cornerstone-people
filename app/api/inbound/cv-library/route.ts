import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseCvLibraryListing } from "@/lib/sourcing";
import { logAudit } from "@/lib/audit";

// Inbound endpoint for forwarded CV-Library alert emails.
//
// Point an inbound-email service (e.g. SendGrid/Postmark inbound parse, or a
// Gmail forward rule) at this URL. It parses the email's candidate listing into
// the Talent Pipeline — names + role/region/skills only, NEVER contact details.
//
// Security: disabled unless INBOUND_EMAIL_TOKEN is set; the caller must present
// that token, and name the target employer. (Single-tenant by design; revisit
// per-employer inbound addresses when multi-tenant.)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_IMPORT = 2000;

function authorise(req: Request, params: URLSearchParams): boolean {
  const token = process.env.INBOUND_EMAIL_TOKEN;
  if (!token) return false;
  const provided =
    params.get("token") ?? req.headers.get("x-inbound-token") ?? "";
  return provided.length > 0 && provided === token;
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  if (!authorise(req, url.searchParams)) {
    return NextResponse.json(
      {
        ok: false,
        error: process.env.INBOUND_EMAIL_TOKEN
          ? "Invalid or missing inbound token."
          : "Inbound email is disabled. Set INBOUND_EMAIL_TOKEN to enable it.",
      },
      { status: 401 },
    );
  }

  // Accept JSON {employerId, body} or a form post (text/body field from an
  // inbound-parse provider).
  let employerId = url.searchParams.get("employerId") ?? "";
  let body = "";
  const ctype = req.headers.get("content-type") ?? "";
  try {
    if (ctype.includes("application/json")) {
      const j = (await req.json()) as { employerId?: string; body?: string; text?: string };
      employerId = employerId || j.employerId || "";
      body = j.body ?? j.text ?? "";
    } else {
      const fd = await req.formData();
      employerId = employerId || String(fd.get("employerId") ?? "");
      body = String(fd.get("text") ?? fd.get("body") ?? fd.get("email") ?? "");
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Could not read body." }, { status: 400 });
  }

  if (!employerId || !body.trim()) {
    return NextResponse.json(
      { ok: false, error: "Missing employerId or email body." },
      { status: 400 },
    );
  }

  const employer = await prisma.employer.findUnique({ where: { id: employerId } });
  if (!employer) {
    return NextResponse.json({ ok: false, error: "Unknown employer." }, { status: 404 });
  }

  const rows = parseCvLibraryListing(body).slice(0, MAX_IMPORT);
  if (rows.length === 0) {
    return NextResponse.json({ ok: true, imported: 0, note: "No candidates found in email." });
  }

  await prisma.talentProspect.createMany({
    data: rows.map((r) => ({
      employerId,
      name: r.name,
      source: "CV-Library (email)",
      profileUrl: r.profileUrl,
      region: r.region,
      roleSought: r.roleSought,
      experienceLevel: r.experienceLevel,
      skills: r.skills,
      summary: r.summary,
    })),
  });
  await logAudit({
    actor: null,
    action: "TALENT_PROSPECTS_IMPORTED",
    entityType: "Employer",
    entityId: employerId,
    summary: `Imported ${rows.length} candidates from a forwarded CV-Library email (no contact details)`,
    meta: { viaInboundEmail: true },
  });

  return NextResponse.json({ ok: true, imported: rows.length });
}
