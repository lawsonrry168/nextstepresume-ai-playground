import type { AppMode } from "../appMode";
import type { SubscriptionPlan } from "./types";

export function resolveEffectiveClientPlan(options: {
  appConfigLoaded: boolean;
  appMode: AppMode;
  trustedServerPlan: SubscriptionPlan;
  trustedServerPlanReady: boolean;
}): SubscriptionPlan {
  const { appConfigLoaded, appMode, trustedServerPlan, trustedServerPlanReady } = options;

  if (!appConfigLoaded) return "starter";
  if (appMode === "playground") return "max";
  if (!trustedServerPlanReady) return "starter";
  return trustedServerPlan;
}
