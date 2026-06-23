import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vitestCli = path.join(root, "node_modules", "vitest", "vitest.mjs");
const target = "src/__tests__/redisQuota.integration.test.ts";

const child = spawn(
  "node",
  [vitestCli, "run", target],
  {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      NSR_REDIS_URL: process.env.NSR_REDIS_URL ?? "redis://127.0.0.1:6379",
      NSR_REDIS_INTEGRATION_REQUIRED: "1",
    },
    shell: false,
  },
);

child.on("exit", (code) => process.exit(code ?? 1));
