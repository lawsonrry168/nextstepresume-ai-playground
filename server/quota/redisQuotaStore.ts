import type { MonthlyUsage } from "../../src/lib/subscription/types.ts";
import { InMemoryQuotaStore } from "./inMemoryQuotaStore.ts";
import type { ClientSubscriptionRecord, QuotaStore } from "./types.ts";
import type { RedisKv } from "./redisKv.ts";

const KEY_PREFIX = "nsr:quota:";
const TTL_SECONDS = 60 * 60 * 24 * 45;

function quotaKey(clientId: string): string {
  return `${KEY_PREFIX}${clientId}`;
}

export class RedisQuotaStore implements QuotaStore {
  private readonly l1 = new InMemoryQuotaStore();
  private readonly hydrated = new Set<string>();
  private readonly hydrationWaiters = new Map<string, Array<() => void>>();

  constructor(
    private readonly kv: RedisKv,
    private readonly onPersistError: (err: unknown) => void = (err) => {
      console.error("[quota/redis] persist failed", err);
    },
  ) {}

  get(clientId: string, month: string, emptyUsage: () => MonthlyUsage): ClientSubscriptionRecord {
    void this.ensureHydrated(clientId, month, emptyUsage);
    return this.l1.get(clientId, month, emptyUsage);
  }

  applyDeltas(
    clientId: string,
    deltas: Array<{ metric: keyof MonthlyUsage; amount: number }>,
    getRecord: (clientId: string) => ClientSubscriptionRecord,
  ): ClientSubscriptionRecord {
    const record = this.l1.applyDeltas(clientId, deltas, getRecord);
    void this.persist(clientId, record);
    return record;
  }

  clear(): void {
    this.l1.clear();
    this.hydrated.clear();
    void this.kv.keys(`${KEY_PREFIX}*`).then((keys) => {
      if (keys.length > 0) {
        void this.kv.del(...keys);
      }
    });
  }

  size(): number {
    return this.l1.size();
  }

  /** Test helper — wait until background hydrate finishes for a client. */
  waitForHydration(clientId: string, timeoutMs = 2_000): Promise<void> {
    if (this.hydrated.has(clientId)) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Redis quota hydrate timeout for ${clientId}`));
      }, timeoutMs);
      const finish = () => {
        clearTimeout(timer);
        resolve();
      };
      const waiters = this.hydrationWaiters.get(clientId) ?? [];
      waiters.push(finish);
      this.hydrationWaiters.set(clientId, waiters);
    });
  }

  private notifyHydrated(clientId: string): void {
    this.hydrated.add(clientId);
    const waiters = this.hydrationWaiters.get(clientId) ?? [];
    this.hydrationWaiters.delete(clientId);
    for (const resolve of waiters) {
      resolve();
    }
  }

  private async ensureHydrated(
    clientId: string,
    month: string,
    emptyUsage: () => MonthlyUsage,
  ): Promise<void> {
    if (this.hydrated.has(clientId)) return;
    try {
      const raw = await this.kv.get(quotaKey(clientId));
      if (raw) {
        const parsed = JSON.parse(raw) as ClientSubscriptionRecord;
        if (parsed.month === month) {
          this.l1.seed(clientId, parsed);
        } else {
          this.l1.seed(clientId, {
            plan: parsed.plan,
            month,
            usage: emptyUsage(),
          });
        }
      }
    } catch (err) {
      this.onPersistError(err);
    } finally {
      this.notifyHydrated(clientId);
    }
  }

  private async persist(clientId: string, record: ClientSubscriptionRecord): Promise<void> {
    try {
      await this.kv.set(quotaKey(clientId), JSON.stringify(record), { EX: TTL_SECONDS });
    } catch (err) {
      this.onPersistError(err);
    }
  }
}
