import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createRedisKv,
  disconnectRedisClientsForTests,
  pingRedis,
  resolveRedisUrl,
} from "../../server/quota/redisClient.ts";
import { RedisRateLimitStore } from "../../server/rateLimit/redisRateLimitStore.ts";

const redisUrl = resolveRedisUrl();
const runIntegration = Boolean(redisUrl);

describe.runIf(runIntegration)("redis rate limit integration", () => {
  let redisReady = false;

  beforeAll(async () => {
    const hint =
      "Start Redis locally or run `npm run test:redis` only when redis://127.0.0.1:6379 is available.";
    try {
      await pingRedis(redisUrl!);
      redisReady = true;
    } catch (err) {
      const message =
        err instanceof Error
          ? `Redis not reachable at ${redisUrl}: ${err.message}. ${hint}`
          : `Redis not reachable at ${redisUrl}. ${hint}`;
      throw new Error(message);
    }
  }, 2_000);

  afterAll(async () => {
    if (redisReady && redisUrl) {
      try {
        const kv = createRedisKv(redisUrl);
        const keys = await kv.keys("nsr:ratelimit:integration-*");
        if (keys.length > 0) {
          await kv.del(...keys);
        }
      } finally {
        await disconnectRedisClientsForTests();
      }
    }
  });

  it("shares counters across redis-backed rate limit store instances", async () => {
    const kv = createRedisKv(redisUrl!);
    const writer = new RedisRateLimitStore(kv);
    const reader = new RedisRateLimitStore(kv);
    const key = `integration-${Date.now()}`;

    const first = await writer.consume(key, 60_000, 2);
    const second = await reader.consume(key, 60_000, 2);
    const third = await reader.consume(key, 60_000, 2);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });
});
