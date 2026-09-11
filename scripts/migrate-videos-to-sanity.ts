// One-off migration: seeds Sanity with `video` (Knowledge Hub videos tab)
// documents for the "Mutual Funds Sahi Hai" YouTube playlist supplied by
// the user, uploading each video's YouTube thumbnail as a real Sanity
// asset.
//
// The `date` field is required by the schema but no publish dates were
// supplied, so this assigns descending placeholder dates (today, today-1,
// ...) purely to preserve the given display order — edit the real dates
// in Sanity Studio afterward if they matter.
//
// Idempotent: uses deterministic `_id`s via createOrReplace, safe to re-run.
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

const videos = [
  { id: "march-to-invest-mutual-funds", title: "#MarchToInvest with an understanding of Mutual Funds.", youtubeId: "r1qQpXWcDNQ" },
  { id: "what-is-elss", title: "What is an ELSS? | The Smart Way to Save Taxes and Invest", youtubeId: "nke3160rCas" },
  { id: "march-to-invest-sip", title: "#MarchToInvest with small and regular investments in SIP.", youtubeId: "6dJmILRJU7E" },
  { id: "short-term-investment-mf-sahi-hai", title: "Even for a short term investment, Mutual Funds Sahi Hai.", youtubeId: "o5IZ9huD3OM" },
  { id: "right-mix-of-mutual-funds", title: "Make the right investments with the right mix of Mutual Funds.", youtubeId: "bCdojayM3PI" },
  { id: "stay-invested-longer", title: "Stay invested for longer in Mutual Funds to reap maximum benefits.", youtubeId: "LNQEPP2V6nE" },
  { id: "financial-planning-considerations", title: "The important things to consider for a good financial planning.", youtubeId: "TFE-xMOWlQA" },
  { id: "balance-investments-mf-types", title: "Balance your investments in different types of Mutual Funds.", youtubeId: "1XSbjGMHOz8" },
  { id: "different-schemes-different-goals", title: "Different Mutual Fund schemes for different goals.", youtubeId: "TY5BiqOu6jI" },
  { id: "what-are-equity-funds", title: "What are Equity Funds? | Investing in Stock Market via Mutual Funds", youtubeId: "IeRSr6F2NOM" },
  { id: "systematic-transfer-plan", title: "Systematic Transfer Plan is a smart way to invest lump sum amounts in Equity Mutual Funds.", youtubeId: "1e2-KGb3wRg" },
  { id: "types-of-mutual-funds", title: "Types of Mutual Funds | Find the Right Investment for You", youtubeId: "OwSdwgsvnVQ" },
];

async function uploadThumbnail(youtubeId: string): Promise<{ _type: "image"; asset: { _type: "reference"; _ref: string } }> {
  const candidates = [
    `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
  ];
  for (const url of candidates) {
    const res = await fetch(url);
    if (!res.ok) continue;
    const buffer = Buffer.from(await res.arrayBuffer());
    // YouTube serves a small placeholder (120x90 grey) instead of a real
    // maxresdefault when one doesn't exist for a video; skip those.
    if (buffer.byteLength < 2000) continue;
    const asset = await client.assets.upload("image", buffer, { filename: `${youtubeId}.jpg` });
    return { _type: "image", asset: { _type: "reference", _ref: asset._id } };
  }
  throw new Error(`Could not fetch a thumbnail for YouTube video ${youtubeId}`);
}

async function migrate() {
  console.log("Uploading thumbnails and queuing video documents...");
  const tx = client.transaction();
  const today = new Date();

  for (let i = 0; i < videos.length; i++) {
    const v = videos[i];
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const thumbnailUrl = await uploadThumbnail(v.youtubeId);
    console.log(`  ${v.id}: thumbnail uploaded`);

    tx.createOrReplace({
      _type: "video",
      _id: "video-" + v.id,
      title: v.title,
      date: date.toISOString().slice(0, 10),
      embedUrl: `https://www.youtube.com/watch?v=${v.youtubeId}`,
      thumbnailUrl,
    });
  }
  console.log(`Queued ${videos.length} videos`);

  await tx.commit();
  console.log("Migration complete.");
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
