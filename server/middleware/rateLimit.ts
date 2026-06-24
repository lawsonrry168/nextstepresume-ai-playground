import type { Request, Response, NextFunction } from "express";
import { createRateLimitStore } from "../rateLimit/createRateLimitStore.ts";
import {
  isRateLimitExemptPath,
  RATE_LIMIT_WINDOW_MS,
  readRateLimitMax,
} from "../rateLimit/config.ts";
import type { RateLimitStore } from "../rateLimit/types.ts";

let rateLimitStore: RateLimitStore = createRateLimitStore();

export function setRateLimitStoreForTests(store: RateLimitStore): void {
  rateLimitStore = store;
}

export function resetRateLimitStoreForTests(): void {
  rateLimitStore = createRateLimitStore("memory");
}

function writeRateLimitHeaders(
  res: Response,
  decision: { limit: number; remaining: number; resetAtMs: number },
): void {
  res.setHeader("RateLimit-Limit", String(decision.limit));
  res.setHeader("RateLimit-Remaining", String(decision.remaining));
  res.setHeader("RateLimit-Reset", String(Math.ceil(decision.resetAtMs / 1000)));
}

export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const apiPath = req.originalUrl.split("?")[0];
  if (isRateLimitExemptPath(apiPath)) {
    next();
    return;
  }

  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const maxRequests = readRateLimitMax();

  void rateLimitStore
    .consume(ip, RATE_LIMIT_WINDOW_MS, maxRequests)
    .then((decision) => {
      writeRateLimitHeaders(res, decision);
      if (!decision.allowed) {
        res.status(429).json({ error: "Too many requests. Please try again later." });
        return;
      }
      next();
    })
    .catch(next);
}
