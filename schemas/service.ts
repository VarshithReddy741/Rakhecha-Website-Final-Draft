import { defineType, defineField, defineArrayMember } from "sanity";
export const serviceSchema = defineType({
  name: "service", title: "Service Card", type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "businessLine", title: "Business Line", type: "string",
      options: { list: ["investment-banking", "wealth-management", "insurance"] },
      validation: (r) => r.required(),
    }),
    defineField({ name: "cardId", title: "Card ID", type: "slug", options: { source: "title" }, validation: (r) => r.required() }),
    defineField({ name: "shortDescription", title: "Short Description (shown on the collapsed card)", type: "text", rows: 3 }),
    defineField({ name: "image", title: "Image", type: "image", options: { hotspot: true }, validation: (r) => r.required() }),
    defineField({
      name: "imagePosition", title: "Image Position", type: "string",
      options: { list: ["center", "right"] }, initialValue: "center",
    }),
    defineField({ name: "order", title: "Display Order (1 = first)", type: "number" }),
    defineField({
      name: "contentBoxes", title: "Content Boxes (shown when the card is expanded)", type: "array",
      of: [
        defineArrayMember({
          type: "object", name: "contentBox",
          fields: [
            defineField({ name: "heading", title: "Heading", type: "string" }),
            defineField({ name: "body", title: "Content", type: "array", of: [defineArrayMember({ type: "block" })] }),
          ],
          preview: { select: { title: "heading" } },
        }),
      ],
    }),
  ],
  preview: { select: { title: "title", subtitle: "businessLine" } }
});
