import { defineType, defineField } from "sanity";
export const articleSchema = defineType({
  name: "article", title: "Article", type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title" }, validation: (r) => r.required() }),
    defineField({ name: "category", title: "Category", type: "string", options: { list: ["Report", "Blog", "Insight"] }, validation: (r) => r.required() }),
    defineField({ name: "date", title: "Published Date", type: "date", validation: (r) => r.required() }),
    defineField({ name: "readTime", title: "Read Time (e.g. 5 min read)", type: "string" }),
    defineField({ name: "imageUrl", title: "Cover Image URL", type: "url" }),
    defineField({ name: "authorName", title: "Author Name", type: "string" }),
    defineField({ name: "authorRole", title: "Author Role", type: "string" }),
    defineField({ name: "authorPhotoUrl", title: "Author Photo URL", type: "url" }),
    defineField({ name: "excerpt", title: "Excerpt", type: "text", rows: 3 }),
    defineField({
      name: "body", title: "Body", type: "array",
      of: [{ type: "object", name: "bodyBlock", title: "Block",
        fields: [
          { name: "blockType", title: "Type", type: "string", options: { list: [{ title: "Paragraph", value: "paragraph" }, { title: "Heading", value: "heading" }, { title: "Quote", value: "quote" }] } },
          { name: "text", title: "Text", type: "text", rows: 4 }
        ],
        preview: { select: { title: "blockType", subtitle: "text" } }
      }]
    }),
  ],
  preview: { select: { title: "title", subtitle: "category" } }
});
