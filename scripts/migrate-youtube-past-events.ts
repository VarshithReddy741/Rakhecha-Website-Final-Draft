// One-off migration: seeds Sanity with `pastEvent` documents for a batch of
// YouTube recordings supplied by the user, uploading each video's YouTube
// thumbnail as a real Sanity asset. Dates below are each video's actual
// YouTube upload date (fetched from the video page's publishDate metadata).
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

const events = [
  { id: "investing-in-indias-next-gen-startups", title: "Investing in India’s Next Generation of Startups | Startup Investment Opportunities", youtubeId: "nM5uqWk6ZM0", date: "2026-08-22" },
  { id: "shantanu-sahai-private-credit", title: "Shantanu Sahai Explains Why India's Biggest Companies Choose Private Credit | @ASKWealth", youtubeId: "d0ca_vq1Zhw", date: "2026-07-25" },
  { id: "how-carnelian-creates-alpha", title: "How Carnelian Creates Alpha | India's Growth Story & PMS Investment Strategy | @carnelianasset", youtubeId: "lNrj7MVIMoc", date: "2026-07-20" },
  { id: "private-equity-decoded-sanjay-vora", title: "Private Equity Decoded with Sanjay Vora | @ValueQuest Tristar Fund | Ep. 03", youtubeId: "8CpkiFON4E0", date: "2026-07-13" },
  { id: "vision-behind-rakhecha-finserv", title: "The Vision Behind Rakhecha Finserv | Founders Speak", youtubeId: "L-EdGAXFFOc", date: "2026-07-10" },
  { id: "complete-guide-to-pre-ipo-investing", title: "The Complete Guide to Pre-IPO Investing", youtubeId: "NUCXVsznMJI", date: "2026-07-03" },
  { id: "invoice-discounting-fixed-income", title: "Invoice Discounting – The Emerging Fixed Income Alternative 2026 | @AmplioInvest", youtubeId: "ASlr46NXJGU", date: "2026-07-01" },
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
    if (buffer.byteLength < 2000) continue;
    const asset = await client.assets.upload("image", buffer, { filename: `${youtubeId}.jpg` });
    return { _type: "image", asset: { _type: "reference", _ref: asset._id } };
  }
  throw new Error(`Could not fetch a thumbnail for YouTube video ${youtubeId}`);
}

async function migrate() {
  console.log("Uploading thumbnails and queuing past-event documents...");
  const tx = client.transaction();

  for (const e of events) {
    const imageUrl = await uploadThumbnail(e.youtubeId);
    console.log(`  ${e.id}: thumbnail uploaded`);

    tx.createOrReplace({
      _type: "pastEvent",
      _id: "pastEvent-" + e.id,
      title: e.title,
      date: e.date,
      recordingUrl: `https://www.youtube.com/watch?v=${e.youtubeId}`,
      imageUrl,
    });
  }
  console.log(`Queued ${events.length} past events`);

  await tx.commit();
  console.log("Migration complete.");
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
