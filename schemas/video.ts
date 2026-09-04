import { defineType, defineField } from "sanity";
export const videoSchema = defineType({
  name: "video", title: "Video", type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "date", title: "Date", type: "date", validation: (r) => r.required() }),
    defineField({ name: "duration", title: "Duration (e.g. 45 min watch)", type: "string" }),
    defineField({ name: "thumbnailUrl", title: "Thumbnail URL", type: "url" }),
    defineField({ name: "embedUrl", title: "Video Embed URL", type: "url" }),
  ],
  preview: { select: { title: "title", subtitle: "date" } }
});
