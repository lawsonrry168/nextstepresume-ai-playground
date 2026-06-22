/**
 * Role-based salary benchmarks — Hong Kong (HKD/month) when HK market is active.
 */

import { estimateHkSalary, formatHkSalaryRange } from "./market/hkSalary";
import { isHongKongMarket } from "./market/config";

export type SalaryCurrency = "USD" | "HKD";

export interface SalaryEstimate {
  currency: SalaryCurrency;
  low: number;
  mid: number;
  high: number;
  roleTier: string;
  marketNote: string;
  unit?: "annual" | "monthly";
  region?: string;
}

interface SalaryTier {
  label: string;
  base: number;
  perYear: number;
  ceiling: number;
  note: string;
}

const ROLE_TIERS: Array<{ match: RegExp; tier: SalaryTier }> = [
  {
    match: /frontend|front-end|react|ui\s*dev/i,
    tier: {
      label: "Frontend Engineer",
      base: 72000,
      perYear: 9200,
      ceiling: 185000,
      note: "React/TypeScript skills and performance optimisation experience significantly raise the band.",
    },
  },
  {
    match: /backend|back-end|api|node|server/i,
    tier: {
      label: "Backend Engineer",
      base: 78000,
      perYear: 9800,
      ceiling: 195000,
      note: "Distributed systems, database tuning, and cloud architecture are key pay drivers.",
    },
  },
  {
    match: /full[\s-]?stack|fullstack/i,
    tier: {
      label: "Full-Stack Engineer",
      base: 82000,
      perYear: 10500,
      ceiling: 210000,
      note: "Engineers who ship end-to-end product tend to sit at the upper band.",
    },
  },
  {
    match: /product\s*manager|pm\b/i,
    tier: {
      label: "Product Manager",
      base: 85000,
      perYear: 9000,
      ceiling: 200000,
      note: "B2B SaaS and data-driven decision experience matter most for PM pay.",
    },
  },
  {
    match: /data\s*(scientist|analyst)|machine\s*learning|ml\b/i,
    tier: {
      label: "Data / ML",
      base: 90000,
      perYear: 11000,
      ceiling: 220000,
      note: "Production ML and MLOps capability are common high-pay requirements.",
    },
  },
  {
    match: /devops|sre|platform/i,
    tier: {
      label: "DevOps / SRE",
      base: 88000,
      perYear: 10200,
      ceiling: 205000,
      note: "Kubernetes, CI/CD, and reliability metrics are core negotiation levers.",
    },
  },
];

const DEFAULT_TIER: SalaryTier = {
  label: "Software Engineer",
  base: 70000,
  perYear: 8500,
  ceiling: 175000,
  note: "Align JD keywords to improve positioning in salary discussions.",
};

export function resolveSalaryTier(roleTitle: string): SalaryTier {
  const normalized = roleTitle.trim();
  const found = ROLE_TIERS.find((r) => r.match.test(normalized));
  return found?.tier ?? DEFAULT_TIER;
}

export function estimateSalary(roleTitle: string, yearsExperience: number): SalaryEstimate {
  if (isHongKongMarket()) {
    return estimateHkSalary(roleTitle, yearsExperience);
  }

  const tier = resolveSalaryTier(roleTitle);
  const years = Math.max(0, Math.min(25, yearsExperience));
  const mid = Math.min(tier.ceiling, Math.round(tier.base + years * tier.perYear));
  const spread = Math.round(mid * 0.12);
  const low = Math.max(45000, mid - spread);
  const high = Math.min(tier.ceiling, mid + spread);

  return {
    currency: "USD",
    low,
    mid,
    high,
    roleTier: tier.label,
    marketNote: tier.note,
    unit: "annual",
  };
}

export function formatSalaryRange(estimate: SalaryEstimate): string {
  if (estimate.currency === "HKD") {
    return formatHkSalaryRange(estimate);
  }
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  return `${fmt(estimate.low)} – ${fmt(estimate.high)}`;
}

export function formatSalaryAmount(amount: number, estimate: SalaryEstimate): string {
  const currency = estimate.currency === "HKD" ? "HKD" : "USD";
  const locale = estimate.currency === "HKD" ? "en-HK" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
