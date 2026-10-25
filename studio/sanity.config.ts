import { defineConfig, defineSingleton } from "sanity";
import { structureTool } from "sanity/structure";
import { cmsSeed } from "../src/data/demo";
import { DEMO_ID } from "../src/lib/content";
import { cafeDemo } from "./schemaTypes/cafeDemo";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET;
if (!projectId || !dataset)
  throw new Error(
    "Set public SANITY_STUDIO_PROJECT_ID and SANITY_STUDIO_DATASET before starting Studio.",
  );

export default defineConfig({
  name: "cafe-demo",
  title: "Bruma — fictional café demo",
  projectId,
  dataset,
  plugins: [structureTool()],
  schema: { types: [cafeDemo] },
  document: {
    singletons: [
      defineSingleton({
        documentId: DEMO_ID,
        schemaType: "cafeDemo",
        title: "Café demonstration",
        initialValue: cmsSeed(),
      }),
    ],
    actions: (actions, context) =>
      context.schemaType === "cafeDemo"
        ? actions.filter((action) => action.action !== "delete")
        : actions,
  },
});
