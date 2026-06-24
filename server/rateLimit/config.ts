export const RATE_LIMIT_WINDOW_MS = 60_000;

export function readRateLimitMax(): number {
  const parsed = Number(process.env.NSR_RATE_LIMIT_MAX);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60;
}

const EXEMPT_API_PATHS = new Set(["/api/subscription/sync", "/api/subscription/status"]);

export function isRateLimitExemptPath(apiPath: string): boolean {
  return EXEMPT_API_PATHS.has(apiPath);
}

export type RateLimitStoreKind = "memory" | "redis";

export function resolveRateLimitStoreKind(): RateLimitStoreKind {
  const raw = (process.env.NSR_RATE_LIMIT_STORE ?? "memory").toLowerCase();
  return raw === "redis" ? "redis" : "memory";
}
