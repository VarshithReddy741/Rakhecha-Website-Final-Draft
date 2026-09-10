import { defineField, defineType } from "sanity";

export const siteSettingsSchema = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "companyDeck",
      title: "Company Deck",
      description: "PDF opened by the Download Company Deck button on the About Us page.",
      type: "file",
      options: { accept: "application/pdf" },
    }),
  ],
  preview: { prepare: () => ({ title: "Site Settings" }) },
});
