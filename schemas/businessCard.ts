import { defineType, defineField } from "sanity";
export const businessCardSchema = defineType({
  name: "businessCard", title: "Business Card (Homepage)", type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title" }, validation: (r) => r.required() }),
    defineField({ name: "href", title: "Link (e.g. /wealth-management/)", type: "string", validation: (r) => r.required() }),
    defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
    defineField({ name: "image", title: "Image (desktop)", type: "image", options: { hotspot: true }, validation: (r) => r.required() }),
    defineField({ name: "mobileImage", title: "Image (mobile, optional — falls back to desktop image)", type: "image", options: { hotspot: true } }),
    defineField({
      name: "imagePosition", title: "Image Position", type: "string",
      options: { list: ["center", "right"] }, initialValue: "center",
    }),
    defineField({ name: "order", title: "Display Order (1 = first)", type: "number" }),
  ],
  preview: { select: { title: "title", subtitle: "href" } }
});
