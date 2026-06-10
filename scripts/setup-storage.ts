/**
 * Create the private Supabase Storage buckets the app uses.
 *
 * Run once after setting NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY:
 *   npm run storage:setup
 *
 * Buckets are created PRIVATE (public: false). The app never serves objects
 * directly — all access is through server actions that authorize the caller and
 * mint short-lived signed URLs, so no per-object RLS policy is required for the
 * service-role path. Idempotent: existing buckets are left as-is.
 */
import { createClient } from "@supabase/supabase-js";
import { ALL_BUCKETS, MAX_FILE_BYTES, ALLOWED_MIME } from "../lib/storage";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first."
    );
    process.exit(1);
  }
  const supabase = createClient(url, key, {
    auth: { persistSession: false },
  });

  const { data: existing, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.error("Could not list buckets:", listErr.message);
    process.exit(1);
  }
  const have = new Set((existing ?? []).map((b) => b.name));

  for (const name of ALL_BUCKETS) {
    if (have.has(name)) {
      console.log(`= ${name} (already exists)`);
      continue;
    }
    const { error } = await supabase.storage.createBucket(name, {
      public: false,
      fileSizeLimit: MAX_FILE_BYTES,
      allowedMimeTypes: Array.from(ALLOWED_MIME),
    });
    if (error) console.error(`✗ ${name}: ${error.message}`);
    else console.log(`✓ ${name} (created, private)`);
  }
  console.log("Storage setup complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
