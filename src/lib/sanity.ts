import { createClient } from "@sanity/client";

export const sanityClient = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? "yoc5jesn",
  dataset: import.meta.env.PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2024-01-01",
  useCdn: true,
});

export interface ArticleBlock {
  blockType: "paragraph" | "heading" | "quote";
  text: string;
}

export interface Article {
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  imageUrl?: string;
  authorName?: string;
  authorRole?: string;
  authorPhotoUrl?: string;
  excerpt?: string;
  body: ArticleBlock[];
}

export interface Founder {
  slug: string;
  name: string;
  role: string;
  photoUrl?: string;
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
  imageUrl?: string;
  isFeatured?: boolean;
}

export interface PastEvent {
  _id: string;
  title: string;
  date: string;
  type?: string;
  tags?: string[];
  imageUrl?: string;
  recordingUrl?: string;
}

export interface VideoItem {
  _id: string;
  title: string;
  date: string;
  duration?: string;
  thumbnailUrl?: string;
  embedUrl?: string;
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
};
