import { afterEach, describe, expect, it } from "vitest";
import { createRateLimitStore } from "../../server/rateLimit/createRateLimitStore.ts";
import { resolveRateLimitStoreKind } from "../../server/rateLimit/config.ts";
import { InMemoryRateLimitStore } from "../../server/rateLimit/inMemoryRateLimitStore.ts";
import { RedisRateLimitStore } from "../../server/rateLimit/redisRateLimitStore.ts";
import type { RedisKv } from "../../server/quota/redisKv.ts";
import {
  resetRateLimitStoreForTests,
  setRateLimitStoreForTests,
} from "../../server/middleware/rateLimit.ts";

describe("phase 26 redis rate limiting", () => {
  afterEach(() => {
    resetRateLimitStoreForTests();
  });

  it("resolveRateLimitStoreKind reads NSR_RATE_LIMIT_STORE", () => {
    const prev = process.env.NSR_RATE_LIMIT_STORE;
    process.env.NSR_RATE_LIMIT_STORE = "redis";
    expect(resolveRateLimitStoreKind()).toBe("redis");
    process.env.NSR_RATE_LIMIT_STORE = "memory";
    expect(resolveRateLimitStoreKind()).toBe("memory");
    if (prev === undefined) delete process.env.NSR_RATE_LIMIT_STORE;
    else process.env.NSR_RATE_LIMIT_STORE = prev;
  });

  it("createRateLimitStore falls back to memory without redis url", () => {
    const prevStore = process.env.NSR_RATE_LIMIT_STORE;
    const prevUrl = process.env.NSR_REDIS_URL;
    process.env.NSR_RATE_LIMIT_STORE = "redis";
    delete process.env.NSR_REDIS_URL;
    delete process.env.REDIS_URL;
    const store = createRateLimitStore("redis");
    expect(store).toBeInstanceOf(InMemoryRateLimitStore);
    if (prevStore === undefined) delete process.env.NSR_RATE_LIMIT_STORE;
    else process.env.NSR_RATE_LIMIT_STORE = prevStore;
    if (prevUrl === undefined) delete process.env.NSR_REDIS_URL;
    else process.env.NSR_REDIS_URL = prevUrl;
  });

  it("in-memory store enforces per-key limits", async () => {
    const store = new InMemoryRateLimitStore();
    const first = await store.consume("127.0.0.1", 60_000, 2);
    const second = await store.consume("127.0.0.1", 60_000, 2);
    const third = await store.consume("127.0.0.1", 60_000, 2);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("redis store uses incr + expire via kv adapter", async () => {
    const counts = new Map<string, number>();
    const kv: RedisKv = {
      get: async () => null,
      set: async () => undefined,
      incr: async (key) => {
        const next = (counts.get(key) ?? 0) + 1;
        counts.set(key, next);
        return next;
      },
      expire: async () => undefined,
      keys: async () => [],
      del: async () => undefined,
    };

    const store = new RedisRateLimitStore(kv);
    const a = await store.consume("10.0.0.1", 60_000, 2);
    const b = await store.consume("10.0.0.1", 60_000, 2);
    const c = await store.consume("10.0.0.1", 60_000, 2);

    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);
    expect(c.allowed).toBe(false);
    expect(counts.size).toBe(1);
  });

  it("middleware test hook accepts injected store", async () => {
    const store = new InMemoryRateLimitStore();
    setRateLimitStoreForTests(store);
    const decision = await store.consume("test-ip", 60_000, 5);
    expect(decision.allowed).toBe(true);
  });
});
