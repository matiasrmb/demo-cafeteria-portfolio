import { defineConfig } from "@playwright/test";
import { tmpdir } from "node:os";
import { join } from "node:path";

export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  reporter: "list",
  outputDir: join(tmpdir(), "opencode", `cafe-browser-${process.pid}`),
  use: { baseURL: "http://127.0.0.1:4327", browserName: "chromium" },
  webServer: {
    command: "pnpm exec astro dev --host 127.0.0.1 --port 4327",
    url: "http://127.0.0.1:4327/@vite/client",
    reuseExistingServer: false,
    timeout: 60000,
  },
});
