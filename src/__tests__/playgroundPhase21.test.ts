import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "../..");

describe("phase 21 full ci orchestration", () => {
  it("exposes npm run test:ci:full", () => {
    const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts["test:ci:full"]).toContain("test-ci-full.mjs");
  });

  it("runs unit, optional redis, and e2e in test-ci-full.mjs", () => {
    const script = readFileSync(path.join(root, "scripts/test-ci-full.mjs"), "utf8");
    expect(script).toContain("test-ci.mjs");
    expect(script).toContain("test-redis.mjs");
    expect(script).toContain('runNpmScript("test:e2e"');
    expect(script).toContain("redis job skipped");
  });

  it("cancels in-progress duplicate workflow runs on the same ref", () => {
    const workflow = readFileSync(path.join(root, ".github/workflows/ci.yml"), "utf8");
    expect(workflow).toContain("concurrency:");
    expect(workflow).toContain("cancel-in-progress: true");
  });
});
