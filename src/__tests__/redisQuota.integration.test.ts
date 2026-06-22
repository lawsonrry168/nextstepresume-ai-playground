import { afterAll, describe, expect, it } from "vitest";
import { createRedisKv, disconnectRedisClientsForTests } from "../../server/quota/redisClient.ts";
import { RedisQuotaStore } from "../../server/quota/redisQuotaStore.ts";
import { emptyUsage } from "../lib/subscription/usageLedger";

const redisUrl = process.env.NSR_REDIS_URL?.trim();
const runIntegration = Boolean(redisUrl);

describe.runIf(runIntegration)("redis quota integration", () => {
  const month = "2026-06";
  const clientId = `integration-client-${Date.now()}`;

  afterAll(async () => {
    if (!redisUrl) return;
    const kv = createRedisKv(redisUrl);
    await kv.del(`nsr:quota:${clientId}`);
    await disconnectRedisClientsForTests();
  });

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
