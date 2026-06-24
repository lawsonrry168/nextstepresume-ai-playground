import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function runNodeScript(scriptPath, label, extraEnv = {}) {
  console.log(`\n> CI full: ${label}`);
  const result = spawnSync("node", [scriptPath], {
    cwd: root,
    stdio: "inherit",
    shell: false,
    env: { ...process.env, ...extraEnv },
  });
  return result.status ?? 1;
}

function runNpmScript(script, label, extraEnv = {}) {
  console.log(`\n> CI full: ${label}`);
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(npm, ["run", script], {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...extraEnv },
  });
  return result.status ?? 1;
}

let failed = false;

const unitStatus = runNodeScript(path.join(root, "scripts/test-ci.mjs"), "unit job (lint + tests)");
if (unitStatus !== 0) {
  failed = true;
}

const redisStatus = runNodeScript(path.join(root, "scripts/test-redis.mjs"), "redis job", {
  NSR_REDIS_URL: process.env.NSR_REDIS_URL ?? "redis://127.0.0.1:6379",
  NSR_REDIS_INTEGRATION_REQUIRED: "1",
});
if (redisStatus !== 0) {
  console.warn("\nCI full: redis job skipped (start Redis with npm run redis:start and retry).");
}

const e2eEnv = {
  NSR_JOBSDB_SIMULATE: "1",
};
// Mirror CI retries/reporter only in GitHub Actions; local runs stay readable.
if (process.env.GITHUB_ACTIONS === "true") {
  e2eEnv.CI = "true";
}
const e2eStatus = runNpmScript("test:e2e", "e2e job", e2eEnv);
if (e2eStatus !== 0) {
  failed = true;
}

if (failed) {
  console.error("\nCI full failed.");
  process.exit(1);
}

console.log("\nCI full passed (unit + e2e; redis optional when unavailable).");
