import { describe, expect, it, afterEach } from "vitest";
import { createQuotaStore } from "../../server/quota/createQuotaStore.ts";
import { InMemoryQuotaStore } from "../../server/quota/inMemoryQuotaStore.ts";
import { RedisQuotaStore } from "../../server/quota/redisQuotaStore.ts";
import type { RedisKv } from "../../server/quota/redisKv.ts";
import { emptyUsage } from "../lib/subscription/usageLedger";
import {
  buildSimulatedJobsdbListings,
  shouldSimulateJobsdbSearch,
} from "../../server/simulation/jobsdb.ts";

function createFakeRedisKv(): RedisKv & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    async get(key) {
      return store.get(key) ?? null;
    },
    async set(key, value) {
      store.set(key, value);
    },
    async incr(key) {
      const next = Number(store.get(key) ?? "0") + 1;
      store.set(key, String(next));
      return next;
    },
    async expire() {
      /* no-op for fake kv */
    },
    async keys(pattern) {
      const prefix = pattern.replace("*", "");
      return [...store.keys()].filter((key) => key.startsWith(prefix));
    },
    async del(...keys) {
      for (const key of keys) {
        store.delete(key);
      }
    },
  };
}

describe("redis quota store", () => {
  const month = "2026-06";

  it("persists usage deltas through redis kv", async () => {
    const kv = createFakeRedisKv();
    const writer = new RedisQuotaStore(kv);
    const reader = new RedisQuotaStore(kv);

    writer.applyDeltas("client-redis-1", [{ metric: "aiCredits", amount: 2 }], (clientId) =>
      writer.get(clientId, month, emptyUsage),
    );

    const hydrated = reader.get("client-redis-1", month, emptyUsage);
    await reader.waitForHydration("client-redis-1");
    const afterHydrate = reader.get("client-redis-1", month, emptyUsage);

    expect(hydrated.usage.aiCredits).toBe(0);
    expect(afterHydrate.usage.aiCredits).toBe(2);
  });

  it("createQuotaStore returns RedisQuotaStore when redis url is set", () => {
    const prevStore = process.env.NSR_QUOTA_STORE;
    const prevUrl = process.env.NSR_REDIS_URL;
    process.env.NSR_QUOTA_STORE = "redis";
    process.env.NSR_REDIS_URL = "redis://127.0.0.1:6379";
    try {
      const store = createQuotaStore("redis");
      expect(store).toBeInstanceOf(RedisQuotaStore);
    } finally {
      process.env.NSR_QUOTA_STORE = prevStore;
      process.env.NSR_REDIS_URL = prevUrl;
    }
  });

  it("falls back to memory when redis url is missing", () => {
    const prevUrl = process.env.NSR_REDIS_URL;
    const prevRedis = process.env.REDIS_URL;
    delete process.env.NSR_REDIS_URL;
    delete process.env.REDIS_URL;
    try {
      const store = createQuotaStore("redis");
      expect(store).toBeInstanceOf(InMemoryQuotaStore);
    } finally {
      process.env.NSR_REDIS_URL = prevUrl;
      process.env.REDIS_URL = prevRedis;
    }
  });
});

describe("jobsdb simulation", () => {
  const prevSimulate = process.env.NSR_JOBSDB_SIMULATE;
  const prevApify = process.env.APIFY_API_TOKEN;

  afterEach(() => {
    process.env.NSR_JOBSDB_SIMULATE = prevSimulate;
    process.env.APIFY_API_TOKEN = prevApify;
  });

  it("enables simulation when NSR_JOBSDB_SIMULATE=1", () => {
    process.env.NSR_JOBSDB_SIMULATE = "1";
    process.env.APIFY_API_TOKEN = "token";
    expect(shouldSimulateJobsdbSearch()).toBe(true);
  });

  it("defaults to simulation when Apify token is missing", () => {
    delete process.env.NSR_JOBSDB_SIMULATE;
    delete process.env.APIFY_API_TOKEN;
    expect(shouldSimulateJobsdbSearch()).toBe(true);
  });

  it("builds deterministic fixture listings", () => {
    const jobs = buildSimulatedJobsdbListings("frontend", 2);
    expect(jobs).toHaveLength(2);
    expect(jobs[0].title).toContain("frontend");
    expect(jobs[0].url).toContain("jobsdb.com");
  });
});
