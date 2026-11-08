import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  expect: { timeout: 15000 },
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4186",
    channel: process.platform === "win32" ? "msedge" : undefined,
    viewport: { width: 1440, height: 1024 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm dev --host 127.0.0.1 --port 4186 --strictPort",
    url: "http://127.0.0.1:4186",
    reuseExistingServer: false,
    env: {
      VITE_TMDB_API_BASE_URL: "https://api.themoviedb.org/3",
      VITE_TMDB_ACCESS_TOKEN: "e2e-test-token",
    },
  },
});
