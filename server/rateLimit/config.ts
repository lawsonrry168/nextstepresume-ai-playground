export const RATE_LIMIT_WINDOW_MS = 60_000;

export function readRateLimitMax(): number {
  const parsed = Number(process.env.NSR_RATE_LIMIT_MAX);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  if (process.env.NODE_ENV !== "production") return 1000;
  return 60;
}

const EXEMPT_API_PATHS = new Set([
  "/api/health",
  "/api/config",
  "/api/subscription/sync",
  "/api/subscription/status",
]);

export function isRateLimitExemptPath(apiPath: string): boolean {
  if (EXEMPT_API_PATHS.has(apiPath)) return true;
  if (process.env.NSR_JOBSDB_SIMULATE === "1" && apiPath === "/api/jobsdb/search") return true;
  return false;
}

export type RateLimitStoreKind = "memory" | "redis";

export function resolveRateLimitStoreKind(): RateLimitStoreKind {
  const raw = (process.env.NSR_RATE_LIMIT_STORE ?? "memory").toLowerCase();
  return raw === "redis" ? "redis" : "memory";
}
