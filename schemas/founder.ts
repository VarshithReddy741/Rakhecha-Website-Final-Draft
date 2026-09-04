import { defineType, defineField } from "sanity";
export const founderSchema = defineType({
  name: "founder", title: "Founder", type: "document",
  fields: [
    defineField({ name: "name", title: "Name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "name" }, validation: (r) => r.required() }),
    defineField({ name: "role", title: "Role / Title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "photoUrl", title: "Photo URL", type: "url" }),
    defineField({ name: "education", title: "Education", type: "string" }),
    defineField({ name: "shortBio", title: "Short Bio", type: "text", rows: 3 }),
    defineField({ name: "extendedBio", title: "Extended Bio", type: "text", rows: 6 }),
    defineField({ name: "linkedinUrl", title: "LinkedIn URL", type: "url" }),
    defineField({ name: "order", title: "Display Order (1 = first)", type: "number" }),
  ],
  preview: { select: { title: "name", subtitle: "role" } }
});
