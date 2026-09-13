// One-off migration: seeds Sanity with `heroSlide` (homepage hero
// slideshow) documents, transcribed from what was previously hardcoded in
// index.astro, uploading each slide's current static image as a real
// Sanity asset.
//
// Idempotent: uses deterministic `_id`s via createOrReplace, safe to re-run.
// Requires an EDITOR-level Sanity token in SANITY_MIGRATION_TOKEN env var,
// plus PUBLIC_SANITY_PROJECT_ID/PUBLIC_SANITY_DATASET (see .env.example).
import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

const IMAGES_DIR = join(__dirname, "..", "src", "assets", "images");
const uploadedImages = new Map<string, string>(); // filename -> asset _id

async function uploadImage(filename: string): Promise<{ _type: "image"; asset: { _type: "reference"; _ref: string } }> {
  let assetId = uploadedImages.get(filename);
  if (!assetId) {
    const buffer = readFileSync(join(IMAGES_DIR, filename));
    const asset = await client.assets.upload("image", buffer, { filename });
    assetId = asset._id;
    uploadedImages.set(filename, assetId);
    console.log(`  uploaded ${filename}`);
  }
  return { _type: "image", asset: { _type: "reference", _ref: assetId } };
}

const heroSlides = [
  {
    id: "invest-today",
    title: "Where Trust Meets Expertise",
    headline: "Where Trust Meets Expertise",
    image: "Homepage image web.png",
    mobileImage: "Home page moblie.png",
    ctaText: "Contact Us",
    ctaLink: "/contact-us/",
    order: 1,
  },
  {
    id: "nri-growth-story",
    title: "Invest in India's Growth Story",
    headline: "Invest in India's Growth Story",
    image: "NRI services web.png",
    ctaText: "Contact Us",
    ctaLink: "/contact-us/",
    order: 2,
  },
];

async function migrate() {
  console.log("Uploading images and building hero slide documents...");
  const tx = client.transaction();

  for (const slide of heroSlides) {
    const image = await uploadImage(slide.image);
    const mobileImage = slide.mobileImage ? await uploadImage(slide.mobileImage) : undefined;
    tx.createOrReplace({
      _type: "heroSlide",
      _id: "heroSlide-" + slide.id,
      title: slide.title,
      headline: slide.headline,
      mediaType: "image",
      image,
      ...(mobileImage ? { mobileImage } : {}),
      ctaText: slide.ctaText,
      ctaLink: slide.ctaLink,
      order: slide.order,
    });
  }
  console.log(`Queued ${heroSlides.length} hero slides`);

  await tx.commit();
  console.log("Migration complete.");
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
