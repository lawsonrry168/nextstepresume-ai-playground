import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createRedisKv,
  disconnectRedisClientsForTests,
  pingRedis,
  resolveRedisUrl,
} from "../../server/quota/redisClient.ts";
import { RedisQuotaStore } from "../../server/quota/redisQuotaStore.ts";
import { emptyUsage } from "../lib/subscription/usageLedger";

const redisUrl = resolveRedisUrl();
const runIntegration = Boolean(redisUrl);

describe.runIf(runIntegration)("redis quota integration", () => {
  const month = "2026-06";
  const clientId = `integration-client-${Date.now()}`;
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
        await kv.del(`nsr:quota:${clientId}`);
      } catch {
        /* ignore cleanup errors */
      }
    }
    await disconnectRedisClientsForTests();
  }, 2_000);

  it("shares usage records across redis-backed store instances", async () => {
    const kv = createRedisKv(redisUrl!);
    const writer = new RedisQuotaStore(kv);
    const reader = new RedisQuotaStore(kv);

    writer.applyDeltas(clientId, [{ metric: "jobsdbSearch", amount: 1 }], (id) =>
      writer.get(id, month, emptyUsage),
    );
    await writer.waitForPersist(clientId);

    reader.get(clientId, month, emptyUsage);
    await reader.waitForHydration(clientId);
    const record = reader.get(clientId, month, emptyUsage);

    expect(record.usage.jobsdbSearch).toBe(1);
  });
});
