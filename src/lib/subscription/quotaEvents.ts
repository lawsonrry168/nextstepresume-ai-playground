import type { UpgradeReason } from "../../context/SubscriptionProvider";

type QuotaListener = (reason: UpgradeReason, detail?: { code?: string; plan?: string }) => void;

let listener: QuotaListener | null = null;

export function setQuotaBlockedListener(next: QuotaListener | null): void {
  listener = next;
}

export function emitQuotaBlocked(
  reason: UpgradeReason,
  detail?: { code?: string; plan?: string },
): void {
  listener?.(reason, detail);
}

export function mapQuotaCodeToReason(
  code: string | undefined,
  path?: string,
): UpgradeReason {
  if (code === "quota_exceeded") return "aiCredits";
  if (path?.includes("jobsdb")) return "import.jobsdb";
  if (path?.includes("cover-letter")) return "ai.coverLetter";
  if (path?.includes("interview-prep")) return "ai.interviewPrep";
  if (path?.includes("company-research")) return "ai.companyResearch";
  if (path?.includes("parse-pdf")) return "pdfParse";
  if (path?.includes("ask-gemini")) return "ai.geminiChat";
  return "general";
}
