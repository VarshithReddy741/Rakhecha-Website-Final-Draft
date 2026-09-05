// One-off migration: seeds Sanity with `businessCard` (homepage "Our
// Businesses") and `service` ("Our Services" cards on the Investment
// Banking / Wealth Management / Insurance pages) documents, transcribed
// from what's currently hand-authored in index.astro / investment-banking
// .astro / wealth-management.astro / insurance.astro, uploading each
// item's current static image as a real Sanity asset.
//
// Two bespoke one-off blocks (IB's "Active Secondary Inventory" table and
// WM's "Products Available to NRIs" table) are NOT migrated here — they
// stay hardcoded in their page files, appended after the Sanity-driven
// content boxes for those specific cards (see plan notes).
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

// --- Portable text builders -------------------------------------------

function key(): string {
  return Math.random().toString(36).slice(2);
}

function span(text: string, marks: string[] = []) {
  return { _type: "span", _key: key(), text, marks };
}

function block(children: ReturnType<typeof span>[], style: string, listItem?: string) {
  return { _type: "block", _key: key(), style, listItem, level: listItem ? 1 : undefined, markDefs: [], children };
}

function paragraph(text: string) {
  return block([span(text)], "normal");
}

function bullet(name: string, desc?: string) {
  const children = desc ? [span(name + ": ", ["strong"]), span(desc)] : [span(name, ["strong"])];
  return block(children, "normal", "bullet");
}

interface BoxSpec {
  heading?: string;
  paragraphs?: string[];
  bullets?: { name: string; desc?: string }[];
}

function buildContentBoxes(specs: BoxSpec[]) {
  return specs.map((spec) => ({
    _key: key(),
    _type: "contentBox",
    heading: spec.heading,
    body: [...(spec.paragraphs ?? []).map(paragraph), ...(spec.bullets ?? []).map((b) => bullet(b.name, b.desc))],
  }));
}

// --- Seed data -----------------------------------------------------------

const businessCards = [
  {
    id: "wealth-management",
    title: "Wealth Management",
    href: "/wealth-management/",
    description: "Comprehensive Wealth Management solutions to protect and grow your assets.",
    image: "Wealth home.jpg",
    imagePosition: "center" as const,
    order: 1,
  },
  {
    id: "investment-banking",
    title: "Investment Banking",
    href: "/investment-banking/",
    description:
      "Strategic advisory for mergers, acquisitions, and capital raising, delivering bespoke solutions for complex corporate transactions.",
    image: "IB Hero Card.png",
    imagePosition: "right" as const,
    order: 2,
  },
  {
    id: "insurance",
    title: "Insurance",
    href: "/insurance/",
    description: "Insurance solutions designed to protect your assets and provide peace of mind.",
    image: "Insurance hero card.png",
    mobileImage: "Insurance home page.png",
    imagePosition: "center" as const,
    order: 3,
  },
];

