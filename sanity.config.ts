import { defineConfig } from "sanity";
import { schemaTypes } from "./schemas";

export default defineConfig({
  projectId: "yoc5jesn",
  dataset: "production",
  title: "Rakhecha Finserv CMS",
  schema: { types: schemaTypes },
});
