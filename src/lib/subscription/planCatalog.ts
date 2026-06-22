import type { SubscriptionPlan } from "./types";
import { getActiveMarket } from "../market/config";
import { formatMarketCurrency } from "../market/formatCurrency";
import type { AppLocale } from "../../i18n/types";

export interface PlanPricing {
  plan: SubscriptionPlan;
  nameKey: string;
  taglineKey: string;
  monthlyAmount: number;
  yearlyAmount: number;
  popular?: boolean;
}

export function getPlanCatalog(): PlanPricing[] {
  const { pricing } = getActiveMarket();
  return [
    {
      plan: "starter",
      nameKey: "billing.plans.starter.name",
      taglineKey: "billing.plans.starter.tagline",
      monthlyAmount: pricing.starter.monthly,
      yearlyAmount: pricing.starter.yearly,
    },
    {
      plan: "pro",
      nameKey: "billing.plans.pro.name",
      taglineKey: "billing.plans.pro.tagline",
      monthlyAmount: pricing.pro.monthly,
      yearlyAmount: pricing.pro.yearly,
      popular: true,
    },
    {
      plan: "max",
      nameKey: "billing.plans.max.name",
      taglineKey: "billing.plans.max.tagline",
      monthlyAmount: pricing.max.monthly,
      yearlyAmount: pricing.max.yearly,
    },
  ];
}

/** @deprecated Use getPlanCatalog() — kept for imports that expect static catalog. */
export const PLAN_CATALOG: PlanPricing[] = getPlanCatalog();

export function formatPlanPrice(amount: number, locale: AppLocale): string {
  return formatMarketCurrency(amount, locale);
}

/** @deprecated Use formatPlanPrice */
export function formatTwd(amount: number, locale: "zh-TW" | "en"): string {
  return formatMarketCurrency(amount, locale === "en" ? "en" : "zh-HK");
}

export function getSprintPassPrice(): number {
  return getActiveMarket().sprintPassHkd;
}
