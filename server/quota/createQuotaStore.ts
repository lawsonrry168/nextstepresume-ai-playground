import { InMemoryQuotaStore } from "./inMemoryQuotaStore.ts";
import type { QuotaStore } from "./types.ts";

export type QuotaStoreKind = "memory" | "redis";

export function resolveQuotaStoreKind(): QuotaStoreKind {
  const raw = (process.env.NSR_QUOTA_STORE ?? "memory").toLowerCase();
  return raw === "redis" ? "redis" : "memory";
}

/**
 * Factory for server-side subscription quota persistence.
 * Redis is reserved for production multi-instance deploys; falls back to memory in playground.
 */
export function createQuotaStore(kind: QuotaStoreKind = resolveQuotaStoreKind()): QuotaStore {
  if (kind === "redis") {
    console.warn(
      "[quota] NSR_QUOTA_STORE=redis is not implemented yet — using in-memory store. " +
        "Set NSR_QUOTA_STORE=memory or omit for playground.",
    );
  }
  return new InMemoryQuotaStore();
}
