import type { MonthlyUsage, SubscriptionPlan } from "../../src/lib/subscription/types.ts";

export interface ClientSubscriptionRecord {
  plan: SubscriptionPlan;
  month: string;
  usage: MonthlyUsage;
}

export interface QuotaStore {
  get(clientId: string, month: string, emptyUsage: () => MonthlyUsage): ClientSubscriptionRecord;
  updatePlan(
    clientId: string,
    plan: SubscriptionPlan,
    month: string,
    emptyUsage: () => MonthlyUsage,
  ): ClientSubscriptionRecord;
  replaceRecord(clientId: string, record: ClientSubscriptionRecord): void;
  applyDeltas(
    clientId: string,
    deltas: Array<{ metric: keyof MonthlyUsage; amount: number }>,
    getRecord: (clientId: string) => ClientSubscriptionRecord,
  ): ClientSubscriptionRecord;
  clear(): void;
  size(): number;
}
