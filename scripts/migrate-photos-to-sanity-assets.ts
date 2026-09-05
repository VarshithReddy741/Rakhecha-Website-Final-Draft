// One-off migration: every "photo" field across founder/article/pastEvent/
// upcomingEvent/video documents used to be a plain pasted-URL string (no
// upload button in Studio). This script downloads whatever's currently
// pasted into each of those fields, re-uploads it as a real Sanity image
// asset, and patches the document to reference that asset instead.
//
// Run `--dry-run` (default) first to see what it would do with no writes.
// Back up the dataset before `--apply`:
//   npx sanity dataset export production backup.tar.gz
//
// Requires an EDITOR-level Sanity token in SANITY_MIGRATION_TOKEN env var,
// plus PUBLIC_SANITY_PROJECT_ID/PUBLIC_SANITY_DATASET (see .env.example).
import { createClient } from "@sanity/client";

function requireEnv(name: "PUBLIC_SANITY_PROJECT_ID" | "PUBLIC_SANITY_DATASET" | "SANITY_MIGRATION_TOKEN"): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name} (see .env.example)`);
  return value;
}

const client = createClient({
  projectId: requireEnv("PUBLIC_SANITY_PROJECT_ID"),
  dataset: requireEnv("PUBLIC_SANITY_DATASET"),
  apiVersion: "2024-01-01",
  token: requireEnv("SANITY_MIGRATION_TOKEN"),
  useCdn: false,
});

const APPLY = process.argv.includes("--apply");

interface FieldTarget {
  type: string;
  field: string;
}

const TARGETS: FieldTarget[] = [
  { type: "founder", field: "photoUrl" },
  { type: "article", field: "imageUrl" },
  { type: "article", field: "authorPhotoUrl" },
  { type: "pastEvent", field: "imageUrl" },
  { type: "upcomingEvent", field: "imageUrl" },
  { type: "video", field: "thumbnailUrl" },
];

function filenameFromUrl(url: string, contentType: string | null): string {
  const fromUrl = url.split("?")[0].split("/").pop();
  if (fromUrl && /\.[a-z0-9]+$/i.test(fromUrl)) return fromUrl;
  const ext = contentType?.split("/")[1]?.split(";")[0] ?? "jpg";
  return `migrated.${ext}`;
}

async function migrateField({ type, field }: FieldTarget) {
  const docs = await client.fetch<{ _id: string; value: unknown }[]>(
    `*[_type == $type && defined(${field})]{ _id, "value": ${field} }`,
    { type },
  );

  const pending = docs.filter((d) => typeof d.value === "string" && d.value.length > 0);
  console.log(`\n${type}.${field}: ${docs.length} documents have a value, ${pending.length} are still plain URL strings.`);

  let migrated = 0;
  let failed = 0;

  for (const doc of pending) {
    const url = doc.value as string;
    if (!APPLY) {
      console.log(`  [dry-run] would migrate ${doc._id} <- ${url}`);
      continue;
    }
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
      const contentType = response.headers.get("content-type");
      const buffer = Buffer.from(await response.arrayBuffer());
      const asset = await client.assets.upload("image", buffer, { filename: filenameFromUrl(url, contentType) });
      await client
        .patch(doc._id)
        .set({ [field]: { _type: "image", asset: { _type: "reference", _ref: asset._id } } })
        .commit();
      console.log(`  migrated ${doc._id}`);
      migrated++;
    } catch (err) {
      console.error(`  FAILED ${doc._id} (${url}):`, err instanceof Error ? err.message : err);
      failed++;
    }
  }

  if (APPLY) console.log(`  -> ${migrated} migrated, ${failed} failed`);
}

async function main() {
  console.log(APPLY ? "Running in APPLY mode — this will write to the dataset." : "Running in DRY-RUN mode — no writes will happen. Pass --apply to actually migrate.");
  for (const target of TARGETS) {
    await migrateField(target);
  }
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
