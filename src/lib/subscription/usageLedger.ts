import { NSR_STORAGE_KEYS } from "../storageKeys";
import { setSubscriptionSnapshot } from "../subscriptionSnapshot";
import type {
  ConsumeResult,
  MonthlyUsage,
  SubscriptionPlan,
  SubscriptionSnapshot,
  UsageMetric,
} from "./types";
import { getEntitlements, getUsageLimit } from "./entitlements";

export function currentUsageMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function emptyUsage(): MonthlyUsage {
  return {
    aiCredits: 0,
    geminiMessages: 0,
    coverLetters: 0,
    interviewPrep: 0,
    companyResearch: 0,
    pdfParse: 0,
    pdfVisualExport: 0,
    pdfAtsExport: 0,
    docxExport: 0,
    mergedExport: 0,
    wizardRuns: 0,
    jobsdbSearch: 0,
    applicationPackages: 0,
  };
}

export interface StoredUsageLedger {
  month: string;
  usage: MonthlyUsage;
}

export function readUsageLedger(): StoredUsageLedger {
  const month = currentUsageMonth();
  if (typeof localStorage === "undefined") {
    return { month, usage: emptyUsage() };
  }
  try {
    const raw = localStorage.getItem(NSR_STORAGE_KEYS.usageLedger);
    if (!raw) return { month, usage: emptyUsage() };
    const parsed = JSON.parse(raw) as StoredUsageLedger;
    if (parsed.month !== month) {
      return { month, usage: emptyUsage() };
    }
    return { month, usage: { ...emptyUsage(), ...parsed.usage } };
  } catch {
    return { month, usage: emptyUsage() };
  }
}

export function writeUsageLedger(ledger: StoredUsageLedger): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(NSR_STORAGE_KEYS.usageLedger, JSON.stringify(ledger));
  } catch {
    /* ignore quota errors */
  }
}

export function readStoredPlan(): SubscriptionPlan {
  if (typeof localStorage === "undefined") return "starter";
  try {
    const raw = localStorage.getItem(NSR_STORAGE_KEYS.subscriptionPlan);
    if (raw === "starter" || raw === "pro" || raw === "max") return raw;
  } catch {
    /* ignore */
  }
  return "starter";
}

export function writeStoredPlan(plan: SubscriptionPlan): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(NSR_STORAGE_KEYS.subscriptionPlan, plan);
  } catch {
    /* ignore */
  }
}

export function getRemaining(plan: SubscriptionPlan, metric: UsageMetric, usage: MonthlyUsage): number {
  const limit = getUsageLimit(plan, metric);
  if (limit >= 999_999) return UNLIMITED_REMAINING;
  return Math.max(0, limit - (usage[metric] ?? 0));
}

const UNLIMITED_REMAINING = 999_999;

export function canConsume(
  plan: SubscriptionPlan,
  metric: UsageMetric,
  usage: MonthlyUsage,
  amount = 1,
): ConsumeResult {
  const limit = getUsageLimit(plan, metric);
  if (limit <= 0) {
    return { ok: false, reason: "feature_locked", metric, remaining: 0 };
  }
  if (limit >= 999_999) {
    return { ok: true, metric, remaining: UNLIMITED_REMAINING };
  }
  const used = usage[metric] ?? 0;
  const remaining = limit - used;
  if (remaining < amount) {
    return { ok: false, reason: "quota_exceeded", metric, remaining: Math.max(0, remaining) };
  }
  return { ok: true, metric, remaining: remaining - amount };
}

export function consumeMetric(
  plan: SubscriptionPlan,
  metric: UsageMetric,
  ledger: StoredUsageLedger,
  amount = 1,
): { ledger: StoredUsageLedger; result: ConsumeResult } {
  const check = canConsume(plan, metric, ledger.usage, amount);
  if (!check.ok) {
    return { ledger, result: check };
  }
  const nextUsage = { ...ledger.usage, [metric]: (ledger.usage[metric] ?? 0) + amount };
  const nextLedger = { month: ledger.month, usage: nextUsage };
  writeUsageLedger(nextLedger);
  return {
    ledger: nextLedger,
    result: { ok: true, metric, remaining: check.remaining },
  };
}

export function consumeMetricsBatch(
  plan: SubscriptionPlan,
  ledger: StoredUsageLedger,
  items: Array<{ metric: UsageMetric; amount: number }>,
): { ledger: StoredUsageLedger; result: ConsumeResult } {
  for (const { metric, amount } of items) {
    const check = canConsume(plan, metric, ledger.usage, amount);
    if (!check.ok) {
      return { ledger, result: check };
    }
  }
  const nextUsage = { ...ledger.usage };
  for (const { metric, amount } of items) {
    nextUsage[metric] = (nextUsage[metric] ?? 0) + amount;
  }
  const nextLedger = { month: ledger.month, usage: nextUsage };
  writeUsageLedger(nextLedger);
  const last = items[items.length - 1];
  const remaining = last ? getRemaining(plan, last.metric, nextUsage) : UNLIMITED_REMAINING;
  return {
    ledger: nextLedger,
    result: { ok: true, metric: last?.metric, remaining },
  };
}

type SubscriptionSyncListener = (snapshot: SubscriptionSnapshot) => void;

let subscriptionSyncListener: SubscriptionSyncListener | null = null;

export function setSubscriptionSyncListener(listener: SubscriptionSyncListener | null): void {
  subscriptionSyncListener = listener;
}

export function applySubscriptionSnapshot(snapshot: SubscriptionSnapshot): void {
  writeUsageLedger({ month: snapshot.usageMonth, usage: snapshot.usage });
  writeStoredPlan(snapshot.plan);
  setSubscriptionSnapshot(snapshot);
  subscriptionSyncListener?.(snapshot);
}

export function syncSubscriptionFromResponse(response: Response): boolean {
  const usageHeader = response.headers.get("X-NSR-Usage");
  if (!usageHeader) return false;
  const usage = parseUsageHeader(usageHeader);
  const usageMonth = response.headers.get("X-NSR-Usage-Month") || currentUsageMonth();
  const planHeader = response.headers.get("X-NSR-Plan");
  const plan =
    planHeader === "starter" || planHeader === "pro" || planHeader === "max"
      ? planHeader
      : readStoredPlan();
  applySubscriptionSnapshot({ plan, usage, usageMonth });
  return true;
}

export function buildSubscriptionHeaders(
  plan: SubscriptionPlan,
  ledger: StoredUsageLedger,
  clientId?: string,
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-NSR-Plan": plan,
    "X-NSR-Usage-Month": ledger.month,
    "X-NSR-Usage": JSON.stringify(ledger.usage),
  };
  if (clientId) {
    headers["X-NSR-Client-Id"] = clientId;
  }
  return headers;
}

export function parsePlanHeader(value: string | undefined): SubscriptionPlan {
  if (value === "pro" || value === "max" || value === "starter") return value;
  return "starter";
}

export function parseUsageHeader(value: string | undefined): MonthlyUsage {
  if (!value) return emptyUsage();
  try {
    const parsed = JSON.parse(value) as Partial<MonthlyUsage>;
    return { ...emptyUsage(), ...parsed };
  } catch {
    return emptyUsage();
  }
}

export function getEntitlementsForPlan(plan: SubscriptionPlan) {
  return getEntitlements(plan);
}
