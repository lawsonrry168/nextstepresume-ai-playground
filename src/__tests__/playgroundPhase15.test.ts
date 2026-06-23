import { describe, expect, it } from "vitest";
import { pingRedis } from "../../server/quota/redisClient.ts";

describe("redis ping helper", () => {
  it("rejects unreachable redis quickly", async () => {
    await expect(pingRedis("redis://127.0.0.1:6399", 400)).rejects.toThrow();
  });
});
