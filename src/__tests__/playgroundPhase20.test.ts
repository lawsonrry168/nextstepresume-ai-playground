import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "../..");

describe("phase 20 ci hygiene", () => {
  it("ignores local redis snapshot files", () => {
    const gitignore = readFileSync(path.join(root, ".gitignore"), "utf8");
    expect(gitignore).toContain("dump.rdb");
    expect(gitignore).toContain("*.rdb");
  });

  it("exposes npm run test:ci for local unit job parity", () => {
    const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts["test:ci"]).toContain("test-ci.mjs");
  });

  it("defines unit, redis, and e2e jobs in ci workflow", () => {
    const workflow = readFileSync(path.join(root, ".github/workflows/ci.yml"), "utf8");
    expect(workflow).toContain("jobs:");
    expect(workflow).toContain("unit:");
    expect(workflow).toContain("redis:");
    expect(workflow).toContain("e2e:");
    expect(workflow).toContain("npm run test:redis");
    expect(workflow).toContain("npm run test:e2e");
  });
});
