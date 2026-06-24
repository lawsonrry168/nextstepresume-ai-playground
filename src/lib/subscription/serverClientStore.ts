import type { Request } from "express";
import { getNsrAuth } from "../../../server/auth/requestAuth.ts";
import { createQuotaStore } from "../../../server/quota/createQuotaStore.ts";
import type { QuotaStore } from "../../../server/quota/types.ts";
import type { MonthlyUsage, SubscriptionPlan } from "./types";
import { currentUsageMonth, emptyUsage } from "./usageLedger";
import { isValidClientId } from "./clientId";

export type { ClientSubscriptionRecord } from "../../../server/quota/types.ts";

let quotaStore: QuotaStore = createQuotaStore();

export function setQuotaStoreForTests(store: QuotaStore): void {
  quotaStore = store;
}

export function resetQuotaStoreForTests(): void {
  quotaStore = createQuotaStore("memory");
}

export function resolveClientId(req: Pick<Request, "header" | "ip" | "socket">): string {
  const authed = getNsrAuth(req as Request);
  if (authed?.clientId) return authed.clientId;

  const tagged = req as Request & { nsrClientId?: string };
  if (tagged.nsrClientId) return tagged.nsrClientId;

  const headerId = req.header("X-NSR-Client-Id");
  if (isValidClientId(headerId)) return headerId!;
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  return `ip:${ip}`;
}

export function getClientRecord(clientId: string) {
  return quotaStore.get(clientId, currentUsageMonth(), emptyUsage);
}

export function setClientPlan(clientId: string, plan: SubscriptionPlan) {
  const month = currentUsageMonth();
  return quotaStore.updatePlan(clientId, plan, month, emptyUsage);
}

export function mergeClientQuota(fromClientId: string, toClientId: string): void {
  if (fromClientId === toClientId) return;
  const month = currentUsageMonth();
  const fromRecord = quotaStore.get(fromClientId, month, emptyUsage);
  const toRecord = quotaStore.get(toClientId, month, emptyUsage);

  const mergedPlan =
    planRank(fromRecord.plan) >= planRank(toRecord.plan) ? fromRecord.plan : toRecord.plan;

  const mergedUsage = { ...toRecord.usage };
  for (const key of Object.keys(fromRecord.usage) as Array<keyof MonthlyUsage>) {
    mergedUsage[key] = Math.max(fromRecord.usage[key] ?? 0, toRecord.usage[key] ?? 0);
  }

  quotaStore.replaceRecord(toClientId, {
    plan: mergedPlan,
    month,
    usage: mergedUsage,
  });
}

function planRank(plan: SubscriptionPlan): number {
  if (plan === "max") return 3;
  if (plan === "pro") return 2;
  return 1;
}

export function applyUsageDeltas(
  clientId: string,
  deltas: Array<{ metric: keyof MonthlyUsage; amount: number }>,
) {
  return quotaStore.applyDeltas(clientId, deltas, getClientRecord);
}

export function resetClientStoreForTests(): void {
  resetQuotaStoreForTests();
}

export function getClientStoreSize(): number {
  return quotaStore.size();
}
