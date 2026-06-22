import { describe, expect, it } from "vitest";
import { getActiveMarket, isHongKongMarket } from "../lib/market/config";
import { getAiWritingGuide } from "../lib/market/aiWritingGuide";
import { buildWhatsAppFollowUpUrl } from "../lib/market/whatsappFollowUp";
import { formatMarketCurrency } from "../lib/market/formatCurrency";
import { estimateSalary } from "../lib/salaryBenchmark";
import { getPlanCatalog, getSprintPassPrice } from "../lib/subscription/planCatalog";
import { hasFeature, getEntitlements } from "../lib/subscription/entitlements";
import { getHkPersonalMetaLines } from "../lib/resumeHkMeta";

describe("Hong Kong market config", () => {
  it("activates HK as the sole market", () => {
    expect(isHongKongMarket()).toBe(true);
    expect(getActiveMarket().id).toBe("hk");
    expect(getActiveMarket().defaultLocale).toBe("en");
    expect(getActiveMarket().jobs.defaultJobsdbCountry).toBe("hk");
  });

  it("uses HKD pricing tiers", () => {
    const catalog = getPlanCatalog();
    const pro = catalog.find((p) => p.plan === "pro");
    expect(pro?.monthlyAmount).toBe(88);
    expect(formatMarketCurrency(88, "en")).toBe("HK$88");
    expect(getSprintPassPrice()).toBe(128);
  });

  it("includes British English guidance for AI", () => {
    const guide = getAiWritingGuide({ locale: "en" });
    expect(guide).toMatch(/British English/i);
    expect(guide).toMatch(/Hong Kong/i);
  });

  it("builds WhatsApp follow-up links", () => {
    const url = buildWhatsAppFollowUpUrl({ companyName: "HSBC", jobTitle: "Analyst" });
    expect(url).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(decodeURIComponent(url)).toMatch(/HSBC/);
  });

  it("estimates monthly HKD salaries", () => {
    const est = estimateSalary("Software Engineer", 4);
    expect(est.currency).toBe("HKD");
    expect(est.unit).toBe("monthly");
    expect(est.mid).toBeGreaterThan(20000);
  });

  it("grants JobsDB to Pro plan", () => {
    expect(hasFeature("pro", "import.jobsdb")).toBe(true);
    expect(getEntitlements("pro").limits.jobsdbSearch).toBe(30);
  });

  it("renders HK personal meta lines", () => {
    const lines = getHkPersonalMetaLines({
      name: "A",
      title: "B",
      email: "",
      phone: "",
      website: "",
      location: "HK",
      linkedin: "",
      rightToWork: "Permanent HK Resident",
      noticePeriod: "1 month",
    });
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0]).toMatch(/Permanent HK Resident/);
  });
});
