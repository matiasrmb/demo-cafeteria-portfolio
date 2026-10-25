import { defineConfig } from "astro/config";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const localEnvironment = new URL("./.env", import.meta.url);
if (existsSync(localEnvironment))
  process.loadEnvFile(fileURLToPath(localEnvironment));

export default defineConfig({
  output: "static",
  site:
    process.env.SITE_URL ||
    process.env.CF_PAGES_URL ||
    "https://cafe-demo.invalid",
  trailingSlash: "always",
  build: { inlineStylesheets: "never" },
  devToolbar: { enabled: false },
});
