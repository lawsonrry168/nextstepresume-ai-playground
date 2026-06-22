import type { FeatureId, PlanEntitlements, SubscriptionPlan, UsageMetric } from "./types";
import type { TemplateStyle } from "../resumeTemplateCatalog";

const UNLIMITED = 999_999;

function allFeatures(enabled: boolean): Record<FeatureId, boolean> {
  const ids: FeatureId[] = [
    "editor.full",
    "ats.liveScore",
    "import.text",
    "import.pdf",
    "import.jdPaste",
    "import.jdUrl",
    "import.jobsdb",
    "templates.all",
    "theme.customize",
    "layout.free",
    "layout.canvasStudio",
    "ai.tailor",
    "ai.match",
    "ai.auditBundle",
    "ai.coverLetter",
    "ai.interviewPrep",
    "ai.companyResearch",
    "ai.geminiChat",
    "ai.geminiThinking",
    "ai.wizard",
    "export.json",
    "export.pdfVisual",
    "export.pdfVisualClean",
    "export.pdfAts",
    "export.docx",
    "export.packageMerged",
    "export.packageFull",
    "tracker",
    "tools.voice",
    "tools.heatmap",
    "tools.salary",
    "tools.atsCrawler",
    "tools.diagnostics",
    "notify.followUp",
  ];
  return Object.fromEntries(ids.map((id) => [id, enabled])) as Record<FeatureId, boolean>;
}

function limits(partial: Partial<Record<UsageMetric, number>>): Record<UsageMetric, number> {
  const base: Record<UsageMetric, number> = {
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
  return { ...base, ...partial };
}

const STARTER_FEATURES = allFeatures(false);
STARTER_FEATURES["editor.full"] = true;
STARTER_FEATURES["ats.liveScore"] = true;
STARTER_FEATURES["import.text"] = true;
STARTER_FEATURES["import.pdf"] = true;
STARTER_FEATURES["import.jdPaste"] = true;
STARTER_FEATURES["ai.tailor"] = true;
STARTER_FEATURES["ai.match"] = true;
STARTER_FEATURES["ai.auditBundle"] = true;
STARTER_FEATURES["export.json"] = true;
STARTER_FEATURES["export.pdfVisual"] = true;

const PRO_FEATURES = allFeatures(false);
Object.assign(PRO_FEATURES, {
  "editor.full": true,
  "ats.liveScore": true,
  "import.text": true,
  "import.pdf": true,
  "import.jdPaste": true,
  "import.jdUrl": true,
  "import.jobsdb": true,
  "templates.all": true,
  "theme.customize": true,
  "layout.free": true,
  "ai.tailor": true,
  "ai.match": true,
  "ai.auditBundle": true,
  "ai.coverLetter": true,
  "ai.interviewPrep": true,
  "ai.companyResearch": true,
  "ai.geminiChat": true,
  "ai.wizard": true,
  "export.json": true,
  "export.pdfVisual": true,
  "export.pdfVisualClean": true,
  "export.pdfAts": true,
  "export.docx": true,
  "export.packageMerged": true,
  "tracker": true,
  "tools.voice": true,
  "tools.heatmap": true,
  "tools.salary": true,
  "notify.followUp": true,
});

const MAX_FEATURES = allFeatures(true);

export const PLAN_ENTITLEMENTS: Record<SubscriptionPlan, PlanEntitlements> = {
  starter: {
    plan: "starter",
    features: STARTER_FEATURES,
    limits: limits({
      aiCredits: 3,
      pdfParse: 2,
      pdfVisualExport: 5,
      applicationPackages: 0,
    }),
    templateAllowlist: "starter-modern",
  },
  pro: {
    plan: "pro",
    features: PRO_FEATURES,
    limits: limits({
      aiCredits: 80,
      geminiMessages: 30,
      coverLetters: 15,
      interviewPrep: 5,
      companyResearch: 5,
      pdfParse: UNLIMITED,
      pdfVisualExport: 30,
      pdfAtsExport: 30,
      docxExport: 30,
      mergedExport: 10,
      wizardRuns: 10,
      jobsdbSearch: 30,
      applicationPackages: 20,
    }),
    templateAllowlist: "all",
  },
  max: {
    plan: "max",
    features: MAX_FEATURES,
    limits: limits({
      aiCredits: 300,
      geminiMessages: 150,
      coverLetters: UNLIMITED,
      interviewPrep: 50,
      companyResearch: 50,
      pdfParse: UNLIMITED,
      pdfVisualExport: UNLIMITED,
      pdfAtsExport: UNLIMITED,
      docxExport: UNLIMITED,
      mergedExport: UNLIMITED,
      wizardRuns: UNLIMITED,
      jobsdbSearch: 100,
      applicationPackages: UNLIMITED,
    }),
    templateAllowlist: "all",
  },
};

/** Starter tier: first 3 modern templates only. */
export const STARTER_TEMPLATE_IDS: TemplateStyle[] = [
  "modern-01",
  "modern-02",
  "modern-03",
];

export const PLAN_ORDER: SubscriptionPlan[] = ["starter", "pro", "max"];

export function getEntitlements(plan: SubscriptionPlan): PlanEntitlements {
  return PLAN_ENTITLEMENTS[plan] ?? PLAN_ENTITLEMENTS.starter;
}

export function hasFeature(plan: SubscriptionPlan, feature: FeatureId): boolean {
  return getEntitlements(plan).features[feature] === true;
}

export function getUsageLimit(plan: SubscriptionPlan, metric: UsageMetric): number {
  return getEntitlements(plan).limits[metric] ?? 0;
}

export function isTemplateAllowed(plan: SubscriptionPlan, templateId: TemplateStyle): boolean {
  const ent = getEntitlements(plan);
  if (ent.templateAllowlist === "all") return true;
  return STARTER_TEMPLATE_IDS.includes(templateId);
}

export function minimumPlanForFeature(feature: FeatureId): SubscriptionPlan {
  for (const plan of PLAN_ORDER) {
    if (hasFeature(plan, feature)) return plan;
  }
  return "max";
}

export function isTabAllowed(plan: SubscriptionPlan, tab: string): boolean {
  switch (tab) {
    case "content":
    case "preview":
      return true;
    case "tailor":
      return hasFeature(plan, "ai.tailor");
    case "match":
      return hasFeature(plan, "ai.match");
    case "tools":
      return (
        hasFeature(plan, "tools.voice") ||
        hasFeature(plan, "tools.heatmap") ||
        hasFeature(plan, "tools.salary") ||
        hasFeature(plan, "tools.atsCrawler")
      );
    case "applications":
      return hasFeature(plan, "tracker");
    default:
      return true;
  }
}
