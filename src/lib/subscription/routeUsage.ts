import type { Request } from "express";
import { AI_CREDIT_COSTS, API_ROUTE_CREDIT_ACTION } from "./creditCosts";
import type { UsageMetric } from "./types";

const ROUTE_USAGE_METRIC: Record<string, UsageMetric> = {
  "/api/resume/parse-pdf": "pdfParse",
  "/api/cover-letter": "coverLetters",
  "/api/interview-prep": "interviewPrep",
  "/api/company-research": "companyResearch",
  "/api/jobsdb/search": "jobsdbSearch",
};

/** Usage increments applied on the server after a successful quota-protected POST. */
export function getUsageDeltasForRoute(
  path: string,
  req: Request,
): Array<{ metric: UsageMetric; amount: number }> {
  const deltas: Array<{ metric: UsageMetric; amount: number }> = [];
  const creditAction = API_ROUTE_CREDIT_ACTION[path];

  if (creditAction) {
    let cost = AI_CREDIT_COSTS[creditAction];
    if (path === "/api/ask-gemini") {
      const body = req.body as { thinkingMode?: boolean } | undefined;
      cost = body?.thinkingMode ? AI_CREDIT_COSTS.geminiThinking : AI_CREDIT_COSTS.geminiFlash;
      deltas.push({ metric: "geminiMessages", amount: 1 });
    }
    deltas.push({ metric: "aiCredits", amount: cost });

    if (creditAction === "coverLetter") deltas.push({ metric: "coverLetters", amount: 1 });
    if (creditAction === "interviewPrep") deltas.push({ metric: "interviewPrep", amount: 1 });
    if (creditAction === "companyResearch") deltas.push({ metric: "companyResearch", amount: 1 });
  }

  const routeMetric = ROUTE_USAGE_METRIC[path];
  if (routeMetric) {
    deltas.push({ metric: routeMetric, amount: 1 });
  }

  return deltas;
}

export const QUOTA_PROTECTED_PREFIXES = [
  "/api/resume/parse-pdf",
  "/api/jd/fetch-url",
  "/api/jobsdb/search",
  "/api/analyze",
  "/api/grammar-tone-check",
  "/api/readability-complexity",
  "/api/skill-job-consistency",
  "/api/match-analysis",
  "/api/cover-letter",
  "/api/interview-prep",
  "/api/company-research",
  "/api/ask-gemini",
] as const;

export function isQuotaProtectedPath(path: string): boolean {
  return QUOTA_PROTECTED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
