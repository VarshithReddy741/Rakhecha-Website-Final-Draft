// Uploads a video file and switches the given heroSlide document to
// mediaType: "video", keeping its headline/CTA/order untouched. Re-run with
// a different path to replace the video later; the Studio field can also be
// updated directly without this script.
import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

function requireEnv(name: "PUBLIC_SANITY_PROJECT_ID" | "PUBLIC_SANITY_DATASET" | "SANITY_MIGRATION_TOKEN"): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name} (see .env.example)`);
  return value;
}

const inputPath = resolve(process.argv[2] ?? "");
const slideId = process.argv[3] ?? "heroSlide-invest-today";
if (!process.argv[2]) {
  throw new Error("Usage: tsx scripts/set-hero-slide-video.ts /path/to/video.mp4 [heroSlide-doc-id]");
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
    contentType: "video/mp4",
  });

  await client
    .patch(slideId)
    .set({
      mediaType: "video",
      video: { _type: "file", asset: { _type: "reference", _ref: asset._id } },
    })
    .commit();

  console.log(`Video uploaded and assigned to ${slideId}: ${asset.url}`);
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
