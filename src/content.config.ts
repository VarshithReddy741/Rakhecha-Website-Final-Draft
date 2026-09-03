import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "zod";

// Schema is deliberately flat/simple (plain strings, no nested blocks) so it
// maps cleanly onto a future Sanity "founder" document type — swapping this
// collection for a live Sanity query is a later project phase, not this task.
const founders = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/founders" }),
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    role: z.string(),
    photo: z.string(),
    education: z.string(),
    shortBio: z.string(),
    extendedBio: z.string(),
    linkedinUrl: z.url().optional(),
  }),
});

// Fixes the same "every card links to the same page" bug as founders:
// Knowledge hub.html's Reports/Blog cards each had distinct titles but all
// linked to one shared Article Page.html. body is a small array of typed
// blocks (paragraph/heading/quote) rather than one opaque string, matching
// the structure Article Page.html actually needs (lead, heading, quote) but
// still simple enough to map cleanly onto Sanity portable text later.
const articles = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/articles" }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    category: z.string(),
    date: z.string(),
    readTime: z.string(),
    image: z.string(),
    authorName: z.string(),
    authorRole: z.string(),
    authorPhoto: z.string(),
    excerpt: z.string(),
    body: z.array(
      z.object({
        type: z.enum(["paragraph", "heading", "quote"]),
        text: z.string(),
      }),
    ),
  }),
});

// Same fix for careers.html's job listings, which all linked to one shared
// Job detail.html.
const jobs = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/jobs" }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    jobId: z.string(),
    location: z.string(),
    employmentType: z.string(),
    experience: z.string(),
    description: z.string(),
    responsibilities: z.array(z.string()),
    qualifications: z.array(z.string()),
  }),
});

export const collections = { founders, articles, jobs };
