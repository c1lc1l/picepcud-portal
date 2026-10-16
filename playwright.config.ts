import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against a production build:
//   npm run build && npm run test:e2e
// They only read from Supabase (public pages, unauthenticated flows) and never
// sign up, submit payments or send email, so they're safe to run against the
// shared project. Uses the installed Google Chrome by default; set
// PLAYWRIGHT_CHANNEL="" to use Playwright's bundled Chromium instead
// (`npx playwright install chromium`).
const PORT = Number(process.env.E2E_PORT ?? 3210);
const channel = process.env.PLAYWRIGHT_CHANNEL ?? "chrome";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    ...(channel ? { channel } : {}),
  },
  projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
