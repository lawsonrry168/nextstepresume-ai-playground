import type { SystemLogType } from "../hooks/useMeasuredApi";

export type ApiOutcomeKey = "success" | "rejected" | "failed";

export function apiResponseLogLevel(status: number): SystemLogType {
  if (status >= 500 || status === 0) return "error";
  if (status >= 400) return "warn";
  return "info";
}

export function apiResponseOutcomeKey(status: number): ApiOutcomeKey {
  if (status >= 500 || status === 0) return "failed";
  if (status >= 400) return "rejected";
  return "success";
}
