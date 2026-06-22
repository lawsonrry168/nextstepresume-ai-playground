import type { Request, Response } from "express";
import { AI_CREDIT_COSTS, API_ROUTE_CREDIT_ACTION } from "./creditCosts";
import { getUsageLimit, hasFeature } from "./entitlements";
import { getUsageDeltasForRoute, isQuotaProtectedPath } from "./routeUsage";
import { applyUsageDeltas, getClientRecord, resolveClientId } from "./serverClientStore";
import { canConsume } from "./usageLedger";
import type { FeatureId, SubscriptionPlan } from "./types";

export interface QuotaCheckResult {
  ok: boolean;
  status?: number;
  error?: string;
  code?: "feature_locked" | "quota_exceeded";
  plan?: SubscriptionPlan;
}

const ROUTE_FEATURE: Record<string, FeatureId> = {
  "/api/jd/fetch-url": "import.jdUrl",
  "/api/jobsdb/search": "import.jobsdb",
  "/api/analyze": "ai.tailor",
  "/api/match-analysis": "ai.match",
  "/api/grammar-tone-check": "ai.auditBundle",
  "/api/readability-complexity": "ai.auditBundle",
  "/api/skill-job-consistency": "ai.auditBundle",
  "/api/cover-letter": "ai.coverLetter",
  "/api/interview-prep": "ai.interviewPrep",
  "/api/company-research": "ai.companyResearch",
  "/api/ask-gemini": "ai.geminiChat",
};

const ROUTE_USAGE_METRIC: Record<string, keyof import("./types").MonthlyUsage> = {
  "/api/resume/parse-pdf": "pdfParse",
  "/api/cover-letter": "coverLetters",
  "/api/interview-prep": "interviewPrep",
  "/api/company-research": "companyResearch",
  "/api/jobsdb/search": "jobsdbSearch",
};

export function attachClientId(req: Request): string {
  const clientId = resolveClientId(req);
  (req as Request & { nsrClientId?: string }).nsrClientId = clientId;
  return clientId;
}

export function getRequestClientId(req: Request): string | undefined {
  return (req as Request & { nsrClientId?: string }).nsrClientId;
}

export function checkApiQuota(path: string, req: Request): QuotaCheckResult {
  const clientId = attachClientId(req);
  const record = getClientRecord(clientId);
  const { plan, usage } = record;

  const feature = ROUTE_FEATURE[path];
  if (feature && !hasFeature(plan, feature)) {
    return {
      ok: false,
      status: 402,
      code: "feature_locked",
      error: "This feature requires a paid plan.",
      plan,
    };
  }

  const creditAction = API_ROUTE_CREDIT_ACTION[path];
  if (creditAction) {
    let cost = AI_CREDIT_COSTS[creditAction];
    if (path === "/api/ask-gemini") {
      const body = req.body as { thinkingMode?: boolean } | undefined;
      cost = body?.thinkingMode ? AI_CREDIT_COSTS.geminiThinking : AI_CREDIT_COSTS.geminiFlash;
      if (body?.thinkingMode && !hasFeature(plan, "ai.geminiThinking")) {
        return {
          ok: false,
          status: 402,
          code: "feature_locked",
          error: "Gemini Thinking Mode requires Max plan.",
          plan,
        };
      }
      const geminiCheck = canConsume(plan, "geminiMessages", usage, 1);
      if (!geminiCheck.ok) {
        return {
          ok: false,
          status: 402,
          code: geminiCheck.reason,
          error: "Monthly Gemini message limit reached.",
          plan,
        };
      }
    }
    const check = canConsume(plan, "aiCredits", usage, cost);
    if (!check.ok) {
      return {
        ok: false,
        status: 402,
        code: check.reason,
        error:
          check.reason === "quota_exceeded"
            ? "Monthly AI credit limit reached."
            : "AI features are not available on your plan.",
        plan,
      };
    }
    return { ok: true, plan };
  }

  const metric = ROUTE_USAGE_METRIC[path];
  if (metric) {
    const check = canConsume(plan, metric, usage, 1);
    if (!check.ok) {
      return {
        ok: false,
        status: 402,
        code: check.reason,
        error: "Monthly usage limit reached for this action.",
        plan,
      };
    }
  }

  return { ok: true, plan };
}

function setQuotaHeaders(req: Request, res: Response): void {
  const clientId = getRequestClientId(req);
  if (!clientId) return;
  const apiPath = req.originalUrl.split("?")[0];
  if (!isQuotaProtectedPath(apiPath)) return;
  const deltas = getUsageDeltasForRoute(apiPath, req);
  const record = applyUsageDeltas(clientId, deltas);
  res.setHeader("X-NSR-Plan", record.plan);
  res.setHeader("X-NSR-Usage-Month", record.month);
  res.setHeader("X-NSR-Usage", JSON.stringify(record.usage));
}

/** Wrap response methods so successful quota-protected calls increment server usage. */
export function wrapQuotaResponse(req: Request, res: Response): void {
  const tagged = res as Response & { __nsrQuotaWrapped?: boolean };
  if (tagged.__nsrQuotaWrapped) return;
  tagged.__nsrQuotaWrapped = true;

  const maybeApply = () => {
    if (res.statusCode < 200 || res.statusCode >= 300) return;
    setQuotaHeaders(req, res);
  };

  const origJson = res.json.bind(res);
  res.json = function jsonWithQuota(...args: Parameters<typeof origJson>) {
    maybeApply();
    return origJson(...args);
  };

  const origSend = res.send.bind(res);
  res.send = function sendWithQuota(...args: Parameters<typeof origSend>) {
    maybeApply();
    return origSend(...args);
  };
}

export function getPlanLimitsSummary(plan: SubscriptionPlan) {
  return {
    plan,
    aiCredits: getUsageLimit(plan, "aiCredits"),
    geminiMessages: getUsageLimit(plan, "geminiMessages"),
  };
}
