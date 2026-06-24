export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAtMs: number;
}

export interface RateLimitStore {
  consume(key: string, windowMs: number, maxRequests: number): Promise<RateLimitDecision>;
}
