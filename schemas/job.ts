import { defineType, defineField } from "sanity";
export const jobSchema = defineType({
  name: "job", title: "Job", type: "document",
  fields: [
    defineField({ name: "title", title: "Job Title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title" }, validation: (r) => r.required() }),
    defineField({ name: "jobId", title: "Job ID", type: "string" }),
    defineField({ name: "location", title: "Location", type: "string" }),
    defineField({ name: "employmentType", title: "Employment Type", type: "string" }),
    defineField({ name: "experience", title: "Experience Required", type: "string" }),
    defineField({ name: "description", title: "Description", type: "text", rows: 4 }),
    defineField({ name: "responsibilities", title: "Responsibilities", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "qualifications", title: "Qualifications", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "isActive", title: "Active (visible on site)", type: "boolean", initialValue: true }),
  ],
  preview: { select: { title: "title", subtitle: "location" } }
});
