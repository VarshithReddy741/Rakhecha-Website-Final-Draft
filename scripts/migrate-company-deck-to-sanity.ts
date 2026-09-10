// Uploads the supplied company deck and assigns it to the singleton Site
// Settings document. Re-run with a replacement PDF whenever needed; the
// Studio field can also be updated directly without this script.
import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

function requireEnv(name: "PUBLIC_SANITY_PROJECT_ID" | "PUBLIC_SANITY_DATASET" | "SANITY_MIGRATION_TOKEN"): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name} (see .env.example)`);
  return value;
}

const inputPath = resolve(process.argv[2] ?? "");
if (!process.argv[2]) {
  throw new Error("Usage: tsx scripts/migrate-company-deck-to-sanity.ts /path/to/company-deck.pdf");
}

const client = createClient({
  projectId: requireEnv("PUBLIC_SANITY_PROJECT_ID"),
  dataset: requireEnv("PUBLIC_SANITY_DATASET"),
  apiVersion: "2024-01-01",
  token: requireEnv("SANITY_MIGRATION_TOKEN"),
  useCdn: false,
});

async function migrate() {
  const asset = await client.assets.upload("file", readFileSync(inputPath), {
    filename: basename(inputPath),
    contentType: "application/pdf",
  });

  await client.createOrReplace({
    _id: "siteSettings",
    _type: "siteSettings",
    companyDeck: { _type: "file", asset: { _type: "reference", _ref: asset._id } },
  });

  console.log(`Company deck uploaded and assigned: ${asset.url}`);
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
