export type QuotaErrorCode = "feature_locked" | "quota_exceeded";

export class QuotaError extends Error {
  readonly code: QuotaErrorCode;
  readonly plan?: string;

  constructor(code: QuotaErrorCode, message: string, plan?: string) {
    super(message);
    this.name = "QuotaError";
    this.code = code;
    this.plan = plan;
  }
}

export function isQuotaError(err: unknown): err is QuotaError {
  return err instanceof QuotaError;
}
