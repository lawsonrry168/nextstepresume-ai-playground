import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3000);
const baseURL = `http://127.0.0.1:${port}`;
const isGithubActions = process.env.GITHUB_ACTIONS === "true";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: isGithubActions ? 1 : 0,
  reporter: isGithubActions ? "github" : "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: "node ./node_modules/tsx/dist/cli.mjs server.ts",
    url: baseURL,
    reuseExistingServer: !isGithubActions,
    timeout: 120_000,
    env: {
      NSR_JOBSDB_SIMULATE: "1",
      NSR_RATE_LIMIT_MAX: "1000",
    },
  },
});
