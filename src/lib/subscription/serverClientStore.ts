import type { Request } from "express";
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
  const headerId = req.header("X-NSR-Client-Id");
  if (isValidClientId(headerId)) return headerId!;
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  return `ip:${ip}`;
}

export function getClientRecord(clientId: string) {
  return quotaStore.get(clientId, currentUsageMonth(), emptyUsage);
}

export function setClientPlan(clientId: string, plan: SubscriptionPlan) {
  const record = getClientRecord(clientId);
  record.plan = plan;
  return record;
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
