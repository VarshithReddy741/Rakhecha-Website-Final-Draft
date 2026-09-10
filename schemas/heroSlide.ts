import { defineType, defineField } from "sanity";
export const heroSlideSchema = defineType({
  name: "heroSlide", title: "Hero Slide (Homepage)", type: "document",
  fields: [
    defineField({ name: "title", title: "Internal Title (not shown on site)", type: "string", validation: (r) => r.required() }),
    defineField({ name: "headline", title: "Headline", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "mediaType", title: "Media Type", type: "string",
      options: { list: [{ title: "Image", value: "image" }, { title: "Video", value: "video" }] },
      initialValue: "image", validation: (r) => r.required(),
    }),
    defineField({
      name: "image", title: "Image (desktop)", type: "image", options: { hotspot: true },
      hidden: ({ parent }) => parent?.mediaType !== "image",
      validation: (r) => r.custom((value, ctx: any) => (ctx.parent?.mediaType === "image" && !value ? "Required when media type is Image" : true)),
    }),
    defineField({
      name: "mobileImage", title: "Image (mobile, optional — falls back to desktop image)", type: "image", options: { hotspot: true },
      hidden: ({ parent }) => parent?.mediaType !== "image",
    }),
    defineField({
      name: "video", title: "Video (mp4, plays muted/looped as the background)", type: "file", options: { accept: "video/*" },
      hidden: ({ parent }) => parent?.mediaType !== "video",
      validation: (r) => r.custom((value, ctx: any) => (ctx.parent?.mediaType === "video" && !value ? "Required when media type is Video" : true)),
    }),
    defineField({
      name: "videoPoster", title: "Video Poster Image (shown while video loads)", type: "image", options: { hotspot: true },
      hidden: ({ parent }) => parent?.mediaType !== "video",
    }),
    defineField({ name: "ctaText", title: "Button Text", type: "string", initialValue: "Contact Us" }),
    defineField({ name: "ctaLink", title: "Button Link", type: "string", initialValue: "/contact-us/" }),
    defineField({ name: "order", title: "Display Order (1 = first)", type: "number", validation: (r) => r.required() }),
  ],
  preview: { select: { title: "title", subtitle: "mediaType" } },
});
