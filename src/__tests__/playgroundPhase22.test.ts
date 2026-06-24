import { afterEach, describe, expect, it, vi } from "vitest";
import { canClientSyncPlan } from "../../server/billing/subscriptionSyncPolicy.ts";
import {
  getStripePriceIdForPlan,
  isStripeConfigured,
  resolvePlanFromStripePriceId,
} from "../../server/billing/stripeConfig.ts";
import {
  resolveClientIdFromStripeMetadata,
  resolvePlanFromCheckoutSession,
  resolvePlanFromSubscription,
} from "../../server/billing/stripePlanResolver.ts";
import { parseAppMode, readServerAppMode } from "../lib/appMode.ts";
import { RedisQuotaStore } from "../../server/quota/redisQuotaStore.ts";
import type { RedisKv } from "../../server/quota/redisKv.ts";
import { setClientPlan, setQuotaStoreForTests } from "../lib/subscription/serverClientStore.ts";

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
      /* no-op */
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

describe("phase 22 production foundation", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
    vi.unstubAllEnvs();
  });

  it("parseAppMode defaults to playground", () => {
    expect(parseAppMode(undefined)).toBe("playground");
    expect(parseAppMode("production")).toBe("production");
  });

  it("canClientSyncPlan blocks paid upgrades in production", () => {
    vi.stubEnv("NSR_APP_MODE", "production");
    expect(canClientSyncPlan("pro", "starter").ok).toBe(false);
    expect(canClientSyncPlan("starter", "pro").ok).toBe(true);
    expect(canClientSyncPlan("pro", "pro").ok).toBe(true);
  });

  it("canClientSyncPlan allows demo upgrades in playground", () => {
    vi.stubEnv("NSR_APP_MODE", "playground");
    expect(canClientSyncPlan("max", "starter").ok).toBe(true);
  });

  it("isStripeConfigured requires all billing env vars", () => {
    expect(isStripeConfigured()).toBe(false);
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_x");
    vi.stubEnv("STRIPE_PRICE_PRO_MONTHLY", "price_pro");
    vi.stubEnv("STRIPE_PRICE_MAX_MONTHLY", "price_max");
    expect(isStripeConfigured()).toBe(true);
    expect(getStripePriceIdForPlan("pro")).toBe("price_pro");
    expect(resolvePlanFromStripePriceId("price_max")).toBe("max");
  });

  it("resolvePlanFromCheckoutSession prefers metadata", () => {
    const plan = resolvePlanFromCheckoutSession({
      metadata: { nsr_plan: "pro", nsr_client_id: "abc" },
      line_items: { data: [{ price: { id: "price_max" } }] },
    });
    expect(plan).toBe("pro");
    expect(resolveClientIdFromStripeMetadata({ nsr_client_id: "abc" })).toBe("abc");
  });

  it("resolvePlanFromSubscription reads price id", () => {
    vi.stubEnv("STRIPE_PRICE_PRO_MONTHLY", "price_pro");
    const plan = resolvePlanFromSubscription({
      metadata: {},
      items: { data: [{ price: { id: "price_pro" } }] },
    });
    expect(plan).toBe("pro");
  });

  it("setClientPlan persists plan via quota store updatePlan", async () => {
    const kv = createFakeRedisKv();
    setQuotaStoreForTests(new RedisQuotaStore(kv));
    const clientId = "11111111-1111-4111-8111-111111111111";
    setClientPlan(clientId, "pro");
    await new RedisQuotaStore(kv).waitForPersist(clientId);
    expect(kv.store.has(`nsr:quota:${clientId}`)).toBe(true);
  });

  it("readServerAppMode reads NSR_APP_MODE", () => {
    vi.stubEnv("NSR_APP_MODE", "production");
    expect(readServerAppMode()).toBe("production");
  });
});
