import type { Request } from "express";
import type { MonthlyUsage, SubscriptionPlan } from "./types";
import { currentUsageMonth, emptyUsage } from "./usageLedger";
import { isValidClientId } from "./clientId";

export interface ClientSubscriptionRecord {
  plan: SubscriptionPlan;
  month: string;
  usage: MonthlyUsage;
}

const store = new Map<string, ClientSubscriptionRecord>();

export function resolveClientId(req: Pick<Request, "header" | "ip" | "socket">): string {
  const headerId = req.header("X-NSR-Client-Id");
  if (isValidClientId(headerId)) return headerId!;
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  return `ip:${ip}`;
}

export function getClientRecord(clientId: string): ClientSubscriptionRecord {
  const month = currentUsageMonth();
  let record = store.get(clientId);
  if (!record || record.month !== month) {
    record = { plan: "starter", month, usage: emptyUsage() };
    store.set(clientId, record);
  }
  return record;
}

export function setClientPlan(clientId: string, plan: SubscriptionPlan): ClientSubscriptionRecord {
  const record = getClientRecord(clientId);
  record.plan = plan;
  return record;
}

export function applyUsageDeltas(
  clientId: string,
  deltas: Array<{ metric: keyof MonthlyUsage; amount: number }>,
): ClientSubscriptionRecord {
  const record = getClientRecord(clientId);
  for (const { metric, amount } of deltas) {
    if (amount <= 0) continue;
    record.usage[metric] = (record.usage[metric] ?? 0) + amount;
  }
  return record;
}

export function resetClientStoreForTests(): void {
  store.clear();
}

export function getClientStoreSize(): number {
  return store.size;
}
