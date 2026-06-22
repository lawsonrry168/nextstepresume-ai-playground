import type { ApiResponseMeta } from "../types";
import { QuotaError, type QuotaErrorCode } from "./api/quotaError";
import { emitQuotaBlocked, mapQuotaCodeToReason } from "../lib/subscription/quotaEvents";

export interface ParsedApiResult<T> {
  data: T;
  meta?: ApiResponseMeta;
  usedFallback: boolean;
}

function stripMeta<T extends Record<string, unknown>>(raw: T): { data: Omit<T, "meta">; meta?: ApiResponseMeta } {
  const { meta, ...rest } = raw as T & { meta?: ApiResponseMeta };
  return { data: rest as Omit<T, "meta">, meta };
}

function throwQuotaError(response: Response, raw: unknown): never {
  const body = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const code = (body.code as QuotaErrorCode | undefined) ?? "quota_exceeded";
  const message =
    typeof body.error === "string" ? body.error : "This action requires an upgrade or more quota.";
  const plan = typeof body.plan === "string" ? body.plan : undefined;
  const reason = mapQuotaCodeToReason(code, response.url);
  emitQuotaBlocked(reason, { code, plan });
  throw new QuotaError(code, message, plan);
}

/**
 * Parse JSON API responses, using server-provided fallback payloads on error.
 */
export async function parseApiJson<T>(response: Response): Promise<ParsedApiResult<T>> {
  const raw = await response.json();

  if (response.status === 429) {
    throw new Error("請求過於頻繁，請稍後再試（每分鐘上限 60 次）");
  }

  if (response.status === 402) {
    throwQuotaError(response, raw);
  }

  if (!response.ok) {
    if (raw && typeof raw === "object" && raw.fallback !== undefined) {
      return {
        data: raw.fallback as T,
        meta: { source: "simulation", simulated: true },
        usedFallback: true,
      };
    }
    const message =
      raw && typeof raw === "object" && raw.error
        ? String(raw.error)
        : `Server returned status ${response.status}`;
    throw new Error(message);
  }

  if (raw && typeof raw === "object" && "meta" in raw) {
    const { data, meta } = stripMeta(raw as Record<string, unknown> & { meta?: ApiResponseMeta });
    return {
      data: data as T,
      meta,
      usedFallback: meta?.simulated === true || meta?.source === "simulation",
    };
  }

  return { data: raw as T, usedFallback: false };
}

/**
 * Ask-gemini returns `reply` (not `fallback`) on server errors.
 */
export async function parseAskGeminiReply(response: Response): Promise<{ reply: string; usedFallback: boolean }> {
  const raw = await response.json();

  if (response.status === 429) {
    throw new Error("請求過於頻繁，請稍後再試");
  }

  if (response.status === 402) {
    throwQuotaError(response, raw);
  }

  if (!response.ok) {
    if (raw && typeof raw === "object" && typeof raw.reply === "string") {
      return { reply: raw.reply, usedFallback: true };
    }
    throw new Error(
      raw && typeof raw === "object" && raw.error
        ? String(raw.error)
        : `Server returned status ${response.status}`
    );
  }

  if (raw && typeof raw === "object" && typeof raw.reply === "string") {
    const usedFallback = raw.meta?.source === "simulation";
    return { reply: raw.reply, usedFallback };
  }

  throw new Error("Invalid ask-gemini response");
}
