import type { RedisKv } from "../quota/redisKv.ts";
import type { RateLimitDecision, RateLimitStore } from "./types.ts";

export class RedisRateLimitStore implements RateLimitStore {
  constructor(private readonly kv: RedisKv) {}

  async consume(key: string, windowMs: number, maxRequests: number): Promise<RateLimitDecision> {
    const bucket = Math.floor(Date.now() / windowMs);
    const redisKey = `nsr:ratelimit:${key}:${bucket}`;
    const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000));

    const count = await this.kv.incr(redisKey);
    if (count === 1) {
      await this.kv.expire(redisKey, ttlSeconds);
    }

    const resetAtMs = (bucket + 1) * windowMs;
    const allowed = count <= maxRequests;
    const remaining = Math.max(0, maxRequests - count);

    return {
      allowed,
      limit: maxRequests,
      remaining,
      resetAtMs,
    };
  }
}
