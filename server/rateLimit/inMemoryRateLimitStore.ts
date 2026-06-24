import type { RateLimitDecision, RateLimitStore } from "./types.ts";

type Entry = { count: number; resetAt: number };

export class InMemoryRateLimitStore implements RateLimitStore {
  private readonly entries = new Map<string, Entry>();

  async consume(key: string, windowMs: number, maxRequests: number): Promise<RateLimitDecision> {
    const now = Date.now();
    let entry = this.entries.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      this.entries.set(key, entry);
    }

    entry.count += 1;
    const allowed = entry.count <= maxRequests;
    const remaining = Math.max(0, maxRequests - entry.count);

    return {
      allowed,
      limit: maxRequests,
      remaining,
      resetAtMs: entry.resetAt,
    };
  }
}
