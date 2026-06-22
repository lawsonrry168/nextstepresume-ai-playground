import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { FeatureId, SubscriptionPlan, UsageMetric } from "../lib/subscription/types";
import {
  getEntitlements,
  hasFeature,
  isTabAllowed,
  isTemplateAllowed,
  minimumPlanForFeature,
} from "../lib/subscription/entitlements";
import { AI_CREDIT_COSTS } from "../lib/subscription/creditCosts";
import type { AiCreditAction } from "../lib/subscription/types";
import { getOrCreateClientId } from "../lib/subscription/clientId";
import { setQuotaBlockedListener } from "../lib/subscription/quotaEvents";
import {
  canConsume,
  consumeMetric,
  consumeMetricsBatch,
  getRemaining,
  readStoredPlan,
  readUsageLedger,
  setSubscriptionSyncListener,
  syncSubscriptionFromResponse,
  writeStoredPlan,
  type StoredUsageLedger,
} from "../lib/subscription/usageLedger";
import { setSubscriptionSnapshot } from "../lib/subscriptionSnapshot";
import type { TemplateStyle } from "../lib/resumeTemplateCatalog";

export type UpgradeReason = FeatureId | UsageMetric | AiCreditAction | "general";

interface SubscriptionContextValue {
  plan: SubscriptionPlan;
  usage: StoredUsageLedger["usage"];
  entitlements: ReturnType<typeof getEntitlements>;
  setPlan: (plan: SubscriptionPlan) => void;
  canUseFeature: (feature: FeatureId) => boolean;
  canUseTab: (tab: string) => boolean;
  canUseTemplate: (templateId: TemplateStyle) => boolean;
  getLimit: (metric: UsageMetric) => number;
  getUsed: (metric: UsageMetric) => number;
  getRemainingUsage: (metric: UsageMetric) => number;
  canConsume: (metric: UsageMetric, amount?: number) => boolean;
  consumeUsage: (metric: UsageMetric, amount?: number) => boolean;
  consumeAiAction: (action: AiCreditAction) => boolean;
  minimumPlanFor: (feature: FeatureId) => SubscriptionPlan;
  pricingOpen: boolean;
  upgradeOpen: boolean;
  upgradeReason: UpgradeReason;
  openPricing: () => void;
  closePricing: () => void;
  openUpgrade: (reason?: UpgradeReason) => void;
  closeUpgrade: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

async function postPlanSync(plan: SubscriptionPlan): Promise<void> {
  try {
    const clientId = getOrCreateClientId();
    const response = await fetch("/api/subscription/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-NSR-Client-Id": clientId,
      },
      body: JSON.stringify({ plan }),
    });
    if (response.ok) {
      syncSubscriptionFromResponse(response);
    }
  } catch {
    /* offline demo — local plan still applies */
  }
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [plan, setPlanState] = useState<SubscriptionPlan>(() => readStoredPlan());
  const [ledger, setLedger] = useState<StoredUsageLedger>(() => readUsageLedger());
  const [pricingOpen, setPricingOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<UpgradeReason>("general");
  const openUpgradeRef = useRef<(reason?: UpgradeReason) => void>(() => {});

  const entitlements = useMemo(() => getEntitlements(plan), [plan]);

  useEffect(() => {
    setSubscriptionSnapshot({
      plan,
      usage: ledger.usage,
      usageMonth: ledger.month,
    });
  }, [plan, ledger]);

  useEffect(() => {
    setSubscriptionSyncListener((snapshot) => {
      setPlanState(snapshot.plan);
      setLedger({ month: snapshot.usageMonth, usage: snapshot.usage });
    });
    return () => setSubscriptionSyncListener(null);
  }, []);

  useEffect(() => {
    void postPlanSync(readStoredPlan());
  }, []);

  const openUpgrade = useCallback((reason: UpgradeReason = "general") => {
    setUpgradeReason(reason);
    setUpgradeOpen(true);
  }, []);

  openUpgradeRef.current = openUpgrade;

  useEffect(() => {
    setQuotaBlockedListener((reason) => openUpgradeRef.current(reason));
    return () => setQuotaBlockedListener(null);
  }, []);

  const setPlan = useCallback((next: SubscriptionPlan) => {
    setPlanState(next);
    writeStoredPlan(next);
    void postPlanSync(next);
  }, []);

  const canUseFeature = useCallback((feature: FeatureId) => hasFeature(plan, feature), [plan]);

  const canUseTab = useCallback((tab: string) => isTabAllowed(plan, tab), [plan]);

  const canUseTemplate = useCallback(
    (templateId: TemplateStyle) => isTemplateAllowed(plan, templateId),
    [plan],
  );

  const getLimit = useCallback((metric: UsageMetric) => entitlements.limits[metric] ?? 0, [entitlements]);

  const getUsed = useCallback((metric: UsageMetric) => ledger.usage[metric] ?? 0, [ledger]);

  const getRemainingUsage = useCallback(
    (metric: UsageMetric) => getRemaining(plan, metric, ledger.usage),
    [plan, ledger],
  );

  const canConsumeMetric = useCallback(
    (metric: UsageMetric, amount = 1) => canConsume(plan, metric, ledger.usage, amount).ok,
    [plan, ledger],
  );

  const consumeUsage = useCallback(
    (metric: UsageMetric, amount = 1) => {
      const current = readUsageLedger();
      const { ledger: nextLedger, result } = consumeMetric(plan, metric, current, amount);
      if (!result.ok) return false;
      setLedger(nextLedger);
      return true;
    },
    [plan],
  );

  const consumeAiAction = useCallback(
    (action: AiCreditAction) => {
      const cost = AI_CREDIT_COSTS[action];
      const current = readUsageLedger();
      const items: Array<{ metric: UsageMetric; amount: number }> = [{ metric: "aiCredits", amount: cost }];

      if (action === "geminiFlash" || action === "geminiThinking") {
        if (action === "geminiThinking" && !hasFeature(plan, "ai.geminiThinking")) return false;
        items.push({ metric: "geminiMessages", amount: 1 });
      } else if (action === "coverLetter") {
        items.push({ metric: "coverLetters", amount: 1 });
      } else if (action === "interviewPrep") {
        items.push({ metric: "interviewPrep", amount: 1 });
      } else if (action === "companyResearch") {
        items.push({ metric: "companyResearch", amount: 1 });
      } else if (action === "wizard") {
        items.push({ metric: "wizardRuns", amount: 1 });
      }

      const { ledger: nextLedger, result } = consumeMetricsBatch(plan, current, items);
      if (!result.ok) return false;
      setLedger(nextLedger);
      return true;
    },
    [plan],
  );

  const openPricing = useCallback(() => setPricingOpen(true), []);
  const closePricing = useCallback(() => setPricingOpen(false), []);
  const closeUpgrade = useCallback(() => setUpgradeOpen(false), []);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      plan,
      usage: ledger.usage,
      entitlements,
      setPlan,
      canUseFeature,
      canUseTab,
      canUseTemplate,
      getLimit,
      getUsed,
      getRemainingUsage,
      canConsume: canConsumeMetric,
      consumeUsage,
      consumeAiAction,
      minimumPlanFor: minimumPlanForFeature,
      pricingOpen,
      upgradeOpen,
      upgradeReason,
      openPricing,
      closePricing,
      openUpgrade,
      closeUpgrade,
    }),
    [
      plan,
      ledger,
      entitlements,
      setPlan,
      canUseFeature,
      canUseTab,
      canUseTemplate,
      getLimit,
      getUsed,
      getRemainingUsage,
      canConsumeMetric,
      consumeUsage,
      consumeAiAction,
      pricingOpen,
      upgradeOpen,
      upgradeReason,
      openPricing,
      closePricing,
      openUpgrade,
      closeUpgrade,
    ],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return ctx;
}
