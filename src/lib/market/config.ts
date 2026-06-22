import type { AppLocale } from "../../i18n/types";
import type { JobsdbCountry } from "../jobsdbApifyScraper";

export type MarketId = "hk";

export interface MarketPricing {
  monthly: number;
  yearly: number;
}

export interface MarketConfig {
  id: MarketId;
  label: string;
  defaultLocale: AppLocale;
  locales: AppLocale[];
  currency: "HKD";
  currencySymbol: "HK$";
  pricing: Record<"starter" | "pro" | "max", MarketPricing>;
  /** One-off 30-day job search pass (display only until Stripe). */
  sprintPassHkd: number;
  jobs: {
    primaryPlatform: "jobsdb";
    defaultJobsdbCountry: JobsdbCountry;
    defaultImportMode: "jobsdb" | "url" | "paste";
    platformHints: string[];
  };
  spelling: "en-GB";
  salaryUnit: "monthly";
  regionLabel: string;
}

/** Hong Kong–first market configuration (single-market deployment). */
export const HK_MARKET: MarketConfig = {
  id: "hk",
  label: "Hong Kong",
  defaultLocale: "en",
  locales: ["en", "zh-HK"],
  currency: "HKD",
  currencySymbol: "HK$",
  pricing: {
    starter: { monthly: 0, yearly: 0 },
    pro: { monthly: 88, yearly: 688 },
    max: { monthly: 188, yearly: 1688 },
  },
  sprintPassHkd: 128,
  jobs: {
    primaryPlatform: "jobsdb",
    defaultJobsdbCountry: "hk",
    defaultImportMode: "jobsdb",
    platformHints: ["JobsDB HK", "LinkedIn", "CTgoodjobs", "Indeed HK"],
  },
  spelling: "en-GB",
  salaryUnit: "monthly",
  regionLabel: "Hong Kong",
};

export function getActiveMarket(): MarketConfig {
  return HK_MARKET;
}

export function isHongKongMarket(): boolean {
  return getActiveMarket().id === "hk";
}
