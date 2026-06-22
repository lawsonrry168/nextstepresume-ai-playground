export type SubscriptionPlan = "starter" | "pro" | "max";

export type FeatureId =
  | "editor.full"
  | "ats.liveScore"
  | "import.text"
  | "import.pdf"
  | "import.jdPaste"
  | "import.jdUrl"
  | "import.jobsdb"
  | "templates.all"
  | "theme.customize"
  | "layout.free"
  | "layout.canvasStudio"
  | "ai.tailor"
  | "ai.match"
  | "ai.auditBundle"
  | "ai.coverLetter"
  | "ai.interviewPrep"
  | "ai.companyResearch"
  | "ai.geminiChat"
  | "ai.geminiThinking"
  | "ai.wizard"
  | "export.json"
  | "export.pdfVisual"
  | "export.pdfVisualClean"
  | "export.pdfAts"
  | "export.docx"
  | "export.packageMerged"
  | "export.packageFull"
  | "tracker"
  | "tools.voice"
  | "tools.heatmap"
  | "tools.salary"
  | "tools.atsCrawler"
  | "tools.diagnostics"
  | "notify.followUp";

export type UsageMetric =
  | "aiCredits"
  | "geminiMessages"
  | "coverLetters"
  | "interviewPrep"
  | "companyResearch"
  | "pdfParse"
  | "pdfVisualExport"
  | "pdfAtsExport"
  | "docxExport"
  | "mergedExport"
  | "wizardRuns"
  | "jobsdbSearch"
  | "applicationPackages";

export type MonthlyUsage = Record<UsageMetric, number>;

export interface PlanEntitlements {
  plan: SubscriptionPlan;
  features: Record<FeatureId, boolean>;
  limits: Record<UsageMetric, number>;
  templateAllowlist: "starter-modern" | "all";
}

export interface ConsumeResult {
  ok: boolean;
  reason?: "feature_locked" | "quota_exceeded";
  metric?: UsageMetric;
  remaining?: number;
}

export interface SubscriptionSnapshot {
  plan: SubscriptionPlan;
  usage: MonthlyUsage;
  usageMonth: string;
}

export type AiCreditAction =
  | "tailor"
  | "match"
  | "auditBundle"
  | "coverLetter"
  | "interviewPrep"
  | "companyResearch"
  | "geminiFlash"
  | "geminiThinking"
  | "wizard";
