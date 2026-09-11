// One-off migration: seeds Sanity with `testimonial` (homepage testimonials
// marquee) documents, transcribed from what was previously hardcoded in
// index.astro.
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

const testimonials = [
  {
    id: "managing-director-global-tech",
    quote: "The level of precision and independent thinking Rakhecha Finserv brings to our family office is unparalleled in the industry.",
    authorName: "Managing Director",
    authorCompany: "Global Technology Firm",
    order: 1,
  },
  {
    id: "cio-private-equity",
    quote: "Their conflict-free approach gave us the confidence to restructure our entire global portfolio during a period of extreme volatility.",
    authorName: "Chief Investment Officer",
    authorCompany: "Private Equity Group",
    order: 2,
  },
  {
    id: "founder-ceo-industrial",
    quote: "A true partner in wealth stewardship. They understand the nuances of generational wealth better than any traditional bank.",
    authorName: "Founder & CEO",
    authorCompany: "Industrial Conglomerate",
    order: 3,
  },
  {
    id: "partner-family-office",
    quote: "Their proactive portfolio adaptation during market shifts has consistently protected our downside while capturing upside we would have otherwise missed.",
    authorName: "Partner",
    authorCompany: "Family Office",
    order: 4,
  },
  {
    id: "director-finance-nri",
    quote: "Transparent, research-backed advice with none of the conflicted incentives we experienced with our previous bank-led advisors.",
    authorName: "Director of Finance",
    authorCompany: "NRI Client, Singapore",
    order: 5,
  },
];

async function migrate() {
  console.log("Building testimonial documents...");
  const tx = client.transaction();

  for (const testimonial of testimonials) {
    tx.createOrReplace({
      _type: "testimonial",
      _id: "testimonial-" + testimonial.id,
      quote: testimonial.quote,
      authorName: testimonial.authorName,
      authorCompany: testimonial.authorCompany,
      order: testimonial.order,
    });
  }
  console.log(`Queued ${testimonials.length} testimonials`);

  await tx.commit();
  console.log("Migration complete.");
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
