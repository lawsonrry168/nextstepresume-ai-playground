import { describe, expect, it, beforeEach } from "vitest";
import {
  buildPlanCompareRows,
  getEntitlements,
  hasFeature,
  isTabAllowed,
  isTemplateAllowed,
  minimumPlanForFeature,
  STARTER_TEMPLATE_IDS,
} from "../lib/subscription/entitlements";
import {
  canConsume,
  consumeMetricsBatch,
  emptyUsage,
  readUsageLedger,
} from "../lib/subscription/usageLedger";
import { AI_CREDIT_COSTS } from "../lib/subscription/creditCosts";
import { checkApiQuota } from "../lib/subscription/serverQuota";
import {
  applyUsageDeltas,
  getClientRecord,
  resetClientStoreForTests,
  setClientPlan,
} from "../lib/subscription/serverClientStore";

function mockQuotaRequest(overrides: {
  plan?: string;
  usage?: ReturnType<typeof emptyUsage>;
  body?: Record<string, unknown>;
  clientId?: string;
}) {
  const clientId = overrides.clientId ?? "test-client-12345678";
  if (overrides.plan) {
    setClientPlan(clientId, overrides.plan as "starter" | "pro" | "max");
  }
  if (overrides.usage) {
    const record = getClientRecord(clientId);
    record.usage = { ...emptyUsage(), ...overrides.usage };
  }
  return {
    method: "POST",
    originalUrl: "/api/analyze",
    ip: "127.0.0.1",
    socket: { remoteAddress: "127.0.0.1" },
    header: (name: string) => {
      if (name === "X-NSR-Client-Id") return clientId;
      return undefined;
    },
    body: overrides.body ?? { intensity: "balanced" },
  } as unknown as import("express").Request;
}

describe("subscription entitlements", () => {
  it("starter includes core editor and limited AI", () => {
    expect(hasFeature("starter", "editor.full")).toBe(true);
    expect(hasFeature("starter", "ai.tailor")).toBe(true);
    expect(hasFeature("starter", "export.docx")).toBe(false);
    expect(hasFeature("starter", "layout.canvasStudio")).toBe(false);
  });

  it("pro unlocks tracker, exports, and JobsDB HK search", () => {
    expect(hasFeature("pro", "tracker")).toBe(true);
    expect(hasFeature("pro", "export.docx")).toBe(true);
    expect(hasFeature("pro", "import.jobsdb")).toBe(true);
    expect(getEntitlements("pro").limits.jobsdbSearch).toBe(30);
    expect(hasFeature("pro", "layout.canvasStudio")).toBe(false);
  });

  it("max unlocks canvas studio and thinking", () => {
    expect(hasFeature("max", "layout.canvasStudio")).toBe(true);
    expect(hasFeature("max", "ai.geminiThinking")).toBe(true);
    expect(hasFeature("max", "import.jobsdb")).toBe(true);
  });

  it("restricts starter templates", () => {
    expect(isTemplateAllowed("starter", "modern-01")).toBe(true);
    expect(isTemplateAllowed("starter", "modern-04")).toBe(false);
    expect(isTemplateAllowed("pro", "classic-05")).toBe(true);
    expect(STARTER_TEMPLATE_IDS.length).toBe(3);
  });

  it("locks applications tab on starter", () => {
    expect(isTabAllowed("starter", "applications")).toBe(false);
    expect(isTabAllowed("pro", "applications")).toBe(true);
  });

  it("allows tools tab when any tool feature is enabled", () => {
    expect(isTabAllowed("starter", "tools")).toBe(false);
    expect(isTabAllowed("pro", "tools")).toBe(true);
  });

  it("builds pricing compare rows from entitlements", () => {
    const rows = buildPlanCompareRows();
    const aiRow = rows.find((row) => row.key === "aiCredits");
    expect(aiRow).toEqual({ key: "aiCredits", starter: "3", pro: "80", max: "300" });
    const templateRow = rows.find((row) => row.key === "templates");
    expect(templateRow?.starter).toBe(String(STARTER_TEMPLATE_IDS.length));
    expect(templateRow?.pro).toBe("all");
    const jobsdbRow = rows.find((row) => row.key === "jobsdb");
    expect(jobsdbRow).toEqual({ key: "jobsdb", starter: "no", pro: "30", max: "100" });
  });

  it("enforces starter AI credit quota", () => {
    const usage = { ...emptyUsage(), aiCredits: 3 };
    const check = canConsume("starter", "aiCredits", usage, AI_CREDIT_COSTS.tailor);
    expect(check.ok).toBe(false);
    expect(check.reason).toBe("quota_exceeded");
  });

  it("resolves minimum plan for features", () => {
    expect(minimumPlanForFeature("export.docx")).toBe("pro");
    expect(minimumPlanForFeature("import.jobsdb")).toBe("pro");
    expect(minimumPlanForFeature("layout.canvasStudio")).toBe("max");
  });

  it("starter limits match entitlements config", () => {
    expect(getEntitlements("starter").limits.aiCredits).toBe(3);
    expect(getEntitlements("pro").limits.aiCredits).toBe(80);
  });
});

