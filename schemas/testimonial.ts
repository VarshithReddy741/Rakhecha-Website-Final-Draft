import { defineType, defineField } from "sanity";
export const testimonialSchema = defineType({
  name: "testimonial", title: "Testimonial (Homepage)", type: "document",
  fields: [
    defineField({ name: "quote", title: "Quote", type: "text", rows: 4, validation: (r) => r.required() }),
    defineField({ name: "authorName", title: "Author Name / Role (e.g. Managing Director)", type: "string", validation: (r) => r.required() }),
    defineField({ name: "authorCompany", title: "Author Company (e.g. Global Technology Firm)", type: "string" }),
    defineField({ name: "photo", title: "Photo (optional — falls back to a placeholder)", type: "image", options: { hotspot: true } }),
    defineField({ name: "order", title: "Display Order (1 = first)", type: "number" }),
  ],
  preview: { select: { title: "authorName", subtitle: "authorCompany" } }
});
