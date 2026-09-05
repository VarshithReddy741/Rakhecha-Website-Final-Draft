import { createClient } from "@sanity/client";
import type { SanityImageSource } from "@sanity/image-url";
import type { PortableTextBlock } from "@portabletext/types";

export const sanityClient = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? "yoc5jesn",
  dataset: import.meta.env.PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2024-01-01",
  // Only ever fetched at build time (output: 'static'), not per-request, so
  // there's no traffic to shield with the CDN's cache — and that cache can
  // lag up to ~60s behind a fresh publish, which was baking stale content
  // into rebuilds triggered right after publishing in Sanity.
  useCdn: false,
});

export interface ArticleBlock {
  blockType: "paragraph" | "heading" | "quote";
  text: string;
}

// Legacy documents may still hold a plain pasted-URL string until
// scripts/migrate-photos-to-sanity-assets.ts converts them to real Sanity
// image assets — see resolveImage() in lib/sanityImage.ts, which handles
// both shapes.
export type LegacyOrImage = SanityImageSource | string;

export interface Article {
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  imageUrl?: LegacyOrImage;
  authorName?: string;
  authorRole?: string;
  authorPhotoUrl?: LegacyOrImage;
  excerpt?: string;
  body: ArticleBlock[];
}

export interface Founder {
  slug: string;
  name: string;
  role: string;
  photoUrl?: LegacyOrImage;
  education: string;
  shortBio: string;
  extendedBio?: string;
  linkedinUrl?: string;
}

export interface Job {
  slug: string;
  title: string;
  jobId: string;
  location: string;
  employmentType: string;
  experience: string;
  description: string;
  responsibilities: string[];
  qualifications: string[];
}

export interface UpcomingEvent {
  _id: string;
  title: string;
  date: string;
  time?: string;
  type?: string;
  format?: string;
  location?: string;
  description?: string;
  imageUrl?: LegacyOrImage;
  isFeatured?: boolean;
}

export interface PastEvent {
  _id: string;
  title: string;
  date: string;
  type?: string;
  tags?: string[];
  imageUrl?: LegacyOrImage;
  recordingUrl?: string;
}

export interface VideoItem {
  _id: string;
  title: string;
  date: string;
  duration?: string;
  thumbnailUrl?: LegacyOrImage;
  embedUrl?: string;
}

export interface BusinessCard {
  slug: string;
  title: string;
  href: string;
  description?: string;
  image: SanityImageSource;
  mobileImage?: SanityImageSource;
  imagePosition?: "center" | "right";
  order?: number;
}

export interface ServiceContentBox {
  heading?: string;
  body?: PortableTextBlock[];
}

export interface Service {
  title: string;
  businessLine: "investment-banking" | "wealth-management" | "insurance";
  cardId: string;
  shortDescription?: string;
  image: SanityImageSource;
  imagePosition?: "center" | "right";
  order?: number;
  contentBoxes?: ServiceContentBox[];
}

export const queries = {
  reportArticles: `*[_type == "article" && category == "Report"] | order(date desc) { "slug": slug.current, title, category, date, readTime, imageUrl, authorName, authorRole, authorPhotoUrl, excerpt, body }`,
  blogArticles:   `*[_type == "article" && category == "Blog"] | order(date desc) { "slug": slug.current, title, category, date, readTime, imageUrl, authorName, authorRole, authorPhotoUrl, excerpt, body }`,
  allArticleSlugs: `*[_type == "article"] { "slug": slug.current }`,
  articleBySlug:  `*[_type == "article" && slug.current == $slug][0] { "slug": slug.current, title, category, date, readTime, imageUrl, authorName, authorRole, authorPhotoUrl, excerpt, body }`,

  allFounders:    `*[_type == "founder"] | order(order asc) { "slug": slug.current, name, role, photoUrl, education, shortBio, extendedBio, linkedinUrl }`,
  allFounderSlugs:`*[_type == "founder"] { "slug": slug.current }`,
  founderBySlug:  `*[_type == "founder" && slug.current == $slug][0] { "slug": slug.current, name, role, photoUrl, education, shortBio, extendedBio, linkedinUrl }`,

  allJobs:        `*[_type == "job" && isActive == true] | order(_createdAt desc) { "slug": slug.current, title, jobId, location, employmentType, experience, description, responsibilities, qualifications }`,
  allJobSlugs:    `*[_type == "job" && isActive == true] { "slug": slug.current }`,
  jobBySlug:      `*[_type == "job" && slug.current == $slug][0] { "slug": slug.current, title, jobId, location, employmentType, experience, description, responsibilities, qualifications }`,

  upcomingEvents: `*[_type == "upcomingEvent"] | order(date asc) { _id, title, date, time, type, format, location, description, imageUrl, isFeatured }`,
  pastEvents:     `*[_type == "pastEvent"] | order(date desc) { _id, title, date, type, tags, imageUrl, recordingUrl }`,
  videos:         `*[_type == "video"] | order(date desc) { _id, title, date, duration, thumbnailUrl, embedUrl }`,

  businessCards:  `*[_type == "businessCard"] | order(order asc) { "slug": slug.current, title, href, description, image, mobileImage, imagePosition, order }`,
  servicesByLine: `*[_type == "service" && businessLine == $businessLine] | order(order asc) { title, businessLine, "cardId": cardId.current, shortDescription, image, imagePosition, order, contentBoxes }`,
};
