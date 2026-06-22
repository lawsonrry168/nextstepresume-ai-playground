import type { MonthlyUsage } from "../../src/lib/subscription/types.ts";
import type { ClientSubscriptionRecord, QuotaStore } from "./types.ts";

export class InMemoryQuotaStore implements QuotaStore {
  private readonly records = new Map<string, ClientSubscriptionRecord>();

  get(clientId: string, month: string, emptyUsage: () => MonthlyUsage): ClientSubscriptionRecord {
    let record = this.records.get(clientId);
    if (!record || record.month !== month) {
      record = { plan: "starter", month, usage: emptyUsage() };
      this.records.set(clientId, record);
    }
    return record;
  }

  applyDeltas(
    clientId: string,
    deltas: Array<{ metric: keyof MonthlyUsage; amount: number }>,
    getRecord: (clientId: string) => ClientSubscriptionRecord,
  ): ClientSubscriptionRecord {
    const record = getRecord(clientId);
    for (const { metric, amount } of deltas) {
      if (amount <= 0) continue;
      record.usage[metric] = (record.usage[metric] ?? 0) + amount;
    }
    return record;
  }

  seed(clientId: string, record: ClientSubscriptionRecord): void {
    this.records.set(clientId, record);
  }

  clear(): void {
    this.records.clear();
  }

  size(): number {
    return this.records.size;
  }
}