const ibServices = [
  {
    cardId: "fundraising",
    title: "Fundraising",
    shortDescription: "Strategic capital structuring across Equity & Debt markets.",
    image: "fundraising.jpg",
    order: 1,
    boxes: [
      {
        paragraphs: [
          "We advise startups, growth-stage companies, and established businesses in raising capital across equity, quasi-equity, and structured debt instruments. Our end-to-end fundraising mandate covers everything from pitch preparation to investor outreach, term sheet negotiation, and deal closure.",
        ],
      },
      {
        heading: "Our Services",
        bullets: [
          { name: "Equity fundraising", desc: "Seed, Series A to E, Pre-IPO" },
          { name: "Debt fundraising", desc: "NCDs, venture debt, structured finance" },
          { name: "Strategic investor identification" },
          { name: "Business plan & financial model review" },
          { name: "Investor deck & data room preparation" },
          { name: "Term sheet review" },
          { name: "Post-deal IR support" },
          { name: "Credit paper preparation" },
        ],
      },
      {
        heading: "Who should use this",
        bullets: [
          { name: "Startups seeking capital" },
          { name: "Growth-stage companies planning expansion" },
          { name: "Promoters looking for PE/VC" },
          { name: "Companies preparing to go public" },
        ],
      },
    ] as BoxSpec[],
  },
  {
    cardId: "ipo",
    title: "IPO Listing Advisory",
    shortDescription: "End-to-end guidance for public market debuts.",
    image: "IPO.jpg",
    order: 2,
    boxes: [
      { paragraphs: ["End-to-end advisory for your journey to the public markets."] },
      {
        heading: "Our Services",
        bullets: [
          { name: "IPO readiness" },
          { name: "Pre-IPO structuring" },
          { name: "DRHP preparation/SEBI filing" },
          { name: "Coordination with BRLM/registrars" },
          { name: "Mainboard IPO (BSE/NSE)" },
          { name: "SME IPO (BSE SME/NSE Emerge)" },
          { name: "Investor roadshow" },
          { name: "Grey market/anchor investor strategy" },
          { name: "Post-listing compliance" },
        ],
      },
    ] as BoxSpec[],
  },
  {
    cardId: "valuation",
    title: "Valuation",
    shortDescription: "Rigorous independent valuation services.",
    image: "Valuation.png",
    order: 3,
    boxes: [
      { paragraphs: ["Helping you understand and unlock the value of your business."] },
      {
        heading: "Our Services",
        bullets: [
          { name: "Business and enterprise valuation" },
          { name: "Early-stage to pre-IPO valuation" },
          { name: "ESOPs and ESOP trust valuation" },
          { name: "Intangible asset and brand valuation" },
          { name: "Real estate and investment portfolio valuation" },
          { name: "Valuation for regulatory compliance (FEMA, SEBI, RBI)" },
          { name: "Fairness opinions for M&A" },
        ],
      },
    ] as BoxSpec[],
  },
  {
    cardId: "ma",
    title: "Mergers & Acquisitions",
    shortDescription: "Strategic advisory from identification to execution.",
    image: "M&A.png",
    order: 4,
    boxes: [
      { paragraphs: ["Supporting businesses through strategic transactions, from opportunity to execution."] },
      {
        heading: "Our Services",
        bullets: [
          { name: "Buy-side M&A" },
          { name: "Sell-side M&A" },
          { name: "Deal structuring" },
          { name: "Regulatory approvals (CCI, NCLT, RBI, SEBI)" },
          { name: "Integration planning" },
          { name: "Cross-border M&A advisory" },
        ],
      },
    ] as BoxSpec[],
  },
  {
    cardId: "secondary",
    title: "Secondary Deals",
    shortDescription: "Navigating the unlisted space with discretion.",
    image: "secondary deals.jpeg",
    order: 5,
    // Table + "Ecosystem Support & Exit Solutions" list stay hardcoded in
    // investment-banking.astro, appended after these Sanity content boxes.
    boxes: [
      { paragraphs: ["Solving for liquidity in private markets. Navigate India's unlisted and pre-IPO opportunities."] },
      {
        heading: "Our Services",
        bullets: [
          { name: "Buying/selling unlisted shares" },
          { name: "Pre-IPO investment facilitation" },
          { name: "Co-investment with institutional VCs" },
          { name: "Promoter stake sales" },
          { name: "Employee stock liquidity/ESOP buyouts" },
          { name: "Block deals" },
          { name: "Due diligence on unlisted targets" },
        ],
      },
    ] as BoxSpec[],
  },
  {
    cardId: "fpi",
    title: "FPI Hub",
    shortDescription: "Streamlined access for Foreign Portfolio Investors.",
    image: "FPI hub.jpeg",
    order: 6,
    boxes: [
      {
        paragraphs: [
          "Helping global investors access India's private markets. Your partner for entering and exiting India's private markets.",
          "We enable Foreign Portfolio Investors to participate seamlessly in India's high-growth private markets, navigating regulatory frameworks, custody requirements, and exit strategies with precision and speed.",
        ],
      },
      {
        heading: "Our Services",
        bullets: [
          { name: "Identification of unlisted/pre-IPO opportunities" },
          { name: "Structuring entry" },
          { name: "FEMA and RBI compliance" },
          { name: "Exit strategy advisory (block deals, IPO-linked exits)" },
          { name: "Currency risk/hedging" },
        ],
      },
      {
        heading: "Target FPI profile",
        bullets: [
          { name: "Offshore funds with India mandates" },
          { name: "Family offices (Singapore, Mauritius, UAE, Cayman)" },
          { name: "Sovereign wealth funds/endowments" },
          { name: "Global PE/VC funds" },
        ],
      },
    ] as BoxSpec[],
  },
  {
    cardId: "credit",
    title: "Credit Papers",
    shortDescription: "Lender-ready credit papers for your financing needs.",
    image: "Credit paper.jpeg",
    order: 7,
    boxes: [
      { paragraphs: ["Lender-ready credit papers for your financing needs."] },
      {
        heading: "Our Services",
        bullets: [
          { name: "Lender-ready credit papers/IMs" },
          { name: "Financial analysis/credit assessment" },
          { name: "Business model/industry analysis" },
          { name: "Debt servicing/cash flow assessment" },
          { name: "Financial projections" },
          { name: "Identification of lending institutions" },
          { name: "Documentation support" },
          { name: "Coordination with lenders" },
          { name: "Presentation support" },
        ],
      },
      {
        heading: "Who should use this",
        bullets: [
          { name: "Businesses seeking working/growth capital" },
          { name: "Companies approaching banks/NBFCs" },
          { name: "Startups raising venture debt" },
          { name: "Companies refinancing debt" },
          { name: "Businesses seeking structured/private credit" },
        ],
      },
    ] as BoxSpec[],
  },
];

