import { defineType, defineField } from "sanity";
export const upcomingEventSchema = defineType({
  name: "upcomingEvent", title: "Upcoming Event", type: "document",
  fields: [
    defineField({ name: "title", title: "Event Title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "date", title: "Date & Time", type: "datetime", validation: (r) => r.required() }),
    defineField({ name: "time", title: "Time Display (e.g. 10:00 AM - 11:30 AM IST)", type: "string" }),
    defineField({ name: "type", title: "Event Type", type: "string", options: { list: ["Roundtable", "Webinar", "Workshop", "Panel", "Conference"] } }),
    defineField({ name: "format", title: "Format", type: "string", options: { list: [{ title: "Online", value: "online" }, { title: "In-Person", value: "in-person" }] } }),
    defineField({ name: "location", title: "Location (for in-person events)", type: "string" }),
    defineField({ name: "description", title: "Description", type: "text", rows: 4 }),
    defineField({ name: "imageUrl", title: "Event Image URL", type: "url" }),
    defineField({ name: "isFeatured", title: "Show as Featured Hero Event", type: "boolean", initialValue: false }),
  ],
  preview: { select: { title: "title", subtitle: "date" } }
});
