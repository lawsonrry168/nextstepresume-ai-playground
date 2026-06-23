import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const steps = [
  {
    label: "lint",
    command: "node",
    args: ["./node_modules/typescript/bin/tsc", "--noEmit"],
  },
  {
    label: "unit tests",
    command: "node",
    args: ["./node_modules/vitest/vitest.mjs", "run"],
  },
];

for (const step of steps) {
  console.log(`\n> CI local: ${step.label}`);
  const result = spawnSync(step.command, step.args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("\nCI local checks passed (lint + unit).");