function wmOrInsuranceBoxes(desc: string, items: { name: string; desc: string }[]): BoxSpec[] {
  return [{ paragraphs: [desc] }, { heading: "Our Services", bullets: items }];
}

const wmServices = [
  {
    cardId: "aif",
    title: "Alternative Investment Funds (AIF)",
    shortDescription: "Explore investment opportunities beyond traditional markets.",
    image: "Alternate Investmetns.jpeg",
    order: 1,
    items: [
      { name: "Category I", desc: "Start-ups, SMEs, and infrastructure funds." },
      { name: "Category II", desc: "Private equity and debt funds." },
      { name: "Category III", desc: "Complex trading strategies and hedge funds." },
      { name: "Minimum Investment", desc: "Rs. 1 crore as per SEBI regulations." },
    ],
  },
  {
    cardId: "pms",
    title: "Portfolio Management Services (PMS)",
    shortDescription: "Professional portfolio management, tailored to your goals.",
    image: "PMS.jpeg",
    order: 2,
    items: [
      { name: "Equity PMS", desc: "Direct equity portfolios managed by experts." },
      { name: "Multi-Asset PMS", desc: "Diversified exposure across asset classes." },
      { name: "Minimum Investment", desc: "Rs. 50 lakhs entry threshold." },
      { name: "Reporting", desc: "Monthly performance attribution and transparency." },
    ],
  },
  {
    cardId: "bonds",
    title: "Bonds & Fixed Income",
    shortDescription: "Predictable Returns. Principal Protection.",
    image: "Bonds.jpeg",
    order: 3,
    items: [
      { name: "G-Secs & T-Bills", desc: "Sovereign backed instruments." },
      { name: "Corporate Bonds", desc: "High-yield NCDs from blue-chip entities." },
      { name: "Tax-Free Bonds", desc: "Optimized returns for high tax brackets." },
      { name: "SGBs", desc: "Sovereign Gold Bonds for digital gold exposure." },
    ],
  },
  {
    cardId: "mutual-funds",
    title: "Mutual Funds",
    shortDescription: "Choose mutual funds that fit your investment goals.",
    image: "Mutual funds.png",
    order: 4,
    items: [
      { name: "Equity Funds", desc: "Growth-oriented diversified portfolios." },
      { name: "Debt Funds", desc: "Stability and regular income focus." },
      { name: "Hybrid Funds", desc: "Balanced risk-reward strategies." },
      { name: "SIP/Lump-sum", desc: "Flexible investment modes." },
    ],
  },
  {
    cardId: "invoice",
    title: "Invoice Discounting",
    shortDescription: "Finance the Future. Earn Today.",
    image: "Invoie discountig.jpeg",
    order: 5,
    items: [
      { name: "Short-term Yield", desc: "30-120 day investment cycles." },
      { name: "Verified Invoices", desc: "Exposure to blue-chip corporate receivables." },
      { name: "High Returns", desc: "Superior risk-adjusted yields." },
      { name: "Low Correlation", desc: "Independent of stock market volatility." },
    ],
  },
  {
    cardId: "private-wealth",
    title: "Private Wealth Advisory",
    shortDescription: "Helping you build and preserve wealth across generations.",
    image: "private wealth.jpg",
    order: 6,
    items: [
      { name: "Family Office", desc: "Comprehensive multi-generational planning." },
      { name: "Estate Planning", desc: "Succession and trust structuring." },
      { name: "Global Solutions", desc: "International asset allocation." },
      { name: "Consolidated Reporting", desc: "Unified view of all global assets." },
    ],
  },
  {
    // Table "Products Available to NRIs" stays hardcoded in
    // wealth-management.astro, appended after these Sanity content boxes.
    cardId: "nri-services",
    title: "NRI Services",
    shortDescription: "Invest in India's Growth Story.",
    image: "NRI service.jpeg",
    order: 7,
    items: [
      { name: "Repatriation", desc: "LRS and FEMA compliance advisory." },
      { name: "NRE/NRO Accounts", desc: "Banking coordination and setup." },
      { name: "DTAA Benefits", desc: "Tax optimization for cross-border income." },
      { name: "India Desk", desc: "Dedicated support for non-resident investors." },
    ],
  },
];

