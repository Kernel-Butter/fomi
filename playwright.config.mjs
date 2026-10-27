import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:3102",
    reducedMotion: "reduce",
    viewport: { width: 1280, height: 800 },
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "node node_modules/next/dist/bin/next start --port 3102 --hostname 127.0.0.1",
    url: "http://127.0.0.1:3102",
    reuseExistingServer: false,
  },
});
