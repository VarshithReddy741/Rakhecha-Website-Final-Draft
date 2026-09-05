import { defineType, defineField } from "sanity";
export const pastEventSchema = defineType({
  name: "pastEvent", title: "Past Event", type: "document",
  fields: [
    defineField({ name: "title", title: "Event Title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "date", title: "Date", type: "date", validation: (r) => r.required() }),
    defineField({ name: "type", title: "Event Type", type: "string", options: { list: ["Panel", "Webinar", "Roundtable", "Workshop", "Conference"] } }),
    defineField({ name: "tags", title: "Tags", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "imageUrl", title: "Event Image", type: "image", options: { hotspot: true } }),
    defineField({ name: "recordingUrl", title: "Recording URL", type: "url" }),
  ],
  preview: { select: { title: "title", subtitle: "date" } }
});