const insuranceServices = [
  {
    cardId: "individual",
    title: "Individual Insurance",
    shortDescription: "Life and Health insurance solutions meticulously tailored for UHNW individuals.",
    image: "individual insurance landscape.png",
    imagePosition: "right" as const,
    order: 1,
    items: [
      { name: "Life Insurance, Term Life", desc: "Comprehensive life cover for long-term financial security." },
      { name: "Individual Health Plans", desc: "Personalized medical coverage for high-net-worth individuals." },
      { name: "Family Floater Plans", desc: "Unified health protection for the entire household." },
      { name: "Critical Illness Cover", desc: "Lump-sum benefits for major medical contingencies." },
      { name: "Super Top-up Plans", desc: "Additional coverage beyond base health limits at low cost." },
      { name: "Senior Citizen Health Plans", desc: "Tailored medical coverage for elderly family members." },
      { name: "Cancer & Cardiac Specific Plans", desc: "Focused protection against major cancer and cardiac diagnoses." },
    ],
  },
  {
    cardId: "business",
    title: "Business Insurance",
    shortDescription: "Strategic risk management and comprehensive coverage for corporate entities.",
    image: "Busienss Insurance.jpeg",
    order: 2,
    items: [
      { name: "Employee Group Health Insurance (GMC)", desc: "Comprehensive medical benefits for your entire workforce." },
      { name: "Group Personal Accident Cover", desc: "24/7 worldwide protection against accidental risks." },
      { name: "Group Term Life Insurance", desc: "Life cover for employees as an added retention benefit." },
      { name: "Workmen's Compensation Policy", desc: "Statutory cover for employee injury or death at work." },
      { name: "Directors & Officers (D&O) Liability", desc: "Protection for management against personal liability claims." },
      { name: "Professional Indemnity Insurance", desc: "Coverage against errors and omissions in professional services." },
      {
        name: "Commercial General Liability (CGL)",
        desc: "Broad protection against third-party bodily injury and property damage claims.",
      },
    ],
  },
];

// --- Migration -------------------------------------------------------------

async function migrate() {
  console.log("Uploading images and building documents...");
  const tx = client.transaction();

  for (const card of businessCards) {
    const image = await uploadImage(card.image);
    const mobileImage = card.mobileImage ? await uploadImage(card.mobileImage) : undefined;
    tx.createOrReplace({
      _type: "businessCard",
      _id: "businessCard-" + card.id,
      title: card.title,
      slug: { _type: "slug", current: card.id },
      href: card.href,
      description: card.description,
      image,
      ...(mobileImage ? { mobileImage } : {}),
      imagePosition: card.imagePosition,
      order: card.order,
    });
  }
  console.log(`Queued ${businessCards.length} business cards`);

  for (const svc of ibServices) {
    const image = await uploadImage(svc.image);
    tx.createOrReplace({
      _type: "service",
      _id: "service-investment-banking-" + svc.cardId,
      title: svc.title,
      businessLine: "investment-banking",
      cardId: { _type: "slug", current: svc.cardId },
      shortDescription: svc.shortDescription,
      image,
      order: svc.order,
      contentBoxes: buildContentBoxes(svc.boxes),
    });
  }
  console.log(`Queued ${ibServices.length} investment-banking services`);

  for (const svc of wmServices) {
    const image = await uploadImage(svc.image);
    tx.createOrReplace({
      _type: "service",
      _id: "service-wealth-management-" + svc.cardId,
      title: svc.title,
      businessLine: "wealth-management",
      cardId: { _type: "slug", current: svc.cardId },
      shortDescription: svc.shortDescription,
      image,
      order: svc.order,
      contentBoxes: buildContentBoxes(wmOrInsuranceBoxes(svc.shortDescription, svc.items)),
    });
  }
  console.log(`Queued ${wmServices.length} wealth-management services`);

  for (const svc of insuranceServices) {
    const image = await uploadImage(svc.image);
    tx.createOrReplace({
      _type: "service",
      _id: "service-insurance-" + svc.cardId,
      title: svc.title,
      businessLine: "insurance",
      cardId: { _type: "slug", current: svc.cardId },
      shortDescription: svc.shortDescription,
      image,
      imagePosition: svc.imagePosition ?? "center",
      order: svc.order,
      contentBoxes: buildContentBoxes(wmOrInsuranceBoxes(svc.shortDescription, svc.items)),
    });
  }
  console.log(`Queued ${insuranceServices.length} insurance services`);

  await tx.commit();
  console.log("Migration complete.");
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
