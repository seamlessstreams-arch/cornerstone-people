/**
 * End-to-end Supabase Storage connectivity check.
 *
 *   npm run storage:check
 *
 * Verifies the service-role connection by: listing buckets, uploading a tiny
 * object to candidate-cvs, minting a signed URL, fetching it back, and deleting
 * the object. Exits non-zero on any failure. Safe to run repeatedly — it cleans
 * up after itself and writes only to a throwaway path.
 */
import { createClient } from "@supabase/supabase-js";
import { BUCKETS } from "../lib/storage";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  console.log("→ listing buckets…");
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) throw listErr;
  const names = (buckets ?? []).map((b) => b.name);
  console.log("  found:", names.join(", ") || "(none)");
  if (!names.includes(BUCKETS.candidateCvs)) {
    console.error(
      `  ✗ bucket "${BUCKETS.candidateCvs}" missing — run "npm run storage:setup" first.`
    );
    process.exit(1);
  }

  const path = `__healthcheck__/${Date.now()}.txt`;
  const body = new TextEncoder().encode("keni storage ok");

  console.log("→ uploading test object…");
  const up = await supabase.storage.from(BUCKETS.candidateCvs).upload(path, body, {
    contentType: "text/plain",
    upsert: true,
  });
  if (up.error) throw up.error;

  console.log("→ creating signed URL…");
  const signed = await supabase.storage.from(BUCKETS.candidateCvs).createSignedUrl(path, 60);
  if (signed.error) throw signed.error;

  console.log("→ fetching via signed URL…");
  const res = await fetch(signed.data.signedUrl);
  const text = await res.text();
  if (!text.includes("storage ok")) throw new Error("Signed URL did not return the object.");

  console.log("→ deleting test object…");
  const del = await supabase.storage.from(BUCKETS.candidateCvs).remove([path]);
  if (del.error) throw del.error;

  console.log("\n✓ Supabase Storage is connected and working.");
}

main().catch((e) => {
  console.error("\n✗ Storage check failed:", e.message ?? e);
  process.exit(1);
});
