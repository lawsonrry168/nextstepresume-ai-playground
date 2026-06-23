import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "../..");

describe("phase 16 redis tooling", () => {
  it("exposes redis npm scripts", () => {
    const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts["redis:start"]).toContain("start-redis.mjs");
    expect(pkg.scripts["test:redis"]).toContain("test-redis.mjs");
  });

  it("documents redis env vars in .env.example", () => {
    const example = readFileSync(path.join(root, ".env.example"), "utf8");
    expect(example).toContain("NSR_QUOTA_STORE");
    expect(example).toContain("NSR_REDIS_URL");
    expect(example).toContain("npm run redis:start");
    expect(example).toContain("NSR_REDIS_INTEGRATION_REQUIRED");
  });
});
