import { readServerAppMode, isProductionAppMode } from "../../src/lib/appMode.ts";
import type { SubscriptionPlan } from "../../src/lib/subscription/types.ts";

export function canClientSyncPlan(
  requested: SubscriptionPlan,
  current: SubscriptionPlan,
): { ok: true } | { ok: false; code: "billing_required" } {
  if (!isProductionAppMode(readServerAppMode())) {
    return { ok: true };
  }
  if (requested === "starter" || requested === current) {
    return { ok: true };
  }
  return { ok: false, code: "billing_required" };
}