describe("server quota middleware", () => {
  beforeEach(() => {
    resetClientStoreForTests();
  });

  it("blocks docx-related AI on starter for cover letter route", () => {
    const req = {
      method: "POST",
      originalUrl: "/api/cover-letter",
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
      header: (name: string) => {
        if (name === "X-NSR-Client-Id") return "test-client-12345678";
        return undefined;
      },
      body: {},
    } as unknown as import("express").Request;

    const result = checkApiQuota("/api/cover-letter", req);
    expect(result.ok).toBe(false);
    expect(result.code).toBe("feature_locked");
  });

  it("allows analyze when starter has credits on server store", () => {
    const req = mockQuotaRequest({ plan: "starter" });
    const result = checkApiQuota("/api/analyze", req);
    expect(result.ok).toBe(true);
  });

  it("increments server usage after successful route", () => {
    const clientId = "quota-inc-client-1";
    setClientPlan(clientId, "pro");
    applyUsageDeltas(clientId, [{ metric: "aiCredits", amount: AI_CREDIT_COSTS.tailor }]);
    const record = getClientRecord(clientId);
    expect(record.usage.aiCredits).toBe(AI_CREDIT_COSTS.tailor);
  });

  it("blocks gemini when message quota exceeded", () => {
    const clientId = "gemini-limit-client";
    setClientPlan(clientId, "pro");
    const record = getClientRecord(clientId);
    record.usage.geminiMessages = 30;
    const req = {
      method: "POST",
      originalUrl: "/api/ask-gemini",
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
      header: (name: string) => (name === "X-NSR-Client-Id" ? clientId : undefined),
      body: { thinkingMode: false },
    } as unknown as import("express").Request;
    const result = checkApiQuota("/api/ask-gemini", req);
    expect(result.ok).toBe(false);
    expect(result.code).toBe("quota_exceeded");
  });
});

describe("consumeMetricsBatch", () => {
  it("rolls back when any metric would exceed quota", () => {
    const ledger = readUsageLedger();
    const exhausted = { ...emptyUsage(), aiCredits: 3 };
    const partial = consumeMetricsBatch("starter", { month: ledger.month, usage: exhausted }, [
      { metric: "aiCredits", amount: 1 },
      { metric: "aiCredits", amount: 1 },
    ]);
    expect(partial.result.ok).toBe(false);
    expect(partial.ledger.usage.aiCredits).toBe(3);
  });

  it("applies multiple metrics atomically", () => {
    const ledger = readUsageLedger();
    const { ledger: next, result } = consumeMetricsBatch("pro", ledger, [
      { metric: "aiCredits", amount: 2 },
      { metric: "geminiMessages", amount: 1 },
    ]);
    expect(result.ok).toBe(true);
    expect(next.usage.aiCredits).toBe(2);
    expect(next.usage.geminiMessages).toBe(1);
  });
});
