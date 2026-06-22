import type { SalaryEstimate } from "../salaryBenchmark";
import { getActiveMarket } from "./config";

interface SalaryTier {
  label: string;
  baseMonthly: number;
  perYearMonthly: number;
  ceilingMonthly: number;
  note: string;
}

/** HKD monthly salary tiers for common Hong Kong roles. */
const HK_ROLE_TIERS: Array<{ match: RegExp; tier: SalaryTier }> = [
  {
    match: /graduate|analyst|junior|assistant|trainee|intern/i,
    tier: {
      label: "Graduate / Junior",
      baseMonthly: 18000,
      perYearMonthly: 800,
      ceilingMonthly: 28000,
      note: "IANG and fresh graduate roles in HK often start HK$18k–28k/month before bonus.",
    },
  },
  {
    match: /frontend|front-end|react|ui\s*dev/i,
    tier: {
      label: "Frontend Engineer",
      baseMonthly: 28000,
      perYearMonthly: 1800,
      ceilingMonthly: 55000,
      note: "React/TypeScript and product delivery experience lift offers in HK tech and banking IT.",
    },
  },
  {
    match: /backend|back-end|api|node|server/i,
    tier: {
      label: "Backend Engineer",
      baseMonthly: 30000,
      perYearMonthly: 2000,
      ceilingMonthly: 58000,
      note: "Distributed systems, cloud, and fintech domain knowledge are strong HK pay drivers.",
    },
  },
  {
    match: /full[\s-]?stack|fullstack/i,
    tier: {
      label: "Full-Stack Engineer",
      baseMonthly: 32000,
      perYearMonthly: 2200,
      ceilingMonthly: 60000,
      note: "End-to-end ownership is valued in HK startups and scale-ups.",
    },
  },
  {
    match: /product\s*manager|pm\b/i,
    tier: {
      label: "Product Manager",
      baseMonthly: 35000,
      perYearMonthly: 2000,
      ceilingMonthly: 65000,
      note: "B2B SaaS and data-informed PM experience commands premiums in Central/Quarry Bay hubs.",
    },
  },
  {
    match: /data\s*(scientist|analyst)|machine\s*learning|ml\b/i,
    tier: {
      label: "Data / ML",
      baseMonthly: 38000,
      perYearMonthly: 2400,
      ceilingMonthly: 70000,
      note: "Production ML and MLOps skills are in demand across finance and I&T sectors.",
    },
  },
  {
    match: /devops|sre|platform/i,
    tier: {
      label: "DevOps / SRE",
      baseMonthly: 36000,
      perYearMonthly: 2200,
      ceilingMonthly: 68000,
      note: "Kubernetes, CI/CD, and reliability metrics are core negotiation levers.",
    },
  },
  {
    match: /accountant|audit|finance|banking|investment|legal|compliance/i,
    tier: {
      label: "Finance / Professional Services",
      baseMonthly: 25000,
      perYearMonthly: 1500,
      ceilingMonthly: 80000,
      note: "Big 4, banks, and buy-side roles may include substantial bonuses on top of base.",
    },
  },
];

const HK_DEFAULT_TIER: SalaryTier = {
  label: "Professional (HK)",
  baseMonthly: 26000,
  perYearMonthly: 1500,
  ceilingMonthly: 52000,
  note: "Align bullet points with JD keywords to improve offer positioning in Hong Kong.",
};

export function resolveHkSalaryTier(roleTitle: string): SalaryTier {
  const normalized = roleTitle.trim();
  const found = HK_ROLE_TIERS.find((r) => r.match.test(normalized));
  return found?.tier ?? HK_DEFAULT_TIER;
}

export function estimateHkSalary(roleTitle: string, yearsExperience: number): SalaryEstimate {
  const tier = resolveHkSalaryTier(roleTitle);
  const years = Math.max(0, Math.min(25, yearsExperience));
  const mid = Math.min(tier.ceilingMonthly, Math.round(tier.baseMonthly + years * tier.perYearMonthly));
  const spread = Math.round(mid * 0.1);
  const low = Math.max(15000, mid - spread);
  const high = Math.min(tier.ceilingMonthly, mid + spread);

  return {
    currency: "HKD",
    low,
    mid,
    high,
    roleTier: tier.label,
    marketNote: tier.note,
    unit: "monthly",
    region: getActiveMarket().regionLabel,
  };
}

export function formatHkSalaryRange(estimate: SalaryEstimate): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-HK", {
      style: "currency",
      currency: "HKD",
      maximumFractionDigits: 0,
    }).format(n);
  return `${fmt(estimate.low)} – ${fmt(estimate.high)} / month`;
}
