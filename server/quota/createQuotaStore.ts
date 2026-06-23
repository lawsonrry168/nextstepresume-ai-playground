import { InMemoryQuotaStore } from "./inMemoryQuotaStore.ts";
import { createRedisKv, resolveRedisUrl } from "./redisClient.ts";
import { RedisQuotaStore } from "./redisQuotaStore.ts";
import type { QuotaStore } from "./types.ts";

export type QuotaStoreKind = "memory" | "redis";

export function resolveQuotaStoreKind(): QuotaStoreKind {
  const raw = (process.env.NSR_QUOTA_STORE ?? "memory").toLowerCase();
  return raw === "redis" ? "redis" : "memory";
}

/**
 * Factory for server-side subscription quota persistence.
 * Redis uses an L1 in-process cache with write-through for sync Express middleware.
 */
export function createQuotaStore(kind: QuotaStoreKind = resolveQuotaStoreKind()): QuotaStore {
  if (kind === "redis") {
    const url = resolveRedisUrl();
    if (!url) {
      console.warn(
        "[quota] NSR_QUOTA_STORE=redis but NSR_REDIS_URL (or REDIS_URL) is missing — using in-memory store.",
      );
      return new InMemoryQuotaStore();
    }
    return new RedisQuotaStore(createRedisKv(url));
  }
  return new InMemoryQuotaStore();
}
