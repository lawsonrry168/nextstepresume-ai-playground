import type { SubscriptionSnapshot } from "./subscription/types";
import { currentUsageMonth, emptyUsage, readStoredPlan } from "./subscription/usageLedger";

let snapshot: SubscriptionSnapshot = {
  plan: readStoredPlan(),
  usage: emptyUsage(),
  usageMonth: currentUsageMonth(),
};

export function getSubscriptionSnapshot(): SubscriptionSnapshot {
  return snapshot;
}

export function setSubscriptionSnapshot(next: SubscriptionSnapshot): void {
  snapshot = next;
}
