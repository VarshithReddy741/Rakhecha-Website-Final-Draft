// Migrates existing JSON content collections into Sanity.
// Requires an EDITOR-level Sanity token in SANITY_MIGRATION_TOKEN env var.
import { createClient } from "@sanity/client";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const client = createClient({
  projectId: "yoc5jesn",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_MIGRATION_TOKEN!,
  useCdn: false,
});

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function readDir(dir: string) {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson(join(dir, f)));
}

async function migrate() {
  console.log("Starting migration...");
  const tx = client.transaction();

  // Articles
  const articles = readDir("src/content/articles");
  for (const a of articles) {
    tx.createOrReplace({
      _type: "article",
      _id: "article-" + a.slug,
      title: a.title,
      slug: { _type: "slug", current: a.slug },
      category: a.category === "Report" || a.category === "Blog" ? a.category : "Report",
      date: a.date,
      readTime: a.readTime,
      imageUrl: a.image ?? a.imageUrl,
      authorName: a.authorName,
      authorRole: a.authorRole,
      authorPhotoUrl: a.authorPhoto ?? a.authorPhotoUrl,
      excerpt: a.excerpt,
      body: (a.body ?? []).map((b: any) => ({
        _type: "bodyBlock",
        _key: Math.random().toString(36).slice(2),
        blockType: b.type,
        text: b.text,
      })),
    });
  }
  console.log(`Queued ${articles.length} articles`);

  // Founders
  const founders = readDir("src/content/founders");
  for (let i = 0; i < founders.length; i++) {
    const f = founders[i];
    tx.createOrReplace({
      _type: "founder",
      _id: "founder-" + f.slug,
      name: f.name,
      slug: { _type: "slug", current: f.slug },
      role: f.role,
      photoUrl: f.photo ?? f.photoUrl,
      education: f.education,
      shortBio: f.shortBio,
      extendedBio: f.extendedBio,
      linkedinUrl: f.linkedinUrl,
      order: i + 1,
    });
  }
  console.log(`Queued ${founders.length} founders`);

  // Jobs
  const jobs = readDir("src/content/jobs");
  for (const j of jobs) {
    tx.createOrReplace({
      _type: "job",
      _id: "job-" + j.slug,
      title: j.title,
      slug: { _type: "slug", current: j.slug },
      jobId: j.jobId,
      location: j.location,
      employmentType: j.employmentType,
      experience: j.experience,
      description: j.description,
      responsibilities: j.responsibilities ?? [],
      qualifications: j.qualifications ?? [],
      isActive: true,
    });
  }
  console.log(`Queued ${jobs.length} jobs`);

  await tx.commit();
  console.log("Migration complete.");
}

migrate().catch((e) => { console.error(e); process.exit(1); });
