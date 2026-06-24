import { afterEach, describe, expect, it, vi } from "vitest";
import { canClientSyncPlan } from "../../server/billing/subscriptionSyncPolicy.ts";
import { clientIdFromUserId } from "../../server/lib/supabaseAdmin.ts";
import { isSupabaseConfigured, isAuthRequired } from "../../server/auth/supabaseConfig.ts";
import { getClientRecord, mergeClientQuota, setClientPlan, setQuotaStoreForTests } from "../lib/subscription/serverClientStore.ts";
import { createQuotaStore } from "../../server/quota/createQuotaStore.ts";
import { getBearerToken } from "../../server/auth/requestAuth.ts";
import { isPublicApiPath } from "../../server/auth/requestAuth.ts";

describe("phase 23 supabase auth", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
    vi.unstubAllEnvs();
    setQuotaStoreForTests(createQuotaStore("memory"));
  });

  it("isSupabaseConfigured requires url, anon, and service role keys", () => {
    expect(isSupabaseConfigured()).toBe(false);
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
    expect(isSupabaseConfigured()).toBe(true);
  });

  it("isAuthRequired respects NSR_AUTH_REQUIRED", () => {
    vi.stubEnv("NSR_AUTH_REQUIRED", "1");
    expect(isAuthRequired()).toBe(true);
    vi.stubEnv("NSR_AUTH_REQUIRED", "0");
    expect(isAuthRequired()).toBe(false);
  });

  it("clientIdFromUserId uses supabase user id", () => {
    const userId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    expect(clientIdFromUserId(userId)).toBe(userId);
  });

  it("getBearerToken parses Authorization header", () => {
    const req = {
      header: (name: string) => (name === "Authorization" ? "Bearer test-token" : undefined),
    } as Parameters<typeof getBearerToken>[0];
    expect(getBearerToken(req)).toBe("test-token");
    expect(getBearerToken({ header: () => undefined } as Parameters<typeof getBearerToken>[0])).toBeNull();
  });

  it("public api paths bypass auth requirement checks", () => {
    expect(isPublicApiPath("/api/health")).toBe(true);
    expect(isPublicApiPath("/api/config")).toBe(true);
    expect(isPublicApiPath("/api/billing/webhook")).toBe(true);
    expect(isPublicApiPath("/api/analyze")).toBe(false);
  });

  it("mergeClientQuota keeps higher plan and max usage", () => {
    const anon = "11111111-1111-4111-8111-111111111111";
    const user = "22222222-2222-4222-8222-222222222222";
    setClientPlan(anon, "pro");
    setClientPlan(user, "starter");
    mergeClientQuota(anon, user);
    expect(getClientRecord(user).plan).toBe("pro");
  });

  it("canClientSyncPlan still blocks paid upgrades in production", () => {
    vi.stubEnv("NSR_APP_MODE", "production");
    expect(canClientSyncPlan("max", "starter").ok).toBe(false);
  });
});
