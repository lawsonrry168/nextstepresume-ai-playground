import { createRedisKv, resolveRedisUrl } from "../quota/redisClient.ts";
import { InMemoryRateLimitStore } from "./inMemoryRateLimitStore.ts";
import { RedisRateLimitStore } from "./redisRateLimitStore.ts";
import type { RateLimitStoreKind } from "./config.ts";
import { resolveRateLimitStoreKind } from "./config.ts";
import type { RateLimitStore } from "./types.ts";

export function createRateLimitStore(
  kind: RateLimitStoreKind = resolveRateLimitStoreKind(),
): RateLimitStore {
  if (kind === "redis") {
    const url = resolveRedisUrl();
    if (!url) {
      console.warn(
        "[rate-limit] NSR_RATE_LIMIT_STORE=redis but NSR_REDIS_URL (or REDIS_URL) is missing — using in-memory store.",
      );
      return new InMemoryRateLimitStore();
    }
    return new RedisRateLimitStore(createRedisKv(url));
  }
  return new InMemoryRateLimitStore();
}
