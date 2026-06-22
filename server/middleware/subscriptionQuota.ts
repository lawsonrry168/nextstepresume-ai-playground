import type { Request, Response, NextFunction } from "express";
import { checkApiQuota, wrapQuotaResponse } from "../../src/lib/subscription/serverQuota.ts";
import { isQuotaProtectedPath } from "../../src/lib/subscription/routeUsage.ts";

export function subscriptionQuota(req: Request, res: Response, next: NextFunction): void {
  if (req.method !== "POST") {
    next();
    return;
  }

  const apiPath = req.originalUrl.split("?")[0];
  if (!isQuotaProtectedPath(apiPath)) {
    next();
    return;
  }

  const check = checkApiQuota(apiPath, req);
  if (!check.ok) {
    res.status(check.status ?? 402).json({
      error: check.error,
      code: check.code,
      plan: check.plan,
    });
    return;
  }

  wrapQuotaResponse(req, res);
  next();
}
