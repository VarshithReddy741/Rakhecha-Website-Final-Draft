import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemas";

export default defineConfig({
  projectId: "yoc5jesn",
  dataset: "production",
  title: "Rakhecha Finserv CMS",
  plugins: [structureTool()],
  schema: { types: schemaTypes },
});
